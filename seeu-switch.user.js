// ==UserScript==
// @name         seeu-switch
// @name:pt-BR   SEEU - Alterar atuação
// @namespace    nadameu.com.br
// @version      2.0.1
// @author       nadameu
// @description  SEEU - Alterar a área de atuação no SEEU a partir da aba "Informações Gerais" de um processo
// @match        https://seeu.pje.jus.br/seeu/processo.do
// @match        https://seeu.pje.jus.br/seeu/visualizacaoProcesso.do?*
// @grant        GM_addStyle
// @grant        GM_info
// ==/UserScript==

(t => {
  if (typeof GM_addStyle == 'function') {
    GM_addStyle(t);
    return;
  }
  const n = document.createElement('style');
  (n.textContent = t), document.head.append(n);
})(
  ' html input[type=button]._btn_2b3z5_1{background:#674c58;box-shadow:0 2px 4px #00000040;transform:translateY(-2px);transition:transform 60ms;margin:0}html input[type=button]._btn_2b3z5_1:hover{background:#704357}html input[type=button]._btn_2b3z5_1:is(:active,:disabled){box-shadow:0 0 #00000040;transform:translateY(0)}html input[type=button]._btn_2b3z5_1:disabled{background:#5e5559;color:#bbb} '
);

(function () {
  'use strict';

  var _GM_info = /* @__PURE__ */ (() =>
    typeof GM_info != 'undefined' ? GM_info : void 0)();
  class Info {
    constructor(message) {
      this.message = message;
    }
  }
  function h(tag, props = null, ...children) {
    const element = document.createElement(tag);
    for (const [key, value] of Object.entries(props ?? {})) {
      if (key === 'style' || key === 'dataset') {
        for (const [k, v] of Object.entries(value)) {
          element[key][k] = v;
        }
      } else if (key === 'classList') {
        let classes2;
        if (Array.isArray(value)) {
          classes2 = value.filter(x => x !== null);
        } else {
          classes2 = Object.entries(value).flatMap(([k, v]) => {
            if (!v) return [];
            return [k];
          });
        }
        for (const className of classes2) {
          element.classList.add(className);
        }
      } else {
        element[key] = value;
      }
    }
    element.append(...children);
    return element;
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
  function isOfType(typeRepresentation) {
    return value => typeof value === typeRepresentation;
  }
  const isString = /* @__PURE__ */ isOfType('string');
  function isLiteral(literal) {
    return value => value === literal;
  }
  const isUndefined = /* @__PURE__ */ isLiteral(void 0);
  const isNull = /* @__PURE__ */ isLiteral(null);
  function negate(predicate) {
    return value => !predicate(value);
  }
  const isNotNull = /* @__PURE__ */ negate(isNull);
  const isDefined = /* @__PURE__ */ negate(isUndefined);
  function refine(...predicates) {
    return value => predicates.every(p => p(value));
  }
  const isNonEmptyString = /* @__PURE__ */ refine(
    isString,
    x => x.trim().length > 0
  );
  const isNullish = x => x == null;
  const isNotNullish = /* @__PURE__ */ negate(isNullish);
  const arrayHasLength = num => obj => obj.length === num;
  const arrayHasAtLeastLength = num => array => array.length >= num;
  const btn = '_btn_2b3z5_1';
  const classes = {
    btn,
  };
  async function XHR(url) {
    return await new Promise((res, rej) => {
      const xhr = new XMLHttpRequest();
      xhr.open('get', url);
      xhr.responseType = 'document';
      xhr.onload = () => res(xhr.response);
      xhr.onerror = rej;
      xhr.send(null);
    });
  }
  function main() {
    const areaAtual = document.querySelector('#areaatuacao')?.textContent;
    assert(isNonEmptyString(areaAtual), 'Área de atuação atual desconhecida.');
    const linkAlterar = document.querySelector('#alterarAreaAtuacao');
    assert(
      linkAlterar instanceof HTMLAnchorElement,
      'Elemento não encontrado: `#alterarAreaAtuacao`.'
    );
    const match = decodeURI(linkAlterar.href).match(
      /^javascript:openSubmitDialog\('(\/seeu\/usuario\/areaAtuacao\.do\?_tj=[0-9a-f]+)', 'Alterar Atua[^']+o', 0, 0\);/
    );
    assert(
      isNotNull(match) && arrayHasAtLeastLength(2)(match),
      'Link para alteração da área de atuação não reconhecido.'
    );
    const urlAlterar = match[1];
    const informacoesProcessuais = document.querySelector(
      '#informacoesProcessuais'
    );
    assert(
      isNotNull(informacoesProcessuais),
      `Informações processuais não encontradas.`
    );
    const linhaJuizo = informacoesProcessuais
      .querySelectorAll('tr')
      .values()
      .filter(x => arrayHasLength(2)(x.cells))
      .filter(x => (x.cells[0].textContent.trim() ?? '') === 'Juízo:')
      .take(1)
      .toArray()
      .at(0);
    assert(isDefined(linhaJuizo), `Informações de juízo não encontradas.`);
    const juizo = linhaJuizo.cells[1].textContent.trim();
    assert(isNonEmptyString(juizo), `Informações de juízo não encontradas.`);
    if (areaAtual === juizo)
      return new Info('Botão não adicionado - mesmo juízo');
    linhaJuizo.cells[1].append(' ', criarBotao(urlAlterar, juizo));
    const aba = document.querySelector(
      'li[name="tabDadosProcesso"].currentTab'
    );
    if (!aba) return;
    const labels = document
      .querySelectorAll('#includeContent td.labelRadio > label')
      .values()
      .filter(x => x.textContent === 'Juízo:')
      .toArray();
    assert(
      arrayHasLength(1)(labels),
      `Encontrado(s) ${labels.length} elemento(s) com texto "Juízo:".`
    );
    const label = labels[0];
    const td = label.closest('td')?.nextElementSibling;
    assert(
      isNotNullish(td),
      'Não foi possível encontrar um local para adicionar o botão.'
    );
    const juizoProcesso = td.textContent.trim();
    assert(isNonEmptyString(juizoProcesso), 'Juízo do processo desconhecido.');
    if (areaAtual === juizoProcesso)
      return new Info('Botão não adicionado - mesmo juízo');
    const button = criarBotao(urlAlterar, juizoProcesso);
    td.append(' ', button);
  }
  function criarBotao(urlAlterar, juizoProcesso) {
    const button = h('input', {
      className: classes.btn,
      type: 'button',
      value: 'Alternar para esta área de atuação',
    });
    button.addEventListener('click', evt => {
      evt.preventDefault();
      button.disabled = true;
      alternar(urlAlterar, juizoProcesso)
        .catch(err => {
          console.error(err);
          window.alert(
            [
              `Não foi possível alternar a área de atuação. Você possui acesso a \`${juizoProcesso}\`?`,
              '',
              'Em caso de erro, entre em contato com o desenvolvedor do script através do endereço abaixo:',
              '',
              'https://www.nadameu.com.br/',
            ].join('\n')
          );
        })
        .finally(() => {
          button.disabled = false;
        });
    });
    return button;
  }
  async function alternar(url, area) {
    const doc = await XHR(url);
    const links = doc
      .querySelectorAll('a[href][target="mainFrame"]')
      .values()
      .filter(x => x.textContent.trim() === area)
      .toArray();
    assert(
      arrayHasLength(1)(links),
      `Encontrado(s) ${links.length} link(s) para a área selecionada.`
    );
    const link = links[0];
    document.body.appendChild(link);
    link.click();
  }
  const HEADER = `<${_GM_info.script.name}>`;
  try {
    const resultado = main();
    if (resultado instanceof Info) {
      console.info(HEADER, resultado.message);
    }
  } catch (err) {
    console.group(HEADER);
    console.error(err);
    console.groupEnd();
  }
})();
