// ==UserScript==
// @name        ocultar-representantes-3798
// @name:pt-BR  Ocultar representantes 3798
// @namespace   http://nadameu.com.br
// @grant       none
// @version     4.0.0
// @author      Paulo R. Maurici Jr.
// @match       https://eproc.jfpr.jus.br/eprocV2/controlador.php?acao=processo_selecionar&*
// @match       https://eproc.jfrs.jus.br/eprocV2/controlador.php?acao=processo_selecionar&*
// @match       https://eproc.jfsc.jus.br/eprocV2/controlador.php?acao=processo_selecionar&*
// @match       https://eproc.trf4.jus.br/eproc2trf4/controlador.php?acao=processo_selecionar&*
// @description Ocultar representantes da Agência 3798 do Banco do Brasil
// @run-at      document-body
// ==/UserScript==

main();

function main() {
  const removerPreOcultacao = preOcultar();
  window.addEventListener('load', () => {
    removerPreOcultacao();
    const infos = buscarElementos();
    if (! infos) return;
    for (const info of infos) {
      criarIcone(info);
    }
  });
}

function preOcultar() {
  const style = document.createElement('style');
  style.textContent = '.ocultarPartes { display: none; }';
  document.head.appendChild(style);
  return () => document.head.removeChild(style);
}

function buscarElementos() {
  const ocultarPartes = document.querySelectorAll('.ocultarPartes');
  if (ocultarPartes.length === 0) return;
  const celulas = Array.prototype.map.call(ocultarPartes, x => x.closest('td'));
  if (celulas.some(x => x === null)) return;
  const icones = celulas.map(x => x.querySelector('img[src$="infra_css/imagens/ver_tudo.gif"], img[src$="infra_css/imagens/ver_resumo.gif"]'))
  if (! icones.every(x => x === null)) return;
  return celulas.map((celula, indice) => ({ celula, span: ocultarPartes[indice] }));
}

function criarIcone({ celula, span }) {
  let mostrar = false;
  const icone = document.createElement('img');
  icone.addEventListener('click', () => {
    mostrar = ! mostrar;
    atualizar();
  });
  atualizar();
  celula.insertBefore(icone, celula.firstElementChild);

  function atualizar() {
    if (mostrar) {
      icone.src = 'infra_css/imagens/ver_resumo.gif';
      span.style.display = null;
    } else {
      icone.src = 'infra_css/imagens/ver_tudo.gif';
      span.style.display = 'none';
    }
  }
}
