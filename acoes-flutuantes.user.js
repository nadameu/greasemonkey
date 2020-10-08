// ==UserScript==
// @name        acoes-flutuantes
// @name:pt-BR  Ações flutuantes
// @namespace   http://nadameu.com.br
// @match       https://eproc.jfpr.jus.br/eprocV2/controlador.php?acao=processo_selecionar&*
// @match       https://eproc.jfrs.jus.br/eprocV2/controlador.php?acao=processo_selecionar&*
// @match       https://eproc.jfsc.jus.br/eprocV2/controlador.php?acao=processo_selecionar&*
// @match       https://eproc.trf4.jus.br/eproc2trf4/controlador.php?acao=processo_selecionar&*
// @grant       none
// @version     1.0
// @author      nadameu
// ==/UserScript==

let debounceTimer;
let debounceFn;
function debounce(fn) {
  return function() {
    if (debounceTimer) debounceFn = fn;
    else debounceTimer = window.setTimeout(() => {
      window.clearTimeout(debounceTimer);
      debounceTimer = undefined;
      debounceFn();
    }, 100);
  }
}

const div = $('<div></div>').css({'background-color': 'white', 'z-index': '1'}).insertBefore('#divMovPref');
$('#divMovPref').appendTo(div);
const placeholder = $('<div></div>').insertBefore(div);
placeholder.css({ height: div.height() + 'px' }).hide();

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
    div.css({position: 'fixed', top: navbarHeight + 'px', width: areaDadosWidth + 'px' });
  } else {
    placeholder.hide();
    div.css({position: 'relative', top: '', width: '' });
  }
}

window.addEventListener('scroll', debounce(onscroll));

onscroll();
