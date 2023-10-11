// ==UserScript==
// @name        seeu-switch
// @name:pt-BR  SEEU - Alterar atuação
// @namespace   nadameu.com.br
// @match       https://seeu.pje.jus.br/seeu/visualizacaoProcesso.do?*
// @grant       none
// @version     1.0.0
// @author      nadameu
// @description SEEU - Alterar a área de atuação no SEEU a partir da aba "Informações Gerais" de um processo
// ==/UserScript==

main().catch(err => {
  console.error(err);
});

async function main() {
  const aba = document.querySelector('li[name="tabDadosProcesso"].currentTab');
  if (!aba) return;
  const label = await queryFilter(
    '#includeContent td.labelRadio > label',
    x => x.textContent === 'Juízo:'
  );
  const td = label.closest('td').nextElementSibling;
  const area = td.textContent.trim();
  const atual = await query('#areaatuacao');
  const alterar = await query('#alterarAreaAtuacao');
  const match = alterar.href.match(
    /^javascript:openSubmitDialog\('(\/seeu\/usuario\/areaAtuacao\.do\?_tj=[0-9a-f]+)', 'Alterar Atua[^']+o', 0, 0\);/
  );
  if (!match) throw new Error('Link para alteração da área de atuação não reconhecido.');
  const url = match[1];
  if (atual.textContent === area) return;

  // Todos os elementos presentes

  adicionarEstilos();
  const button = document.createElement('input');
  button.id = 'gm-seeu-switch-button';
  button.type = 'button';
  button.value = 'Alternar para esta área de atuação';
  button.addEventListener('click', e => {
    e.preventDefault();
    (async () => {
      try {
        const doc = await new Promise((res, rej) => {
          const xhr = new XMLHttpRequest();
          xhr.open('get', url);
          xhr.responseType = 'document';
          xhr.onload = () => res(xhr.response);
          xhr.onerror = rej;
          xhr.send(null);
        });
        const link = await queryFilter(
          'a[href][target="mainFrame"]',
          x => x.textContent.trim() === area,
          doc
        );
        document.body.appendChild(link);
        link.click();
      } catch (e) {
        console.error(e);
        window.alert(
          'Não foi possível alternar a área de atuação. Entre em contato com o desenvolvedor do script através do endereço abaixo:\n\nhttps://www.nadameu.com.br/'
        );
      }
    })();
  });
  td.append(' ', button);
}

function adicionarEstilos() {
  const style =
    document.getElementById('gm-seeu-switch-style') ??
    document.head.appendChild(document.createElement('style'));
  style.id ||= 'gm-seeu-switch-style';
  style.textContent = /* css */ `
#gm-seeu-switch-button {
  background: hsl(266, 25%, 90%);
  padding: 2px 1ex;
  border: 1px solid #204;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.25);
  transform: translateY(-2px);
  transition: transform 60ms;
}
#gm-seeu-switch-button:active {
  box-shadow: 0 0 0 rgba(0, 0, 0, 0.25);
  transform: translateY(0);
}
`;
}

async function query(selector, context = document) {
  const elt = context.querySelector(selector);
  if (!elt) throw new Error(`Elemento não encontrado: \`${selector}\`.`);
  return elt;
}

async function queryFilter(selector, filter, context = document) {
  const elts = Array.from(context.querySelectorAll(selector)).filter(filter);
  if (elts.length < 1) throw new Error(`Elemento não encontrado: \`${selector}\` (filtrado).`);
  if (elts.length > 1)
    throw new Error(`Mais de um elemento encontrado: \`${selector}\` (filtrados).`);
  return elts[0];
}
