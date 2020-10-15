// ==UserScript==
// @name        focar-documento
// @name:pt-BR  Focar documento ao abrir
// @namespace   http://nadameu.com.br
// @match       https://eproc.jfsc.jus.br/eprocV2/controlador.php?acao=acessar_documento&*
// @match       https://eproc.jfsc.jus.br/eprocV2/controlador.php?acao=acessar_documento_implementacao&*
// @grant       none
// @version     1.1.0
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
        window.scrollByPages(1);
        break;

      case 'k':
      case 'K':
        window.scrollByPages(-1);
        break;

      case 'g':
        window.scrollTo(undefined, 0);
        break;

      case 'G':
        window.scrollTo(undefined, window.scrollMaxY);
        break;

      default:
        break;
    }
  }, false);
}
