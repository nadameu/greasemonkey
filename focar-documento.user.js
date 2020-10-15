// ==UserScript==
// @name        focar-documento
// @name:pt-BR  Focar documento ao abrir
// @namespace   http://nadameu.com.br
// @match       https://eproc.jfsc.jus.br/eprocV2/controlador.php?acao=acessar_documento&*
// @match       https://eproc.jfsc.jus.br/eprocV2/controlador.php?acao=acessar_documento_implementacao&*
// @grant       none
// @version     1.2.0
// @author      nadameu
// @description Facilita o uso do teclado, focando o documento ao abri-lo em uma janela.
// ==/UserScript==

if (window.frames.length) {
  window.frames[0].focus();
} else {
  document.body.addEventListener('keydown', evt => {
    switch (evt.key) {
      case 'j':
      case 'J':
        smoothScroll(window.innerHeight, true);
        break;

      case 'k':
      case 'K':
        smoothScroll(-window.innerHeight, true);
        break;

      case 'g':
        smoothScroll(0);
        break;

      case 'G':
        smoothScroll(window.scrollMaxY);
        break;

      default:
        break;
    }
  }, false);
}

function smoothScroll(top, relative = false) {
  const fn = relative ? 'scrollBy' : 'scrollTo';
  window[fn]({ top, behavior: 'smooth' });
}
