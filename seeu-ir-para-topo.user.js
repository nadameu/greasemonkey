// ==UserScript==
// @name         seeu-ir-para-topo
// @name:pt-BR   SEEU - Ir para o topo
// @namespace    nadameu.com.br
// @version      1.1.0
// @author       nadameu
// @description  Acrescenta botões para facilitar ir para o início e o fim da página
// @match        https://seeu.pje.jus.br/*
// @grant        GM_addStyle
// ==/UserScript==

main();

function main() {
  if (window.name !== 'userMainFrame') return;
  const button = h(
    'div',
    { id: `gm-${GM_info.script.name}` },
    icon('chevron-up')
  );
  const estado = (() => {
    let _mostrar = false;
    return {
      get mostrar() {
        return _mostrar;
      },
      set mostrar(valor) {
        if (valor === _mostrar) return;
        button.style.opacity = valor ? '1' : '0';
        _mostrar = valor;
      },
    };
  })();
  let timer = null;
  window.addEventListener('scroll', () => {
    if (timer) {
      window.clearTimeout(timer);
    }
    timer = window.setTimeout(() => {
      window.clearTimeout(timer);
      timer = null;
      estado.mostrar = window.scrollY !== 0;
    }, 100);
  });
  button.addEventListener('click', () => {
    estado.mostrar = false;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
  document.body.insertAdjacentElement('beforeend', button);
  GM_addStyle(/* css */ `
#container {
  margin-bottom: 70px;
}
#gm-${GM_info.script.name} {
  --cor-fundo: hsl(333, 50%, 97%);
  --cor-hover: hsl(333, 30%, 90%);
  --cor-frente: hsl(333, 50%, 12%);
  opacity: 0;
  position: fixed;
  right: 20px;
  bottom: 20px;
  display: grid;
  grid-template-columns: 50px 50px;
  grid-gap: 0 8px;
  border: 1px solid var(--cor-frente);
  border-radius: 100%;
  width: 50px;
  height: 50px;
  padding: 12px;
  background: var(--cor-fundo);
  color: var(--cor-frente);
  box-shadow: 0 4px 4px #0004;
  transition: opacity .5s, transform .2s, box-shadow .2s;
  cursor: pointer;

  &:hover {
    background: var(--cor-hover);
  }

  &:active {
    transform: translateY(4px);
    box-shadow: none;
  }

  .icon {
    width: 24px;
    height: 24px;
  }
}
  `);
}

/**
 * @template {keyof HTMLElementTagNameMap} K
 * @param {K} tag
 * @param {Partial<HTMLElementTagNameMap[K]>} props
 * @param  {...Array<string|Node>} children
 * @returns {HTMLElementTagNameMap[K]}
 */
function h(tag, props = {}, ...children) {
  const element = document.createElement(tag);
  for (const [key, value] of Object.entries(props)) element[key] = value;
  element.append(...children);
  return element;
}

/**
 *
 * @param {string} name
 * @returns {HTMLElement}
 */
function icon(name) {
  return h('i', { className: `icon icon-mdi:${name}` });
}
