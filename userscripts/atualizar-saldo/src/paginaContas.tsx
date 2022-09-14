import { Either, Left, Right, traverse } from '@nadameu/either';
import { Handler } from '@nadameu/handler';
import * as p from '@nadameu/predicates';
import { render } from 'preact';
import { makeTaggedUnion, MemberType, none } from 'safety-match';
import { createStore } from './createStore';
import { NumProc } from './NumProc';
import { obterProcessosAguardando, removerProcessoAguardando } from './processosAguardando';

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

const Estado = makeTaggedUnion({
  Ocioso: (infoContas: InfoConta[]) => ({ infoContas }),
  Atualizando: (infoContas: InfoConta[], conta: number) => ({ infoContas, conta }),
  Erro: (erro: Error) => ({ erro }),
});
type Estado = MemberType<typeof Estado>;

const Acao = makeTaggedUnion({
  Atualizar: none,
  SaldoAtualizado: (saldo: number) => ({ saldo }),
  ErroComunicacao: (mensagem?: string) => ({ mensagem }),
});
type Acao = MemberType<typeof Acao>;

export function paginaContas(numproc: NumProc): Either<Error[], void> {
  const atualizarAutomaticamente = obterProcessosAguardando().includes(numproc);
  if (atualizarAutomaticamente) {
    removerProcessoAguardando(numproc);
  }

  const barra = document.getElementById('divInfraBarraLocalizacao');
  if (!barra) {
    return Left([new Error('Barra de localização não encontrada.')]);
  }
  const div = document.createElement('div');
  div.className = 'gm-atualizar-saldo__contas';
  barra.insertAdjacentElement('afterend', div)!;

  const store = createStore<Estado, Acao>(
    () =>
      obterContas().match<Estado>({
        Left: Estado.Erro,
        Right: Estado.Ocioso,
      }),
    (estado, acao) =>
      acao.match({
        Atualizar: () =>
          estado.match({
            Erro: () => estado,
            Ocioso: ({ infoContas }) => {
              ouvirXHR(x => store.dispatch(x));
              const primeiraConta = findIndex(infoContas, x => x.atualizacao !== null);
              if (primeiraConta < 0) {
                // Existem contas, mas não podem ser atualizadas. Ex.: Banco do Brasil
                return estado;
              }
              infoContas[primeiraConta]!.atualizacao!();
              return Estado.Atualizando(infoContas, primeiraConta);
            },
            Atualizando: () =>
              Estado.Erro(new Error('Tentativa de atualização durante outra atualização.')),
          }),
        SaldoAtualizado: ({ saldo }) =>
          estado.match({
            Erro: () => estado,
            Ocioso: () => estado,
            Atualizando: ({ conta, infoContas }) => {
              const infoNova = infoContas
                .slice(0, conta)
                .concat([{ saldo, atualizacao: null }])
                .concat(infoContas.slice(conta + 1));
              const proxima = findIndex(infoNova, x => x.atualizacao !== null, conta + 1);
              if (proxima < 0) return Estado.Ocioso(infoNova);
              infoNova[proxima]!.atualizacao!();
              return Estado.Atualizando(infoNova, proxima);
            },
          }),
        ErroComunicacao: ({ mensagem = 'Ocorreu um erro na atualização dos saldos.' }) => {
          console.error(new Error(mensagem));
          return estado.match({ Erro: () => estado, _: () => Estado.Erro(new Error(mensagem)) });
        },
      })
  );

  store.subscribe(update);
  if (atualizarAutomaticamente) {
    store.dispatch(Acao.Atualizar);
  }
  return Right(undefined as void);

  function App({ estado }: { estado: Estado }) {
    return estado.match({
      Atualizando: ({ conta }) => <span>Atualizando conta {conta + 1}...</span>,
      Ocioso: ({ infoContas }) => {
        const contasComSaldo = infoContas.filter(x => x.saldo > 0).length;
        const contasAtualizaveis = infoContas
          .map(x => x.atualizacao)
          .filter((x): x is () => void => x !== null);
        const mensagem =
          contasComSaldo === 0 ? (
            <span class="zerado">Sem saldo em conta(s).</span>
          ) : (
            <span class="saldo">Há {contasComSaldo} conta(s) com saldo.</span>
          );
        const botao =
          contasAtualizaveis.length === 0 ? null : <button onClick={onClick}>Atualizar</button>;
        return (
          <>
            {mensagem}
            <br />
            {botao}
          </>
        );
      },
      Erro: ({ erro }) => (
        <>
          <span class="erro">{erro.message}</span>
        </>
      ),
    });
  }

  function onClick(evt: Event) {
    evt.preventDefault();
    store.dispatch(Acao.Atualizar);
  }

  function update(estado: Estado) {
    render(<App estado={estado} />, div);
  }
  function obterContas(): Either<Error, InfoConta[]> {
    const tabela = document.querySelector<HTMLTableElement>('#divInfraAreaDadosDinamica > table');
    if (!tabela) return Right([]);
    return traverse(
      tabela.querySelectorAll<HTMLTableRowElement>('tr[id^="tdConta"]'),
      obterInfoContaLinha
    ).mapLeft(e => new Error('Erro ao obter dados das contas.' + e));
  }

  function ouvirXHR(handler: Handler<Acao>) {
    $.ajaxSetup({
      complete(xhr, resultado) {
        if (!p.hasShape({ url: p.isString })(this)) return;
        const url = new URL(this.url, document.location.href);
        if (!/\/controlador_ajax\.php$/.test(url.pathname)) return;
        if (url.searchParams.get('acao_ajax') !== 'atualizar_precatorio_rpv') return;
        try {
          p.check(p.isLiteral(200), xhr.status);
          const responseXML = xhr.responseXML;
          if (responseXML) {
            const erros = responseXML.querySelectorAll('erros > erro');
            const mensagem =
              erros.length === 0
                ? undefined
                : Array.from(erros, erro => erro.getAttribute('descricao')?.trim() ?? '')
                    .filter(x => x !== '')
                    .join('\n') || undefined;
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
  /^javascript:atualizarSaldo\('(\d{20})','(\d{4})',(\d+),'(\d+)','(\d{20})',(\d{3}),'(\d+)',(\d+)\)$/;

function obterInfoContaLinha(row: HTMLTableRowElement): Either<null, InfoConta> {
  if (row.cells.length !== 15) return Left(null);
  const celulaSaldo = row.querySelector('td[id^="saldoRemanescente"]');
  if (!celulaSaldo) return Left(null);
  const textoSaldo = celulaSaldo.textContent ?? '';
  const match = textoSaldo.match(/^R\$ ([0-9.]*\d,\d{2})$/);
  if (!match || match.length < 2) return Left(null);
  const [, numeros] = match as [string, string];
  const saldo = Number(numeros.replace(/\./g, '').replace(',', '.'));
  const link = row.cells[row.cells.length - 1]!.querySelector<HTMLAnchorElement>(
    'a[href^="javascript:atualizarSaldo("]'
  );
  let atualizacao: (() => void) | null = null;
  if (link) {
    const match = link.href.match(jsLinkRE);
    if (!match || match.length < 9) return Left(null);
    const [
      _,
      numProcessoOriginario,
      agencia,
      strConta,
      idProcesso,
      numProcesso,
      strBanco,
      idRequisicaoBeneficiarioPagamento,
      strQtdMovimentos,
    ] = match as [string, string, string, string, string, string, string, string, string];
    const [conta, numBanco, qtdMovimentos] = [
      Number(strConta),
      Number(strBanco),
      Number(strQtdMovimentos),
    ].filter(x => !Number.isNaN(x));
    if (conta === undefined || numBanco === undefined || qtdMovimentos === undefined) {
      return Left(null);
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
  return Right({ saldo, atualizacao });
}

function findIndex<T>(xs: ArrayLike<T>, pred: (_: T) => boolean, startAt = 0) {
  const len = xs.length;
  for (let i = startAt; i < len; i++) {
    if (pred(xs[i]!)) return i;
  }
  return -1;
}
