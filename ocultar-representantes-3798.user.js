// ==UserScript==
// @name        ocultar-representantes-3798
// @name:pt-BR  Ocultar representantes 3798
// @namespace   http://nadameu.com.br
// @match       https://eproc.jfpr.jus.br/eprocV2/controlador.php?acao=processo_selecionar&*
// @match       https://eproc.jfrs.jus.br/eprocV2/controlador.php?acao=processo_selecionar&*
// @match       https://eproc.jfsc.jus.br/eprocV2/controlador.php?acao=processo_selecionar&*
// @match       https://eproc.trf4.jus.br/eproc2trf4/controlador.php?acao=processo_selecionar&*
// @grant       none
// @version     2.0.0
// @author      Paulo R. Maurici Jr.
// @description Ocultar representantes da Agência 3798 do Banco do Brasil
// ==/UserScript==

document
  .querySelectorAll('[id="exibirPartes"]')
  .forEach(img => {
    const partes = img.parentNode.getElementsByClassName('ocultarPartes');
    img.addEventListener('click', update);
    update();
  
    function update() {
      const match = img.src.match(/\/ver_(tudo|resumo).gif$/);
      if (! match) return;
      const exibir = match[1] === 'resumo';
      partes.forEach(parte => {
        parte.style.display = exibir ? null : 'none';
      });
    }
  });
