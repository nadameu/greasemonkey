// ==UserScript==
// @name         seeu-esmaecer-links
// @name:pt-BR   SEEU - Esmaecer links
// @namespace    http://nadameu.com.br
// @version      1.0.1
// @author       nadameu
// @description  Diminui o destaque para links em vermelho quando seu conteúdo é o número 0 (zero)
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
  const name = 'seeu-esmaecer-links';
  class CustomError extends Error {
    constructor(message, payload = {}) {
      super(message);
      this.payload = payload;
    }
  }
  CustomError.prototype.name = 'CustomError';
  function lift_throwable(fn) {
    return (...args) => {
      try {
        fn(...args);
      } catch (err) {
        console.group(`<${name}>`);
        console.error(err);
        if (err instanceof CustomError) {
          console.debug(err.payload);
        }
        console.groupEnd();
      }
    };
  }
  function try_catch(fn) {
    return lift_throwable(fn)();
  }
  const NOME_CLASSE_CONTAGEM_ZERADA = `gm-${name}-vazio`;
  let observado = false;
  function main() {
    const linhas = obter_linhas_rotulo_valor();
    const tabelas_pecas = obter_tabelas_outros_cumprimentos();
    if (tabelas_pecas.length === 1) {
      linhas.push(...tabelas_pecas[0].linhas);
    }
    const celulas_com_script = linhas.flatMap(l =>
      l.celulas.filter(c => c.contem_scripts).map(c => c.celula)
    );
    if (!observado && celulas_com_script.length > 0) {
      const common = common_ancestor(celulas_com_script);
      const observer = new MutationObserver(debounce(lift_throwable(main)));
      observer.observe(common, { childList: true, subtree: true });
      observado = true;
    }
    for (const { linha, celulas } of linhas) {
      linha.classList.remove(NOME_CLASSE_CONTAGEM_ZERADA);
      const celulas_vazias = [];
      for (const { celula, qtd } of celulas) {
        celula.classList.remove(NOME_CLASSE_CONTAGEM_ZERADA);
        if (qtd === 0) {
          celulas_vazias.push(celula);
        }
      }
      if (celulas_vazias.length === celulas.length) {
        linha.classList.add(NOME_CLASSE_CONTAGEM_ZERADA);
      } else {
        for (const celula_vazia of celulas_vazias) {
          celula_vazia.classList.add(NOME_CLASSE_CONTAGEM_ZERADA);
        }
      }
    }
    _GM_addStyle(`.${NOME_CLASSE_CONTAGEM_ZERADA} { opacity: 0.3; }`);
  }
  function obter_linhas_rotulo_valor() {
    return [
      ...document.querySelectorAll(
        'tr:has(> td:first-child.label + td:last-child)'
      ),
    ].flatMap(linha => {
      const celula = linha.cells[1];
      const { texto, contem_scripts } = extrair_dados_celula(celula);
      const qtd = texto.trim().match(/^\d+$/);
      if (qtd === null) {
        if (contem_scripts) {
          return [{ linha, celulas: [{ celula, qtd: -1, contem_scripts }] }];
        } else {
          return [];
        }
      } else {
        return [
          { linha, celulas: [{ celula, qtd: Number(qtd[0]), contem_scripts }] },
        ];
      }
    });
  }
  function extrair_dados_celula(celula) {
    if (celula.querySelector('script') === null)
      return { texto: celula.textContent, contem_scripts: false };
    else {
      const texto = [...celula.childNodes]
        .filter(
          node =>
            !(node instanceof HTMLScriptElement) && !(node instanceof Comment)
        )
        .map(x => x.textContent ?? '')
        .join('');
      return { texto, contem_scripts: true };
    }
  }
  function obter_tabelas_outros_cumprimentos() {
    return [...document.querySelectorAll('table.resultTable')]
      .map(tabela => {
        const from_nullish = x => (x == null ? [] : [x]);
        const first = xs => xs[0] ?? null;
        const colunas = first(
          from_nullish(tabela.tHead)
            .map(thead => thead.rows)
            .filter(linhas2 => linhas2.length === 1)
            .map(linhas2 => linhas2[0])
            .map(primeira_linha => primeira_linha.cells.length)
            .filter(qtd => qtd > 2)
        );
        if (colunas === null) return null;
        const tBody = first(
          [tabela.tBodies]
            .filter(tbodies => tbodies.length === 1)
            .map(tb => tb[0])
        );
        if (tBody === null) return null;
        const linhas = [...tBody.rows].filter(
          linha => linha.cells.length === colunas
        );
        const linha_total = linhas
          .slice(-1)
          .map(linha => {
            if (linha.querySelector('a[href]') !== null) return null;
            const [primeira, ...outras] = linha.cells;
            if (primeira.textContent.trim() !== 'Total') return null;
            return { linha, outras };
          })
          .filter(x => x !== null);
        if (linha_total.length === 0) return null;
        const linhas_dados = linhas
          .slice(0, -1)
          .map(linha => {
            const [primeira, ...outras] = linha.cells;
            if (primeira.querySelector('a[href]') !== null) return null;
            if (!outras.some(c => c.querySelector('a[href]') !== null)) {
              return null;
            }
            return { linha, outras };
          })
          .filter(x => x !== null);
        if (linhas_dados.length === 0) return null;
        return {
          tabela,
          linhas: linhas_dados
            .concat(linha_total)
            .map(({ linha, outras }) => {
              const celulas = outras
                .map(celula => {
                  const texto = celula.textContent.trim();
                  let match;
                  if ((match = texto.match(/^\d+$/)) !== null) {
                    return {
                      celula,
                      qtd: Number(match[0]),
                      contem_scripts: false,
                    };
                  } else if (
                    (match = texto.match(/^(\d+)\s+\/\s+(\d+)$/)) !== null
                  ) {
                    return {
                      celula,
                      qtd: Number(match[1]) + Number(match[2]),
                      contem_scripts: false,
                    };
                  } else {
                    return null;
                  }
                })
                .filter(x => x !== null);
              if (celulas.length === 0) return null;
              return { linha, celulas };
            })
            .filter(x => x !== null),
        };
      })
      .filter(x => x !== null);
  }
  function common_ancestor(nodes) {
    const [first, ...rest] = [...nodes];
    const range = new Range();
    range.setStart(first, 0);
    for (const curr of rest) {
      range.setEnd(curr, 0);
      if (range.collapsed) {
        reverse(range);
      }
      range.setStart(range.commonAncestorContainer, 0);
    }
    return range.startContainer;
    function reverse(range2) {
      const temp = range2.startContainer;
      range2.setStart(range2.endContainer, 0);
      range2.setEnd(temp, 0);
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
