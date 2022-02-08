// ==UserScript==
// @name        acoes-flutuantes
// @name:pt-BR  Ações flutuantes
// @namespace   http://nadameu.com.br
// @match       https://eproc.jfpr.jus.br/eprocV2/controlador.php?acao=processo_selecionar&*
// @match       https://eproc.jfrs.jus.br/eprocV2/controlador.php?acao=processo_selecionar&*
// @match       https://eproc.jfsc.jus.br/eprocV2/controlador.php?acao=processo_selecionar&*
// @match       https://eproc.trf4.jus.br/eproc2trf4/controlador.php?acao=processo_selecionar&*
// @grant       GM_addStyle
// @version     5.0.0
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
  bottom: 1rem;
  right: 9rem;
  width: 50px;
  height: 50px;
  padding: 0;
  border: 1px solid #6c757d57;
  border-radius: 50px;
  color: #6c757d;
}
  `);
}
