// ==UserScript==
// @name         bnmp-destacar-alertas
// @name:pt-BR   BNMP - Destacar alertas com conteúdo
// @namespace    http://nadameu.com.br
// @version      2.1.1
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
    ' ._body_1dpet_1 ._card_1dpet_1._vazio_1dpet_1{opacity:.4;--gm-border-color:transparent}._body_1dpet_1 .alert-card__description{height:100%}._body_1dpet_1 .alert-card__tipo-baixa{color:var(--gm-card-color);margin-bottom:.75rem}._body_1dpet_1 ._card_1dpet_1>button{border:1px solid var(--gm-border-color);padding-block:.75rem}._card_1dpet_1._manual_1dpet_16{--gm-card-color:#854747}._card_1dpet_1._automatico_1dpet_19{--gm-card-color:#857547}._body_1dpet_1 ._card_1dpet_1{--color-alert-count:var(--gm-card-color);--gm-border-color:var(--gm-card-color)}\n/*$vite$:1*/ '
  );
  var name = 'bnmp-destacar-alertas';
  var index_module_default = {
    body: '_body_1dpet_1',
    card: '_card_1dpet_1',
    vazio: '_vazio_1dpet_1',
    manual: '_manual_1dpet_16',
    automatico: '_automatico_1dpet_19',
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
    const observer = new MutationObserver(mutation_list => {
      if (document.location.pathname !== '/alertas') return;
      const grid_novo = mutation_list
        .values()
        .reduce(
          (prev, mut) =>
            mut.target instanceof HTMLElement &&
            mut.target.matches('section.alertas-dashboard') &&
            mut.addedNodes.length === 1 &&
            mut.addedNodes[0] instanceof HTMLElement &&
            mut.addedNodes[0].matches('div.dashboard-grid') &&
            mut.removedNodes.length === 0
              ? mut.addedNodes[0]
              : prev,
          null
        );
      if (!grid_novo) return;
      const adicionados = mutation_list
        .values()
        .filter(m => m.target === grid_novo)
        .flatMap(m => m.addedNodes)
        .filter(n => n instanceof HTMLElement)
        .filter(n => n.matches('bnmp-alertas-card'))
        .toArray();
      if (isNonEmptyArray(adicionados)) {
        console.log({ adicionados });
        update(grid_novo, adicionados);
      }
    });
    window.addEventListener('beforeunload', () => observer.disconnect());
    document.body.classList.add(index_module_default.body);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }
  var update = wrap_error((grid, adicionados) => {
    if (adicionados.some(c => c.parentElement !== grid))
      throw new Error('Não foi possível obter o elemento pai dos cards.');
    const collator = new Intl.Collator('pt', { sensitivity: 'base' });
    const cards = adicionados
      .map(card => {
        const next = card.nextSibling;
        const description = card.querySelector('.alert-card__description');
        const tipo_baixa = description
          ?.querySelector('.alert-card__tipo-baixa')
          ?.textContent?.trim();
        const texto = description?.lastChild?.textContent?.trim();
        const total = Number(
          card.querySelector('.alert-card__total')?.textContent ?? 'NaN'
        );
        if (
          next === null ||
          (tipo_baixa !== 'Alerta Automático-' &&
            tipo_baixa !== 'Alerta Manual-') ||
          texto === void 0 ||
          Number.isNaN(total)
        )
          throw new Error('Não foi possível obter as informações necessárias.');
        const manual = tipo_baixa === 'Alerta Manual-';
        card.classList.add(index_module_default.card);
        if (manual) card.classList.add(index_module_default.manual);
        else card.classList.add(index_module_default.automatico);
        if (total === 0) card.classList.add(index_module_default.vazio);
        return {
          card,
          next,
          manual,
          texto,
          total,
        };
      })
      .sort(
        concatCompare(
          compareBy(c => (c.total > 0 ? -1 : 1)),
          compareBy(c => (c.manual ? -1 : 1)),
          compareBy(c => c.texto, collator.compare)
        )
      );
    grid.append(...cards.flatMap(c => [c.card, c.next]));
  });
  function isNonEmptyArray(arr) {
    return arr.length > 0;
  }
  function defaultCompare(a, b) {
    if (a < b) return -1;
    if (a > b) return 1;
    return 0;
  }
  function concatCompare(...fns) {
    return (a, b) => {
      for (const fn of fns) {
        const result = fn(a, b);
        if (result !== 0) return result;
      }
      return 0;
    };
  }
  function compareBy(keyFn, compareFn = defaultCompare) {
    return (a, b) => compareFn(keyFn(a), keyFn(b));
  }
})();
