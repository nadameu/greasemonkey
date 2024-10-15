// ==UserScript==
// @name         Achei
// @namespace    http://nadameu.com.br/achei
// @version      17.2.1
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

  class AssertionError extends Error {
    name = 'AssertionError';
    constructor(message) {
      super(message);
    }
  }
  function assert(condition, message) {
    if (!condition) throw new AssertionError(message);
  }
  function isLiteral(literal) {
    return value => value === literal;
  }
  const isNull = /* @__PURE__ */ isLiteral(null);
  function negate(predicate) {
    return value => !predicate(value);
  }
  const isNotNull = /* @__PURE__ */ negate(isNull);
  const arrayHasLength = num => obj => obj.length === num;
  const arrayHasAtLeastLength = num => array => array.length >= num;
  const dominios = {
    1: 'trf4',
    2: 'jfrs',
    3: 'jfsc',
    4: 'jfpr',
  };
  function getDominio(doc) {
    const value = doc.querySelector('input[name="local"]:checked')?.value;
    assert(
      !!value && isInDominios(value),
      'Não foi possível verificar o domínio.'
    );
    return dominios[value];
  }
  function isInDominios(key) {
    return key in dominios;
  }
  function getFormulario(doc) {
    const form = doc.querySelector('form[name="formulario"]');
    assert(form !== null, 'Não foi possível obter o formulário.');
    return form;
  }
  const ITERATOR = XPathResult.ORDERED_NODE_ITERATOR_TYPE;
  function* queryAllX(selector, context) {
    assert(isNotNull(context.ownerDocument));
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
    assert(arrayHasLength(3)(match));
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
    assert(isNotNull(link));
    return ({ node, sigla }) => {
      assert(isNotNull(node.parentNode));
      link.href = `https://intra.trf4.jus.br/membros/${sigla}${dominio}-jus-br`;
      const fragment = doc.importNode(content, true);
      node.parentNode.insertBefore(fragment, node.nextSibling);
    };
  }
  function main({ doc, log }) {
    const resultado = parsePagina(doc);
    const { linksCriados } = (() => {
      if (resultado === 0) return { linksCriados: 0 };
      return modificarPagina({ ...resultado, doc });
    })();
    const s = linksCriados > 1 ? 's' : '';
    log(`${linksCriados} link${s} criado${s}`);
  }
  function parsePagina(doc) {
    const formulario = getFormulario(doc);
    const nodeSiglas = Array.from(getNodeInfo(formulario));
    if (!arrayHasAtLeastLength(1)(nodeSiglas)) return 0;
    const dominio = getDominio(doc);
    return { nodeSiglas, dominio };
  }
  function modificarPagina({ doc, nodeSiglas, dominio }) {
    const criarLink = makeCriarLinks(doc, dominio);
    let linksCriados = 0;
    for (const nodeSigla of nodeSiglas) {
      criarLink(nodeSigla);
      linksCriados += 1;
    }
    return { linksCriados };
  }
  try {
    main({ doc: document, log: console.log.bind(console, '[achei]') });
  } catch (err) {
    console.group('[achei]');
    console.error(err);
    console.groupEnd();
  }
})();
