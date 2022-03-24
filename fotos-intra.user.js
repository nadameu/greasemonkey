// ==UserScript==
// @name         Fotos Intra
// @namespace    http://nadameu.com.br/fotos-intra
// @version      3.0.0
// @author       nadameu
// @description  Corrige a distorção nas fotos da Intra
// @website      http://www.nadameu.com.br/
// @include      /^https?:\/\/intra(pr|rs|sc|)2?\.trf4\.jus\.br\/membros\/.*-jus-br\/$/
// @include      /^https?:\/\/intra(pr|rs|sc|)2?\.trf4\.jus\.br\/$/
// @run-at       document-end
// @grant        none
// ==/UserScript==

if (document.location.pathname === '/') {
  const coluna = document.querySelector('.coluna-direita');
  if (!coluna) return;
  const titulo = coluna.querySelector(':scope > .widgettitle:first-child');
  if (!titulo) return;
  if (!/^Aniversariantes/.test(titulo.textContent)) return;
  const div = titulo.insertAdjacentElement('afterend', document.createElement('div'));
  div.className = 'gm-aniversariantes'
  const aniversariantes = coluna.querySelectorAll('a[href^="/membros/"]');
  aniversariantes.forEach(aniv => {
    div.appendChild(aniv);
  });
  document.querySelectorAll('.avatar').forEach(foto => {
    foto.removeAttribute('width');
    foto.removeAttribute('height');
  });
  const style = document.head.appendChild(document.createElement('style'));
  style.textContent = `
.gm-aniversariantes {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: space-between;
}
.avatar {
  height: 50px;
  margin: 1px;
  border: 1px solid #aaa;
}
.avatar[src*="mystery-man"] {
  aspect-ratio: 2/3;
  object-fit: cover;
}
  `;
} else {
  document.querySelectorAll('.photo').forEach(foto => {
    foto.removeAttribute('width');
    foto.removeAttribute('height');
  });
}
