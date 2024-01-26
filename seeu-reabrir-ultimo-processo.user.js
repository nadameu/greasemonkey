// ==UserScript==
// @name        seeu-reabrir-ultimo-processo
// @name:pt-BR  SEEU - Reabrir último processo
// @namespace   nadameu.com.br
// @version     1.2.1
// @author      nadameu
// @match       https://seeu.pje.jus.br/seeu/usuario/areaAtuacao.do?*
// @match       https://seeu.pje.jus.br/seeu/historicoProcessosRecursos.do?actionType=listar
// ==/UserScript==

(function () {
  'use strict';

  function h(tag, props = null, ...children) {
    const element = document.createElement(tag);
    for (const [key, value] of Object.entries(props ?? {})) {
      element[key] = value;
    }
    element.append(...children);
    return element;
  }
  const name = 'seeu-reabrir-ultimo-processo';
  const gm_name = 'SEEU - Reabrir último processo';
  const styles =
    '#gm-seeu-reabrir__button{background:hsl(333,30%,60%);border-radius:50%;padding:.4rem;margin:auto 8px}\n';
  const LOG_PREFIX = `<${gm_name}>`;
  const LOCAL_STORAGE_VALUE = 'REABRIR_ULTIMO';
  const resultado = main();
  if (resultado && resultado instanceof Error) {
    console.group(LOG_PREFIX);
    console.error(resultado);
    console.groupEnd();
  }
  function main() {
    if (
      document.location.href.match(
        /^https:\/\/seeu\.pje\.jus\.br\/seeu\/historicoProcessosRecursos\.do\?actionType=listar$/
      )
    ) {
      if (window.localStorage.getItem(name) === LOCAL_STORAGE_VALUE) {
        window.localStorage.removeItem(name);
        const links = document.querySelectorAll(
          'table.resultTable a.link[href^="/seeu/historicoProcessosRecursos.do?"]'
        );
        if (links.length === 0)
          return new Error('Não há processos no histórico.');
        links[0].click();
      }
      return;
    }
    const header = document.querySelector('seeu-header');
    if (!header || !header.shadowRoot)
      return new Error('Cabeçalho não encontrado.');
    header.shadowRoot.appendChild(h('style', {}, styles));
    const link = header.shadowRoot.querySelector(
      'seeu-icon[name="mdi:history"]'
    );
    if (!link) return new Error('Link não encontrado.');
    const botao = link.cloneNode(true);
    botao.id = 'gm-seeu-reabrir__button';
    botao.setAttribute('name', 'mdi:reload');
    botao.dataset.tooltip = 'Reabrir último processo';
    botao.addEventListener('click', evt => {
      evt.preventDefault();
      window.localStorage.setItem(name, LOCAL_STORAGE_VALUE);
      link.click();
    });
    link.parentElement.insertBefore(botao, link);
  }
})();
