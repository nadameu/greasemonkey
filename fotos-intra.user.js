// ==UserScript==
// @name         Fotos Intra
// @namespace    http://nadameu.com.br/fotos-intra
// @version      2.0.0
// @author       nadameu
// @description  Corrige a distorção nas fotos da Intra
// @website      http://www.nadameu.com.br/
// @include      /^https?:\/\/intra(pr|rs|sc|)2?\.trf4\.jus\.br\/membros\/.*-jus-br\/$/
// @run-at       document-end
// @grant        none
// ==/UserScript==

[...document.querySelectorAll('.photo')].forEach(foto => {
  foto.removeAttribute('width');
  foto.removeAttribute('height');
});
