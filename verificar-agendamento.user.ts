// ==UserScript==
// @name        verificar-agendamento
// @name:pt-BR  Verificar agendamento
// @namespace   http://nadameu.com.br
// @match       https://eproc.jfpr.jus.br/eprocV2/controlador.php?acao=minuta_verificar_agendamento&*
// @match       https://eproc.jfrs.jus.br/eprocV2/controlador.php?acao=minuta_verificar_agendamento&*
// @match       https://eproc.jfsc.jus.br/eprocV2/controlador.php?acao=minuta_verificar_agendamento&*
// @match       https://eproc.trf4.jus.br/eproc2trf4/controlador.php?acao=minuta_verificar_agendamento&*
// @grant       none
// @version     1.1.0
// @author      Paulo R. Maurici Jr.
// @description Fecha a tela de alteração de agendamento quando a minuta foi criada em bloco
// ==/UserScript==

main().catch(error => {
  console.error(error);
});

async function main() {
  const [botao, ehLote] = await validate([obterBotao(), obterEhLote()]);

  if (ehLote) {
    botao.click();
  }
}

async function obterBotao() {
  const botoes = document.querySelectorAll<HTMLElement>(
    '#btnManterAgendamento'
  );
  assert(botoes.length === 1, 'Mais de um botão encontrado.');
  const botao = botoes[0]!;
  return botao;
}

async function obterEhLote() {
  const headings = document.querySelectorAll<HTMLHeadingElement>(
    '#divInfraBarraLocalizacao h4'
  );
  assert(headings.length === 1, 'Mais de um título encontrado.');
  const minuta = headings[0]!.textContent.match(
    /^Agendamento da Minuta .*(\d+)$/
  )?.[1];
  assert(minuta != null, 'Número da minuta não encontrado.');

  const linhas = Array.from(
    window.top?.document.body.querySelectorAll<HTMLTableRowElement>(
      '#fldMinutas tr'
    ) ?? []
  )
    .filter(row => row.cells.length >= 2)
    .filter(row => RegExp(minuta).test(row.cells[1]!.textContent));
  assert(linhas.length === 1, 'Quantidade inesperada de linhas encontradas.');
  const linha = linhas[0]!;
  const ehLote =
    (linha.cells[linha.cells.length - 1]!.querySelectorAll(
      '#divListaRecursosMinuta > a img[src$="imagens/minuta_editar_lote.gif"]'
    ).length ?? 0) > 0;
  return ehLote;
}

function assert(condition: boolean, message?: string): asserts condition {
  if (!condition) throw new Error(message);
}

function validate<T, U>(promises: [Promise<T>, Promise<U>]): Promise<[T, U]>;
function validate<T>(promises: Promise<T>[]): Promise<Awaited<T>[]> {
  return Promise.allSettled(promises).then(results => {
    if (
      results.every(
        (x): x is PromiseFulfilledResult<Awaited<T>> => x.status === 'fulfilled'
      )
    ) {
      return results.map(x => x.value);
    } else {
      throw new AggregateError(
        results
          .filter((x): x is PromiseRejectedResult => x.status === 'rejected')
          .map(x => x.reason)
      );
    }
  });
}
