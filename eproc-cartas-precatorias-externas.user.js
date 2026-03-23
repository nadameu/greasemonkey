// ==UserScript==
// @name         eproc-cartas-precatorias-externas
// @name:pt-BR   eproc - processos externos
// @namespace    http://nadameu.com.br
// @version      1.2.1
// @author       nadameu
// @description  Permite consultar processos externos através do serviço www.jus.br
// @match        https://eproc.jfpr.jus.br/eprocV2/controlador.php?acao=relatorio_processo_carta_precatoria_listar&*
// @match        https://eproc.jfrs.jus.br/eprocV2/controlador.php?acao=relatorio_processo_carta_precatoria_listar&*
// @match        https://eproc.jfsc.jus.br/eprocV2/controlador.php?acao=relatorio_processo_carta_precatoria_listar&*
// @match        https://eproc.trf4.jus.br/eproc2trf4/controlador.php?acao=relatorio_processo_carta_precatoria_listar&*
// @match        https://eproc.jfpr.jus.br/eprocV2/controlador.php?acao=processo_selecionar&*
// @match        https://eproc.jfrs.jus.br/eprocV2/controlador.php?acao=processo_selecionar&*
// @match        https://eproc.jfsc.jus.br/eprocV2/controlador.php?acao=processo_selecionar&*
// @match        https://eproc.trf4.jus.br/eproc2trf4/controlador.php?acao=processo_selecionar&*
// @match        https://portaldeservicos.pdpj.jus.br/consulta
// @match        https://portaldeservicos.pdpj.jus.br/consulta/autosdigitais
// @grant        GM.deleteValue
// @grant        GM.getValue
// @grant        GM.setValue
// @grant        GM_addStyle
// @grant        unsafeWindow
// @grant        window.close
// ==/UserScript==

