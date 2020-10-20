// ==UserScript==
// @name        ultimo-link-clicado
// @name:pt-BR  Último link clicado
// @namespace   http://nadameu.com.br
// @match       https://eproc.jfsc.jus.br/eprocV2/controlador.php
// @grant       none
// @version     1.0.0
// @author      nadameu
// @description Destaca o último link clicado
// ==/UserScript==

$('a[href]').click(function(){
  $('.extraUltimoLinkClicado').removeClass('extraUltimoLinkClicado');
  $(this).addClass('extraUltimoLinkClicado');
});

