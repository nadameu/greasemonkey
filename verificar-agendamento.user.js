// ==UserScript==
// @name        verificar-agendamento
// @name:pt-BR  Verificar agendamento
// @namespace   http://nadameu.com.br
// @match       https://eproc.jfpr.jus.br/eprocV2/controlador.php?acao=minuta_verificar_agendamento&*
// @match       https://eproc.jfrs.jus.br/eprocV2/controlador.php?acao=minuta_verificar_agendamento&*
// @match       https://eproc.jfsc.jus.br/eprocV2/controlador.php?acao=minuta_verificar_agendamento&*
// @match       https://eproc.trf4.jus.br/eproc2trf4/controlador.php?acao=minuta_verificar_agendamento&*
// @grant       none
// @version     1.0.2
// @author      Paulo R. Maurici Jr.
// @description Fecha a tela de alteração de agendamento quando a minuta foi criada em bloco
// ==/UserScript==

main().catch(err => {
  consol.error(err);
});

async function main() {
  const minuta = await queryOne('#divInfraBarraLocalizacao h4')
    .then(h4 => notNull(h4.textContent))
    .then(text => notNull(text.match(/^Agendamento da Minuta .*(\d+)$/)))
    .then(match => match[1]);
  const botao = await queryOne('#btnManterAgendamento');
  const rows = window.top.document.querySelectorAll('#fldMinutas tr');
  if (rows.length === 0) throw new Error(`Não foi possível verificar a minuta ${minuta}.`);
  const ehLote = Array.prototype.filter.call(rows, row => {
    if (row.cells.length < 2) throw new Error(`Quantidade inesperada de células: ${row.cells.length}.`);
    if (! RegExp(minuta).test(row.cells[1].textContent)) return false;
    const iconeLote = row.cells[row.cells.length - 1].querySelectorAll('#divListaRecursosMinuta > a img[src$="imagens/minuta_editar_lote.gif"]');
    if (iconeLote.length > 1) throw new Error(`Quantidade inesperada de ícones: ${iconeLote.length}.`);
    if (iconeLote.length === 1) return true;
    return false;
  });
  if (ehLote.length === 1) {
    botao.click();
  }
}

async function queryOne(selector, context = document) {
  const elements = context.querySelectorAll(selector);
  if (elements.length !== 1) throw new Error(`Impossível obter um elemento único para o seletor \`${selector}\`.`);
  return elements[0];
}

async function notNull(nullable) {
  if (nullable != null) return nullable;
  throw new Error();
}
