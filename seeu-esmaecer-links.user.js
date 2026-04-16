// ==UserScript==
// @name         seeu-esmaecer-links
// @name:pt-BR   SEEU - Esmaecer links
// @namespace    http://nadameu.com.br
// @version      1.0.0
// @author       nadameu
// @description  Diminui o destaque para links em vermelho quando seu conteúdo é o número 0 (zero)
// @match        https://seeu.pje.jus.br/seeu/*
// @run-at       document-idle
// ==/UserScript==

(function () {
  'use strict';

  const name = 'seeu-esmaecer-links';
  class CustomError extends Error {
    constructor(message, payload = {}) {
      super(message);
      this.payload = payload;
    }
  }
  CustomError.prototype.name = 'CustomError';
  function try_catch(fn) {
    try {
      fn();
    } catch (err) {
      console.group(`<${name}>`);
      console.error(err);
      if (err instanceof CustomError) {
        console.debug(err.payload);
      }
      console.groupEnd();
    }
  }
  let observado = false;
  function main() {
    let ha_scripts = false;
    const linhas = document
      .querySelectorAll('tr:has(> td:first-child.label + td:last-child)')
      .values()
      .flatMap(linha => {
        const [texto, possui_script] = obter_texto_celula(linha.cells[1]);
        ha_scripts ||= possui_script;
        const qtd = texto.trim().match(/^\d+$/);
        if (qtd === null) {
          return [];
        } else {
          return [{ linha, qtd: Number(qtd[0]) }];
        }
      })
      .toArray();
    if (!observado && ha_scripts && linhas.length > 0) {
      const common = common_ancestor(linhas.map(x => x.linha));
      const observer = new MutationObserver(() => try_catch(main));
      observer.observe(common, { childList: true, subtree: true });
      observado = true;
    }
    for (const { linha: linha_vazia } of linhas.filter(l => l.qtd === 0)) {
      linha_vazia.style.opacity = '0.5';
    }
  }
  function obter_texto_celula(celula) {
    if (celula.querySelector('script') === null)
      return [celula.textContent, false];
    else {
      const texto = [...celula.childNodes]
        .filter(
          node =>
            !(node instanceof HTMLScriptElement) && !(node instanceof Comment)
        )
        .map(x => x.textContent)
        .join('');
      return [texto, true];
    }
  }
  function common_ancestor(nodes) {
    const [first, ...rest] = [...nodes];
    const range = new Range();
    range.setStart(first, 0);
    for (const curr of rest) {
      range.setEnd(curr, 0);
      if (range.collapsed) {
        reverse(range);
      }
      range.setStart(range.commonAncestorContainer, 0);
    }
    return range.startContainer;
    function reverse(range2) {
      const temp = range2.startContainer;
      range2.setStart(range2.endContainer, 0);
      range2.setEnd(temp, 0);
    }
  }
  try_catch(main);
})();
