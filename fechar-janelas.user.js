// ==UserScript==
// @name        fechar-janelas
// @name:pt-BR  Fechar janelas abertas
// @namespace   http://nadameu.com.br
// @match       https://eproc.jfpr.jus.br/eprocV2/controlador.php?acao=processo_selecionar&*
// @match       https://eproc.jfrs.jus.br/eprocV2/controlador.php?acao=processo_selecionar&*
// @match       https://eproc.jfsc.jus.br/eprocV2/controlador.php?acao=processo_selecionar&*
// @match       https://eproc.trf4.jus.br/eproc2trf4/controlador.php?acao=processo_selecionar&*
// @grant       none
// @version     1.0.0
// @author      nadameu
// @description Fecha as janelas de documentos que tenham sido abertas no processo
// ==/UserScript==

const referencia = document.querySelector('[name="selInfraUnidades"]')?.parentNode?.parentNode;
if (! referencia) {
  console.error('<fechar-janelas>', 'Não foi possível encontrar um local para inserir o botão.');
  return;
}

const div = document.createElement('div');
div.className = 'p-2';
div.style.cursor = 'pointer';

// © 2014 Andreas Kainz & Uri Herrera & Andrew Lake & Marco Martin & Harald Sitter & Jonathan Riddell & Ken Vermette & Aleix Pol & David Faure & Albert Vaca & Luca Beltrame & Gleb Popov & Nuno Pinheiro & Alex Richardson &  Jan Grulich & Bernhard Landauer & Heiko Becker & Volker Krause & David Rosca & Phil Schaf / KDE
div.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" height="22"><circle cx="8" cy="8" r="6" fill="#fff"/><path d="M8 0a8 8 0 00-8 8 8 8 0 008 8 8 8 0 008-8 8 8 0 00-8-8M5 4l3 3 3-3 1 1-3 3 3 3-1 1-3-3-3 3-1-1 3-3-3-3 1-1" fill="#da4453"/></svg> Fechar janelas`;

div.addEventListener('click', onClick);

referencia.insertAdjacentElement('afterend', div);

function onClick(evt) {
  evt.preventDefault();
  const documentosAbertos = window.documentosAbertos || {};
  for (const janela of Object.values(documentosAbertos)) {
    if (!janela || janela.closed) continue;
    janela.close();
  }
  window.documentosAbertos = {};
}
