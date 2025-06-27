// ==UserScript==
// @name         Fotos Intra
// @namespace    http://nadameu.com.br/fotos-intra
// @version      4.6.0
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
  style ??= document.head.appendChild(h('style', {}));
  style.textContent += css;
}

main();

function main() {
  if (document.location.pathname === '/') {
    let list = null;
    const children = queryOne('.coluna-direita').children;
    for (const [i, child] of Array.from(children).entries()) {
      if (
        child.matches('.widgettitle') ||
        child.querySelector('.widgettitle')
      ) {
        list = { titulo: child, children: [], previous: list };
      } else if (list) {
        list.children.push(child);
      } else {
        throw new Error('Não foi encontrado título da seção.');
      }
    }

    let encontrados = false;
    for (let current = list; current; current = current.previous) {
      if (/^Aniversariantes/.test(current.titulo.textContent)) {
        encontrados = true;
        if (current.children.length < 1) continue;
        const div = current.children[0].insertAdjacentElement(
          'beforebegin',
          h('div', { class: 'gm-aniversariantes' })
        );
        div.append(...current.children);
      }
    }

    if (!encontrados)
      throw new Error('Não foi possível localizar aniversariantes.');

    adicionarEstilosGeral();
    adicionarEstilosHome();
    for (const foto of document.querySelectorAll('.avatar')) {
      foto.removeAttribute('width');
      foto.removeAttribute('height');
    }
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
  adicionarEstilos(/* css */ `
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
.gridly > .brick > .handle > img {
  width: 75px;
  height: 75px;
}
`);
}

function adicionarEstilosGeral() {
  adicionarEstilos(/* css */ `
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
