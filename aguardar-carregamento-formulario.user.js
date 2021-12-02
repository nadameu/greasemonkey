// ==UserScript==
// @name        aguardar-carregamento-formulario
// @name:pt-BR  Aguardar carregamento do formulário
// @namespace   http://nadameu.com.br
// @match       https://eproc.jfpr.jus.br/eprocV2/controlador.php?acao=relatorio_geral_listar&*
// @match       https://eproc.jfrs.jus.br/eprocV2/controlador.php?acao=relatorio_geral_listar&*
// @match       https://eproc.jfsc.jus.br/eprocV2/controlador.php?acao=relatorio_geral_listar&*
// @match       https://eproc.trf4.jus.br/eproc2trf4/controlador.php?acao=relatorio_geral_listar&*
// @grant       none
// @version     2.0.0
// @author      nadameu
// @description Aguardar o carregamento completo do formulário do relatório geral antes de poder clicar em "Consultar"
// ==/UserScript==

main().catch(error => {
  console.error(error);
});

async function main() {
  adicionarEstilos();

  const tela = document.body.appendChild(document.createElement('div'));
  tela.id = 'gm-tela-ocultar-formulario';
  tela.textContent = 'Carregando formulário...';

  let timeout, observer;
  
  try {
    const localizador = document.getElementById('selLocalizadorPrincipal');
    if (! localizador) return;
    
    await Promise.race([
      new Promise((_,rej) => {
        timeout = window.setTimeout(rej, 3000);
      }),
      new Promise((res) => {
        observer = new MutationObserver(() => {
          if (localizador.style.display !== 'none') return;
          else res();
        });
        observer.observe(localizador, { attributes: true });
      }),
    ])
  } catch (error) {
    throw error;
  } finally {
    if (observer) observer.disconnect(); 
    if (timeout) window.clearTimeout(timeout);
    document.body.removeChild(tela);
  }
}

function adicionarEstilos() {
  const style = document.head.appendChild(document.createElement('style'));
    
  style.textContent = /* css */ `
#gm-tela-ocultar-formulario {
  position: fixed;
  inset: 0;
  z-index: 1031;
  display: flex;
  justify-content: center;
  align-items: center;
  background: hsla(266, 25%, 5%, 0.75);
  font-size: 2.2rem;
  color: white;
  text-shadow: 0px 0px 3px black;
}`;
  
}
