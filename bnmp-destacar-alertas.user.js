// ==UserScript==
// @name         bnmp-destacar-alertas
// @name:pt-BR   BNMP - Destacar alertas com conteúdo
// @namespace    http://nadameu.com.br
// @version      2.0.0
// @author       nadameu
// @description  Destaca as categorias de alerta do BNMP que possuem conteúdo
// @match        https://bnmp.pdpj.jus.br/*
// @match        https://bnmp-preprod.pdpj.jus.br/*
// @grant        GM_addStyle
// ==/UserScript==

(function () {
  'use strict';
  var s = new Set();
  var _css = async t => {
    if (s.has(t)) return;
    s.add(t);
    (c => {
      if (typeof GM_addStyle === 'function') GM_addStyle(c);
      else
        (document.head || document.documentElement)
          .appendChild(document.createElement('style'))
          .append(c);
    })(t);
  };
  _css(
    ' ._body_6b3qh_1 ._vazio_6b3qh_1{opacity:.25;transform:scale(.75)}\n/*$vite$:1*/ '
  );
  var name = 'bnmp-destacar-alertas';
  var index_module_default = {
    body: '_body_6b3qh_1',
    vazio: '_vazio_6b3qh_1',
  };
  wrap_error(main)();
  function wrap_error(fn) {
    return (...args) => {
      try {
        fn(...args);
      } catch (err) {
        console.group(`<${name}>`);
        console.error(err);
        console.groupEnd();
      }
    };
  }
  function main() {
    const observer = new MutationObserver(
      wrap_error(mutation_list => {
        if (document.location.pathname !== '/alertas') return;
        for (const mutation of mutation_list)
          for (const node of mutation.addedNodes)
            if (eh_alerta_vazio(node))
              node.classList.add(index_module_default.vazio);
      })
    );
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
    window.addEventListener('beforeunload', () => {
      observer.disconnect();
    });
    document.body.classList.add(index_module_default.body);
  }
  function eh_alerta_vazio(node) {
    if (!(node instanceof HTMLElement) || !node.matches('bnmp-alertas-card'))
      return false;
    return (
      query_or_throw('.alert-card__total', node).textContent.trim() === '0'
    );
  }
  function query_or_throw(selector, parentNode) {
    const elt = parentNode.querySelector(selector);
    if (elt === null) throw new QuerySelectorError(selector, parentNode);
    return elt;
  }
  var QuerySelectorError = class extends Error {
    parentNode;
    name = 'QuerySelectorError';
    constructor(selector, parentNode) {
      super(`Elemento não encontrado: \`${selector}\`.`);
      this.parentNode = parentNode;
    }
  };
})();
