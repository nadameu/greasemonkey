// ==UserScript==
// @name        Barra flutuante
// @namespace   http://nadameu.com.br/barraflutuante
// @include     https://eproc.jfpr.jus.br/eprocV2/*
// @include     https://eproc.jfsc.jus.br/eprocV2/*
// @include     https://eproc.jfrs.jus.br/eprocV2/*
// @include     https://eproc.trf4.jus.br/eproc2trf4/*
// @version     4
// @grant       none
// ==/UserScript==

var $ = window.jQuery;

$('head').append($('<style type="text/css"></style>').html([
  '#divInfraAreaGlobal { position: absolute; margin: 0 2.5%; }',
  '#divInfraBarraTribunal { position: fixed; top: 8px; width: 95%; z-index: 1000; }'
].join(' ')));

function onResize() {
  var alturaBarra = $('#divInfraBarraTribunal').height();
  var alturaBordaBarra = 2;
  $('#divInfraAreaGlobal').css('padding-top', (alturaBarra + alturaBordaBarra) + 'px');
}

$(window).on('load', onResize);
$(window).on('resize', onResize);
