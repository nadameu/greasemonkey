// ==UserScript==
// @name        eproc-minutas-abrir-processos
// @name:pt-BR  eproc - área de trabalho - abrir processos
// @namespace   http://nadameu.com.br
// @match       https://eproc.jfpr.jus.br/eprocV2/controlador.php?acao=minuta_area_trabalho&*
// @match       https://eproc.jfrs.jus.br/eprocV2/controlador.php?acao=minuta_area_trabalho&*
// @match       https://eproc.jfsc.jus.br/eprocV2/controlador.php?acao=minuta_area_trabalho&*
// @match       https://eproc.trf4.jus.br/eproc2trf4/controlador.php?acao=minuta_area_trabalho&*
// @grant       none
// @version     1.0.0
// @author      nadameu
// @description Impede que o mesmo processo seja aberto várias vezes quando possuir múltiplas minutas na área de trabalho
// ==/UserScript==

class CustomError extends Error {
  constructor(message, payload) {
    super(message);
    this.payload = payload;
  }
}
CustomError.prototype.name = 'CustomError';

try_catch(main);

function main() {
  document.body.addEventListener('click', evt => {
    console.log('body clicked')
    if (evt.target instanceof HTMLElement && evt.target.matches('a[onclick^="abreProcessosSelecionadosEmAbas"]')) {
      return on_click(evt);
    }
  }, { capture: true });
}

function on_click(evt) {
  debugger;
  console.log('clicked');
  const rollback = [];
  const urls = new Set();
  for (const linha of document.querySelectorAll('.infraTrMarcada')) {
    for (const link of linha.querySelectorAll('a[href*="controlador.php?acao=processo_selecionar&"], a[href*="processo_selecionar_siapro&"]')) {
      const { href } = link;
      if (urls.has(href)) {
        link.href = 'javascript:false';
        rollback.push(() => {
          link.href = href;
        });
      } else {
        urls.add(href);
      }
    }
  }
  window.setTimeout(() => {
    for (const fn of rollback) {
      fn();
    }
  }, 100);
  return false;
}

function try_catch(fn) {
  try {
    fn();
  } catch(err) {
    console.group(`<${GM_info.script.name}>`);
    console.error(err);
    if (err instanceof CustomError) {
      console.debug(err.payload);
    }
    console.groupEnd();
  }
}
