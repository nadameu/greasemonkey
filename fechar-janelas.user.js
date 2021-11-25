// ==UserScript==
// @name        fechar-janelas
// @name:pt-BR  Fechar janelas abertas
// @namespace   http://nadameu.com.br
// @match       https://eproc.jfpr.jus.br/eprocV2/controlador.php?acao=processo_selecionar&*
// @match       https://eproc.jfrs.jus.br/eprocV2/controlador.php?acao=processo_selecionar&*
// @match       https://eproc.jfsc.jus.br/eprocV2/controlador.php?acao=processo_selecionar&*
// @match       https://eproc.trf4.jus.br/eproc2trf4/controlador.php?acao=processo_selecionar&*
// @grant       none
// @version     3.1.0
// @author      nadameu
// @description Fecha as janelas de documentos que tenham sido abertas no processo
// ==/UserScript==

const referencia = document.querySelector('[name="selInfraUnidades"]')?.parentNode?.parentNode;
if (! referencia) {
  console.error('<fechar-janelas>', 'Não foi possível encontrar um local para inserir o botão.');
  return;
}

const tabela = document.querySelector('#tblEventos');
if (! tabela) {
  console.error('<fechar-janelas>', 'Não foi possível encontrar a tabela de eventos.');
  return;
}

tabela.addEventListener('click', onTabelaClick);

const style = document.head.appendChild(document.createElement('style'));
style.textContent = /* css */ `

#gm-fechar-janelas {
  --accent: #6f5b9b;
  --shadow: #555;
  --muted-accent: #675a84;
  --text: #fff;
}
#gm-fechar-janelas {
  display: flex;
  align-items: center;
  margin: 0 1rem;
  padding: 2px 20px;
  font-size: 18px;
  border: none;
  border-radius: 4px;
  box-shadow: 0 2px 4px var(--shadow);
  background: var(--muted-accent);
  color: var(--text);
  cursor: pointer;
}
#gm-fechar-janelas:hover {
  transition: background-color 0.1s ease-in;
  background: var(--accent);
}
#gm-fechar-janelas:disabled {
  display: none;
}
#gm-fechar-janelas svg {
  height: 18px;
  margin-right: 10px;
}
#gm-fechar-janelas svg .outer {
  fill: var(--text);
}
`;

const button = referencia.insertAdjacentElement('afterend', document.createElement('button'));
button.id = 'gm-fechar-janelas';
button.disabled = true;

// © 2014 Andreas Kainz & Uri Herrera & Andrew Lake & Marco Martin & Harald Sitter & Jonathan Riddell & Ken Vermette & Aleix Pol & David Faure & Albert Vaca & Luca Beltrame & Gleb Popov & Nuno Pinheiro & Alex Richardson &  Jan Grulich & Bernhard Landauer & Heiko Becker & Volker Krause & David Rosca & Phil Schaf / KDE
button.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path d="M8 0a8 8 0 00-8 8 8 8 0 008 8 8 8 0 008-8 8 8 0 00-8-8M5 4l3 3 3-3 1 1-3 3 3 3-1 1-3-3-3 3-1-1 3-3-3-3 1-1" class="outer"/></svg> Fechar janelas`;

button.addEventListener('click', onClick);


function onTabelaClick(evt) {
  if (! evt.target?.matches?.('a.infraLinkDocumento')) return;
  show();
}

function onClick(evt) {
  evt.preventDefault();
  const documentosAbertos = window.documentosAbertos || {};
  for (const janela of Object.values(documentosAbertos)) {
    if (!janela || janela.closed) continue;
    janela.close();
  }
  hide();
}

function show() {
  button.disabled = false;
}

function hide() {
  button.disabled = true;
}
