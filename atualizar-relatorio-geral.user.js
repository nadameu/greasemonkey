// ==UserScript==
// @name        atualizar-relatorio-geral
// @name:pt-BR  Atualizar relatório geral
// @namespace   http://nadameu.com.br
// @match       https://eproc.jfsc.jus.br/eprocV2/controlador.php?acao=relatorio_geral_consultar&*
// @grant       none
// @version     1.0.0
// @author      nadameu
// @description Cria um botão para atualizar os dados do relatório geral
// ==/UserScript==

main();

function main() {
  const barras = document.getElementsByClassName('infraBarraComandos');
  
  if (barras.length === 0) return;
  
  inserirEstilos();
  
  barras.forEach(barra => {
    barra.insertAdjacentHTML('afterbegin', '<button class="infraButton gm-atualizar-relatorio-geral">Atualizar</button>');
  });
}

function inserirEstilos() {
  const style = document.head.appendChild(document.createElement('style'));
  style.textContent = /*css*/ `
.gm-atualizar-relatorio-geral {
  --bg: hsl(266, 25%, 50%);
  --dk: hsl(266, 35%, 40%);
  --hl: hsl(266, 35%, 60%);
}
.infra-styles button.infraButton.gm-atualizar-relatorio-geral {
  background-color: var(--bg);
  background-image: none;
  background-image: linear-gradient(to bottom, var(--bg), var(--dk));
  border: 1px outset var(--bg);
  color: #fff;
}
.infra-styles button.infraButton.gm-atualizar-relatorio-geral:hover,
.infra-styles button.infraButton.gm-atualizar-relatorio-geral:focus {
  background-color: var(--hl);
  background-image: none;
  background-image: linear-gradient(to bottom, var(--bg), var(--hl));
  color: #fff;
  border: 1px inset var(--bg);
}
.infra-styles button.infraButton.gm-atualizar-relatorio-geral:active {
  border: 1px inset var(--bg);
}
`;
}