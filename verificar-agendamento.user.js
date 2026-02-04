// ==UserScript==
// @name         verificar-agendamento
// @name:pt-BR   Verificar agendamento
// @namespace    http://nadameu.com.br
// @version      1.1.2
// @author       Paulo R. Maurici Jr.
// @description  Fecha a tela de alteração de agendamento quando a minuta foi criada em bloco
// @match        https://eproc.jfpr.jus.br/eprocV2/controlador.php?acao=minuta_verificar_agendamento&*
// @match        https://eproc.jfrs.jus.br/eprocV2/controlador.php?acao=minuta_verificar_agendamento&*
// @match        https://eproc.jfsc.jus.br/eprocV2/controlador.php?acao=minuta_verificar_agendamento&*
// @match        https://eproc.trf4.jus.br/eproc2trf4/controlador.php?acao=minuta_verificar_agendamento&*
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
  function check(predicate, value, message) {
    assert(predicate(value), message);
    return value;
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
  try {
    main();
  } catch (error) {
    console.error(error);
  }
  function main() {
    const botao = obterBotao();
    const ehLote = obterEhLote();
    if (ehLote) {
      botao.click();
    }
  }
  function obterBotao() {
    return check(
      arrayHasLength(1),
      document.querySelectorAll('#btnManterAgendamento'),
      'Mais de um botão encontrado.'
    )[0];
  }
  function obterEhLote() {
    const heading = check(
      arrayHasLength(1),
      document.querySelectorAll('#divInfraBarraLocalizacao h4'),
      'Mais de um título encontrado.'
    )[0];
    const minuta = check(
      isNotNull,
      heading.textContent.match(/^Agendamento da Minuta .*(\d+)$/),
      'Número da minuta não encontrado.'
    )[1];
    const linha = check(
      arrayHasLength(1),
      window.top?.document.body
        .querySelectorAll('#fldMinutas tr')
        .values()
        .filter(
          row =>
            arrayHasAtLeastLength(2)(row.cells) &&
            RegExp(minuta).test(row.cells[1].textContent)
        )
        .toArray() ?? [],
      'Quantidade inesperada de linhas encontradas.'
    )[0];
    const ehLote =
      check(arrayHasAtLeastLength(1), linha.cells)[
        linha.cells.length - 1
      ].querySelectorAll(
        '#divListaRecursosMinuta > a img[src$="imagens/minuta_editar_lote.gif"]'
      ).length > 0;
    return ehLote;
  }
})();
