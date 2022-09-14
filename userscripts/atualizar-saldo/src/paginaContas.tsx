import { Either, Left, Right, traverse } from '@nadameu/either';
import { expectUnreachable } from '@nadameu/expect-unreachable';
import { createFiniteStateMachine } from '@nadameu/finite-state-machine';
import { Handler } from '@nadameu/handler';
import * as p from '@nadameu/predicates';
import { NumProc } from './NumProc';
import { obterProcessosAguardando, removerProcessoAguardando } from './processosAguardando';
import { TransicaoInvalida } from './TransicaoInvalida';
import { render } from 'preact';

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

const PREFIXO_MSG = '<Atualizar saldo RPV>: ';
const PREFIXO_MSG_HTML = PREFIXO_MSG.replace('<', '&lt;').replace('>', '&gt;');

type Estado =
  | { status: 'ATUALIZANDO_BLOQUEIOS'; fns: Array<() => void>; conta: number }
  | { status: 'ATUALIZANDO_SALDO'; fns: Array<() => void>; conta: number }
  | { status: 'CONTAS_ATUALIZADAS'; qtd: number }
  | { status: 'ERRO'; erro: Error }
  | { status: 'CONTAS_OBTIDAS'; fns: Array<() => void> }
  | { status: 'OBTER_CONTAS' };
type Acao =
  | { type: 'CLIQUE' }
  | { type: 'CONTAS_OBTIDAS'; fns: Array<() => void> }
  | { type: 'SALDO_ATUALIZADO' }
  | { type: 'BLOQUEIOS_ATUALIZADOS' }
  | { type: 'ERRO_ATUALIZACAO'; erro: string };

