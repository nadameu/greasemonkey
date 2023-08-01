// ==UserScript==
// @name         Achei
// @namespace    http://nadameu.com.br/achei
// @version      16.0.1
// @author       nadameu
// @description  Link para informações da Intra na página do Achei!
// @match        http://centralrh.trf4.gov.br/achei/pesquisar.php?acao=pesquisar
// @match        http://centralrh.trf4.gov.br/achei/pesquisar.php?acao=pesquisar&*
// @match        https://centralrh.trf4.gov.br/achei/pesquisar.php?acao=pesquisar
// @match        https://centralrh.trf4.gov.br/achei/pesquisar.php?acao=pesquisar&*
// @match        http://serh.trf4.jus.br/achei/pesquisar.php?acao=pesquisar
// @match        http://serh.trf4.jus.br/achei/pesquisar.php?acao=pesquisar&*
// @match        https://serh.trf4.jus.br/achei/pesquisar.php?acao=pesquisar
// @match        https://serh.trf4.jus.br/achei/pesquisar.php?acao=pesquisar&*
// ==/UserScript==

(function () {
  'use strict';

  const dominios = {
    1: 'trf4',
    2: 'jfrs',
    3: 'jfsc',
    4: 'jfpr',
  };
  async function getDominio(doc) {
    const value = doc.querySelector('input[name="local"]:checked')?.value;
    if (!value || !(value in dominios)) throw new Error('Não foi possível verificar o domínio.');
    return dominios[value];
  }
  async function getFormulario(doc) {
    const form = doc.querySelector('form[name="formulario"]');
    if (!form) throw new Error('Não foi possível obter o formulário.');
    return form;
  }
  function flattenTabela(node) {
    const nodes = [node];
    if (node instanceof HTMLTableElement)
      return Array.from(node.querySelector('td:nth-child(2)')?.childNodes ?? []).concat(nodes);
    return nodes;
  }
  const reSigla = /^\s*Sigla:\s*(\S+)\s*(\(antiga:\s*\S+\s*\))?\s*$/;
  function siglaFromText(text) {
    const match = text.match(reSigla);
    if (!match) return null;
    if (match[2]) {
      return match[1];
    } else {
      return match[1].toLowerCase();
    }
  }
  function getNodeSigla(node) {
    const text = node.textContent;
    if (!text) return null;
    const sigla = siglaFromText(text);
    if (!sigla) return null;
    return { node, sigla };
  }
  function* siblings(node) {
    for (let s = node.nextSibling; s; s = s.nextSibling) yield s;
  }
  function getNodeInfo(formulario) {
    return Array.from(siblings(formulario))
      .flatMap(flattenTabela)
      .map(getNodeSigla)
      .filter(x => x !== null);
  }
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
  async function main({ doc, log }) {
    const dominio = await getDominio(doc);
    const criarLinks = makeCriarLinks(doc, dominio);
    const formulario = await getFormulario(doc);
    const nodeInfo = getNodeInfo(formulario);
    nodeInfo.forEach(criarLinks);
    const qtd = nodeInfo.length;
    const s = qtd > 1 ? 's' : '';
    log(`${qtd} link${s} criado${s}`);
  }
  main({ doc: document, log: console.log.bind(console, '[achei]') }).catch(err => {
    if (err && err instanceof Error) {
      console.error(err);
    } else {
      console.error(String(err));
    }
  });
})();
