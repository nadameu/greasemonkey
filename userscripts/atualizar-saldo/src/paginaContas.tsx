import {
  A,
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
import { createStore, Subscription } from '@nadameu/create-store';
import { Handler } from '@nadameu/handler';
import {
  FromConstructors,
  makeConstructors,
  match,
  matchWith,
} from '@nadameu/match';
import * as p from '@nadameu/predicates';
import { render } from 'preact';
import { createMsgService, Mensagem } from './Mensagem';
import { NumProc } from './NumProc';

declare function atualizarSaldo(
  numProcessoOriginario: string,
  agencia: string,
  conta: number,
  idProcesso: string,
  numProcesso: string,
  numBanco: number,
  idRequisicaoBeneficiarioPagamento: string,
  qtdMovimentos: number
): void;

const Estado = makeConstructors({
  Ocioso: (infoContas: InfoConta[]) => ({ infoContas }),
  Atualizando: (infoContas: InfoConta[], conta: number) => ({
    infoContas,
    conta,
  }),
  Erro: (erro: Error) => ({ erro }),
});
type Estado = FromConstructors<typeof Estado>;

const Acao = makeConstructors({
  Atualizar: () => ({}),
  SaldoAtualizado: (saldo: number) => ({ saldo }),
  ErroComunicacao: (mensagem?: string) => ({ mensagem }),
});
type Acao = FromConstructors<typeof Acao>;

export function paginaContas(numproc: NumProc): Either<Error, void> {
  const barra = document.getElementById('divInfraBarraLocalizacao');
  if (!barra) {
    return Left(new Error('Barra de localização não encontrada.'));
  }
  const div = document.createElement('div');
  div.className = 'gm-atualizar-saldo__contas';
  barra.insertAdjacentElement('afterend', div)!;

  let sub: Subscription | null = null;
  const bc = createMsgService();
  const store = createStore<Estado, Acao>(
    () => {
      const estado = flow(obterContas(), E.match(Estado.Erro, Estado.Ocioso));
      match(estado)
        .case('Erro', () => {})
        .otherwise(() => {
          bc.subscribe(msg =>
            matchWith('tipo')(msg)
              .case('InformaContas', () => {})
              .case('InformaSaldoDeposito', () => {})
              .case('PerguntaAtualizar', () => {})
              .case(
                'RespostaAtualizar',
                ({ numproc: msgNumproc, atualizar }) => {
                  if (msgNumproc !== numproc) return;
                  if (atualizar) {
                    store.dispatch(Acao.Atualizar());
                  }
                }
              )
              .get()
          );
          bc.publish(Mensagem.PerguntaAtualizar(numproc));
        })
        .get();
      return estado;
    },
    (estado, acao) =>
      match(acao)
        .case('Atualizar', () =>
          match(estado)
            .case('Erro', () => estado)
            .case('Ocioso', ({ infoContas }) => {
              ouvirXHR(x => store.dispatch(x));
              const primeiraConta = encontrarContaAtualizavel(infoContas);
              if (primeiraConta < 0) {
                // Existem contas, mas não podem ser atualizadas. Ex.: Banco do Brasil
                bc.publish(
                  Mensagem.InformaContas(
                    numproc,
                    infoContas.map(x => x.saldo).filter(x => x > 0).length,
                    false
                  )
                );
                return estado;
              }
              infoContas[primeiraConta]!.atualizacao!();
              return Estado.Atualizando(infoContas, primeiraConta);
            })
            .case('Atualizando', () =>
              Estado.Erro(
                new Error('Tentativa de atualização durante outra atualização.')
              )
            )
            .get()
        )
        .case('SaldoAtualizado', ({ saldo }) =>
          match(estado)
            .case('Erro', () => estado)
            .case('Ocioso', () => estado)
            .case('Atualizando', ({ conta, infoContas }) => {
              const infoNova: InfoConta[] = infoContas
                .slice(0, conta)
                .concat([{ saldo, atualizacao: null }])
                .concat(infoContas.slice(conta + 1));
              const proxima = encontrarContaAtualizavel(infoNova, conta + 1);
              if (proxima < 0) {
                const qtdComSaldo = infoNova
                  .map(x => x.saldo)
                  .filter(x => x > 0).length;
                const permiteAtualizar = infoNova.some(
                  x => x.atualizacao !== null
                );
                bc.publish(
                  Mensagem.InformaContas(numproc, qtdComSaldo, permiteAtualizar)
                );
                return Estado.Ocioso(infoNova);
              }
              infoNova[proxima]!.atualizacao!();
              return Estado.Atualizando(infoNova, proxima);
            })
            .get()
        )
        .case(
          'ErroComunicacao',
          ({ mensagem = 'Ocorreu um erro na atualização dos saldos.' }) =>
            match(estado)
              .case('Erro', () => estado)
              .otherwise(() => {
                bc.destroy();
                return Estado.Erro(new Error(mensagem));
              })
              .get()
        )
        .get()
  );

  sub = store.subscribe(update);
  return Right(undefined as void);

  function App({ estado }: { estado: Estado }) {
    return match(estado)
      .case('Atualizando', ({ conta }) => (
        <span>Atualizando conta {conta + 1}...</span>
      ))
      .case('Ocioso', ({ infoContas }) => {
        const contasComSaldo = infoContas.filter(x => x.saldo > 0).length;
        const contasAtualizaveis = infoContas
          .map(x => x.atualizacao)
          .filter((x): x is () => void => x !== null);
        const classe = contasComSaldo === 0 ? 'zerado' : 'saldo';

        const mensagem =
          contasComSaldo === 0
            ? 'Sem saldo em conta(s).'
            : contasComSaldo === 1
              ? 'Há 1 conta com saldo.'
              : `Há ${contasComSaldo} contas com saldo.`;
        const botao =
          contasAtualizaveis.length === 0 ? null : (
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
        if (sub) {
          sub.unsubscribe();
          sub = null;
        }
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
      '#divInfraAreaDadosDinamica > table'
    );
    if (!tabela) return Right([]);
    return flow(
      tabela.querySelectorAll<HTMLTableRowElement>('tr[id^="tdConta"]'),
      I.traverse(applicativeEither)(
        pipe(
          obterInfoContaLinha,
          M.fromNullable,
          M.toEither(() => new Error('Erro ao obter dados das contas.'))
        )
      )
    );
  }

  function ouvirXHR(handler: Handler<Acao>) {
    $.ajaxSetup({
      complete(xhr, resultado) {
        if (!p.hasShape({ url: p.isString })(this)) return;
        const url = new URL(this.url, document.location.href);
        if (!/\/controlador_ajax\.php$/.test(url.pathname)) return;
        if (url.searchParams.get('acao_ajax') !== 'atualizar_precatorio_rpv')
          return;
        try {
          p.assert(p.isLiteral(200)(xhr.status));
          const responseXML = xhr.responseXML;
          if (responseXML) {
            const erros = responseXML.querySelectorAll('erros > erro');
            const mensagem =
              erros.length === 0
                ? undefined
                : flow(
                    erros,
                    A.map(erro => erro.getAttribute('descricao')?.trim() ?? ''),
                    A.filter(x => x !== '')
                  ).join('\n') || undefined;
            return handler(Acao.ErroComunicacao(mensagem));
          }
          const json = p.check(
            p.hasShape({ saldo_valor_total_sem_formatacao: p.isString }),
            xhr.responseJSON
          );
          const novoSaldo = p.check(
            (x): x is number => !Number.isNaN(x),
            Number(json.saldo_valor_total_sem_formatacao)
          );
          return handler(Acao.SaldoAtualizado(novoSaldo));
        } catch (err) {
          const mensagem = err instanceof Error ? err.message : undefined;
          return handler(Acao.ErroComunicacao(mensagem));
        }
      },
    });
  }
}

interface InfoConta {
  saldo: number;
  atualizacao: (() => void) | null;
}

const jsLinkRE =
  /^javascript:atualizarSaldo\('(\d{20})','(\d+)',(\d+),'(\d+)','(\d{20})',(\d{3}),'(\d+)',(\d+)\)$/;

function obterInfoContaLinha(row: HTMLTableRowElement): InfoConta | null {
  if (!p.arrayHasLength(15)(row.cells)) return null;
  const celulaSaldo = row.querySelector('td[id^="saldoRemanescente"]');
  if (!celulaSaldo) {
    if ((row.cells[12].textContent ?? '').match(/^Valor estornado/))
      return { saldo: 0, atualizacao: null };
    return null;
  }
  const textoSaldo = celulaSaldo.textContent ?? '';
  const match = textoSaldo.match(/^R\$ ([0-9.]*\d,\d{2})$/);
  if (!match || !p.arrayHasLength(2)(match)) return null;
  const [, numeros] = match;
  const saldo = Number(numeros.replace(/\./g, '').replace(',', '.'));
  const link = row.cells[
    row.cells.length - 1
  ]!.querySelector<HTMLAnchorElement>('a[href^="javascript:atualizarSaldo("]');
  let atualizacao: (() => void) | null = null;
  if (link) {
    const match = link.href.match(jsLinkRE);
    if (!match || !p.arrayHasLength(9)(match)) return null;
    const [
      ,
      numProcessoOriginario,
      agencia,
      strConta,
      idProcesso,
      numProcesso,
      strBanco,
      idRequisicaoBeneficiarioPagamento,
      strQtdMovimentos,
    ] = match;
    const [conta, numBanco, qtdMovimentos] = [
      Number(strConta),
      Number(strBanco),
      Number(strQtdMovimentos),
    ].filter(x => !Number.isNaN(x));
    if (
      conta === undefined ||
      numBanco === undefined ||
      qtdMovimentos === undefined
    ) {
      return null;
    }
    atualizacao = () =>
      atualizarSaldo(
        numProcessoOriginario,
        agencia,
        conta,
        idProcesso,
        numProcesso,
        numBanco,
        idRequisicaoBeneficiarioPagamento,
        qtdMovimentos
      );
  }
  return { saldo, atualizacao };
}

function encontrarContaAtualizavel(xs: ArrayLike<InfoConta>, startAt = 0) {
  const len = xs.length;
  for (let i = startAt; i < len; i++) {
    if (xs[i]!.atualizacao !== null) return i;
  }
  return -1;
}
