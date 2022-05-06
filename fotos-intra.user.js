// ==UserScript==
// @name         Fotos Intra
// @namespace    http://nadameu.com.br/fotos-intra
// @version      4.1.0
// @author       nadameu
// @description  Corrige a distorção nas fotos da Intra
// @website      http://www.nadameu.com.br/
// @include      /^https?:\/\/intra(pr|rs|sc|)2?\.trf4\.jus\.br\/membros\/.*-jus-br\//
// @include      /^https?:\/\/intra(pr|rs|sc|)2?\.trf4\.jus\.br\//
// @run-at       document-end
// @grant        none
// ==/UserScript==

let style;

main().catch(err => {
  console.error(err);
});

async function main() {
  adicionarEstilosGeral();
  if (document.location.pathname === '/') {
    const coluna = await queryOne('.coluna-direita');
    const titulo = await queryOne(':scope > .widgettitle:first-child', coluna);
    if (!/^Aniversariantes/.test(titulo.textContent)) throw new Error('Não foi possível localizar aniversariantes.');

    adicionarEstilosHome();
    const div = titulo.insertAdjacentElement('afterend', document.createElement('div'));
    div.className = 'gm-aniversariantes'
    for (const aniversariante of coluna.querySelectorAll('a[href^="/membros/"]')) {
      div.appendChild(aniversariante);
    }
    for (const foto of document.querySelectorAll('.avatar')) {
      foto.removeAttribute('width');
      foto.removeAttribute('height');
    }
  }
}

function adicionarEstilosHome() {
  style = style || document.head.appendChild(document.createElement('style'));
  style.textContent += `
.gm-aniversariantes {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: space-between;
}
.gm-aniversariantes::after {
  content: '';
  flex: auto;
}
.avatar {
  height: 50px;
  margin: 1px;
  border: 1px solid #aaa;
}
.avatar[src*="mystery-man"] {
  aspect-ratio: 2/3;
  object-fit: cover;
}
`;
}

function adicionarEstilosGeral() {
  style = style || document.head.appendChild(document.createElement('style'));
  style.textContent += `
.avatar,
#wp-admin-bar-user-info .avatar {
  width: auto !important;
}
`;
}

async function queryOne(selector, context = document) {
  const elements = context.querySelectorAll(selector);
  if (elements.length !== 1) throw new Error(`Não foi possível obter um elemento único para o seletor \`${selector}\`.`);
  return elements[0];
}

function queryAll(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}
