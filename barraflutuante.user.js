// ==UserScript==
// @name        Barra flutuante
// @namespace   http://nadameu.com.br/barraflutuante
// @include     https://eproc.jfpr.jus.br/eprocV2/*
// @include     https://eproc.jfsc.jus.br/eprocV2/*
// @include     https://eproc.jfrs.jus.br/eprocV2/*
// @include     https://eproc.trf4.jus.br/eproc2trf4/*
// @version     5
// @grant       none
// ==/UserScript==

const urlIcone = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB4bWxuczpza2V0Y2g9Imh0dHA6Ly93d3cuYm9oZW1pYW5jb2RpbmcuY29tL3NrZXRjaC9ucyIgdmlld0JveD0iMCAwIDEwMCAxMDAiIHZlcnNpb249IjEuMSIgeD0iMHB4IiB5PSIwcHgiPjx0aXRsZT5uZXdfd2luZG93PC90aXRsZT48ZGVzYz5DcmVhdGVkIHdpdGggU2tldGNoLjwvZGVzYz48ZyBzdHJva2U9Im5vbmUiIHN0cm9rZS13aWR0aD0iMSIgZmlsbD0ibm9uZSIgZmlsbC1ydWxlPSJldmVub2RkIiBza2V0Y2g6dHlwZT0iTVNQYWdlIj48ZyBza2V0Y2g6dHlwZT0iTVNMYXllckdyb3VwIiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgyLjAwMDAwMCwgMi4wMDAwMDApIiBmaWxsPSIjMDAwMDAwIj48cGF0aCBkPSJNNzMuNzg4MzIyOCwxNiBMNDQuNTY0MDEsNDUuMjI0MzEyOCBDNDIuODQ4NDc2Miw0Ni45Mzk4NDY2IDQyLjg0NTk5MTgsNDkuNzI4MjU3IDQ0LjU2NDI5ODcsNTEuNDQ2NTYzOSBDNDYuMjc5MTA5Miw1My4xNjEzNzQ0IDQ5LjA2ODQwMjMsNTMuMTY1MDAwMSA1MC43ODY1NDk4LDUxLjQ0Njg1MjYgTDgwLDIyLjIzMzQwMjQgTDgwLDMyLjAwMzE2MTEgQzgwLDM0LjIwNTg3OTcgODEuNzkwODYxLDM2IDg0LDM2IEM4Ni4yMDQ2NDM4LDM2IDg4LDM0LjIxMDU1NDMgODgsMzIuMDAzMTYxMSBMODgsMTEuOTk2ODM4OSBDODgsMTAuODk2MDA0OSA4Ny41NTI3MTE3LDkuODk3MjIzMDcgODYuODI5NDYyNyw5LjE3MzQzNTk1IEM4Ni4xMDUxMTI1LDguNDQ4NDEwMTkgODUuMTA2MzMwMyw4IDg0LjAwMzE2MTEsOCBMNjMuOTk2ODM4OSw4IEM2MS43OTQxMjAzLDggNjAsOS43OTA4NjEgNjAsMTIgQzYwLDE0LjIwNDY0MzggNjEuNzg5NDQ1NywxNiA2My45OTY4Mzg5LDE2IEw3My43ODgzMjI4LDE2IEw3My43ODgzMjI4LDE2IFogTTg4LDU2IEw4OCwzNi45ODUxNTA3IEw4OCw3OC4wMjk2OTg2IEM4OCw4My41MzYxNDQgODQuMDMyNzg3Niw4OCA3OS4xMzI5MzY1LDg4IEwxNi44NjcwNjM1LDg4IEMxMS45Njk5MTk2LDg4IDgsODMuNTI3NDMxMiA4LDc4LjAyOTY5ODYgTDgsMTcuOTcwMzAxNCBDOCwxMi40NjM4NTYgMTEuOTY3MjEyNCw4IDE2Ljg2NzA2MzUsOCBMNTkuNTY2NDY4Miw4IEw0MCw4IEM0Mi4yMDkxMzksOCA0NCw5Ljc5MDg2MSA0NCwxMiBDNDQsMTQuMjA5MTM5IDQyLjIwOTEzOSwxNiA0MCwxNiBMMTguMjc3NzkzOSwxNiBDMTcuMDA1Mjg3MiwxNiAxNiwxNy4xOTQ3MzY3IDE2LDE4LjY2ODUxOSBMMTYsNzcuMzMxNDgxIEMxNiw3OC43Nzg2NjM2IDE3LjAxOTgwMzEsODAgMTguMjc3NzkzOSw4MCBMNzcuNzIyMjA2MSw4MCBDNzguOTk0NzEyOCw4MCA4MCw3OC44MDUyNjMzIDgwLDc3LjMzMTQ4MSBMODAsNTYgQzgwLDUzLjc5MDg2MSA4MS43OTA4NjEsNTIgODQsNTIgQzg2LjIwOTEzOSw1MiA4OCw1My43OTA4NjEgODgsNTYgTDg4LDU2IFoiIHNrZXRjaDp0eXBlPSJNU1NoYXBlR3JvdXAiLz48L2c+PC9nPjwvc3ZnPg==';

var $ = window.jQuery;

$('head').append($('<style type="text/css"></style>').html([
  '#divInfraBarraTribunal { position: fixed; top: 8px; width: 95%; z-index: 1000; }',
  '#txtNumProcessoPesquisaRapida { padding-right: 17px; }'
].join(' ')));
var pesquisaRapida = $('#txtNumProcessoPesquisaRapida');
var icone = $('<a href="#"><img tabindex="52" src="' + urlIcone + '" width="14" height="14" style="position: absolute; margin-top: 4px; margin-left: -17px;"/></a>');
icone.on('click', function(evt) {
  evt.preventDefault();
  var form = pesquisaRapida.parent('form');
  form.attr('target', '_blank');
  form.submit();
  form.attr('target', '');
  pesquisaRapida.val('');
});
pesquisaRapida.after(icone);

function onResize() {
  var alturaBarra = $('#divInfraBarraTribunal').height();
  var alturaBordaBarra = 2;
  $('#divInfraAreaGlobal').css({
    'position': 'absolute',
    'margin': '0 2.5%',
    'padding-top': (alturaBarra + alturaBordaBarra) + 'px'
  });
}

$(window).on('load', onResize);
$(window).on('resize', onResize);
