// ==UserScript==
// @name        ocultar-representantes-3798
// @name:pt-BR  Ocultar representantes 3798
// @namespace   http://nadameu.com.br
// @match       https://eproc.jfpr.jus.br/eprocV2/controlador.php?acao=processo_selecionar&*
// @match       https://eproc.jfrs.jus.br/eprocV2/controlador.php?acao=processo_selecionar&*
// @match       https://eproc.jfsc.jus.br/eprocV2/controlador.php?acao=processo_selecionar&*
// @match       https://eproc.trf4.jus.br/eproc2trf4/controlador.php?acao=processo_selecionar&*
// @grant       none
// @version     1.1.0
// @author      Paulo R. Maurici Jr.
// @description Ocultar representantes da Agência 3798 do Banco do Brasil
// ==/UserScript==

const unidadesExternas = document.querySelectorAll('.infraNomeParte[data-parte="UNIDADE EXTERNA"]');
const [agenciaBB] = Array.from(unidadesExternas).filter(el => el.textContent === 'Agência BB Agência Setor Público Porto Alegre');
if (! agenciaBB) return;

let representantes = null;
for (let node = agenciaBB.nextSibling; node !== null; node = node.nextSibling)
  if (node.textContent.match(/Representante\(s\):/))
    representantes = node;
if (!representantes) return;

const parent = representantes.parentNode;

const span = document.createElement('span');
span.style.display = 'none';
parent.insertBefore(span, representantes.nextSibling);

while (span.nextSibling)
  span.appendChild(span.nextSibling);

const button = document.createElement('button');
button.type = 'button';
button.className = 'infraButton';
button.textContent = 'Mostrar'
button.addEventListener('click', () => {
  button.remove();
  span.style.display = '';
}, { once: true });
parent.appendChild(button);
