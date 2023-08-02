// ==UserScript==
// @name        Pi
// @namespace   http://nadameu.com.br/pi
// @description Altera a imagem de fundo do e-Proc V2
// @include     /^https:\/\/eproc\.(jf(pr|rs|sc)|trf4)\.jus\.br\/eproc(V2|2trf4)\//
// @version     6.0.0
// @grant       none
// ==/UserScript==

(() => {
  const tamanho = 48;
  const tamanhoFonte = tamanho * 0.75;
  const texto = '\u03c0'; // PI

  const elt = document.querySelector('#divInfraAreaGlobal');
  if (!elt) return;
  const backgroundColor = window.getComputedStyle(elt).backgroundColor;
  const match = backgroundColor.match(/rgb\((\d+), (\d+), (\d+)\)/);
  if (!match) return;
  const rgb = match.slice(1);

  const foregroundColor = `rgb(${rgb.map(color => Math.round(0.95 * Number(color))).join(', ')})`;

  const backgroundAlphaColor = `rgba(${rgb.join(', ')}, 0.5)`;

  const elementos = [
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
  const url = `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="${tamanho}" height="${tamanho}"><g font-family="Times New Roman" font-size="${tamanhoFonte}" text-anchor="middle" fill="${foregroundColor}">${elementos}</g></svg>`;

  const style = document.head.appendChild(document.createElement('style'));
  style.innerHTML = /* css */ `
#divInfraAreaGlobal { background-image: url('${url}'); }
div.infraAreaTelaD, div.infraBarraComandos, div.infraAreaDados, div.infraAviso { border-color: transparent; }
div.infraAreaTelaD { background-color: ${backgroundAlphaColor}; }
table.infraTable { background-color: ${backgroundColor}; }
`;
})();
