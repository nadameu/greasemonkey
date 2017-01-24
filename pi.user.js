// ==UserScript==
// @name        Pi
// @namespace   http://nadameu.com.br/pi
// @description Altera a imagem de fundo do e-Proc V2
// @include     /^https:\/\/eproc\.(jf(pr|rs|sc)|trf4)\.jus\.br\/eproc(V2|2trf4)\//
// @version     4
// @grant       none
// ==/UserScript==

const texto = 'π';
const side = 48;
const fontSize = side * 0.75;
const rotation = Math.PI / 4
const bgColor = $(document.body).css('background-color');
const [, r, g, b] = bgColor.match(/rgb\((\d+), (\d+), (\d+)\)/);
const components = [r,g,b];
const bgColorAlpha = 'rgba(' + components.join(', ') + ', 0.5)';
const ratio = 0.95;
const fgColor = 'rgb(' + components.map(color => Math.round(color * ratio)).join(', ') + ')';

const canvas = $(`<canvas width="${side}" height="${side}"></canvas>`).get(0);
const context = canvas.getContext('2d');

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

putText(side * 2/4, side * 0/4, -rotation);
putText(side * 0/4, side * 2/4, +rotation);
putText(side * 4/4, side * 2/4, +rotation);
putText(side * 2/4, side * 4/4, -rotation);

const dataURL = canvas.toDataURL();
const style = $('<style></style>').html([
  `body { background-image: url('${dataURL}'); }`,
  'div.infraAreaTelaD, div.infraBarraComandos, div.infraAreaDados, div.infraAviso { border-color: transparent; }',
  `div.infraAreaTelaD { background-color: ${bgColorAlpha}; }`
].join('\n'));
$('head').append(style);
