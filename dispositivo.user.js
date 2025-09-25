// ==UserScript==
// @name         Dispositivo
// @namespace    http://nadameu.com.br/
// @version      2.0.0
// @description  Traz o foco da página para o dispositivo da sentença
// @author       nadameu
// @include      /^https:\/\/eproc\.(jf(pr|rs|sc)|trf4)\.jus\.br\/eproc(V2|2trf4)\/controlador\.php\?acao=acessar_documento&/
// @run-at       document-idle
// ==/UserScript==

const waitForElement = (selector, { ms = 100, attempts = 15 } = {}) =>
  new Promise((res, rej) => {
    const go = attempt => {
      if (attempt > attempts) return void rej();
      const el = document.querySelector(selector);
      if (el) return void res(el);
      setTimeout(go, ms, attempt + 1);
    };
    go(1);
  });

waitForElement('.titulo')
  .catch(() => Promise.reject('Título não encontrado!'))
  .then(el => el.textContent === 'SENTENÇA' || Promise.reject('Não é sentença'))
  .then(() => document.querySelector('.dispositivo'))
  .then(el => el || Promise.reject('Dispositivo não encontrado!'))
  .then(el => {
    el.scrollIntoView({ behavior: 'smooth' })
  })
  .then(() => console.log('done'))
  .catch(e => console.error(e));
