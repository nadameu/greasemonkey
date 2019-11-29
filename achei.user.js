// ==UserScript==
// @name        Achei
// @namespace   http://nadameu.com.br/achei
// @description Link para informações da Intra na página do Achei!
// @include     http://centralrh.trf4.gov.br/achei/pesquisar.php?acao=pesquisar*
// @include     http://serh.trf4.jus.br/achei/pesquisar.php?acao=pesquisar*
// @version     14.0.0
// @grant       none
// ==/UserScript==

const reSigla = /^Sigla:\s*(\S+)\s*$/;
const reTable = /^table$/i;
const ifNull = (val, msg) => (val == null ? Promise.reject(msg) : Promise.resolve(val));
const query = (selector, msg) => ifNull(document.querySelector(selector), msg);
const formularioPromise = query('form[name="formulario"]', 'Formulário não encontrado!');
const dominioPromise = query('[name="local"]:checked', 'Não foi selecionado local!')
  .then(inputLocal => ifNull(inputLocal.nextSibling, 'Local selecionado não possui texto!'))
  .then(node => node.textContent.trim().toLowerCase());
const template = document.createElement('template');
template.innerHTML = ' [ <a href="" target="_blank">Abrir na Intra</a> ]';
const content = template.content;
const link = content.querySelector('a');
const inserirNodeSeTiverSigla = dominio => node => {
  const match = node.textContent.match(reSigla);

  if (match === null) return false;

  link.href = `https://intra.trf4.jus.br/membros/${match[1].toLowerCase()}${dominio}-jus-br`;
  const fragment = document.importNode(content, true);
  node.parentNode.insertBefore(fragment, node.nextSibling);
  return true;
};
const siblings = function*(node) {
  for (let current = node.nextSibling; current !== null; current = current.nextSibling)
    yield current;
};
Promise.all([dominioPromise, formularioPromise])
  .then(([dominio, formulario]) => {
    const mapper = inserirNodeSeTiverSigla(dominio);
    const qtd = Array.from(siblings(formulario))
      .flatMap(node => {
        if (node instanceof HTMLTableElement)
          return Array.from(node.querySelector('td:nth-child(2)').childNodes);
        return [node];
      })
      .map(mapper)
      .filter(resultado => resultado === true).length;
    const s = qtd > 1 ? 's' : '';
    return `${qtd} link${s} criado${s}`;
  })
  .then(
    x => {
      console.log('Resultado:', x);
    },
    e => {
      console.error('Erro:', e);
    }
  );
