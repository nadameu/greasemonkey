import { Either, Left, Right, traverse, validateMap } from '@nadameu/either';
import { expectUnreachable } from '@nadameu/expect-unreachable';
import { createFiniteStateMachine } from '@nadameu/finite-state-machine';
import { Handler } from '@nadameu/handler';
import * as p from '@nadameu/predicates';
import { NumProc } from './NumProc';
import { obterProcessosAguardando, removerProcessoAguardando } from './processosAguardando';
import { TransicaoInvalida } from './TransicaoInvalida';

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
  | { status: 'OBTER_CONTAS' };
type Acao =
  | { type: 'CONTAS_OBTIDAS'; fns: Array<() => void> }
  | { type: 'SALDO_ATUALIZADO' }
  | { type: 'BLOQUEIOS_ATUALIZADOS' }
  | { type: 'ERRO_ATUALIZACAO'; erro: string };

export function paginaContas(numproc: NumProc): Either<Error[], void> {
  if (!obterProcessosAguardando().includes(numproc)) return Right(undefined as void);
  removerProcessoAguardando(numproc);

  const barra = document.getElementById('divInfraBarraLocalizacao');
  if (!barra) {
    const msg = 'Não foi possível obter um local para exibir o resultado.';
    window.alert(`${PREFIXO_MSG}${msg}`);
    throw new Error(msg);
  }
  const output = barra.parentNode!.insertBefore(
    document.createElement('output'),
    barra.nextSibling
  );

  const fsm = createFiniteStateMachine<Estado, Acao>(
    { status: 'OBTER_CONTAS' },
    {
      OBTER_CONTAS: {
        CONTAS_OBTIDAS: ({ fns }) => {
          if (fns.length === 0) {
            return { status: 'CONTAS_ATUALIZADAS', qtd: 0 };
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
      ERRO: {},
    },
    (estado, acao) => ({ status: 'ERRO', erro: new TransicaoInvalida(estado, acao) })
  );

  fsm.subscribe(render);
  obterContas();
  return Right(undefined as void);

  function render(estado: Estado) {
    output.innerHTML = obterHtml(estado);

    function obterHtml(estado: Estado) {
      switch (estado.status) {
        case 'ATUALIZANDO_BLOQUEIOS':
          return mensagem(`Atualizando bloqueios da conta ${estado.conta + 1}...`);

        case 'ATUALIZANDO_SALDO':
          return mensagem(`Atualizando saldo da conta ${estado.conta + 1}...`);

        case 'CONTAS_ATUALIZADAS':
          if (estado.qtd === 0) {
            return mensagem(`Não é possível atualizar o saldo das contas.`, 'erro');
          } else {
            const s = estado.qtd > 1 ? 's' : '';
            return mensagem(`${estado.qtd} conta${s} atualizada${s}.`, 'fim');
          }

        case 'ERRO':
          return mensagem(estado.erro.message, 'erro');

        case 'OBTER_CONTAS':
          return mensagem(`Obtendo dados sobre as contas...`);

        default:
          return expectUnreachable(estado);
      }
    }

    function mensagem(texto: string, estilo?: 'fim' | 'erro') {
      const style =
        estilo === 'fim'
          ? 'color: darkgreen;'
          : estilo === 'erro'
          ? 'color: red; font-weight: bold;'
          : null;
      if (style) return `<span style="${style}">${PREFIXO_MSG_HTML}${texto}</span>`;
      else return `${PREFIXO_MSG_HTML}${texto}`;
    }
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
