// ==UserScript==
// @name copiar-excel
// @name:pt-br Copiar dados para Excel
// @namespace http://nadameu.com.br
// @description Copiar dados importantes do processo para colar em planilhas Excel
// @author Paulo Roberto Maurici Junior
// @version 1.0.2
// @include /^https:\/\/eproc\.jf(pr|rs|sc)\.jus\.br\/eprocV2\/controlador\.php\?acao=processo_selecionar&/
// @grant none
// ==/UserScript==

class Maybe {
  constructor(_info) {
    this._info = _info;
  }
  ap(that) {
    return that.flatMap(f => this.map(f));
  }
  flatMap(f) {
    return this._info.isNothing ? Nothing : f(this._info.value);
  }
  getOrElse(fallbackValue) {
    return this._info.isNothing ? fallbackValue : this._info.value;
  }
  map(f) {
    return this.flatMap(x => Just(f(x)));
  }
  mapNullable(f) {
    return this.flatMap(x => Maybe.from(f(x)));
  }
  static all(maybes) {
    return Array.from(maybes).reduce((acc, x) => x.ap(acc.map(xs => x => [...xs, x])), Just([]));
  }
  static from(value) {
    return new Maybe(value == null ? { isNothing: true } : { isNothing: false, value });
  }
  static justs(maybes) {
    let result = [];
    for (const maybe of maybes) if (!maybe._info.isNothing) result.push(maybe._info.value);
    return result;
  }
}
function Just(value) {
  return new Maybe({ isNothing: false, value });
}
const Nothing = new Maybe({ isNothing: true });
main();
function main() {
  const eventos = Maybe.all(
    Array.from(document.querySelectorAll('#tblEventos > tbody > tr[class^="infraTr"]')).map(linha =>
      Maybe.all([obterSequencial(linha), obterData(linha)]).map(([seq, data]) => ({
        linha,
        seq,
        data,
        ehSentenca: ehSentenca(linha),
        ehCitacaoExpedida: ehCitacaoExpedida(linha),
        ehCitacaoConfirmada: ehCitacaoConfirmada(linha),
      }))
    )
  ).getOrElse([]);
  if (eventos.length === 0) return;
  const botao = document.createElement('button');
  botao.type = 'button';
  botao.className = 'infraButton';
  botao.textContent = 'Copiar dados para área de transferência';
  botao.addEventListener('click', whenClicked(eventos), false);
  query('#divInfraBarraLocalizacao')
    .mapNullable(x => x.insertAdjacentElement('afterend', botao))
    .mapNullable(botao => {
      if (eventos[0].seq > 100)
        botao.insertAdjacentHTML(
          'afterend',
          '<br>Processo possui mais de 100 eventos, carregue as próximas páginas antes de gerar o arquivo.'
        );
      botao.insertAdjacentHTML(
        'beforebegin',
        '<div id="copy" style="position: absolute; top: -100px; left: -100px; width: 50px; height: 50px; overflow: hidden;"></div>'
      );
    });
}
function query(selector, parentNode = document) {
  return Maybe.from(parentNode.querySelector(selector));
}
function whenClicked(eventos) {
  return function whenClicked() {
    const {
      numProcessoFormatado,
      numProcesso,
      valorCausa,
      dataSentenca,
      autores,
      reus,
    } = obterDados(eventos);
    query('#copy')
      .mapNullable(copy => {
        let html = '<table border="2px">';
        html += `<tr><th>Número do processo:</th><td>${numProcessoFormatado.getOrElse(
          ''
        )}</td></tr>`;
        html += `<tr><th>Número do processo (sem pontuação):</th><td>="${numProcesso.getOrElse(
          ''
        )}"</td></tr>`;
        html += `<tr><th>Valor da causa:</th><td>${valorCausa
          .map(x => x.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }))
          .getOrElse('')}</td></tr>`;
        html += `<tr><th>Data da sentença:</th><td>${dataSentenca
          .map(dataParaExcel)
          .getOrElse('')}</td></tr>`;
        html += '<tr><td></td></tr>';
        html += '<tr><td></td><th>Nome</th><th>Data da citação</th></tr>';
        html += '<tr><th>Autor(es):</th>';
        html += autores.map(autor => `<td>${autor}</td>`).join('</tr><tr><td></td>');
        html += '</tr>';
        html += '<tr><th>Réu(s):</th>';
        html += reus
          .map(
            ({ nome, dataCitacao }) =>
              `<td>${nome}</td><td>${dataCitacao.map(dataParaExcel).getOrElse('')}</td>`
          )
          .join('</tr><tr><td></td>');
        html += '</tr>';
        html += '</table>';
        copy.innerHTML = html;
        return copy.firstElementChild;
      })
      .flatMap(table => {
        const range = new Range();
        range.selectNode(table);
        return Maybe.from(window.getSelection()).map(selection => ({ selection, range }));
      })
      .map(({ selection, range }) => {
        selection.removeAllRanges();
        selection.addRange(range);
        document.execCommand('copy');
      });
  };
}
function obterDados(eventos) {
  const numProcessoFormatado = query('#txtNumProcesso').mapNullable(x => x.textContent);
  const numProcesso = numProcessoFormatado.map(x => x.replace(/[.-]/g, ''));
  const [autores, reus] = query('table#tblPartesERepresentantes')
    .map(obterPartesPolo)
    .map(f => {
      return [f('AUTOR'), f('REU')];
    })
    .getOrElse([[], []]);
  const sentencas = eventos.filter(({ ehSentenca }) => ehSentenca).map(({ data }) => data);
  const citacoesConfirmadas = Maybe.justs(
    eventos.filter(({ ehCitacaoConfirmada }) => ehCitacaoConfirmada).map(obterDadosReferente)
  );
  const dataEventos = new Map();
  for (const { data, eventos } of citacoesConfirmadas)
    for (const evento of eventos) dataEventos.set(evento, data);
  const citacoes = new Map(
    Maybe.justs(
      eventos
        .filter(({ ehCitacaoExpedida }) => ehCitacaoExpedida)
        .map(obterDadosCitacao(dataEventos))
    ).map(({ reu, data }) => [reu, data])
  );
  const valorCausa = query('a[href*="?acao=historico_valor_causa_listar&"]')
    .mapNullable(x => x.nextSibling)
    .mapNullable(x => x.textContent)
    .mapNullable(x => x.match(/^\s*R\$\s+([0-9.,]+)\s*$/))
    .mapNullable(x => Number(x[1].replace(/\./g, '').replace(',', '.')));
  return {
    numProcessoFormatado,
    numProcesso,
    valorCausa,
    dataSentenca: Maybe.from(sentencas[0]),
    autores,
    reus: reus.map(nome => ({ nome, dataCitacao: Maybe.from(citacoes.get(nome)) })),
  };
  function obterPartesPolo(tabelaPartes) {
    return function obterPartesPolo(tipo) {
      return Array.from(tabelaPartes.querySelectorAll(`.infraNomeParte[data-parte="${tipo}"]`))
        .map(x => x.textContent)
        .filter(x => x != null);
    };
  }
}
function obterSequencial(linha) {
  return Maybe.from(linha.cells[1])
    .mapNullable(x => x.textContent)
    .map(Number);
}
function obterData(linha) {
  return Maybe.from(linha.cells[2])
    .mapNullable(x => x.textContent)
    .mapNullable(x => x.match(/(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2}):(\d{2})/))
    .mapNullable(xs => xs.map(Number))
    .mapNullable(([_, d, m, y, h, i, s]) => new Date(y, m - 1, d, h, i, s));
}
function ehSentenca(linha) {
  return linha.matches('.infraEventoMuitoImportante');
}
function ehCitacaoConfirmada(linha) {
  return query('td.infraEventoDescricao', linha)
    .mapNullable(x => x.textContent)
    .map(x => /citação eletrônica\s+-\s+confirmada/i.test(x))
    .getOrElse(false);
}
function ehCitacaoExpedida(linha) {
  return query('td.infraEventoDescricao', linha)
    .mapNullable(x => x.textContent)
    .map(x => /citação eletrônica\s+-\s+expedida/i.test(x))
    .getOrElse(false);
}
function obterDadosCitacao(dataEventos) {
  return function obterDadosCitacao({ seq, linha }) {
    return Maybe.all([
      Maybe.from(dataEventos.get(seq)),
      query('td.infraEventoDescricao', linha)
        .mapNullable(x => x.textContent)
        .mapNullable(x => x.match(/\(.*?\s+-\s+([^)]+)\)/))
        .map(x => x[1]),
    ]).map(([data, reu]) => ({ data, reu }));
  };
}
function obterDadosReferente({ data, linha }) {
  return query('td.infraEventoDescricao', linha)
    .mapNullable(x => x.textContent)
    .mapNullable(x => x.match(/Refer\. aos? Eventos?: ([0-9][0-9, e]+)/))
    .map(x => x[1].match(/\d+/g).map(Number))
    .map(eventos => ({ data, eventos }));
}
function dataParaExcel(dt) {
  return `${dt.getFullYear()}-${dt.getMonth() +
    1}-${dt.getDate()} ${dt.getHours()}:${dt.getMinutes()}:${dt.getSeconds()}`;
}
