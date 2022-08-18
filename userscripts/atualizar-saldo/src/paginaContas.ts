import { expectUnreachable } from '@nadameu/expect-unreachable';
import { Handler } from '@nadameu/handler';
import * as p from '@nadameu/predicates';
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

const PREFIXO_MSG = '<Atualizar saldo RPV>: ';
const PREFIXO_MSG_HTML = PREFIXO_MSG.replace('<', '&lt;').replace('>', '&gt;');

const estados = {
  ATUALIZANDO_BLOQUEIOS: 'atualizando-bloqueios',
  ATUALIZANDO_SALDO: 'atualizando-saldo',
  CONTAS_ATUALIZADAS: 'contas-atualizadas',
  ERRO: 'erro',
  OBTER_CONTAS: 'obter-contas',
} as const;
type Estados = typeof estados;
type Estado =
  | { tipo: Estados['ATUALIZANDO_BLOQUEIOS']; fns: Array<() => void>; conta: number }
  | { tipo: Estados['ATUALIZANDO_SALDO']; fns: Array<() => void>; conta: number }
  | { tipo: Estados['CONTAS_ATUALIZADAS']; qtd: number }
  | { tipo: Estados['ERRO']; erro: Error }
  | { tipo: Estados['OBTER_CONTAS'] };
type Acao = (estado: Estado, dispatch: Dispatch) => Estado;
type Dispatch = Handler<Acao>;

export async function paginaContas(numproc: NumProc) {
  if (!obterProcessosAguardando().includes(numproc)) return;
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
  const render = (estado: Estado) => {
    output.innerHTML = obterHtml(estado);

    function obterHtml(estado: Estado) {
      switch (estado.tipo) {
        case estados.ATUALIZANDO_BLOQUEIOS:
          return mensagem(`Atualizando bloqueios da conta ${estado.conta + 1}...`);

        case estados.ATUALIZANDO_SALDO:
          return mensagem(`Atualizando saldo da conta ${estado.conta + 1}...`);

        case estados.CONTAS_ATUALIZADAS:
          if (estado.qtd === 0) {
            return mensagem(`Não é possível atualizar o saldo das contas.`, 'erro');
          } else {
            const s = estado.qtd > 1 ? 's' : '';
            return mensagem(`${estado.qtd} conta${s} atualizada${s}.`, 'fim');
          }

        case estados.ERRO:
          return mensagem(estado.erro.message, 'erro');

        case estados.OBTER_CONTAS:
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
  };

  const dispatch: Dispatch = (() => {
    let estado: Estado = { tipo: estados.OBTER_CONTAS };
    render(estado);
    return f => {
      const proximo = f(estado, dispatch);
      if (proximo !== estado) {
        estado = proximo;
        render(estado);
      }
    };
  })();
  const estadoErro = (msg?: string): Estado => ({ tipo: estados.ERRO, erro: new Error(msg) });
  const acoes = {
    bloqueiosAtualizados: (): Acao => estado => {
      if (estado.tipo !== estados.ATUALIZANDO_BLOQUEIOS)
        return estadoErro(`Estado inválido: ${JSON.stringify(estado)}`);
      const proxima = estado.conta + 1;
      if (proxima >= estado.fns.length) {
        return { tipo: estados.CONTAS_ATUALIZADAS, qtd: estado.fns.length };
      } else {
        estado.fns[proxima]!();
        return { tipo: estados.ATUALIZANDO_SALDO, fns: estado.fns, conta: proxima };
      }
    },
    contasObtidas:
      (fns: Array<() => void>): Acao =>
      (estado, dispatch) => {
        if (estado.tipo !== estados.OBTER_CONTAS)
          return estadoErro(`Estado inválido: ${JSON.stringify(estado)}`);
        if (fns.length === 0) return { tipo: estados.CONTAS_ATUALIZADAS, qtd: 0 };
        ouvirXHR(makeHandler(dispatch));
        fns[0]!();
        return { tipo: estados.ATUALIZANDO_SALDO, fns, conta: 0 };
      },
    erroAtualizacao:
      (texto: string): Acao =>
      estado => {
        switch (estado.tipo) {
          case estados.ATUALIZANDO_SALDO:
            return estadoErro(`Erro atualizando saldo da conta ${estado.conta + 1}.`);

          case estados.ATUALIZANDO_BLOQUEIOS:
            return estadoErro(`Erro atualizando os bloqueios da conta ${estado.conta + 1}.`);

          default:
            return estadoErro(`Estado inválido: ${JSON.stringify(estado)}`);
        }
      },
    saldoAtualizado: (): Acao => estado => {
      if (estado.tipo !== estados.ATUALIZANDO_SALDO)
        return estadoErro(`Estado inválido: ${JSON.stringify(estado)}`);
      return { tipo: estados.ATUALIZANDO_BLOQUEIOS, fns: estado.fns, conta: estado.conta };
    },
  };
  obterContas();
  return;

  function obterContas() {
    const linksAtualizar = document.querySelectorAll<HTMLAnchorElement>(
      'a[href^="javascript:atualizarSaldo("]'
    );
    if (linksAtualizar.length === 0) return dispatch(acoes.contasObtidas([]));
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
    const fnsAtualizacao = Array.from(linksAtualizar, link =>
      p.check(
        temCamposObrigatorios,
        link.href.match(jsLinkRE)?.groups,
        'Link de atualização desconhecido.'
      )
    ).map(groups => {
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
      return () =>
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
    });
    dispatch(acoes.contasObtidas(fnsAtualizacao));
  }

  function ouvirXHR(handler: Handler<{ resultado: string; texto: string }>) {
    $.ajaxSetup({
      complete(xhr, resultado) {
        handler({ resultado, texto: xhr.responseText });
      },
    });
  }

  function makeHandler(dispatch: Dispatch): Handler<{ resultado: string; texto: string }> {
    return ({ resultado, texto }) => {
      console.debug({ resultado, texto });
      if (resultado !== 'success') {
        dispatch(acoes.erroAtualizacao(texto));
      } else if (texto.match(/"saldo_valor_disponivel"/)) {
        dispatch(acoes.saldoAtualizado());
      } else if (texto.match(/"htmlBloqueiosConta"/)) {
        dispatch(acoes.bloqueiosAtualizados());
      }
    };
  }
}
