import {
  applicativeEither,
  E,
  Either,
  flow,
  I,
  Left,
  M,
  pipe,
  Right,
} from '@nadameu/adts';
import { createStore } from '@nadameu/create-store';
import { makeConstructorsWith, match, matchWith } from '@nadameu/match';
import * as p from '@nadameu/predicates';
import { render } from 'preact';
import { createMsgService, Mensagem } from './Mensagem';
import { NumProc } from './NumProc';

declare function consultarSaldo(
  idProcessoDepositoJudicialConta: string,
  idConta: string
): void;
declare function consultarSaldoTodos(): void;

const isEstado = /* @__PURE__ */ p.isTaggedUnion('status', {
  Ocioso: {
    infoContas: p.isTypedArray(
      p.hasShape({ saldo: p.isNumber, atualizacao: p.isBoolean })
    ),
  },
  Erro: { erro: p.isInstanceOf(Error) },
});
type Estado = p.Static<typeof isEstado>;
const Estado = makeConstructorsWith('status', {
  Ocioso: (infoContas: InfoConta[]) => ({ infoContas }),
  Erro: (erro: Error) => ({ erro }),
}) satisfies {
  [K in Estado['status']]: (...args: never[]) => Extract<Estado, { status: K }>;
};

const isAcao = /* @__PURE__ */ p.isTaggedUnion('tipo', { Atualizar: {} });
type Acao = p.Static<typeof isAcao>;
const Acao = makeConstructorsWith('tipo', {
  Atualizar: () => ({}),
}) satisfies {
  [K in Acao['tipo']]: (...args: never[]) => Extract<Acao, { tipo: K }>;
};

export function paginaDepositos(numproc: NumProc): Either<Error, void> {
  const barra = document.getElementById('divInfraBarraLocalizacao');
  if (!barra) {
    return Left(new Error('Barra de localização não encontrada.'));
  }
  const div = document.createElement('div');
  div.className = 'gm-atualizar-saldo__contas';
  barra.insertAdjacentElement('afterend', div)!;

  const bc = createMsgService();
  const store = createStore<Estado, Acao>(
    () =>
      flow(
        obterContas(),
        E.match(Estado.Erro, infoContas => {
          bc.publish(
            Mensagem.InformaSaldoDeposito(
              numproc,
              infoContas.filter(x => x.saldo > 0).length
            )
          );
          bc.destroy();
          return Estado.Ocioso(infoContas);
        })
      ),
    (estado, acao) => {
      return matchWith('tipo')(acao)
        .case('Atualizar', () =>
          matchWith('status')(estado)
            .case('Erro', () => estado)
            .case('Ocioso', () => {
              consultarSaldoTodos();
              return estado;
            })
            .get()
        )
        .get();
    }
  );

  const sub = store.subscribe(update);
  return Right(undefined as void);

  function App({ estado }: { estado: Estado }) {
    return matchWith('status')(estado)
      .case('Ocioso', ({ infoContas }) => {
        const contasComSaldo = infoContas.filter(x => x.saldo > 0).length;
        const contasAtualizaveis = infoContas.filter(x => x.atualizacao).length;
        const classe = contasComSaldo === 0 ? 'zerado' : 'saldo';

        const mensagem =
          contasComSaldo === 0
            ? 'Sem saldo em conta(s).'
            : contasComSaldo === 1
              ? 'Há 1 conta com saldo.'
              : `Há ${contasComSaldo} contas com saldo.`;
        const botao =
          contasAtualizaveis === 0 ? null : (
            <button onClick={onClick}>Atualizar</button>
          );
        return (
          <>
            <span class={classe}>{mensagem}</span>
            <br />
            {botao}
          </>
        );
      })
      .case('Erro', ({ erro }) => {
        window.setTimeout(() => sub.unsubscribe(), 0);
        return <span class="erro">{erro.message}</span>;
      })
      .get();
  }

  function onClick(evt: Event) {
    evt.preventDefault();
    store.dispatch(Acao.Atualizar());
  }

  function update(estado: Estado) {
    render(<App estado={estado} />, div);
  }
  function obterContas(): Either<Error, InfoConta[]> {
    const tabela = document.querySelector<HTMLTableElement>(
      'table#tblSaldoConta'
    );
    if (!tabela) return Left(new Error('Tabela de contas não encontrada'));
    return flow(
      tabela.querySelectorAll<HTMLTableRowElement>(
        'tr[id^="tblSaldoContaROW"]'
      ),
      I.filter(x => !/Saldos$/.test(x.id)),
      I.traverse(applicativeEither)(
        pipe(
          obterInfoContaLinha,
          M.fromNullable,
          M.toEither(() => new Error('Erro ao obter dados das contas.'))
        )
      )
    );
  }
}

interface InfoConta {
  saldo: number;
  atualizacao: boolean;
}

function obterInfoContaLinha(row: HTMLTableRowElement): InfoConta | null {
  if (!p.arrayHasLength(11)(row.cells) && !p.arrayHasLength(13)(row.cells))
    return null;
  const textoSaldo = row.cells[row.cells.length - 4]!.textContent ?? '';
  const match = textoSaldo.match(/^R\$ ([0-9.]*\d,\d{2})$/);
  if (!match || !p.arrayHasLength(2)(match)) return null;
  const [, numeros] = match;
  const saldo = Number(numeros.replace(/\./g, '').replace(',', '.'));
  const link = row.cells[
    row.cells.length - 1
  ]!.querySelector<HTMLAnchorElement>('a[onclick^="consultarSaldo("]');
  const atualizacao = link !== null;
  return { saldo, atualizacao };
}
