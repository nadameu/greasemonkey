// ==UserScript==
// @name         bnmp-destacar-alertas
// @name:pt-BR   BNMP - Destacar alertas com conteúdo
// @namespace    http://nadameu.com.br
// @version      1.1.0
// @author       nadameu
// @description  Destaca as categorias de alerta do BNMP que possuem conteúdo
// @match        https://bnmp.pdpj.jus.br/*
// @match        https://bnmp-preprod.pdpj.jus.br/*
// @grant        GM_addStyle
// @grant        GM_info
// ==/UserScript==

(function () {
  'use strict';

  var _GM_addStyle = /* @__PURE__ */ (() =>
    typeof GM_addStyle != 'undefined' ? GM_addStyle : void 0)();
  var _GM_info = /* @__PURE__ */ (() =>
    typeof GM_info != 'undefined' ? GM_info : void 0)();
  try_catch(main);
  function try_catch(fn) {
    try {
      fn();
    } catch (err) {
      console.group(`<${_GM_info.script.name}>`);
      console.error(err);
      console.groupEnd();
    }
  }
  function main() {
    const mut = new MutationObserver(mutation_list => {
      try_catch(() => {
        if (document.location.pathname !== '/alertas') return;
        mutation_list
          .values()
          .flatMap(m => m.addedNodes)
          .filter(eh_alerta_vazio)
          .forEach(alerta_vazio => {
            alerta_vazio.classList.add('gm-bnmp-destacar-alertas__vazio');
          });
      });
    });
    mut.observe(document.body, { childList: true, subtree: true });
    window.addEventListener('beforeunload', () => {
      mut.disconnect();
    });
    document.body.classList.add('gm-bnmp-destacar-alertas');
    _GM_addStyle(`
.gm-bnmp-destacar-alertas {
  .gm-bnmp-destacar-alertas__vazio {
    opacity: 0.25;
    transform: scale(0.75);
  }
}
`);
  }
  function eh_alerta_vazio(node) {
    if (!(node instanceof HTMLElement)) return false;
    if (!node.matches('mat-chip')) return false;
    const elt_quantidade = node.querySelector('.component-total-box');
    if (elt_quantidade === null) throw new QuantidadeNaoEncontradaError(node);
    return elt_quantidade.textContent.trim() === '0';
  }
  class QuantidadeNaoEncontradaError extends Error {
    constructor(origem) {
      super('Erro ao obter a quantidade de alertas.');
      this.origem = origem;
    }
  }
})();
