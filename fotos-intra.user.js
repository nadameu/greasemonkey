// ==UserScript==
// @name         Fotos Intra
// @namespace    http://nadameu.com.br/fotos-intra
// @version      4.5.0
// @author       nadameu
// @description  Corrige a distorção nas fotos da Intra
// @website      http://www.nadameu.com.br/
// @include      /^https?:\/\/intra(pr|rs|sc|)2?\.trf4\.jus\.br\/membros\/.*-jus-br\//
// @include      /^https?:\/\/intra(pr|rs|sc|)2?\.trf4\.jus\.br\//
// @run-at       document-end
// @grant        none
// ==/UserScript==

let style;
function adicionarEstilos(css) {
  style = style ?? document.head.appendChild(document.createElement('style'));
  style.textContent += css;
}

main();

function main() {
  if (document.location.pathname === '/') {
    const coluna = queryOne('.coluna-direita');
    let aniversariantes = null;
    for (let child = coluna.firstElementChild; child !== null; child = child.nextElementSibling) {
      if (child.matches('.widgettitle')) {
        aniversariantes = null;
        if (/^Aniversariantes/.test(child.textContent)) {
          aniversariantes = h('div', { class: 'gm-aniversariantes' });
          child.insertAdjacentElement('afterend', aniversariantes);
        }
        continue;
      }
      if (aniversariantes && child.matches('a[href^="/membros/"]')) {
        const prev = child.previousElementSibling;
        aniversariantes.appendChild(child);
        child = prev;
      }
    }
    if (! coluna.querySelector('.gm-aniversariantes')) {
      throw new Error('Não foi possível localizar aniversariantes.');
    }
    const fotos = document.querySelectorAll('.avatar');

    adicionarEstilosGeral();
    adicionarEstilosHome();
    fotos.forEach(foto => {
      foto.removeAttribute('width');
      foto.removeAttribute('height');
    });
  } else {
    adicionarEstilosGeral();
  }
}

function h(tag, props, ...children) {
  const element = document.createElement(tag);
  if (props)
    for (const [key, value] of Object.entries(props))
      if (key in element) element[key] = value;
      else element.setAttribute(key, value);
  element.append(...children);
  return element;
}

function adicionarEstilosHome() {
  adicionarEstilos(`
.gm-aniversariantes {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: space-around;
}
.gm-aniversariantes::after {
  content: '';
  flex: auto;
}
.avatar {
  height: 50px;
  margin: 1px;
  border: 2px solid #fff;
  box-shadow: 0 2px 4px #aaa;
}
.avatar[src*="mystery-man"] {
  aspect-ratio: 2/3;
  object-fit: cover;
}
`);
}

function adicionarEstilosGeral() {
  adicionarEstilos(`
.avatar,
#wp-admin-bar-user-info .avatar {
  width: auto !important;
}
`);
}

function queryOne(selector, context = document) {
  const elements = context.querySelectorAll(selector);
  assert(
    elements.length === 1,
    `Não foi possível obter um elemento único para o seletor \`${selector}\`.`
  );
  return elements[0];
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}
