// ==UserScript==
// @name        Pi
// @namespace   http://nadameu.com.br/pi
// @description Altera a imagem de fundo do e-Proc V2
// @include     /^https:\/\/eproc\.(jf(pr|rs|sc)|trf4)\.jus\.br\/eproc(V2|2trf4)\//
// @version     5
// @grant       none
// ==/UserScript==

var tamanho = 48;
var tamanhoFonte = tamanho * 0.75;
var texto = '\u03c0'; // PI

var rgb = getComputedStyle(document.body)
  .backgroundColor.match(/rgb\((\d+), (\d+), (\d+)\)/)
  .slice(1);

var foregroundColor = ['rgb(', rgb.map(color => Math.round(0.95 * color)).join(', '), ')'].join('');

var backgroundAlphaColor = ['rgba(', rgb.join(', '), ', 0.5)'].join('');

var elementos = [
  [0.5, 0, -1],
  [1, 0.5, 1],
  [0.5, 1, -1],
  [0, 0.5, 1],
]
  .map(([x, y, r]) => [tamanho * x, tamanho * y, 45 * r])
  .map(
    ([x, y, rotation]) =>
      `<text dominant-baseline="middle" x="${x}" y="${y}" transform="rotate(${rotation}, ${x}, ${y})">${texto}</text>`
  )
  .join('');
var url = [
  `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="${tamanho}" height="${tamanho}"><g font-family="Times New Roman" font-size="${tamanhoFonte}" text-anchor="middle" fill="${foregroundColor}">`,
  elementos,
  '</g></svg>',
].join('');

var style = document.createElement('style');
style.innerHTML = [
  `body { background-image: url('${url}'); }`,
  'div.infraAreaTelaD, div.infraBarraComandos, div.infraAreaDados, div.infraAviso { border-color: transparent; }',
  `div.infraAreaTelaD { background-color: ${backgroundAlphaColor}; }`,
].join('\n');
document.querySelector('head').appendChild(style);
