// ==UserScript==
// @name        aguardar-carregamento-formulario
// @name:pt-BR  Aguardar carregamento do formulário
// @namespace   http://nadameu.com.br
// @match       https://eproc.jfsc.jus.br/eprocV2/controlador.php?acao=relatorio_geral_listar&*
// @grant       none
// @version     1.0.0
// @author      nadameu
// @description Aguardar o carregamento completo do formulário do relatório geral antes de poder clicar em "Consultar"
// @run-at      document-start
// ==/UserScript==

let head, body, tela, localizador;

const observer = new MutationObserver(() => {
  if (! head) {
    if (! document.head) return;
    head = document.head;
    adicionarEstilos();
  }
  if (! body) {
    if (! document.body) return;
    body = document.body;
  }
  if (! tela) {
    tela = body.insertBefore(document.createElement('div'), body.firstChild);
    tela.id = 'gm-tela-ocultar-formulario';
    tela.textContent = 'Carregando formulário...'
  }
  if (! localizador) {
    const el = document.getElementById('selLocalizadorPrincipal');
    if (! el) return;
    localizador = el;
  }
  observer.disconnect();
  
  const observerLoc = new MutationObserver(() => {
    if (localizador.style.display !== 'none') return;
    
    body.removeChild(tela);
    
    observerLoc.disconnect();
  });
  observerLoc.observe(localizador, { attributes: true });
});

observer.observe(document, { childList: true, subtree: true });

function adicionarEstilos() {
  const style = head.appendChild(document.createElement('style'));
    
  style.textContent = /* css */ `
#gm-tela-ocultar-formulario {
  position: fixed;
  inset: 0;
  z-index: 1031;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #080210aa;
  font-size: 2.2rem;
  color: white;
  text-shadow: 0px 0px 3px black;
}`;
  
}
