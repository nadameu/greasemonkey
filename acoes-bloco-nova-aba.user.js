// ==UserScript==
// @name        acoes-bloco-nova-aba
// @name:pt-BR  Ações em bloco em nova aba
// @namespace   https://nadameu.com.br
// @match       https://eproc.jfpr.jus.br/eprocV2/controlador.php?acao=localizador_processos_lista&*
// @match       https://eproc.jfrs.jus.br/eprocV2/controlador.php?acao=localizador_processos_lista&*
// @match       https://eproc.jfsc.jus.br/eprocV2/controlador.php?acao=localizador_processos_lista&*
// @match       https://eproc.trf4.jus.br/eproc2trf4/controlador.php?acao=localizador_processos_lista&*
// @grant       none
// @version     1.0.0
// @author      Paulo R. Maurici Jr.
// @description Permite que ações em bloco sejam abertas em nova aba, na tela de processos por localizador.
// ==/UserScript==

const frmAcao = document.querySelector('#frmAcao');
if (! frmAcao) return;

const oldTarget = frmAcao.target;

const fieldsets = document.querySelectorAll('[id="fldAcoes"]');

fieldsets.forEach(fieldset => {
  fieldset.addEventListener('click', (evt) => {
    const { target } = evt;
    if (typeof target.matches !== 'function') return;
    if (! target.matches('a.infraButton')) return;

    const [, tipoAcao] = target.href.match(/^javascript:validarAcao\('([^']+)'\);void\(0\);$/) || [];
    if (! tipoAcao) return;
    
    evt.preventDefault();

    frmAcao.target = '_blank';
    validarAcao(tipoAcao);
    window.setTimeout(() => {
      frmAcao.target = oldTarget;
    }, 0);
  });
});
