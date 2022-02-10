// ==UserScript==
// @name        acoes-flutuantes
// @name:pt-BR  Ações flutuantes
// @namespace   http://nadameu.com.br
// @match       https://eproc.jfpr.jus.br/eprocV2/controlador.php?acao=processo_selecionar&*
// @match       https://eproc.jfrs.jus.br/eprocV2/controlador.php?acao=processo_selecionar&*
// @match       https://eproc.jfsc.jus.br/eprocV2/controlador.php?acao=processo_selecionar&*
// @match       https://eproc.trf4.jus.br/eproc2trf4/controlador.php?acao=processo_selecionar&*
// @grant       GM_addStyle
// @version     5.1.0
// @author      nadameu
// ==/UserScript==

main();

function main() {
  const backTop = document.getElementById('backTop');
  if (! backTop) return;
  const fldAcoes = document.getElementById('fldAcoes');
  if (! fldAcoes) return;
  adicionarEstilos();
  const button = document.createElement('button');
  button.id = 'gm-scroll-acoes'
  button.className = 'btn btn-light shadow-sm';
  button.textContent = 'Ações';
  button.addEventListener('click', evt => {
    evt.preventDefault();
    fldAcoes.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    });
  });
  backTop.insertAdjacentElement('afterend', button);
}

function adicionarEstilos() {
  GM_addStyle(/* css */ `
#gm-scroll-acoes {
  position: fixed;
  bottom: 75px;
  right: 5rem;
  width: 50px;
  height: 50px;
  padding: 0;
  background: #eae8ee;
  border: 1px solid #bdafcf;
  border-radius: 50px;
  color: #3c2060;
}
  `);
}