export function paginaContas(numproc: NumProc): Either<Error[], void> {
  const atualizarAutomaticamente = obterProcessosAguardando().includes(numproc);
  if (atualizarAutomaticamente) {
    removerProcessoAguardando(numproc);
  }

  const barra = document.getElementById('divInfraBarraLocalizacao');
  if (!barra) {
    const msg = 'Não foi possível obter um local para exibir o resultado.';
    window.alert(`${PREFIXO_MSG}${msg}`);
    throw new Error(msg);
  }
  const div = document.createElement('div');
  div.className = 'gm-atualizar-saldo';
  const output = barra.insertAdjacentElement('afterend', div)!;

  const fsm = createFiniteStateMachine<Estado, Acao>(
    { status: 'OBTER_CONTAS' },
    {
      OBTER_CONTAS: {
        CONTAS_OBTIDAS: ({ fns }) => {
          if (fns.length === 0 || !atualizarAutomaticamente) {
            return { status: 'CONTAS_OBTIDAS', fns };
          } else {
            ouvirXHR(x => fsm.dispatch(mapXHR(x)));
            fns[0]!();
            return { status: 'ATUALIZANDO_SALDO', fns, conta: 0 };
          }
        },
      },
      ATUALIZANDO_SALDO: {
        SALDO_ATUALIZADO: (_, { fns, conta }) => ({ status: 'ATUALIZANDO_BLOQUEIOS', fns, conta }),
        ERRO_ATUALIZACAO: ({ erro }) => ({
          status: 'ERRO',
          erro: new Error('Erro na atualização das contas.'),
        }),
      },
      ATUALIZANDO_BLOQUEIOS: {
        BLOQUEIOS_ATUALIZADOS: (acao, estado) => {
          const proxima = estado.conta + 1;
          if (proxima >= estado.fns.length) {
            return { status: 'CONTAS_ATUALIZADAS', qtd: estado.fns.length };
          } else {
            estado.fns[proxima]!();
            return { status: 'ATUALIZANDO_SALDO', fns: estado.fns, conta: proxima };
          }
        },
        ERRO_ATUALIZACAO: ({ erro }) => ({
          status: 'ERRO',
          erro: new Error('Erro na atualização das contas.'),
        }),
      },
      CONTAS_ATUALIZADAS: {},
      CONTAS_OBTIDAS: {
        CLIQUE: (acao, estado) => {
          ouvirXHR(x => fsm.dispatch(mapXHR(x)));
          estado.fns[0]!();
          return { status: 'ATUALIZANDO_SALDO', fns: estado.fns, conta: 0 };
        },
      },
      ERRO: {},
    },
    (estado, acao) => ({ status: 'ERRO', erro: new TransicaoInvalida(estado, acao) })
  );

  fsm.subscribe(update);
  obterContas();
  return Right(undefined as void);

  function App({ estado }: { estado: Estado }) {
    let mensagem: string;
    switch (estado.status) {
      case 'OBTER_CONTAS':
        return (
          <>
            <output>Obtendo informações das contas...</output>
          </>
        );

      case 'CONTAS_OBTIDAS':
        return (
          <>
            <output class={estado.fns.length === 0 ? 'zerado' : 'saldo'}>
              {estado.fns.length} conta(s) encontrada(s).
            </output>
            <br />
            <button onClick={onClick} disabled={estado.fns.length === 0}>
              Atualizar
            </button>
          </>
        );

      case 'ATUALIZANDO_BLOQUEIOS':
        return (
          <>
            <output>Atualizando bloqueios da conta {estado.conta + 1}...</output>
          </>
        );

      case 'ATUALIZANDO_SALDO':
        return (
          <>
            <output>Atualizando saldo da conta {estado.conta + 1}...</output>
          </>
        );

      case 'CONTAS_ATUALIZADAS':
        return (
          <>
            <output>{estado.qtd} conta(s) atualizada(s).</output>
          </>
        );

      case 'ERRO':
        return (
          <>
            <output class="erro">{estado.erro.message}</output>
          </>
        );

      default:
        expectUnreachable(estado);
    }
    return (
      <>
        <output>Mensagem</output>
        <br />
        <button onClick={onClick}>Atualizar saldos</button>
      </>
    );
  }

  function onClick(evt: Event) {
    evt.preventDefault();
    fsm.dispatch({ type: 'CLIQUE' });
  }

  function update(estado: Estado) {
    render(<App estado={estado} />, div);
  }

  function obterContas() {
    const linksAtualizar = document.querySelectorAll<HTMLAnchorElement>(
      'a[href^="javascript:atualizarSaldo("]'
    );
    if (linksAtualizar.length === 0) return fsm.dispatch({ type: 'CONTAS_OBTIDAS', fns: [] });
    const jsLinkRE =
      /^javascript:atualizarSaldo\('(?<numProcessoOriginario>\d{20})','(?<agencia>\d{4})',(?<conta>\d+),'(?<idProcesso>\d+)','(?<numProcesso>\d{20})',(?<numBanco>\d{3}),'(?<idRequisicaoBeneficiarioPagamento>\d+)',(?<qtdMovimentos>\d+)\)$/;
    const temCamposObrigatorios = p.hasShape({
      numProcessoOriginario: p.isString,
      agencia: p.isString,
      conta: p.isString,
      idProcesso: p.isString,
      numProcesso: p.isString,
      numBanco: p.isString,
      idRequisicaoBeneficiarioPagamento: p.isString,
      qtdMovimentos: p.isString,
    });
    const fnsAtualizacao = traverse(linksAtualizar, link => {
      const groups = link.href.match(jsLinkRE)?.groups;
      if (!temCamposObrigatorios(groups))
        return Left(new Error(`Link de atualização desconhecido: "${link.href}".`));

      const {
        numProcessoOriginario,
        agencia,
        conta: strConta,
        idProcesso,
        numProcesso,
        numBanco: strBanco,
        idRequisicaoBeneficiarioPagamento,
        qtdMovimentos: strQtdMovimentos,
      } = groups;
      const [conta, numBanco, qtdMovimentos] = [
        Number(strConta),
        Number(strBanco),
        Number(strQtdMovimentos),
      ];
      return Right(() =>
        atualizarSaldo(
          numProcessoOriginario,
          agencia,
          conta,
          idProcesso,
          numProcesso,
          numBanco,
          idRequisicaoBeneficiarioPagamento,
          qtdMovimentos
        )
      );
    });
    fnsAtualizacao.match({
      Left: error => {
        fsm.dispatch({ type: 'ERRO_ATUALIZACAO', erro: error.message });
      },
      Right: fns => {
        fsm.dispatch({ type: 'CONTAS_OBTIDAS', fns });
      },
    });
  }

  function ouvirXHR(handler: Handler<{ resultado: string; texto: string }>) {
    $.ajaxSetup({
      complete(xhr, resultado) {
        handler({ resultado, texto: xhr.responseText });
      },
    });
  }

  function mapXHR({ resultado, texto }: { resultado: string; texto: string }): Acao {
    if (resultado === 'success') {
      if (texto.match(/"saldo_valor_disponivel"/)) {
        return { type: 'SALDO_ATUALIZADO' };
      } else if (texto.match(/"htmlBloqueiosConta"/)) {
        return { type: 'BLOQUEIOS_ATUALIZADOS' };
      }
    }
    return { type: 'ERRO_ATUALIZACAO', erro: texto };
  }
}
