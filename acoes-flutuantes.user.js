// ==UserScript==
// @name        acoes-flutuantes
// @name:pt-BR  Ações flutuantes
// @namespace   http://nadameu.com.br
// @match       https://eproc.jfpr.jus.br/eprocV2/controlador.php?acao=processo_selecionar&*
// @match       https://eproc.jfrs.jus.br/eprocV2/controlador.php?acao=processo_selecionar&*
// @match       https://eproc.jfsc.jus.br/eprocV2/controlador.php?acao=processo_selecionar&*
// @match       https://eproc.trf4.jus.br/eproc2trf4/controlador.php?acao=processo_selecionar&*
// @grant       GM_addStyle
// @version     1.3.1
// @author      nadameu
// ==/UserScript==

let debounceTimer;
let debounceFn;
function debounce(fn) {
  return function () {
    debounceFn = fn;
    if (!debounceTimer)
      debounceTimer = window.setTimeout(() => {
        window.clearTimeout(debounceTimer);
        debounceTimer = undefined;
        debounceFn();
      }, 100);
  };
}

const div = $('<div id="divAcoesFlutuantes"></div>').insertBefore('#fldAcoes');
$('#fldAcoes').appendTo(div);
$('#divMovPref').appendTo(div);
const placeholder = $('<div></div>').insertBefore(div);
placeholder
  .css({
    height: `${div.height()}px`,
  })
  .hide();

let yPosition = 0;
let current = div.get(0);
do {
  yPosition += current.offsetTop + current.clientTop;
  current = current.offsetParent;
} while (current);
let navbarHeight = $('#navbar').height();
yPosition -= navbarHeight;
let areaDadosWidth = $('#divInfraAreaDados').width();

function onscroll() {
  if (window.scrollY > yPosition) {
    placeholder.show();
    div.toggleClass('flutuante', true);
  } else {
    placeholder.hide();
    div.toggleClass('flutuante', false);
  }
}

window.addEventListener('scroll', debounce(onscroll));

onscroll();

$('#lblDemaisAcoes, #lblDemaisAcoesPref').css({ display: 'block' });

GM_addStyle(/*css*/ `
.infra-styles #fldAcoes a.infraButton {
  line-height: 18px;
  height: 18px;
}

.infra-styles #divMovPref a.infraButton {
  line-height: 16px;
  height: 16px;
}

#divAcoesFlutuantes.flutuante {
  position: fixed;
  top: ${navbarHeight}px;
  width: ${areaDadosWidth}px;
  z-index: 1;
  background-color: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.25),
              0 4px 8px rgba(0, 0, 0, 0.125),
              0 0 1.2em 0.6em white;
  border-color: #ccc;
}

#divAcoesFlutuantes.flutuante fieldset {
  border-width: 1px 0 0;
  padding-top: 0;
  padding-bottom: 0;
}

#divAcoesFlutuantes.flutuante > #divMovPref > br:first-child {
  display: none;
}

#lblDemaisAcoes, #lblDemaisAcoesPref {
  margin-bottom: -0.5em;
}

#lblOcultarAcoes, #lblOcultarAcoesPref {
  display: block;
}
`);