(function () {
  'use strict';

  function log_erro(err) {
    console.group('<eproc-cartas-precatorias-externas>');
    console.error(err);
    console.groupEnd();
  }
  var _GM = (() => (typeof GM != 'undefined' ? GM : void 0))();
  var _GM_addStyle = (() =>
    typeof GM_addStyle != 'undefined' ? GM_addStyle : void 0)();
  var _unsafeWindow = (() =>
    typeof unsafeWindow != 'undefined' ? unsafeWindow : void 0)();
  function createBroadcastService(id, validate) {
    const listeners = new Set();
    const bc = new BroadcastChannel(id);
    bc.addEventListener('message', onMessage);
    return { destroy, publish, subscribe };
    function onMessage(evt) {
      if (validate(evt.data))
        for (const listener of listeners) listener(evt.data);
    }
    function destroy() {
      bc.removeEventListener('message', onMessage);
      listeners.clear();
      bc.close();
    }
    function publish(message) {
      bc.postMessage(message);
    }
    function subscribe(listener) {
      listeners.add(listener);
      return {
        unsubscribe() {
          listeners.delete(listener);
        },
      };
    }
  }
  class AssertionError extends Error {
    name = 'AssertionError';
    constructor(message) {
      super(message);
    }
  }
  function assert(condition, message) {
    if (!condition) throw new AssertionError(message);
  }
  function check(predicate, value, message) {
    assert(predicate(value), message);
    return value;
  }
  function isLiteral(literal) {
    return value => value === literal;
  }
  const isNull = isLiteral(null);
  function negate(predicate) {
    return value => !predicate(value);
  }
  const isNotNull = negate(isNull);
  const arrayHasLength = num => obj => obj.length === num;
  function validar_mensagem(msg) {
    return (
      typeof msg === 'object' &&
      msg !== null &&
      'processo_aberto' in msg &&
      typeof msg.processo_aberto === 'string' &&
      /^[0-9]{20}$/.test(msg.processo_aberto)
    );
  }
  async function pdpj_consulta() {
    await new Promise((res, rej) => {
      let ms = 100;
      const LIMIT = 15e3;
      let timer = window.setTimeout(function retry() {
        window.clearTimeout(timer);
        const app = document.querySelector('app-consulta-processo');
        if (app == null && ms < LIMIT) {
          ms *= 2;
          window.setTimeout(retry, ms);
        } else if (ms >= LIMIT) {
          rej(new Error('timeout'));
        } else {
          res();
        }
      }, ms);
    });
    const numero = await _GM.getValue('numero');
    console.log({ numero });
    if (!numero) return;
    await _GM.deleteValue('numero');
    const input = check(
      isNotNull,
      document.querySelector('input[name="numeroProcesso"]'),
      'Não foi possível obter o campo do número do processo.'
    );
    const result_botao = document
      .querySelectorAll('button')
      .values()
      .filter(b => /Buscar/.test(b.textContent.trim()))
      .take(2)
      .reduce(
        (_, value, i) => (i === 0 ? { is_ok: true, value } : { is_ok: false }),
        { is_ok: false }
      );
    if (!result_botao.is_ok) {
      throw new Error('Não foi possível obter o botão "Buscar".');
    }
    const botao = result_botao.value;
    input.value = numero;
    input.dispatchEvent(new Event('input'));
    const consulta = check(
      isNotNull,
      document.querySelector('app-consulta-processo'),
      'Não foi possível obter consulta.'
    );
    const promise = new Promise(res => {
      const observer = new MutationObserver(x => {
        x.forEach(y => {
          console.log(y.addedNodes);
        });
        const rows2 = x.filter(
          y =>
            y.target instanceof HTMLElement &&
            y.target.matches('app-lista-processo mat-row')
        );
        if (rows2.length > 0) {
          observer.disconnect();
          res();
        }
      });
      observer.observe(consulta, { childList: true, subtree: true });
    });
    botao.click();
    await promise;
    const rows = consulta.querySelectorAll('app-lista-processo mat-row');
    if (arrayHasLength(1)(rows)) {
      const bc = createBroadcastService('gm-precatorias', validar_mensagem);
      bc.subscribe(({ processo_aberto }) => {
        if (processo_aberto === numero) {
          bc.destroy();
          window.close();
        }
      });
      rows[0].click();
    }
  }
  async function pdpj_processo() {
    const params = new URL(document.location.href).searchParams;
    const numero_formatado = params.get('processo');
    assert(numero_formatado !== null, 'Número do processo não encontrado.');
    const numero = numero_formatado.replace(/[.-]/g, '');
    assert(
      /^[0-9]{20}$/.test(numero),
      `Número de processo inválido: ${numero_formatado}.`
    );
    const bc = createBroadcastService('gm-precatorias', validar_mensagem);
    bc.publish({ processo_aberto: numero });
    bc.destroy();
  }
  function pdpj_main() {
    switch (document.location.pathname) {
      case '/consulta':
        return pdpj_consulta();
      case '/consulta/autosdigitais':
        return pdpj_processo();
      default:
        throw new Error(`Caminho desconhecido: ${document.location.pathname}.`);
    }
  }
  async function abrir_aba_pdpj(numero) {
    await _GM.setValue('numero', numero);
    window.open('https://portaldeservicos.pdpj.jus.br/consulta', '_blank');
  }
  function eproc_cartas() {
    const tabela = document
      .getElementById('divInfraAreaTabela')
      ?.querySelector(
        ':scope > table.infraTable[summary="Tabela de Cartas Precatórias Externas."]'
      );
    assert(tabela != null, 'Erro ao obter tabela.');
    for (const [i, linha] of Array.from(tabela.rows).slice(1).entries()) {
      assert(
        linha.cells.length === 14,
        `Número de células esperado: 14. Obtido: ${linha.cells.length}. Linha: ${i}.`
      );
      const celula = linha.cells[0];
      const numero_formatado = celula.textContent.trim();
      if (numero_formatado === '') continue;
      const numero = numero_formatado.replace(/[.-]/g, '');
      if (!/^[0-9]{20}$/.test(numero)) {
        celula.style.color = 'red';
        continue;
      }
      const botao = document.createElement('button');
      botao.type = 'button';
      botao.className = 'gm-precatorias';
      botao.textContent = 'Consultar (jus.br)';
      botao.onclick = e => {
        e.preventDefault();
        document
          .querySelector('button.gm-precatorias.gm-clicked')
          ?.classList.toggle('gm-clicked', false);
        botao.classList.add('gm-clicked');
        abrir_aba_pdpj(numero).catch(log_erro);
      };
      celula.append(document.createElement('br'), botao);
    }
    _GM_addStyle(`
.bootstrap-styles button.gm-precatorias {
  border: 1px outset hsl(333, 25%, 75%);
  border-radius: 4px;
  background: hsl(333, 25%, 50%);
  color: white;
  box-shadow: 0 2px 4px #0004;
  padding: 2px 8px;
}
.bootstrap-styles button.gm-precatorias.gm-clicked {
  box-shadow: 0 0 1px 2px yellow;
}
`);
  }
  function eproc_analisar_tabela(tabela) {
    for (const linha of tabela.rows) {
      if (linha.cells.length <= 1) continue;
      const primeira_celula = linha.cells[0];
      if (primeira_celula.querySelector('a[href]') !== null) continue;
      const texto = primeira_celula.textContent.trim();
      const match = texto.match(/^(\d{20})(?:\/[A-Z]{2})?$/);
      if (match === null) {
        throw new Error(
          `Formato de número de processo desconhecido: ${texto}.`
        );
      }
      const [, numero] = match;
      const [, seq, dv, ...resto] = numero.match(
        /(.......)(..)(....)(.)(..)(....)/
      );
      const numero_formatado = `${seq}-${dv}.${resto.join('.')}`;
      const link = document.createElement('a');
      link.href = 'javascript:';
      link.addEventListener('click', e => {
        e.preventDefault();
        abrir_aba_pdpj(numero).catch(log_erro);
      });
      link.textContent = texto.replace(numero, numero_formatado);
      const span = document.createElement('span');
      span.className = 'gm-pdpj';
      span.textContent = 'jus.br';
      primeira_celula.replaceChildren(link, ' ', span);
    }
    _GM_addStyle(`
.bootstrap-styles #divCapaProcesso span.gm-pdpj {
  display: inline-block;
  font-size: .67rem;
  font-weight: normal;
  border-radius: 4px;
  color: hsl(333, 50%, 30%);
  border: 1px solid;
  padding: 0 .5ch;
  line-height: 1.2em;
}
`);
  }
  function eproc_processo() {
    const tabelas = document.querySelectorAll('#tableRelacionado');
    if (tabelas.length > 1)
      throw new Error(
        'Não foi possível obter tabela única de processos relacionados.'
      );
    if (tabelas.length === 0) return;
    const [tabela] = tabelas;
    const outros = tabela.querySelectorAll(
      '#carregarOutrosRelacionados > a[href^="javascript:"]'
    );
    if (outros.length > 1)
      throw new Error(
        'Não foi possível obter link único para carregamento de processos relacionados.'
      );
    if (outros.length === 1) {
      const $ = _unsafeWindow.jQuery;
      $(document).on('ajaxComplete', function (_evt, _xhr, opts) {
        const params = new URL(opts.url, document.location.href).searchParams;
        if (params.get('acao_ajax') === 'carregar_processos_relacionados') {
          try {
            eproc_analisar_tabela(tabela);
          } catch (err) {
            log_erro(err);
          }
        }
      });
    }
    return eproc_analisar_tabela(tabela);
  }
  function eproc_main() {
    const params = new URL(document.location.href).searchParams;
    switch (params.get('acao')) {
      case 'processo_selecionar':
        return eproc_processo();
      case 'relatorio_processo_carta_precatoria_listar':
        return eproc_cartas();
      default:
        throw new Error(`Ação desconhecida: ${params.get('acao')}`);
    }
  }
  async function main() {
    switch (document.location.hostname) {
      case 'eproc.jfpr.jus.br':
      case 'eproc.jfrs.jus.br':
      case 'eproc.jfsc.jus.br':
      case 'eproc.trf4.jus.br':
        return eproc_main();
      case 'portaldeservicos.pdpj.jus.br':
        return pdpj_main();
      default:
        throw new Error(
          `Servidor desconhecido: ${document.location.hostname}.`
        );
    }
  }
  main().catch(log_erro);
})();
