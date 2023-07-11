// ==UserScript==
// @name        acelerar-relatorio-geral
// @name:pt-BR  Acelerar relatório geral
// @namespace   http://nadameu.com.br
// @match       https://eproc.jfsc.jus.br/eprocV2/controlador.php?acao=relatorio_geral_listar&*
// @grant       none
// @version     1.0.0
// @author      nadameu
// @description Exclui alguns campos do relatório geral para acelerar seu carregamento
// @run-at      document-body
// ==/UserScript==

async function main() {
  const campos = ['Cid', 'Medicamento', 'Produto', 'Procedimento'];
  const ids = campos.map(nome => `valueOptions${nome}`);

  let tries = 30 /* segundos */ * 60; /* FPS */
  await new Promise(res => {
    function loop() {
      if (ids.some(id => document.getElementById(id) === null) && tries-- > 0)
        window.requestAnimationFrame(loop);
      else res();
    }
    loop();
  });

  campos.forEach(nome => {
    const id = `valueOptions${nome}`;
    console.log('Esvaziando', id);
    const elt = document.getElementById(id);
    elt.value = '';
  });
}

main().catch(err => {
  console.error(err);
});
