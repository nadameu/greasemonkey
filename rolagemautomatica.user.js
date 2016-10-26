// ==UserScript==
// @name        Rolagem automática
// @namespace   http://nadameu.com.br/autoscroll
// @description Rola automaticamente a página
// @include     http://sap.trf4.gov.br/relat_estat/estat_proc_concl_n_desp.php
// @version     1
// @grant       none
// ==/UserScript==

var Preferencias = {
	get velocidade() { return localStorage.getItem('velocidade') || 10; },
	set velocidade(val) { localStorage.setItem('velocidade', val); },
	get pausa() { return localStorage.getItem('pausa') || 1; },
	set pausa(val) { localStorage.setItem('pausa', val); }
};

var posicaoAtual = 0;
var rolando = false;
var velocidadeAtual = Preferencias.velocidade;
var pausaAtual = Preferencias.pausa;

var posicaoMaxima = window.scrollMaxY;
var intervalo, timer;

function iniciarRolagem() {
	posicaoAtual = 0;
	posicaoMaxima = window.scrollMaxY;
	intervalo = window.setInterval(function() {
		posicaoAtual = posicaoAtual + velocidadeAtual / 100;
		if (posicaoAtual > posicaoMaxima) {
			pararRolagem();
			timer = window.setTimeout(function() {
				window.clearTimeout(timer);
				posicaoAtual = 0;
				iniciarRolagem();
			}, pausaAtual * 1000);
		}
		window.scrollTo(0, Math.floor(posicaoAtual));
	}, 1);
	rolando = true;
}

function pararRolagem() {
	window.clearInterval(intervalo);
	rolando = false;
}

var style = document.createElement('style');
style.innerHTML = [
	'@media print { #gmBotoes { display: none; } }',
	'#gmBotoes { position: fixed; top: 4px; left: 4px; background-color: #ccc; box-shadow: #444 4px 4px 8px; }',
	'#gmBotoes, #gmBotoes button { font-size: 14px; }',
	'#gmBarra { background-color: #048; }',
	'#gmTitulo { display: inline-block; color: #fff; font-weight: bold; padding: 0 4px; }',
	'#gmFechar { display: inline-block; margin-left: 50px; margin-right: 1px; width: 18px; height: 18px; text-align: center; border: 2px solid #fff; background-color: #c00; color: #fff; font-weight: bold; text-decoration: none; border-radius: 4px; }',
	'#gmConteudo { text-align: center; }',
	'#gmPlayPause { margin: 4px; border: 2px outset #aaa; }',
	'#gmConteudo label { display: block; margin: 4px; }',
	'#gmVelocidade, #gmPausa { width: 10ex; }'
].join('\n');
document.getElementsByTagName('head')[0].appendChild(style);

var botoes = document.createElement('div');
botoes.id = 'gmBotoes';
botoes.innerHTML = [
	'<div id="gmBarra">',
	'<span id="gmTitulo">Rolagem automática</span>',
	'<a id="gmFechar" href="#">X</a>',
	'</div>',
	'<div id="gmConteudo">',
	'<button id="gmPlayPause">Iniciar/Parar</button>',
	'<label> Velocidade: ',
	'<input id="gmVelocidade" type="number" min="1">',
	'</label>',
	'<label> Pausa: ',
	'<input id="gmPausa" type="number" min="0">',
	'</label>',
	'</div>'
].join('');

document.body.appendChild(botoes);
var fechar = document.getElementById('gmFechar');
var playPause = document.getElementById('gmPlayPause');
var velocidade = document.getElementById('gmVelocidade');
var pausa = document.getElementById('gmPausa');

fechar.addEventListener('click', function(evt) {
	evt.preventDefault();
	botoes.style.display = 'none';
}, false);

playPause.addEventListener('click', function(evt) {
	if (rolando) {
		pararRolagem();
	} else {
		iniciarRolagem();
	}
}, false);

velocidade.value = velocidadeAtual;
velocidade.addEventListener('change', function(evt) {
	velocidadeAtual = Number(velocidade.value);
	Preferencias.velocidade = velocidadeAtual;
}, false);

pausa.value = pausaAtual;
pausa.addEventListener('change', function(evt) {
	pausaAtual = Number(pausa.value);
	Preferencias.pausa = pausaAtual;
}, false);

iniciarRolagem();
