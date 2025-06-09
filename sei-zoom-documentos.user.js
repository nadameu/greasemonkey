// ==UserScript==
// @name         sei-zoom-documentos
// @name:pt-BR   SEI! - Zoom em documentos
// @namespace    http://nadameu.com.br
// @version      1.0.0
// @author       nadameu
// @description  Permite aplicar zoom apenas aos documentos do processo, sem afetar o restante da interface
// @match        https://sei.trf4.jus.br/controlador.php?acao=arvore_visualizar&*
// @match        https://sei.trf4.jus.br/sei/controlador.php?acao=arvore_visualizar&*
// @match        https://sei.trf4.jus.br/controlador.php?acao=documento_visualizar&*
// @match        https://sei.trf4.jus.br/sei/controlador.php?acao=documento_visualizar&*
// @grant        GM_addStyle
// ==/UserScript==

(d => {
  if (typeof GM_addStyle == 'function') {
    GM_addStyle(d);
    return;
  }
  const e = document.createElement('style');
  (e.textContent = d), document.head.append(e);
})(
  ' ._div_1sxbi_1{background-color:#dfd2d8;margin-top:10px;padding:10px;border-radius:5px;box-shadow:0 .125rem .5rem #0000004d,0 .0625rem .125rem #0003}._div_1sxbi_1 input:invalid{background-color:#dfa79f} '
);

(function () {
  'use strict';

  function h(tag, props = null, ...children) {
    const element = document.createElement(tag);
    for (const [key, value] of Object.entries(props ?? {})) {
      if (key === 'style' || key === 'dataset') {
        for (const [k, v] of Object.entries(value)) {
          element[key][k] = v;
        }
      } else if (key === 'classList') {
        let classes2;
        if (Array.isArray(value)) {
          classes2 = value.filter(x => x !== null);
        } else {
          classes2 = Object.entries(value).flatMap(([k, v]) => {
            if (!v) return [];
            return [k];
          });
        }
        for (const className of classes2) {
          element.classList.add(className);
        }
      } else {
        element[key] = value;
      }
    }
    element.append(...children);
    return element;
  }
  const div = '_div_1sxbi_1';
  const classes = {
    div,
  };
  const ZOOM_PADRAO = 100;
  const ZOOM_MINIMO = 30;
  const ZOOM_MAXIMO = 500;
  const ZOOM_STEP = 10;
  function aproximar(valor) {
    return (
      ZOOM_MINIMO + Math.round((valor - ZOOM_MINIMO) / ZOOM_STEP) * ZOOM_STEP
    );
  }
  const LOCAL_STORAGE_NAME = 'gm-sei-zoom-documentos';
  function main() {
    const url = new URL(document.location.href);
    const params = url.searchParams;
    const acao = params.get('acao');
    switch (acao) {
      case 'arvore_visualizar':
        criar_controles();
        break;
      case 'documento_visualizar':
        aplicar_zoom();
        break;
      default:
        throw new Error(`Ação desconhecida: "${String(acao)}".`);
    }
  }
  function criar_controles() {
    const divs_documento = document.querySelectorAll('#divArvoreConteudoIfr');
    if (divs_documento.length !== 1) {
      throw new Error('Erro ao buscar o container do documento.');
    }
    const div_documento = divs_documento[0];
    const iframes = div_documento.querySelectorAll('iframe');
    if (iframes.length !== 1) {
      throw new Error('Erro ao buscar a janela do documento.');
    }
    const iframe = iframes[0];
    const nivel = h('input', {
      type: 'number',
      min: ZOOM_MINIMO.toString(),
      max: ZOOM_MAXIMO.toString(),
      step: ZOOM_STEP.toString(),
      required: true,
      value: localStorage.getItem(LOCAL_STORAGE_NAME) ?? ZOOM_PADRAO.toString(),
      onchange,
    });
    if (!nivel.validity.valid) {
      onchange();
    }
    const div2 = h(
      'div',
      { className: classes.div },
      'Zoom do documento:',
      nivel,
      '%'
    );
    div_documento.insertAdjacentElement('afterend', div2);
    function onchange() {
      return logar_erros(() => {
        if (nivel.validity.rangeUnderflow) {
          nivel.value = nivel.min;
        } else if (nivel.validity.rangeOverflow) {
          nivel.value = nivel.max;
        } else if (nivel.validity.stepMismatch) {
          nivel.value = aproximar(nivel.valueAsNumber).toString();
        } else if (!nivel.validity.valid) {
          nivel.value = ZOOM_PADRAO.toString();
        }
        const valor = nivel.valueAsNumber;
        localStorage.setItem(LOCAL_STORAGE_NAME, valor.toString());
        const zoom = valor / 100;
        if (!iframe.contentDocument) {
          throw new Error('Conteúdo do documento não encontrado.');
        }
        iframe.contentDocument.documentElement.style.zoom = zoom.toString();
      });
    }
  }
  function aplicar_zoom() {
    const input = window.parent?.document.querySelector(
      `.${classes.div} > input`
    );
    if (!input || !input.validity.valid) return;
    const zoom = input.valueAsNumber / 100;
    document.documentElement.style.zoom = zoom.toString();
  }
  function logar_erros(fn) {
    try {
      fn();
    } catch (err) {
      console.group('sei-zoom-documentos');
      console.error(err);
      console.groupEnd();
    }
  }
  logar_erros(main);
})();
