import { createStore } from '@nadameu/create-store';
import { createTaggedUnion, Static } from '@nadameu/match';
import { render } from 'preact';
import { createMsgService, Mensagem } from './Mensagem';
import { NumProc } from './NumProc';
import { Result } from './Result';

declare function consultarSaldo(idProcessoDepositoJudicialConta: string, idConta: string): void;
declare function consultarSaldoTodos(): void;

const Estado = createTaggedUnion({
  Ocioso: (infoContas: InfoConta[]) => ({ infoContas }),
  Erro: (erro: Error) => ({ erro }),
});
type Estado = Static<typeof Estado>;

const Acao = createTaggedUnion({
  Atualizar: null,
});
type Acao = Static<typeof Acao>;

export function paginaDepositos(numproc: NumProc): Result<void> {
  const barra = document.getElementById('divInfraBarraLocalizacao');
  if (!barra) {
    return Result.err(new Error('Barra de localização não encontrada.'));
  }
  const div = document.createElement('div');
  div.className = 'gm-atualizar-saldo__contas';
  barra.insertAdjacentElement('afterend', div)!;

  const bc = createMsgService();
  const store = createStore<Estado, Acao>(
    () =>
      obterContas().match<Estado>({
        Err: Estado.Erro,
        Ok: infoContas => {
          bc.publish(
            Mensagem.InformaSaldoDeposito(numproc, infoContas.filter(x => x.saldo > 0).length)
          );
          bc.destroy();
          return Estado.Ocioso(infoContas);
        },
      }),
    (estado, acao) =>
      Acao.match(acao, {
        Atualizar: () =>
          Estado.match(estado, {
            Erro: () => estado,
            Ocioso: () => {
              consultarSaldoTodos();
              return estado;
            },
          }),
      })
  );

  const sub = store.subscribe(update);
  return Result.ok(undefined as void);

  function App({ estado }: { estado: Estado }) {
    return Estado.match(estado, {
      Ocioso: ({ infoContas }) => {
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
          contasAtualizaveis === 0 ? null : <button onClick={onClick}>Atualizar</button>;
        return (
          <>
            <span class={classe}>{mensagem}</span>
            <br />
            {botao}
          </>
        );
      },
      Erro: ({ erro }) => {
        window.setTimeout(() => sub.unsubscribe(), 0);
        return <span class="erro">{erro.message}</span>;
      },
    });
  }

  function onClick(evt: Event) {
    evt.preventDefault();
    store.dispatch(Acao.Atualizar);
  }

  function update(estado: Estado) {
    render(<App estado={estado} />, div);
  }
  function obterContas(): Result<InfoConta[]> {
    const tabela = document.querySelector<HTMLTableElement>('table#tblSaldoConta');
    if (!tabela) return Result.err(new Error('Tabela de contas não encontrada'));
    return Result.traverse(
      Array.from(tabela.querySelectorAll<HTMLTableRowElement>('tr[id^="tblSaldoContaROW"]')).filter(
        x => !/Saldos$/.test(x.id)
      ),
      linha => {
        const info = obterInfoContaLinha(linha);
        return info ? Result.ok(info) : Result.err(new Error('Erro ao obter dados das contas.'));
      }
    );
  }
}

interface InfoConta {
  saldo: number;
  atualizacao: boolean;
}

function obterInfoContaLinha(row: HTMLTableRowElement): InfoConta | null {
  if (row.cells.length !== 11 && row.cells.length !== 13) return null;
  const textoSaldo = row.cells[row.cells.length - 4]!.textContent ?? '';
  const match = textoSaldo.match(/^R\$ ([0-9.]*\d,\d{2})$/);
  if (!match || match.length < 2) return null;
  const [, numeros] = match as [string, string];
  const saldo = Number(numeros.replace(/\./g, '').replace(',', '.'));
  const link = row.cells[row.cells.length - 1]!.querySelector<HTMLAnchorElement>(
    'a[onclick^="consultarSaldo("]'
  );
  const atualizacao = link !== null;
  return { saldo, atualizacao };
}
