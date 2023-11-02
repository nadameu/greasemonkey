// ==UserScript==
// @name exportar-excel
// @name:pt-br Exportar dados para Excel
// @namespace http://nadameu.com.br
// @version 1.0.1
// @include /^https:\/\/eproc\.jf(pr|rs|sc)\.jus\.br\/eprocV2\/controlador\.php\?acao=processo_selecionar&/
// @require https://unpkg.com/xlsx@0.15.5/dist/xlsx.full.min.js
// @grant none
// ==/UserScript==

main();

function main() {
  const eventos = Array.from(
    document.querySelectorAll('#tblEventos > tbody > tr[class^="infraTr"]')
  ).map(linha => ({
    linha,
    seq: obterSequencial(linha),
    data: obterData(linha),
    ehSentenca: ehSentenca(linha),
    ehCitacao: ehCitacao(linha),
  }));

  const botao = document.createElement('button');
  botao.type = 'button';
  botao.className = 'infraButton';
  botao.textContent = 'Exportar dados para Excel';
  botao.addEventListener('click', onclick(eventos), false);

  safePipe(
    document.getElementById('divInfraBarraLocalizacao'),
    x => x.insertAdjacentElement('afterend', botao),
    botao =>
      eventos[0].seq > 100 &&
      botao.insertAdjacentHTML(
        'afterend',
        '<br>Processo possui mais de 100 eventos, carregue as próximas páginas antes de gerar o arquivo.'
      )
  );
}

function safePipe(value, ...fns) {
  return fns.reduce((x, f) => (x == null ? null : f(x)), value);
}

function onclick(eventos) {
  return function onclick() {
    const dados = obterDados(eventos);
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(dados);
    ws['!cols'] = calcularLarguraColunas(dados);

    // Formatação de números
    ws['B3'].z = '#,##0.00';
    ws['B4'].z = 'DD/MM/YYYY';
    dados.forEach((linha, r) => {
      if (r < 6) return;
      if (linha[2] instanceof Date) ws[`C${r + 1}`].z = 'DD/MM/YYYY';
    });

    XLSX.utils.book_append_sheet(wb, ws, 'dados');

    const array = XLSX.write(wb, {
      type: 'array',
      bookType: 'xlsx',
      compression: true,
    });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(
      new Blob([array], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })
    );
    link.download = 'dados.xlsx';
    link.click();
  };
}

function obterDados(eventos) {
  const numProcessoFormatado = safePipe(
    document.getElementById('txtNumProcesso'),
    x => x.textContent
  );

  const numProcesso = safePipe(numProcessoFormatado, x =>
    x.replace(/[.-]/g, '')
  );

  const autores = Array.from(
    document.querySelectorAll('.infraNomeParte[data-parte="AUTOR"]')
  ).map(x => x.textContent);

  const reus = Array.from(
    document.querySelectorAll('.infraNomeParte[data-parte="REU"]')
  ).map(x => x.textContent);

  const sentencas = eventos
    .filter(({ ehSentenca }) => ehSentenca)
    .map(({ data }) => data);

  const citacoes = new Map(
    eventos
      .filter(({ ehCitacao }) => ehCitacao)
      .map(info => obterDadosCitacao(info))
      .filter(x => x != null)
      .map(({ reu, data }) => [reu, data])
  );

  const valorCausa = safePipe(
    document.querySelector('a[href*="?acao=historico_valor_causa_listar&"]'),
    x => x.nextSibling,
    x => x.textContent,
    x => x.match(/^\s*R\$\s+([0-9.,]+)\s*$/),
    x => Number(x[1].replace(/\./g, '').replace(',', '.'))
  );

  return [
    ['Número do processo', numProcessoFormatado || ''],
    ['Número do processo (sem pontuação)', numProcesso || ''],
    ['Valor da causa', valorCausa],
    ['Data da sentença', sentencas[0] || ''],
    [],
    ['', 'Nome', 'Data da citação'],
    ...autores.map((autor, i) => [i === 0 ? 'Autor(es):' : '', autor]),
    ...reus.map((reu, i) => [
      i === 0 ? 'Réu(s)' : '',
      reu,
      citacoes.get(reu) || '',
    ]),
  ];
}

function obterSequencial(linha) {
  return safePipe(linha.cells[1], x => x.textContent, Number);
}

function obterData(linha) {
  return safePipe(
    linha.cells[2],
    x => x.textContent,
    x => x.match(/(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2}):(\d{2})/),
    xs => xs.map(Number),
    ([_, d, m, y, h, i, s]) => new Date(y, m - 1, d, h, i, s)
  );
}

function ehSentenca(linha) {
  return linha.matches('.infraEventoMuitoImportante');
}

function ehCitacao(linha) {
  return (
    safePipe(
      linha.querySelector('td.infraEventoDescricao'),
      x => x.textContent,
      x => /citação eletrônica\s+-\s+confirmada/i.test(x)
    ) || false
  );
}

function obterDadosCitacao({ data, linha }) {
  return safePipe(
    linha.querySelector('td.infraEventoDescricao'),
    x => x.textContent,
    x => x.match(/\(RÉU\s+-\s+(.*)\)/),
    x => x[1],
    reu => ({ data, reu })
  );
}

function calcularLarguraColunas(xss) {
  const length = Math.max(0, ...xss.map(xs => xs.length));
  const widths = Array.from({ length }, (_, c) =>
    Math.max(
      0,
      ...xss.map(xs =>
        xs[c] instanceof Date ? 10 : String(xs[c] || '').length
      )
    )
  );
  return widths.map(wch => ({ wch }));
}
