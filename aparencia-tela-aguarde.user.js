// ==UserScript==
// @name        aparencia-tela-aguarde
// @name:pt-BR  Aparência da tela "Aguarde..."
// @namespace   http://nadameu.com.br
// @match       https://eproc.jfpr.jus.br/eprocV2/controlador.php
// @match       https://eproc.jfrs.jus.br/eprocV2/controlador.php
// @match       https://eproc.jfsc.jus.br/eprocV2/controlador.php
// @match       https://eproc.trf4.jus.br/eproc2trf4/controlador.php
// @grant       none
// @version     1.0.0
// @author      nadameu
// @description Muda a aparência da tela "Aguarde..."
// ==/UserScript==

main();

function main() {
  adicionarEstilos();

  const template = document.createElement('template');
  template.innerHTML = /*html*/ `<div id="divInfraAvisoFundo" class="infraFundoTransparente">
  <div id="divInfraAviso" class="infraAviso">
    <svg class="spinner" viewBox="0 0 32 32"><circle class="path" cx="16" cy="16" r="12" fill="none" stroke-width="4"></circle></svg>
    <span id="spnInfraAviso">Processando...</span>
    <button type="button" id="btnInfraAvisoCancelar" class="infraButton" onclick="infraAvisoCancelar();" style="font-size:1em;">Cancelar</button>
    <img id="imgInfraAviso" src="" hidden />
  </div>
</div>`;

  unsafeWindow.infraAviso = function (botaoCancelar = true, texto = 'Processando...') {
    const fundoAntigo = document.getElementById('divInfraAvisoFundo');
    if (!fundoAntigo) {
      document.body.appendChild(template.content.cloneNode(true));
    } else {
      fundoAntigo.replaceWith(template.content.cloneNode(true));
    }
    const fundo = document.getElementById('divInfraAvisoFundo');
    const span = document.getElementById('spnInfraAviso');
    span.innerHTML = texto;
    const botao = document.getElementById('btnInfraAvisoCancelar');
    botao.style.display = botaoCancelar ? '' : 'none';
    return fundo;
  }
}

function adicionarEstilos() {
  const style = document.head.appendChild(document.createElement('style'));
  style.textContent = /*css*/ `
body > div.infraFundoTransparente {
  --bg: hsla(266, 25%, 5%, 0.75);
  --aviso: #dfdfdf;
  --spinner: hsl(266, 20%, 40%);
  background: var(--bg);
  inset: 0 !important;
  width: inherit !important;
  height: inherit !important;
  display: flex;
  justify-content: center;
  align-items: center;
}
#divInfraAviso {
  inset: auto !important;
  padding: 1em;
  border: 1px outset var(--aviso);
  border-radius: 2px;
  display: grid;
  grid-template: "spinner text ." 48px "spinner button ." auto / 48px auto 48px;
  justify-items: center;
  align-items: center;
  box-shadow: 0 4px 4px 2px rgba(0, 0, 0, 0.25);
}
#spnInfraAviso {
  grid-area: text;
  padding: 1em 0;
  text-align: center;
}
#btnInfraAvisoCancelar {
  grid-area: button;
}
svg.spinner {
  grid-area: spinner;
  animation: rotate 2s linear infinite;
  width: 32px;
  height: 32px;
}
svg.spinner .path {
  stroke: var(--spinner);
  stroke-linecap: round;
  animation: dash 1.5s ease-in-out infinite;
}

@keyframes rotate {
  100% {
    transform: rotate(360deg);
  }
}

@keyframes dash {
  0% {
    stroke-dasharray: 1, 150;
    stroke-dashoffset: 0;
  }
  50% {
    stroke-dasharray: 90, 150;
    stroke-dashoffset: -35;
  }
  100% {
    stroke-dasharray: 90, 150;
    stroke-dashoffset: -124;
  }
}
`;
}