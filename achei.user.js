// ==UserScript==
// @name        Achei
// @namespace   http://nadameu.com.br/achei
// @description Link para informações da Intra na página do Achei!
// @include     http://centralrh.trf4.gov.br/achei/pesquisar.php?acao=pesquisar
// @include     http://centralrh.trf4.gov.br/achei/pesquisar.php?acao=pesquisar&*
// @include     https://centralrh.trf4.gov.br/achei/pesquisar.php?acao=pesquisar
// @include     https://centralrh.trf4.gov.br/achei/pesquisar.php?acao=pesquisar&*
// @include     http://serh.trf4.jus.br/achei/pesquisar.php?acao=pesquisar
// @include     http://serh.trf4.jus.br/achei/pesquisar.php?acao=pesquisar&*
// @include     https://serh.trf4.jus.br/achei/pesquisar.php?acao=pesquisar
// @include     https://serh.trf4.jus.br/achei/pesquisar.php?acao=pesquisar&*
// @version     15.1.0
// @grant       none
// ==/UserScript==

function Just(value) {
  return {
    isJust: true,
    isNothing: false,
    value,
    *[Symbol.iterator]() {
      yield value;
    },
    chain: f => f(value),
    map: f => Just(f(value)),
    safeMap: f => fromNullish(f(value)),
    then(f, _) {
      return f(value);
    },
  };
}
const returnNothing = () => Nothing;
const Nothing = {
  isJust: false,
  isNothing: true,
  *[Symbol.iterator]() {},
  chain: returnNothing,
  map: returnNothing,
  safeMap: returnNothing,
  then(_, f) {
    return f();
  },
};
function all(...maybes) {
  const results = [];
  for (const maybe of maybes) {
    if (maybe.isNothing) return Nothing;
    results.push(maybe.value);
  }
  return Just(results);
}
function fromNullish(value) {
  if (value == null) return Nothing;
  return Just(value);
}

async function main(doc) {
  const [dominio, nodeInfo] = await all(getDominio(doc), getFormulario(doc).map(getNodeInfo));
  criarLinks(doc, dominio, nodeInfo);
  const qtd = nodeInfo.length;
  const s = qtd > 1 ? 's' : '';
  console.log(`${qtd} link${s} criado${s}`);
}
const dominios = {
  1: 'trf4',
  2: 'jfrs',
  3: 'jfsc',
  4: 'jfpr',
};
const getDominio = doc =>
  Just(doc)
    .safeMap(x => x.querySelector('input[name="local"]:checked'))
    .map(x => x.value)
    .safeMap(x => (x in dominios ? dominios[x] : null));
const getFormulario = doc => Just(doc).safeMap(x => x.querySelector('form[name="formulario"]'));
const getNodeInfo = formulario => Array.from(parseFormulario(formulario));
function* parseFormulario(formulario) {
  for (const sibling of siblings(formulario))
    for (const node of flattenTabela(sibling)) yield* getNodeSigla(node);
}
function* siblings(node) {
  for (let s = node.nextSibling; s !== null; s = s.nextSibling) yield s;
}
function* flattenTabela(node) {
  if (node instanceof HTMLTableElement) {
    const celula = node.querySelector('td:nth-child(2)');
    if (!celula) throw new Error('Célula não encontrada.');
    yield* celula.childNodes;
  }
  yield node;
}
const getNodeSigla = node =>
  Just(node)
    .safeMap(x => x.textContent)
    .chain(siglaFromText)
    .map(sigla => ({ node, sigla }));
const reSigla = /^\s*Sigla:\s*(\S+)\s*(\(antiga:\s*\S+\s*\))?\s*$/;
const siglaFromText = text =>
  Just(text)
    .safeMap(x => x.match(reSigla))
    .map(match => {
      if (match[2]) {
        // Possui sigla antiga e nova
        return match[1];
      } else {
        // Possui somente sigla nova
        return match[1].toLowerCase();
      }
    });
function criarLinks(doc, dominio, nodeInfo) {
  const template = doc.createElement('template');
  template.innerHTML = ' [ <a href="" target="_blank">Abrir na Intra</a> ]';
  const content = template.content;
  const link = content.querySelector('a');
  for (const { node, sigla } of nodeInfo) {
    link.href = `https://intra.trf4.jus.br/membros/${sigla}${dominio}-jus-br`;
    const fragment = doc.importNode(content, true);
    node.parentNode.insertBefore(fragment, node.nextSibling);
  }
}
main(document).catch(e => {
  console.error(e);
});
