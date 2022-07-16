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
// @version     16.0.0
// @grant       none
// ==/UserScript==

// src/index.ts
function main(doc) {
  const dominio = getDominio(doc);
  if (!dominio) throw new Error('Não foi possível verificar o domínio.');
  const formulario = getFormulario(doc);
  if (!formulario) throw new Error('Não foi possível obter o formulário.');
  const criarLinks = makeCriarLinks(doc, dominio);
  const nodeInfo = getNodeInfo(formulario);
  for (const nodeSigla of nodeInfo) {
    criarLinks(nodeSigla);
  }
  const qtd = nodeInfo.length;
  const s = qtd > 1 ? 's' : '';
  console.log(`${qtd} link${s} criado${s}`);
}
var dominios = {
  1: 'trf4',
  2: 'jfrs',
  3: 'jfsc',
  4: 'jfpr',
};
var getDominio = doc => {
  const value = doc.querySelector('input[name="local"]:checked')?.value;
  if (!value) return null;
  if (!(value in dominios)) return null;
  return dominios[value];
};
var getFormulario = doc => doc.querySelector('form[name="formulario"]');
var getNodeInfo = formulario => {
  const nodeInfo = [];
  for (const sibling of siblings(formulario))
    for (const node of flattenTabela(sibling)) {
      const nodeSigla = getNodeSigla(node);
      if (nodeSigla) nodeInfo.push(nodeSigla);
    }
  return nodeInfo;
};
function* siblings(node) {
  for (let s = node.nextSibling; s; s = s.nextSibling) yield s;
}
function* flattenTabela(node) {
  if (node instanceof HTMLTableElement)
    yield* node.querySelector('td:nth-child(2)')?.childNodes ?? [];
  yield node;
}
var getNodeSigla = node => {
  const text = node.textContent;
  if (!text) return null;
  const sigla = siglaFromText(text);
  if (!sigla) return null;
  return { node, sigla };
};
var reSigla = /^\s*Sigla:\s*(\S+)\s*(\(antiga:\s*\S+\s*\))?\s*$/;
var siglaFromText = text => {
  const match = text.match(reSigla);
  if (!match) return null;
  if (match[2]) {
    return match[1];
  } else {
    return match[1].toLowerCase();
  }
};
function makeCriarLinks(doc, dominio) {
  const template = doc.createElement('template');
  template.innerHTML = ' [ <a href="" target="_blank">Abrir na Intra</a> ]';
  const content = template.content;
  const link = content.querySelector('a');
  return ({ node, sigla }) => {
    link.href = `https://intra.trf4.jus.br/membros/${sigla}${dominio}-jus-br`;
    const fragment = doc.importNode(content, true);
    node.parentNode.insertBefore(fragment, node.nextSibling);
  };
}
main(document);
