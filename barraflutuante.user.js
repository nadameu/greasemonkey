// ==UserScript==
// @name        Barra flutuante
// @namespace   http://nadameu.com.br/barraflutuante
// @include     https://eproc.jfpr.jus.br/eprocV2/*
// @include     https://eproc.jfsc.jus.br/eprocV2/*
// @include     https://eproc.jfrs.jus.br/eprocV2/*
// @include     https://eproc.trf4.jus.br/eproc2trf4/*
// @version     10
// @grant       none
// ==/UserScript==

'use strict';

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="M75.8 18L46.6 47.2c-1.8 1.7-1.8 4.5 0 6.2 1.7 1.8 4.5 1.8 6.2 0L82 24.2V34c0 2.2 1.8 4 4 4s4-1.8 4-4V14c0-1-.4-2-1.2-2.8C88 10.4 87 10 86 10H66c-2.2 0-4 1.8-4 4s1.8 4 4 4h9.8zM90 58V39v41c0 5.5-4 10-9 10H19c-5 0-9-4.5-9-10V20c0-5.5 4-10 9-10h42.6H42c2.2 0 4 1.8 4 4s-1.8 4-4 4H20.3C19 18 18 19.2 18 20.7v58.6c0 1.5 1 2.7 2.3 2.7h59.4c1.3 0 2.3-1.2 2.3-2.7V58c0-2.2 1.8-4 4-4s4 1.8 4 4z" fill-rule="evenodd"/></svg>`;
const urlIcone = 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);

const $ = window.jQuery;

const style = $('<style></style>');
style.html([
	'#divInfraBarraTribunal { position: fixed; width: 95%; z-index: 1000; }',
	'#txtNumProcessoPesquisaRapida,',
	'#txtNumProcessoPesquisaRapida[placeholder] { padding-right: 20px; }',
	'#gmAbrirPesquisaNovaJanela { margin-left: -17px; }'
].join('\n'));
$('head').append(style);

const barra = $('#divInfraBarraTribunal');

const placeholder = $('<div></div>');
barra.after(placeholder);

const pesquisaRapida = $('#txtNumProcessoPesquisaRapida');

const form = pesquisaRapida.parent('form');

const icone = $(`<a id="gmAbrirPesquisaNovaJanela" href="#"><img tabindex="52" src="${urlIcone}" width="14" height="14" title="Abrir pesquisa em nova janela" alt="Abrir pesquisa em nova janela"/></a>`);
icone.on('click', evt => {
	evt.preventDefault();
	evt.stopPropagation();
	form.attr('target', '_blank');
	form.submit();
	form.attr('target', '');
	pesquisaRapida.val('');
});
pesquisaRapida.after(icone);

function onResize() {
	placeholder.css({
		'width': `${barra.width()}px`,
		'height': `${barra.height()}px`
	});
}

$(window).on('load', onResize);
$(window).on('resize', onResize);
