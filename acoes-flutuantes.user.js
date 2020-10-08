// ==UserScript==
// @name        acoes-flutuantes
// @name:pt-BR  Ações flutuantes
// @namespace   http://nadameu.com.br
// @match       https://eproc.jfpr.jus.br/eprocV2/controlador.php?acao=processo_selecionar&*
// @match       https://eproc.jfrs.jus.br/eprocV2/controlador.php?acao=processo_selecionar&*
// @match       https://eproc.jfsc.jus.br/eprocV2/controlador.php?acao=processo_selecionar&*
// @match       https://eproc.trf4.jus.br/eproc2trf4/controlador.php?acao=processo_selecionar&*
// @grant       GM_addStyle
// @version     1.3.0
// @author      nadameu
// ==/UserScript==

let debounceTimer;
let debounceFn;
function debounce(fn) {
  return function () {
    if (debounceTimer) debounceFn = fn;
    else
      debounceTimer = window.setTimeout(() => {
        window.clearTimeout(debounceTimer);
        debounceTimer = undefined;
        debounceFn();
      }, 100);
  };
}

const div = $("<div id=\"divAcoesFlutuantes\"></div>")
  .insertBefore("#divMovPref");
$("#divMovPref").appendTo(div);
const placeholder = $("<div></div>").insertBefore(div);
placeholder
  .css({
    height: div.height() + "px",
  })
  .hide();

let yPosition = 0;
let current = div.get(0);
do {
  yPosition += current.offsetTop + current.clientTop;
  current = current.offsetParent;
} while (current);
let navbarHeight = $("#navbar").height();
yPosition -= navbarHeight;
let areaDadosWidth = $("#divInfraAreaDados").width();

function onscroll() {
  if (window.scrollY > yPosition) {
    placeholder.show();
    div.toggleClass('flutuante', true);
  } else {
    placeholder.hide();
    div.toggleClass('flutuante', false);
  }
}

window.addEventListener("scroll", debounce(onscroll));

onscroll();

GM_addStyle(/*css*/`
#divAcoesFlutuantes.flutuante {
  position: fixed;
  top: ${navbarHeight}px;
  width: ${areaDadosWidth}px;
  z-index: 1;
}
#divAcoesFlutuantes.flutuante fieldset {
  margin-top: -1em;
  background-color: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.25),
              0 4px 8px rgba(0, 0, 0, 0.125),
              0 0 1.2em 0.6em white;
  border-color: #ccc;
}
`);
