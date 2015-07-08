// ==UserScript==
// @name        Barra flutuante
// @namespace   http://nadameu.com.br/barraflutuante
// @include     https://eproc.jfpr.jus.br/eprocV2/*
// @include     https://eproc.jfsc.jus.br/eprocV2/*
// @include     https://eproc.jfrs.jus.br/eprocV2/*
// @include     https://eproc.trf4.jus.br/eproc2trf4/*
// @version     1
// @grant       GM_addStyle
// ==/UserScript==

var $ = window.jQuery;

$('head').append($('<style type="text/css"></style>').html([
  '#divInfraAreaGlobal { position: absolute; margin: 0 2.5%; padding-top: 48px; }',
  '#divInfraBarraTribunal { position: fixed; margin-top: -48px; width: 95%; z-index: 1000; }'
].join(' '));
