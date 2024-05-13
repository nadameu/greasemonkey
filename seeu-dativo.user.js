// ==UserScript==
// @name        seeu-dativo
// @name:pt-BR  SEEU - Advogado dativo
// @namespace   nadameu.com.br
// @match       https://seeu.pje.jus.br/seeu/visualizacaoProcesso.do?*
// @match       https://seeu.pje.jus.br/seeu/processo.do
// @grant       GM_addStyle
// @version     2.0.0
// @author      nadameu
// @description Destaca a existência de advogado dativo
// ==/UserScript==

const HEADER = 'SEEU - Advogado dativo';

main().catch(err => {
  console.group(HEADER);
  console.error(err);
  console.groupEnd();
});

async function main() {
  const advs = Array.from(
    document.querySelectorAll(
      '[id="informacoesProcessuais-table"] table td > label'
    )
  ).filter(x => (x.textContent?.trim() ?? '') === 'Advogados/Defensoria:');
  if (advs.length === 0) return;
  if (advs.length > 1)
    throw new Error(
      'Não foi possível individualizar a informação do(s) advogado(s) cadastrado(s).'
    );
  const [adv] = advs;

  const linksAbaPartes = Array.from(
    document.querySelectorAll('li[onclick^="setTab"]')
  ).filter(x => /^setTab\(.*'tabPartes'.*\);/.test(x.getAttribute('onclick')));
  if (linksAbaPartes.length !== 1)
    throw new Error('Não foi possível individualizar a aba "Partes".');
  const [linkAbaPartes] = linksAbaPartes;

  const abaPartesAberta = linkAbaPartes.classList.contains('currentTab');

  const numproc =
    document.getElementById('processoNumeroFormatado')?.value ?? '';
  if (!numproc) throw new Error('Não foi possível obter o número do processo.');

  const contemInformacaoDativo = await obterInformacaoDativo(
    numproc,
    abaPartesAberta
  );

  if (contemInformacaoDativo) {
    adv
      .closest('tr')
      .children[1].insertAdjacentHTML(
        'beforeend',
        '<p><em>Há defensor(a) dativo(a)</em></p>'
      );
  }
}

async function obterInformacaoDativo(numproc, abaPartesAberta) {
  if (abaPartesAberta) {
    const contemDativo = extrairInformacaoDativo(document);
    console.info(
      HEADER,
      'Informação obtida da página:',
      contemDativo ? 'há dativo' : 'não há dativos'
    );
    localStorage.setItem(
      'seeu-dativo',
      JSON.stringify({ numproc, contemDativo })
    );
    return contemDativo;
  }
  try {
    const textoSalvo = localStorage.getItem('seeu-dativo');
    if (!textoSalvo) throw null;
    const data = JSON.parse(textoSalvo);
    if (
      typeof data === 'object' &&
      data !== null &&
      'numproc' in data &&
      typeof data.numproc === 'string' &&
      'contemDativo' in data &&
      typeof data.contemDativo === 'boolean'
    ) {
      if (data.numproc !== numproc) throw null;
      console.info(
        HEADER,
        'Informação obtida do cache:',
        data.contemDativo ? 'há dativo' : 'não há dativos'
      );
      return data.contemDativo;
    } else {
      throw null;
    }
  } catch (_) {
    localStorage.removeItem('seeu-dativo');
  }
  const data = new FormData(document.forms[0]);
  data.set('selectedIcon', 'tabPartes');
  const response = await fetch(
    '/seeu/visualizacaoProcesso.do?actionType=visualizar',
    { method: 'POST', body: data }
  );
  const text = await response.text();
  const parser = new DOMParser();
  const doc = parser.parseFromString(text, 'text/html');
  const contemDativo = extrairInformacaoDativo(doc);
  console.info(
    HEADER,
    'Informação obtida remotamente:',
    contemDativo ? 'há dativo' : 'não há dativos'
  );
  localStorage.setItem(
    'seeu-dativo',
    JSON.stringify({ numproc, contemDativo })
  );
  return contemDativo;
}

function extrairInformacaoDativo(doc) {
  const dativos = Array.from(doc.querySelectorAll('table.resultTable')).filter(
    x => /\(Defensor Dativo\)/g.test(x.textContent)
  );
  return dativos.length > 0;
}
