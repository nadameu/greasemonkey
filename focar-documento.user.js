// ==UserScript==
// @name        focar-documento
// @name:pt-BR  Focar documento ao abrir
// @namespace   http://nadameu.com.br
// @match       https://eproc.jfsc.jus.br/eprocV2/controlador.php?acao=acessar_documento&*
// @match       https://eproc.jfsc.jus.br/eprocV2/controlador.php?acao=acessar_documento_implementacao&*
// @grant       window.focus
// @version     2.0.1
// @author      nadameu
// @description Facilita o uso do teclado, focando o documento ao abri-lo em uma janela.
// ==/UserScript==

if (window.frames.length) window.frames[0].focus();
