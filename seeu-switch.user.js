// ==UserScript==
// @name         seeu-switch
// @name:pt-BR   SEEU - Alterar atuação
// @namespace    nadameu.com.br
// @version      1.1.0
// @author       nadameu
// @description  SEEU - Alterar a área de atuação no SEEU a partir da aba "Informações Gerais" de um processo
// @match        https://seeu.pje.jus.br/seeu/visualizacaoProcesso.do?*
// ==/UserScript==

(function () {
  'use strict';

  const ABA_DIVERSA = 1;
  const MESMO_JUIZO = 2;
  const BOTAO_ADICIONADO = 3;
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
  const css =
    '#gm-seeu-switch-button{background:hsl(266,25%,90%);padding:2px 1ex;border:1px solid #204;border-radius:4px;box-shadow:0 2px 4px #00000040;transform:translateY(-2px);transition:transform 60ms}#gm-seeu-switch-button:active,#gm-seeu-switch-button:disabled{box-shadow:0 0 #00000040;transform:translateY(0)}#gm-seeu-switch-button:disabled{background:hsl(266,5%,90%);color:#666;border-color:#666}\n';
  const STYLE_ID = 'gm-seeu-switch-style';
  function adicionarEstilos() {
    const style =
      document.getElementById(STYLE_ID) ??
      document.head.appendChild(createElement('style', { id: STYLE_ID }));
    style.textContent = css;
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
  function main() {
    const aba = document.querySelector('li[name="tabDadosProcesso"].currentTab');
    if (!aba) return ABA_DIVERSA;
    const labels = Array.from(
      document.querySelectorAll('#includeContent td.labelRadio > label')
    ).filter(x => x.textContent === 'Juízo:');
    assert(labels.length === 1, `Encontrado(s) ${labels.length} elemento(s) com texto "Juízo:".`);
    const label = labels[0];
    const td = label.closest('td')?.nextElementSibling;
    assert(td != null, 'Não foi possível encontrar um local para adicionar o botão.');
    const juizoProcesso = td?.textContent?.trim() ?? '';
    assert(juizoProcesso !== '', 'Juízo do processo desconhecido.');
    const areaAtual = document.querySelector('#areaatuacao')?.textContent ?? '';
    assert(areaAtual !== '', 'Área de atuação atual desconhecida.');
    if (areaAtual === juizoProcesso) return MESMO_JUIZO;
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
    adicionarEstilos();
    const button = createElement('input', {
      id: 'gm-seeu-switch-button',
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
    return BOTAO_ADICIONADO;
  }
  async function alternar(url, area) {
    const doc = await XHR(url);
    const links = Array.from(doc.querySelectorAll('a[href][target="mainFrame"]')).filter(
      x => x.textContent?.trim() === area
    );
    assert(links.length === 1, `Encontrado(s) ${links.length} link(s) para a área selecionada.`);
    const link = links[0];
    document.body.appendChild(link);
    link.click();
  }
  const gm_name = 'SEEU - Alterar atuação';
  const HEADER = `<${gm_name}>`;
  const MENSAGENS = {
    [ABA_DIVERSA]: 'Aba diversa.',
    [MESMO_JUIZO]: 'Mesmo juízo.',
    [BOTAO_ADICIONADO]: 'Botão adicionado.',
  };
  try {
    const result = main();
    switch (result) {
      case ABA_DIVERSA:
      case MESMO_JUIZO:
      case BOTAO_ADICIONADO:
        console.info(HEADER, MENSAGENS[result]);
        break;
      default:
        logarErro(new Error(`Resultado inesperado: ${JSON.stringify(result)}.`));
        break;
    }
  } catch (err) {
    logarErro(err);
  }
  function logarErro(err) {
    console.group(HEADER);
    console.error(err);
    console.groupEnd();
  }
})();
