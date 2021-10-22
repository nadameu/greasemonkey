"use strict";
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
// @require     https://raw.githubusercontent.com/nadameu/greasemonkey/Maybe-v1.0.0/lib/Maybe.js
// @version     15.0.0
// @grant       none
// ==/UserScript==
async function main(doc) {
    const [dominio, nodeInfo] = await maybe.all(getDominio(doc), getFormulario(doc).map(getNodeInfo));
    criarLinks(doc, dominio, nodeInfo);
    const qtd = nodeInfo.length;
    const s = qtd > 1 ? 's' : '';
    console.log(`${qtd} link${s} criado${s}`);
}
const getDominio = (doc) => maybe
    .Just(doc)
    .safeMap(x => x.querySelector('[name="local"]:checked'))
    .safeMap(x => x.nextSibling)
    .safeMap(x => x.textContent)
    .map(x => x.trim());
const getFormulario = (doc) => maybe.Just(doc).safeMap(x => x.querySelector('form[name="formulario"]'));
const getNodeInfo = (formulario) => Array.from(parseFormulario(formulario));
function* parseFormulario(formulario) {
    for (const sibling of siblings(formulario))
        for (const node of flattenTabela(sibling))
            yield* getNodeSigla(node);
}
function* siblings(node) {
    for (let s = node.nextSibling; s !== null; s = s.nextSibling)
        yield s;
}
function* flattenTabela(node) {
    if (node instanceof HTMLTableElement) {
        const celula = node.querySelector('td:nth-child(2)');
        if (!celula)
            throw new Error('Célula não encontrada.');
        yield* celula.childNodes;
    }
    yield node;
}
const getNodeSigla = (node) => maybe
    .Just(node)
    .safeMap(x => x.textContent)
    .chain(siglaFromText)
    .map(sigla => ({ node, sigla }));
const reSigla = /^\s*Sigla:\s*(\S+)\s*(\(antiga:\s*\S+\s*\))?\s*$/;
const siglaFromText = (text) => maybe
    .Just(text)
    .safeMap(x => x.match(reSigla))
    .map(match => {
    if (match[2]) {
        // Possui sigla antiga e nova
        return match[1];
    }
    else {
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
