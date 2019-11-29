// ==UserScript==
// @name        Achei
// @namespace   http://nadameu.com.br/achei
// @description Link para informações da Intra na página do Achei!
// @include     http://centralrh.trf4.gov.br/achei/pesquisar.php?acao=pesquisar*
// @include     http://serh.trf4.jus.br/achei/pesquisar.php?acao=pesquisar*
// @version     13
// @grant       none
// ==/UserScript==

const reSigla = /^Sigla:\s*(\S+)\s*$/;
const reTable = /^table$/i;
const formularioPromise = Promise.resolve(
  document.querySelector('form[name="formulario"]') ||
    Promise.reject('Formul\u00e1rio n\u00e3o encontrado!')
);
const dominioPromise = Promise.resolve(
  document.querySelector('[name="local"]:checked') ||
    Promise.reject('N\u00e3o foi selecionado local!')
)
  .then(inputLocal =>
    Promise.resolve(
      inputLocal.nextSibling || Promise.reject('Local selecionado n\u00e3o possui texto!')
    )
  )
  .then(node => node.textContent.trim().toLowerCase());
const template = document.createElement('template');
template.innerHTML = ' [ <a href="" target="_blank">Abrir na Intra</a> ]';
const content = template.content;
const link = content.querySelector('a');
const makeReducer = dominio => (soma, node) => {
  if (reSigla.test(node.textContent)) {
    link.href =
      'https://intra.trf4.jus.br/membros/' +
      node.textContent.match(reSigla)[1].toLowerCase() +
      dominio +
      '-jus-br';
    const fragment = document.importNode(content, true);
    node.parentNode.insertBefore(fragment, node.nextSibling);
    return soma + 1;
  }
  return soma;
};
Promise.all([dominioPromise, formularioPromise])
  .then(pair => {
    const reducer = makeReducer(pair[0]);
    let qtd = 0;
    for (let node = pair[1].nextSibling; node !== null; node = node.nextSibling) {
      qtd = ('tagName' in node && reTable.test(node.tagName)
        ? Array.from(node.querySelector('td:nth-child(2)').childNodes)
        : [node]
      ).reduce(reducer, qtd);
    }
    const s = qtd > 1 ? 's' : '';
    return qtd + ' ' + ('link' + s) + ' ' + ('criado' + s);
  })
  .then(
    x => {
      console.log('Resultado:', x);
    },
    e => {
      console.error('Erro:', e);
    }
  );
