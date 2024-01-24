// ==UserScript==
// @name         seeu-switch
// @name:pt-BR   SEEU - Alterar atuação
// @namespace    nadameu.com.br
// @version      1.2.0
// @author       nadameu
// @description  SEEU - Alterar a área de atuação no SEEU a partir da aba "Informações Gerais" de um processo
// @match        https://seeu.pje.jus.br/seeu/visualizacaoProcesso.do?*
// @grant        GM_addStyle
// ==/UserScript==

(t => {
  if (typeof GM_addStyle == 'function') {
    GM_addStyle(t);
    return;
  }
  const o = document.createElement('style');
  (o.textContent = t), document.head.append(o);
})(
  ' ._btn_x8tis_1{background:hsl(266,25%,90%);padding:2px 1ex;border:1px solid #204;border-radius:4px;box-shadow:0 2px 4px #00000040;transform:translateY(-2px);transition:transform 60ms}._btn_x8tis_1:active,._btn_x8tis_1:disabled{box-shadow:0 0 #00000040;transform:translateY(0)}._btn_x8tis_1:disabled{background:hsl(266,5%,90%);color:#666;border-color:#666} '
);

(function () {
  'use strict';

  const gm_name = 'SEEU - Alterar atuação';
  class Info {
    constructor(message) {
      this.message = message;
    }
  }
  function createElement(tag, props = null, ...children) {
    const element = document.createElement(tag);
    for (const [key, value] of Object.entries(props ?? {})) {
      element[key] = value;
    }
    element.append(...children);
    return element;
  }
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
  class AssertionError extends Error {
    name = 'AssertionError';
    constructor(message) {
      super(message);
    }
  }
  function assert(condition, message) {
    if (condition) return;
    if (typeof message === 'string') throw new AssertionError(message);
    throw message();
  }
  const btn = '_btn_x8tis_1';
  const classes = {
    btn,
  };
  function main() {
    const aba = document.querySelector(
      'li[name="tabDadosProcesso"].currentTab'
    );
    if (!aba) return;
    const labels = Array.from(
      document.querySelectorAll('#includeContent td.labelRadio > label')
    ).filter(x => x.textContent === 'Juízo:');
    assert(
      labels.length === 1,
      `Encontrado(s) ${labels.length} elemento(s) com texto "Juízo:".`
    );
    const label = labels[0];
    const td = label.closest('td')?.nextElementSibling;
    assert(
      td != null,
      'Não foi possível encontrar um local para adicionar o botão.'
    );
    const juizoProcesso = td?.textContent?.trim() ?? '';
    assert(juizoProcesso !== '', 'Juízo do processo desconhecido.');
    const areaAtual = document.querySelector('#areaatuacao')?.textContent ?? '';
    assert(areaAtual !== '', 'Área de atuação atual desconhecida.');
    if (areaAtual === juizoProcesso)
      return new Info('Botão não adicionado - mesmo juízo');
    const linkAlterar = document.querySelector('#alterarAreaAtuacao');
    assert(
      linkAlterar instanceof HTMLAnchorElement,
      'Elemento não encontrado: `#alterarAreaAtuacao`.'
    );
    const match = linkAlterar.href.match(
      /^javascript:openSubmitDialog\('(\/seeu\/usuario\/areaAtuacao\.do\?_tj=[0-9a-f]+)', 'Alterar Atua[^']+o', 0, 0\);/
    );
    assert(
      match !== null && match.length >= 2,
      'Link para alteração da área de atuação não reconhecido.'
    );
    const urlAlterar = match[1];
    const button = createElement('input', {
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
    td.append(' ', button);
  }
  async function alternar(url, area) {
    const doc = await XHR(url);
    const links = Array.from(
      doc.querySelectorAll('a[href][target="mainFrame"]')
    ).filter(x => x.textContent?.trim() === area);
    assert(
      links.length === 1,
      `Encontrado(s) ${links.length} link(s) para a área selecionada.`
    );
    const link = links[0];
    document.body.appendChild(link);
    link.click();
  }
  const HEADER = `<${gm_name}>`;
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
