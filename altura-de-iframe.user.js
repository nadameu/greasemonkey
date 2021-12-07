// ==UserScript==
// @name        altura-de-iframe
// @name:pt-BR  Altura do iframe
// @namespace   http://nadameu.com.br
// @match       https://eproc.jfsc.jus.br/eprocV2/controlador.php
// @grant       none
// @version     2.0.0
// @author      nadameu
// @description Limita a altura do iframe para que não ultrapasse o espaço disponível na tela
// ==/UserScript==

if (window.exibirSubFrm) {
  const funcaoOriginal = window.exibirSubFrm;
  window.exibirSubFrm = function exibirSubFrmCabivel() {
    const valorRetornado = funcaoOriginal.apply(this, arguments);
    const iframe = document.getElementById('ifrSubFrm');
    if (iframe) {
      iframe.style.position = 'fixed';
      iframe.style.top = '6px';
      iframe.style.border = '2px inset #aaa';
      iframe.style.boxShadow = '0 8px 16px #000c';
      iframe.style.height = 'calc(100% - 16px)';
    }
    return valorRetornado;
  };
}
