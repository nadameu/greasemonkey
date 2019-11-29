// ==UserScript==
// @name        Rolagem automática
// @namespace   http://nadameu.com.br/autoscroll
// @description Rola automaticamente a página
// @include     http://sap.trf4.gov.br/relat_estat/estat_proc_concl_n_desp.php
// @version     2
// @grant       none
// ==/UserScript==

const fps = 60;

var Preferencias = {
  get velocidade() {
    return localStorage.getItem('velocidade') || 10;
  },
  set velocidade(val) {
    localStorage.setItem('velocidade', val);
  },
};

var posicaoAtual = 0;
var direcaoAtual = 0;
var velocidadeAtual = Preferencias.velocidade;
var pausaAtual = Preferencias.pausa;

var posicaoMaxima = 0;
var frameInterval = Math.round(1000 / fps);
var intervalo, timer;

var tps = 0;
function iniciarRolagem() {
  posicaoMaxima = posicaoAtual = window.scrollY;
  direcaoAtual = -1;
  intervalo = window.setInterval(function() {
    posicaoAtual = posicaoAtual + (direcaoAtual * velocidadeAtual) / fps;
    if (posicaoAtual >= posicaoMaxima) {
      posicaoAtual = posicaoMaxima;
      direcaoAtual = -1;
    } else if (posicaoAtual <= 0) {
      posicaoAtual = 0;
      direcaoAtual = 1;
    }
    window.scrollTo(0, Math.round(posicaoAtual));
    tps++;
  }, frameInterval);
  timer = window.setInterval(() => {
    console.log(posicaoAtual, direcaoAtual, velocidadeAtual, frameInterval, tps);
    tps = 0;
  }, 1000);
}

function pararRolagem() {
  window.clearInterval(intervalo);
  window.clearInterval(timer);
  direcaoAtual = 0;
}

var style = document.createElement('style');
style.innerHTML = [
  '@media print { #gmBotoes { display: none; } }',
  '#gmBotoes { position: fixed; top: 4px; left: 4px; background-color: #ccc; box-shadow: #444 4px 4px 8px; width: -moz-calc(19% - 8px); }',
  '#gmBotoes, #gmBotoes button { font-size: 14px; }',
  '#gmBarra { background-color: #048; }',
  '#gmTitulo { display: inline-block; color: #fff; font-weight: bold; padding: 0 4px; width: -moz-calc(100% - 31px); }',
  '#gmFechar { display: inline-block; margin-right: 1px; width: 18px; height: 18px; text-align: center; border: 2px solid #fff; background-color: #c00; color: #fff; font-weight: bold; text-decoration: none; border-radius: 4px; }',
  '#gmConteudo { text-align: center; }',
  '#gmAviso { padding: 4px; }',
  '#gmPlayPause { margin: 4px; border: 2px outset #aaa; }',
  '#gmConteudo label { display: block; margin: 4px; }',
  '#gmVelocidade, #gmPausa { width: 10ex; }',
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
  '<div id="gmAviso">',
  'Role a página até o ponto onde a rolagem automática deve parar.',
  '<br/>',
  'Depois, clique em "Iniciar/Parar".',
  '</div>',
  '<button id="gmPlayPause">Iniciar/Parar</button>',
  '<label> Velocidade: ',
  '<input id="gmVelocidade" type="number" min="1">',
  ' pixels por segundo</label>',
  '</div>',
].join('');

document.body.appendChild(botoes);
var fechar = document.getElementById('gmFechar');
var playPause = document.getElementById('gmPlayPause');
var velocidade = document.getElementById('gmVelocidade');
var pausa = document.getElementById('gmPausa');

fechar.addEventListener(
  'click',
  function(evt) {
    evt.preventDefault();
    botoes.style.display = 'none';
  },
  false
);

playPause.addEventListener(
  'click',
  function(evt) {
    if (direcaoAtual !== 0) {
      pararRolagem();
    } else {
      iniciarRolagem();
    }
  },
  false
);

velocidade.value = velocidadeAtual;
velocidade.addEventListener(
  'change',
  function(evt) {
    velocidadeAtual = Number(velocidade.value);
    Preferencias.velocidade = velocidadeAtual;
  },
  false
);
