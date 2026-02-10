// ==UserScript==
// @name        focar-documento
// @name:pt-BR  Focar documento ao abrir
// @namespace   http://nadameu.com.br
// @match       https://eproc.jfpr.jus.br/eprocV2/controlador.php?acao=acessar_documento&*
// @match       https://eproc.jfrs.jus.br/eprocV2/controlador.php?acao=acessar_documento&*
// @match       https://eproc.jfsc.jus.br/eprocV2/controlador.php?acao=acessar_documento&*
// @match       https://eproc.trf4.jus.br/eproc2trf4/controlador.php?acao=acessar_documento&*
// @match       https://eproc.jfpr.jus.br/eprocV2/controlador.php?acao=acessar_documento_implementacao&*
// @match       https://eproc.jfrs.jus.br/eprocV2/controlador.php?acao=acessar_documento_implementacao&*
// @match       https://eproc.jfsc.jus.br/eprocV2/controlador.php?acao=acessar_documento_implementacao&*
// @match       https://eproc.trf4.jus.br/eproc2trf4/controlador.php?acao=acessar_documento_implementacao&*
// @grant       window.focus
// @version     4.1.0
// @author      nadameu
// @description Facilita o uso do teclado, focando o documento ao abri-lo em uma janela.
// ==/UserScript==

if (window.frames.length) window.frames[0].focus();
