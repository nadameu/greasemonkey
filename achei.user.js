// ==UserScript==
// @name         Achei
// @namespace    http://nadameu.com.br/achei
// @version      17.0.0
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
  function getDominio(doc) {
    const value = doc.querySelector('input[name="local"]:checked')?.value;
    if (!value || !(k => k in dominios)(value)) {
      throw new Error('Não foi possível verificar o domínio.');
    }
    return dominios[value];
  }
  function getFormulario(doc) {
    const form = doc.querySelector('form[name="formulario"]');
    if (!form) throw new Error('Não foi possível obter o formulário.');
    return form;
  }
  const ITERATOR = XPathResult.ORDERED_NODE_ITERATOR_TYPE;
  function* queryAllX(selector, context) {
    const iter = context.ownerDocument.evaluate(
      selector,
      context,
      null,
      ITERATOR
    );
    for (let node = iter.iterateNext(); node; node = iter.iterateNext()) {
      yield node;
    }
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
  function* getNodeInfo(formulario) {
    for (const node of queryAllX(
      [
        'following-sibling::text()',
        'following-sibling::table//td[2]/text()',
      ].join('|'),
      formulario
    )) {
      const text = node.nodeValue;
      if (!text) continue;
      const sigla = siglaFromText(text);
      if (!sigla) continue;
      yield { node, sigla };
    }
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
  function main({ doc, log }) {
    const formulario = getFormulario(doc);
    const nodeInfo = Array.from(getNodeInfo(formulario));
    const qtd = nodeInfo.length;
    if (qtd > 0) {
      const dominio = getDominio(doc);
      const criarLinks = makeCriarLinks(doc, dominio);
      nodeInfo.forEach(criarLinks);
    }
    const s = qtd > 1 ? 's' : '';
    log(`${qtd} link${s} criado${s}`);
  }
  try {
    main({ doc: document, log: console.log.bind(console, '[achei]') });
  } catch (err) {
    console.error(err);
  }
})();
