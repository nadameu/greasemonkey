import * as P from '@nadameu/predicates';

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
  return P.check(
    P.arrayHasLength(1),
    document.querySelectorAll<HTMLElement>('#btnManterAgendamento'),
    'Mais de um botão encontrado.'
  )[0];
}

function obterEhLote() {
  const heading = P.check(
    P.arrayHasLength(1),
    document.querySelectorAll<HTMLHeadingElement>(
      '#divInfraBarraLocalizacao h4'
    ),
    'Mais de um título encontrado.'
  )[0];

  const minuta = P.check(
    P.isNotNull,
    heading.textContent.match(/^Agendamento da Minuta .*(\d+)$/) as
      | [string, string]
      | null,
    'Número da minuta não encontrado.'
  )[1];

  const linha = P.check(
    P.arrayHasLength(1),
    window.top?.document.body
      .querySelectorAll<HTMLTableRowElement>('#fldMinutas tr')
      .values()
      .filter(
        row =>
          P.arrayHasAtLeastLength(2)(row.cells) &&
          RegExp(minuta).test(row.cells[1].textContent)
      )
      .toArray() ?? [],
    'Quantidade inesperada de linhas encontradas.'
  )[0];

  const ehLote =
    P.check(P.arrayHasAtLeastLength(1), linha.cells)[
      linha.cells.length - 1
    ]!.querySelectorAll(
      '#divListaRecursosMinuta > a img[src$="imagens/minuta_editar_lote.gif"]'
    ).length > 0;
  return ehLote;
}
