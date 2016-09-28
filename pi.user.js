// ==UserScript==
// @name        Pi
// @namespace   http://nadameu.com.br/pi
// @description Altera a imagem de fundo do e-Proc V2
// @include     /^https:\/\/eproc\.(jf(pr|rs|sc)|trf4)\.jus\.br\/eproc(V2|2trf4)\//
// @version     1
// @grant       none
// ==/UserScript==

var texto = 'π';
var side = 96;
var fontSize = side * 0.5;
var rotation = Math.PI / 4
var bgColor = $(document.body).css('background-color');
var [trash, r, g, b] = bgColor.match(/rgb\((\d+), (\d+), (\d+)\)/);
var bgColorAlpha = 'rgba(' + [r, g, b].join(', ') + ', 0.5)';
var ratio = 0.95;
var fgColor = 'rgb(' + [Math.round(r * ratio), Math.round(g * ratio), Math.round(b * ratio)].join(', ') + ')';

var canvas = $('<canvas width="' + side + '" height="' + side + '" style="border: 2px solid white;"></canvas>').get(0);
var context = canvas.getContext('2d');

context.rect(0, 0, side, side);
context.fillStyle = bgColor;
context.fill();

function putText(x, y, rotation) {
  context.translate(x, y);
  context.rotate(rotation);

  context.font = fontSize + 'px Times New Roman';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillStyle = fgColor;
  context.fillText(texto, 0, 0);

  context.rotate(-rotation);
  context.translate(-x, -y);
}

putText(side * 1/4, side * 1/4, -rotation);
putText(side * 3/4, side * 1/4, +rotation);
putText(side * 1/4, side * 3/4, +rotation);
putText(side * 3/4, side * 3/4, -rotation);

var dataURL = canvas.toDataURL();
var style = $('<style></style>');
style.html([
  'body { background-image: url(\'' + dataURL + '\'); }',
  'div.infraAreaTelaD, div.infraBarraComandos, div.infraAreaDados, div.infraAviso { border-color: transparent; }',
  'div.infraAreaTelaD { background-color: ' + bgColorAlpha + '; }'
].join('\n'));
$('head').append(style);
