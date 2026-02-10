// ==UserScript==
// @name         seeu-ir-para-topo
// @name:pt-BR   SEEU - Ir para o topo
// @namespace    nadameu.com.br
// @version      1.2.3
// @author       nadameu
// @description  Acrescenta botão para facilitar ir para o início da página
// @match        https://seeu.pje.jus.br/*
// @grant        GM_addStyle
// @grant        GM_info
// ==/UserScript==

try {
  main();
} catch (err) {
  console.group(`<${GM_info.script.name}>`);
  console.error(err);
  console.groupEnd();
}

function main() {
  if (window.frameElement?.id !== 'userMainFrame') return;
  const win = window;
  const debounce = make_debounce(window.top);
  const button = h(
    'div',
    { id: `gm-${GM_info.script.name}` },
    icon('chevron-up')
  );
  const { pub: set_mostrar, sub: on_mostrar_change } = pub_sub(false);
  const subscription = on_mostrar_change(valor => {
    button.style.opacity = valor ? '1' : '0';
  });
  win.addEventListener('beforeunload', () => {
    subscription.unsubscribe();
  });
  win.addEventListener(
    'scroll',
    debounce(() => {
      set_mostrar(win.scrollY !== 0);
    })
  );
  button.addEventListener('click', () => {
    set_mostrar(false);
    win.scrollTo({ top: 0, behavior: 'smooth' });
  });
  document.body.append(button);
  GM_addStyle(/* css */ `
#container::after {
  content: '';
  display: block;
  height: 70px;
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
 * @param  {Array<string|Node>} children
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

/**
 * @param {Window} win
 */
function make_debounce(win) {
  return debounce;
  /**
   * @param {() => void} fn
   * @param {number} ms
   * @returns {() => void}
   */
  function debounce(fn, ms = 100) {
    /** @type {number} */
    let timer;
    return () => {
      win.clearTimeout(timer);
      timer = win.setTimeout(fn, ms);
    };
  }
}

/**
 * @template T
 * @param {T} initial_value
 * @returns
 */
function pub_sub(initial_value) {
  let current_value = initial_value;
  /** @type {Set<(_: T) => void>} */
  const subscribers = new Set();
  return {
    /**
     * @param {T} value
     * @returns {void}
     */
    pub(value) {
      if (value === current_value) return;
      current_value = value;
      for (const fn of subscribers) {
        fn(value);
      }
    },
    /**
     * @param {(_: T) => void} fn
     * @returns {{ unsubscribe(): void }}
     */
    sub(fn) {
      subscribers.add(fn);
      return {
        unsubscribe() {
          subscribers.delete(fn);
        },
      };
    },
  };
}
