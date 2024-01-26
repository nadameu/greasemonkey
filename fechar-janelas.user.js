// ==UserScript==
// @name        fechar-janelas
// @name:pt-BR  Fechar janelas abertas
// @namespace   http://nadameu.com.br
// @match       https://eproc.jfpr.jus.br/eprocV2/controlador.php?acao=processo_selecionar&*
// @match       https://eproc.jfrs.jus.br/eprocV2/controlador.php?acao=processo_selecionar&*
// @match       https://eproc.jfsc.jus.br/eprocV2/controlador.php?acao=processo_selecionar&*
// @match       https://eproc.trf4.jus.br/eproc2trf4/controlador.php?acao=processo_selecionar&*
// @grant       none
// @version     4.1.0
// @author      nadameu
// @description Fecha as janelas de documentos que tenham sido abertas no processo
// ==/UserScript==

let button;

try {
  main();
} catch (error) {
  console.error('<fechar-janelas>', error);
}

function main() {
  const referencia = document.querySelector('[name="selInfraUnidades"]')
    ?.parentNode?.parentNode;
  if (!referencia)
    throw new Error(
      'Não foi possível encontrar um local para inserir o botão.'
    );

  const tabela = document.querySelector('#tblEventos');
  if (!tabela)
    throw new Error('Não foi possível encontrar a tabela de eventos.');

  adicionarEstilos();

  tabela.addEventListener('click', onTabelaClick);

  button = referencia.insertAdjacentElement(
    'afterend',
    document.createElement('button')
  );
  button.type = 'button';
  button.id = 'gm-fechar-janelas';
  button.hidden = true;

  // © 2014 Andreas Kainz & Uri Herrera & Andrew Lake & Marco Martin & Harald Sitter & Jonathan Riddell & Ken Vermette & Aleix Pol & David Faure & Albert Vaca & Luca Beltrame & Gleb Popov & Nuno Pinheiro & Alex Richardson &  Jan Grulich & Bernhard Landauer & Heiko Becker & Volker Krause & David Rosca & Phil Schaf / KDE
  button.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path d="M8 0a8 8 0 00-8 8 8 8 0 008 8 8 8 0 008-8 8 8 0 00-8-8M5 4l3 3 3-3 1 1-3 3 3 3-1 1-3-3-3 3-1-1 3-3-3-3 1-1" class="outer"/></svg> Fechar janelas`;

  button.addEventListener('click', onClick);
}

function onTabelaClick(evt) {
  if (
    !evt.target?.matches?.('a.infraLinkDocumento, a.infraLinkDocumentoSigiloso')
  )
    return;
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
  button.hidden = false;
}

function hide() {
  button.hidden = true;
}

function adicionarEstilos() {
  const style = document.head.appendChild(document.createElement('style'));
  style.textContent = /* css */ `
#gm-fechar-janelas {
  --bg: transparent;
  --text: #fff;
}
#gm-fechar-janelas {
  display: flex;
  align-items: center;
  margin: 0 1rem;
  padding: 2px 10px;
  font-size: 14px;
  border: none;
  border-radius: 4px;
  box-shadow: 0 -1px 2px 0px #fff2, 0 1px 2px 0 #0002;
  background: var(--bg);
  color: var(--text);
  cursor: pointer;
  transition: background 0.1s ease-in;
}
#gm-fechar-janelas:hover {
  --bg: hsla(333, 25%, 50%, 0.75);
}
#gm-fechar-janelas svg {
  height: 18px;
  margin-right: 10px;
}
#gm-fechar-janelas svg .outer {
  fill: var(--text);
}
`;
}
