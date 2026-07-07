// ==UserScript==
// @name         seeu-esmaecer-links
// @name:pt-BR   SEEU - Esmaecer links
// @namespace    http://nadameu.com.br
// @version      1.1.0
// @author       nadameu
// @description  Diminui o destaque para links de contagem cuja quantidade é 0 (zero)
// @match        https://seeu.pje.jus.br/seeu/usuario/mesa*
// @grant        GM_addStyle
// @grant        unsafeWindow
// ==/UserScript==

(function () {
  'use strict';
  var _GM_addStyle = (() =>
    typeof GM_addStyle != 'undefined' ? GM_addStyle : void 0)();
  var _unsafeWindow = (() =>
    typeof unsafeWindow != 'undefined' ? unsafeWindow : void 0)();
  var name = 'seeu-esmaecer-links';
  var IMaybe = class {
    ap(ff) {
      return this.chain(a => ff.map(f => f(a)));
    }
    map(f) {
      return this.chain(x => new Just(f(x)));
    }
    safeMap(f) {
      return this.chain(x => maybe(f(x)));
    }
  };
  var Just = class extends IMaybe {
    value;
    empty = false;
    constructor(value) {
      super();
      this.value = value;
    }
    chain(f) {
      return f(this.value);
    }
  };
  function just(value) {
    return new Just(value);
  }
  var Nothing = class extends IMaybe {
    empty = true;
    chain(_) {
      return this;
    }
  };
  var _Nothing = null;
  function nothing() {
    return (_Nothing ??= new Nothing());
  }
  function maybe(value) {
    return value == null ? nothing() : just(value);
  }
  function combine(maybes) {
    let result = just([]);
    for (let i = 0; i < maybes.length; i += 1)
      result = maybes[i].ap(result.map(xs => x => (xs.push(x), xs)));
    return result;
  }
  var CustomError = class extends Error {
    payload;
    constructor(message, payload = {}) {
      super(message);
      this.payload = payload;
    }
  };
  CustomError.prototype.name = 'CustomError';
  function lift_throwable(fn) {
    return (...args) => {
      try {
        fn(...args);
      } catch (err) {
        console.group(`<${name}>`);
        console.error(err);
        if (err instanceof CustomError) console.debug(err.payload);
        console.groupEnd();
      }
    };
  }
  function try_catch(fn) {
    return lift_throwable(fn)();
  }
  var NOME_CLASSE_CONTAGEM_ZERADA = `gm-${name}-vazio`;
  function main() {
    const linhas = obter_linhas_rotulo_valor(document).concat(
      obter_tabelas_outros_cumprimentos(document) ?? []
    );
    const celulas_com_script = parse_non_empty(
      linhas.flatMap(l =>
        l.celulas.filter(c => c.contem_scripts).map(c => c.celula)
      )
    );
    if (celulas_com_script != null) {
      const common = common_ancestor(celulas_com_script);
      new MutationObserver(
        debounce(
          lift_throwable(() => {
            const linhas = obter_linhas_rotulo_valor(common);
            for (const linha of linhas) aplicar_alteracoes_linha(linha);
          })
        )
      ).observe(common, {
        childList: true,
        subtree: true,
      });
    }
    for (const linha of linhas) aplicar_alteracoes_linha(linha);
    _GM_addStyle(`.${NOME_CLASSE_CONTAGEM_ZERADA} { opacity: 0.3; }`);
  }
  function aplicar_alteracoes_linha({ linha, celulas }) {
    linha.classList.remove(NOME_CLASSE_CONTAGEM_ZERADA);
    const celulas_vazias = [];
    for (const { celula, qtd } of celulas) {
      celula.classList.remove(NOME_CLASSE_CONTAGEM_ZERADA);
      if (qtd === 0) celulas_vazias.push(celula);
    }
    if (celulas_vazias.length === celulas.length)
      linha.classList.add(NOME_CLASSE_CONTAGEM_ZERADA);
    else
      for (const celula_vazia of celulas_vazias)
        celula_vazia.classList.add(NOME_CLASSE_CONTAGEM_ZERADA);
  }
  function parse_linha_com_mais_de_duas_celulas(qtd) {
    return linha => {
      return linha.cells.length === qtd ? linha : null;
    };
  }
  function parse_maior_que_dois(value) {
    return value > 2 ? value : null;
  }
  function parse_non_empty(xs) {
    return xs.length > 0 ? xs : null;
  }
  function obter_linhas_rotulo_valor(context) {
    return [
      ...context.querySelectorAll(
        'tr:has(> td:first-child.label + td:last-child)'
      ),
    ].flatMap(linha => {
      const celula = linha.cells[1];
      const { texto, contem_scripts } = extrair_dados_celula(celula);
      const qtd = texto.trim().match(/^\d+$/);
      if (qtd === null)
        if (contem_scripts)
          return [
            {
              linha,
              celulas: [
                {
                  celula,
                  qtd: -1,
                  contem_scripts,
                },
              ],
            },
          ];
        else return [];
      else
        return [
          {
            linha,
            celulas: [
              {
                celula,
                qtd: Number(qtd[0]),
                contem_scripts,
              },
            ],
          },
        ];
    });
  }
  function extrair_dados_celula(celula) {
    if (celula.querySelector('script') === null)
      return {
        texto: celula.textContent,
        contem_scripts: false,
      };
    else
      return {
        texto: [...celula.childNodes]
          .filter(
            node =>
              !(node instanceof HTMLScriptElement) && !(node instanceof Comment)
          )
          .map(x => x.textContent ?? '')
          .join(''),
        contem_scripts: true,
      };
  }
  function obter_tabelas_outros_cumprimentos(context) {
    return (
      single_element(
        [...context.querySelectorAll('table.resultTable')]
          .map(extrair_dados_tabela_cumprimentos)
          .filter(x => x !== null)
      )?.linhas ?? null
    );
  }
  function extrair_dados_tabela_cumprimentos(tabela) {
    const colunas = parse_thead(tabela);
    if (colunas === null) return null;
    const secoes = parse_tbodies(colunas)(tabela);
    if (secoes === null) return null;
    const footer = parse_footer(secoes.footer);
    if (footer === null) return null;
    const linhas_dados = secoes.linhas.map(parse_linha).filter(x => x !== null);
    if (linhas_dados.length === 0) return null;
    return {
      tabela,
      linhas: linhas_dados
        .concat([footer])
        .map(parse_linha_dados)
        .filter(x => x !== null),
    };
  }
  function parse_thead(tabela) {
    return (
      maybe(tabela.tHead)
        .map(t => t.rows)
        .safeMap(single_element)
        .map(r => r.cells.length)
        .safeMap(parse_maior_que_dois).value ?? null
    );
  }
  function parse_tbodies(colunas) {
    return tabela => {
      const tbody = single_element(tabela.tBodies);
      if (!tbody) return null;
      const linhas = combine(
        [...tbody.rows]
          .map(parse_linha_com_mais_de_duas_celulas(colunas))
          .map(maybe)
      );
      if (linhas.empty) return null;
      if (linhas.value.length < 2) return null;
      return {
        linhas: linhas.value.slice(0, -1),
        footer: linhas.value.slice(-1)[0],
      };
    };
  }
  function parse_linha(linha) {
    const [primeira, ...outras] = linha.cells;
    if (primeira.querySelector('a[href]') !== null) return null;
    if (!outras.some(c => c.querySelector('a[href]') !== null)) return null;
    return {
      linha,
      celulas: outras,
    };
  }
  function parse_footer(linha) {
    if (linha.querySelector('a[href]') !== null) return null;
    const [primeira, ...outras] = linha.cells;
    if (primeira.textContent.trim() !== 'Total') return null;
    return {
      linha,
      celulas: outras,
    };
  }
  function parse_linha_dados(dados) {
    const celulas = dados.celulas.map(parse_celula).filter(x => x !== null);
    if (celulas.length === 0) return null;
    return {
      linha: dados.linha,
      celulas,
    };
  }
  function parse_celula(celula) {
    const texto = celula.textContent.trim();
    let match;
    if ((match = texto.match(/^\d+$/)) !== null)
      return {
        celula,
        qtd: Number(match[0]),
        contem_scripts: false,
      };
    else if ((match = texto.match(/^(\d+)\s+\/\s+(\d+)$/)) !== null)
      return {
        celula,
        qtd: Number(match[1]) + Number(match[2]),
        contem_scripts: false,
      };
    else return null;
  }
  function single_element(xs) {
    if (xs.length === 1) return xs[0];
    return null;
  }
  function common_ancestor(nodes) {
    const [first, ...rest] = [...nodes];
    const range = new Range();
    range.setStart(first, 0);
    for (const curr of rest) {
      range.setEnd(curr, 0);
      if (range.collapsed) reverse(range);
      range.setStart(range.commonAncestorContainer, 0);
    }
    return range.startContainer;
    function reverse(range) {
      const temp = range.startContainer;
      range.setStart(range.endContainer, 0);
      range.setEnd(temp, 0);
    }
  }
  function debounce(fn, timeout_ms = 200) {
    let timer;
    return () => {
      _unsafeWindow.clearTimeout(timer);
      timer = _unsafeWindow.setTimeout(fn, timeout_ms);
    };
  }
  try_catch(main);
})();
