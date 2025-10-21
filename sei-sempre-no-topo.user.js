// ==UserScript==
// @name        sei-sempre-no-topo
// @name:pt-BR  SEI! - Sempre no topo
// @namespace   http://nadameu.com.br
// @match       https://sei.trf4.jus.br/controlador.php?acao=procedimento_visualizar&*
// @match       https://sei.trf4.jus.br/sei/controlador.php?acao=procedimento_visualizar&*
// @grant       none
// @version     1.0.0
// @author      nadameu
// @description Mantém o número do processo sempre visível no topo da árvore de documentos
// ==/UserScript==

function main() {
  const header = document.getElementById('header');
  assert(header != null, 'Erro ao obter cabeçalho da árvore.');
  const hidden = document.createElement('div');
  header.before(hidden);
  const observer = new IntersectionObserver(([entry]) => {
    header.classList.toggle('active', !entry.isIntersecting);
  });
  observer.observe(hidden);
  const style = document.createElement('style');
  style.type = 'text/css';
  style.textContent = `
#header {
  position: sticky;
  top: 0;
  background-color: var(--bs-body-bg);
  transition: box-shadow 300ms ease-in,
              height 100ms ease-in;
}
#header.active {
  height: 34px;
  box-shadow: 0 2px 4px #0004;
}
`;
  document.head.append(style);
}

try {
  main();
} catch (err) {
  console.group('<sei-sempre-no-topo>');
  console.error(err);
  console.groupEnd();
}

function assert(condition, msg) {
  if (!condition) throw new Error(msg);
}
