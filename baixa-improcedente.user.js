// ==UserScript==
// @name baixa-improcedente
// @version 0.2.1
// @description 3DIR Baixa - sentença de improcedência
// @namespace http://nadameu.com.br/baixa-improcedente
// @match https://eproc.jfsc.jus.br/eprocV2/controlador.php?acao=processo_selecionar&*
// @grant none
// ==/UserScript==

const localizadores = queryAll('[id="AbreLocalizadores"]').map(textContent);
if (localizadores.length !== 1) return log('Mais de um localizador.');

const peritos = queryAll('a[data-parte="PERITO"]').map(textContent);
if (peritos.length < 1) return log('Não há peritos.');

const eventos = queryAll('td.infraEventoDescricao').map(celula => celula.closest('tr'));

if (
  !eventos.some(linha =>
    textContent(linha.cells[3]).match(/Trânsito em Julgado|Transitado em Julgado/)
  )
)
  return log('Não há trânsito em julgado.');

if (
  !eventos.some(
    linha =>
      textContent(linha.cells[3]).match(
        /Sentença com Resolução de Mérito - Pedido Improcedente|Julgado improcedente o pedido/
      ) &&
      textContent(linha.cells[5]).match(
        /Condeno a parte autora ao (reembolso|pagamento) dos honorários periciais/
      )
  )
)
  return log('Não há sentença de improcedência.');

if (localizadores[0] === '3DIR Baixa Turma') {
  const ultimoEvento = Number(textContent(eventos[0].cells[1]));
  if (
    !eventos.some(
      linha =>
        textContent(linha.cells[3]).match(
          /Julgamento - Mantida a Sentença - por unanimidade|Sentença confirmada - por unanimidade/
        ) && Number(textContent(linha.cells[1])) >= ultimoEvento - 9
    )
  )
    return log('Julgamento não manteve sentença por unanimidade.');
} else if (localizadores[0] !== '3DIR Baixa') {
  return log('Não é 3DIR Baixa.');
}

for (const perito of peritos) {
  if (
    !eventos.some(
      linha =>
        textContent(linha.cells[3]).match(
          /(?:Expedida|Expedição de) Requisição Honorários Perito\/Dativo/
        ) &&
        textContent(linha.cells[5]).match(/PGTOPERITO\d/) &&
        textContent(linha.cells[5]).match(
          new RegExp(`Perito:\\s*${perito}\\s*. Documento gerado pelo sistema AJG`)
        )
    )
  )
    return log(`Não houve pagamento do perito ${perito}.`);
}

const capa = document.getElementById('fldCapa');
if (!capa) return;

capa.insertAdjacentHTML(
  'beforebegin',
  `<div style="display: inline-block; padding: 4px; border-radius: 4px; font-size: 1.25em; font-weight: bold; background: #848; color: #fff;">Baixar motivo 6</div>`
);

function queryAll(selector) {
  return Array.from(document.querySelectorAll(selector));
}

function textContent(node) {
  return (node.textContent || '').trim();
}

function log(...msgs) {
  console.log('<baixa-improcedente>', ...msgs);
}
