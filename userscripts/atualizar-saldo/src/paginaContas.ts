import { expectUnreachable } from '@nadameu/expect-unreachable';
import { Handler } from '@nadameu/handler';
import * as p from '@nadameu/predicates';
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

const PREFIXO_MSG = '<Atualizar saldo RPV>: ';
const PREFIXO_MSG_HTML = PREFIXO_MSG.replace('<', '&lt;').replace('>', '&gt;');

class TransicaoInvalida extends Error {
  name = 'TransicaoInvalida';
  constructor(public estado: any, public acao: any) {
    super('Transição inválida.');
  }
}

type Estado =
  | { type: 'ATUALIZANDO_BLOQUEIOS'; fns: Array<() => void>; conta: number }
  | { type: 'ATUALIZANDO_SALDO'; fns: Array<() => void>; conta: number }
  | { type: 'CONTAS_ATUALIZADAS'; qtd: number }
  | { type: 'ERRO'; erro: Error }
  | { type: 'OBTER_CONTAS' };
type Acao =
  | { type: 'CONTAS_OBTIDAS'; fns: Array<() => void> }
  | { type: 'SALDO_ATUALIZADO' }
  | { type: 'BLOQUEIOS_ATUALIZADOS' }
  | { type: 'ERRO_ATUALIZACAO'; erro: string };

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

  const store = createStore<Estado, Acao>(function* () {
    let estado: Estado = { type: 'OBTER_CONTAS' };
    while (true) {
      const acao: Acao | undefined = yield estado;
      if (!acao) continue;

      if (estado.type === 'OBTER_CONTAS') {
        if (acao.type === 'CONTAS_OBTIDAS') {
          if (acao.fns.length === 0) {
            estado = { type: 'CONTAS_ATUALIZADAS', qtd: 0 };
          } else {
            estado = { type: 'ATUALIZANDO_SALDO', fns: acao.fns, conta: 0 };
            ouvirXHR(makeHandler(x => store.dispatch(x)));
            estado.fns[0]!();
          }
          continue;
        }
      } else if (estado.type === 'ATUALIZANDO_SALDO') {
        if (acao.type === 'SALDO_ATUALIZADO') {
          estado = { type: 'ATUALIZANDO_BLOQUEIOS', fns: estado.fns, conta: estado.conta };
          continue;
        } else if (acao.type === 'ERRO_ATUALIZACAO') {
          estado = { type: 'ERRO', erro: new Error('Erro na atualização das contas.') };
          continue;
        }
      } else if (estado.type === 'ATUALIZANDO_BLOQUEIOS') {
        if (acao.type === 'BLOQUEIOS_ATUALIZADOS') {
          const proxima: number = estado.conta + 1;
          if (proxima >= estado.fns.length) {
            estado = { type: 'CONTAS_ATUALIZADAS', qtd: estado.fns.length };
          } else {
            estado = { type: 'ATUALIZANDO_SALDO', fns: estado.fns, conta: proxima };
            estado.fns[proxima]!();
          }
          continue;
        } else if (acao.type === 'ERRO_ATUALIZACAO') {
          estado = { type: 'ERRO', erro: new Error('Erro na atualização das contas.') };
          continue;
        }
      }
      throw new TransicaoInvalida(estado, acao);
    }
  });

  store.subscribe(estado => {
    output.innerHTML = obterHtml(estado);

    function obterHtml(estado: Estado) {
      switch (estado.type) {
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
  });

  obterContas();
  return;

  function obterContas() {
    const linksAtualizar = document.querySelectorAll<HTMLAnchorElement>(
      'a[href^="javascript:atualizarSaldo("]'
    );
    if (linksAtualizar.length === 0) return store.dispatch({ type: 'CONTAS_OBTIDAS', fns: [] });
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
    store.dispatch({ type: 'CONTAS_OBTIDAS', fns: fnsAtualizacao });
  }

  function ouvirXHR(handler: Handler<{ resultado: string; texto: string }>) {
    $.ajaxSetup({
      complete(xhr, resultado) {
        handler({ resultado, texto: xhr.responseText });
      },
    });
  }

  function makeHandler(dispatch: Handler<Acao>): Handler<{ resultado: string; texto: string }> {
    return ({ resultado, texto }) => {
      if (resultado === 'success') {
        if (texto.match(/"saldo_valor_disponivel"/)) {
          return dispatch({ type: 'SALDO_ATUALIZADO' });
        } else if (texto.match(/"htmlBloqueiosConta"/)) {
          return dispatch({ type: 'BLOQUEIOS_ATUALIZADOS' });
        }
      }
      dispatch({ type: 'ERRO_ATUALIZACAO', erro: texto });
    };
  }
}
