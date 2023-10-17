// ==UserScript==
// @name        seeu-reabrir-ultimo-processo
// @name:pt-BR  SEEU - Reabrir último processo
// @namespace   nadameu.com.br
// @version     1.0.0
// @author      nadameu
// @match       https://seeu.pje.jus.br/seeu/*
// @grant       GM_addStyle
// @grant       unsafeWindow
// ==/UserScript==

(o => {
  if (typeof GM_addStyle == 'function') {
    GM_addStyle(o);
    return;
  }
  const t = document.createElement('style');
  (t.textContent = o), document.head.append(t);
})(
  ' ._botao_ko9cf_1{background:hsl(266,25%,90%);padding:1px 1ex;margin-right:4ch;font-size:.9em;border:1px solid #204;border-radius:4px;box-shadow:0 2px 4px #00000040;transform:translateY(0);transition:transform 60ms}._botao_ko9cf_1:active,._botao_ko9cf_1:disabled{box-shadow:0 0 #00000040;transform:translateY(2px)}._botao_ko9cf_1:disabled{background:hsl(266,5%,90%);color:#666;border-color:#666} '
);

(function () {
  'use strict';

  function createElement(tag, props = null, ...children) {
    const element = document.createElement(tag);
    for (const [key, value] of Object.entries(props ?? {})) {
      element[key] = value;
    }
    element.append(...children);
    return element;
  }
  function createTaggedUnion(definitions, tagName = 'tag') {
    const ctors = {};
    for (const tag of Object.getOwnPropertyNames(definitions).concat(
      Object.getOwnPropertySymbols(definitions)
    )) {
      if (tag === 'match') throw new Error('Invalid tag: "match".');
      const f = definitions[tag];
      if (f === null) {
        ctors[tag] = { [tagName]: tag };
      } else {
        ctors[tag] = (...args) => {
          const obj = f(...args);
          obj[tagName] = tag;
          return obj;
        };
      }
    }
    ctors.match = matchBy(tagName);
    return ctors;
  }
  function matchBy(tagName) {
    return (obj, matchers, otherwise) => {
      if ((typeof obj !== 'object' && typeof obj !== 'function') || obj === null)
        throw new Error(
          `${Object.prototype.toString
            .call(obj)
            .slice('[object '.length, -1)
            .toLowerCase()} is not a valid object.`
        );
      const tag = obj[tagName];
      if (tag === void 0)
        throw new Error(`Object does not have a valid "${String(tagName)}" property.`);
      const fn = matchers[tag] ?? otherwise ?? matchNotFound;
      return fn(obj);
    };
    function matchNotFound(obj) {
      throw new Error(`Not matched: "${obj[tagName]}".`);
    }
  }
  const name = 'seeu-reabrir-ultimo-processo';
  const gm_name = 'SEEU - Reabrir último processo';
  const botao = '_botao_ko9cf_1';
  const styles = {
    botao,
  };
  const Resultado = createTaggedUnion({
    SemLink: null,
    UrlAlterado: null,
    ErroDeRede: erro => ({ erro }),
    Ok: null,
  });
  const PREFIX = `<${gm_name}>`;
  const logInfo = (...args) => console.info(PREFIX, ...args);
  const logErro = (...args) => console.error(PREFIX, ...args);
  const URL_RE = /'\/seeu\/historicoProcessosRecursos\.do\?actionType=listar'/;
  handleResultado(main());
  function handleResultado(resultado) {
    Resultado.match(resultado, {
      SemLink: () => {
        logInfo('Sem link.');
      },
      UrlAlterado: () => {
        logErro('URL alterado.');
      },
      ErroDeRede: erro => {
        logErro(erro);
      },
      Ok: () => {
        logInfo('Botão adicionado.');
      },
    });
  }
  function main() {
    if (
      document.location.href.match(
        /^https:\/\/seeu\.pje\.jus\.br\/seeu\/historicoProcessosRecursos\.do\?actionType=listar$/
      )
    ) {
      if (window.localStorage.getItem(name) === 'REABRIR_ULTIMO') {
        window.localStorage.removeItem(name);
        const links = document.querySelectorAll(
          'table.resultTable a.link[href^="/seeu/historicoProcessosRecursos.do?"]'
        );
        if (links.length === 0) return Resultado.SemLink;
        links[0].click();
      }
      return Resultado.SemLink;
    }
    if (!unsafeWindow.openDialogHistoricoProcessosRecursos) return Resultado.SemLink;
    if (!URL_RE.test(unsafeWindow.openDialogHistoricoProcessosRecursos.toString()))
      return Resultado.UrlAlterado;
    const link = document.querySelector('#userinfo #shortcuts > a#history.shortcuts');
    if (
      link &&
      link.getAttribute('href') === "javascript: openDialogHistoricoProcessosRecursos('');"
    ) {
      const botao2 = createElement(
        'button',
        { type: 'button', className: styles.botao },
        'Reabrir último processo'
      );
      botao2.addEventListener('click', evt => {
        evt.preventDefault();
        window.localStorage.setItem(name, 'REABRIR_ULTIMO');
        link.click();
      });
      link.parentElement.insertAdjacentElement('afterbegin', botao2);
      return Resultado.Ok;
    } else {
      return Resultado.SemLink;
    }
  }
})();
