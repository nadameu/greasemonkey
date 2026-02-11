// ==UserScript==
// @name         bnmp-destacar-alertas
// @name:pt-BR   BNMP - Destacar alertas com conteúdo
// @namespace    http://nadameu.com.br
// @version      1.1.1
// @author       nadameu
// @description  Destaca as categorias de alerta do BNMP que possuem conteúdo
// @match        https://bnmp.pdpj.jus.br/*
// @match        https://bnmp-preprod.pdpj.jus.br/*
// @grant        GM_addStyle
// ==/UserScript==

(t => {
  if (typeof GM_addStyle == 'function') {
    GM_addStyle(t);
    return;
  }
  const e = document.createElement('style');
  (e.textContent = t), document.head.append(e);
})(' ._body_15vap_1 ._vazio_15vap_1{opacity:.25;transform:scale(.75)} ');

(function () {
  'use strict';

  const name = 'bnmp-destacar-alertas';
  const body = '_body_15vap_1';
  const vazio = '_vazio_15vap_1';
  const classes = {
    body,
    vazio,
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
        for (const mutation of mutation_list) {
          for (const node of mutation.addedNodes) {
            if (eh_alerta_vazio(node)) {
              node.classList.add(classes.vazio);
            }
          }
        }
      })
    );
    observer.observe(document.body, { childList: true, subtree: true });
    window.addEventListener('beforeunload', () => {
      observer.disconnect();
    });
    document.body.classList.add(classes.body);
  }
  function eh_alerta_vazio(node) {
    if (!(node instanceof HTMLElement) || !node.matches('mat-chip'))
      return false;
    return (
      query_or_throw('.component-total-box', node).textContent.trim() === '0'
    );
  }
  function query_or_throw(selector, parentNode) {
    const elt = parentNode.querySelector(selector);
    if (elt === null) throw new QuerySelectorError(selector, parentNode);
    return elt;
  }
  class QuerySelectorError extends Error {
    constructor(selector, parentNode) {
      super(`Elemento não encontrado: \`${selector}\`.`);
      this.parentNode = parentNode;
    }
    name = 'QuerySelectorError';
  }
})();
