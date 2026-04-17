import { GM_addStyle } from '$';
import { name as pkg_name } from '../package.json' with { type: 'json' };
import { try_catch } from './try_catch';

interface LinhaComContagem {
  linha: HTMLTableRowElement;
  celulas: CelulaComContagem[];
}

interface CelulaComContagem {
  celula: HTMLTableCellElement;
  qtd: number;
  contem_scripts: boolean;
}

const NOME_CLASSE_CONTAGEM_ZERADA = `gm-${pkg_name}-vazio`;

let observado = false;
export function main() {
  const linhas = obter_linhas_rotulo_valor();
  const tabelas_pecas = obter_tabelas_outros_cumprimentos();

  if (tabelas_pecas.length === 1) {
    linhas.push(...tabelas_pecas[0]!.linhas);
  }
  const celulas_com_script = linhas.flatMap(l =>
    l.celulas.filter(c => c.contem_scripts).map(c => c.celula)
  );
  if (!observado && celulas_com_script.length > 0) {
    const common = common_ancestor(
      celulas_com_script as Node[] as [Node, ...Node[]]
    );
    const observer = new MutationObserver(debounce(() => try_catch(main)));
    observer.observe(common, { childList: true, subtree: true });
    observado = true;
  }
  const linhas_com_celulas_vazias = linhas.flatMap(
    (
      l
    ):
      | []
      | [
          { linha: HTMLTableRowElement } & (
            | { vazia: true }
            | { vazia: false; celulas_vazias: HTMLTableCellElement[] }
          ),
        ] => {
      const celulas_vazias = l.celulas.filter(c => c.qtd === 0);
      if (celulas_vazias.length === l.celulas.length) {
        return [{ linha: l.linha, vazia: true }];
      } else {
        return [
          {
            linha: l.linha,
            vazia: false,
            celulas_vazias: celulas_vazias.map(c => c.celula),
          },
        ];
      }
    }
  );
  for (const l of linhas_com_celulas_vazias) {
    if (l.vazia) {
      l.linha.classList.add(NOME_CLASSE_CONTAGEM_ZERADA);
    } else {
      for (const celula_vazia of l.celulas_vazias) {
        celula_vazia.classList.add(NOME_CLASSE_CONTAGEM_ZERADA);
      }
    }
  }
  GM_addStyle(/* css */ `.${NOME_CLASSE_CONTAGEM_ZERADA} { opacity: 0.3; }`);
}

function obter_linhas_rotulo_valor() {
  return [
    ...document.querySelectorAll<HTMLTableRowElement>(
      'tr:has(> td:first-child.label + td:last-child)'
    ),
  ].flatMap((linha): LinhaComContagem[] => {
    const celula = linha.cells[1]!;
    const { texto, contem_scripts } = extrair_dados_celula(celula);
    const qtd = texto.trim().match(/^\d+$/);
    if (qtd === null) {
      return [];
    } else {
      return [
        { linha, celulas: [{ celula, qtd: Number(qtd[0]), contem_scripts }] },
      ];
    }
  });
}

function extrair_dados_celula(celula: Element) {
  if (celula.querySelector('script') === null)
    return { texto: celula.textContent, contem_scripts: false };
  else {
    const texto = [...celula.childNodes]
      .filter(
        node =>
          !(node instanceof HTMLScriptElement) && !(node instanceof Comment)
      )
      .map(x => x.textContent)
      .join('');
    return { texto, contem_scripts: false };
  }
}

function obter_tabelas_outros_cumprimentos() {
  return [...document.querySelectorAll<HTMLTableElement>('table.resultTable')]
    .map(tabela => {
      const from_nullish = <T>(x: T | null | undefined): [T] | [] =>
        x == null ? [] : [x];
      const first = <T>(xs: T[]): T | null => xs[0] ?? null;
      const colunas = first(
        from_nullish(tabela.tHead)
          .map(thead => thead.rows)
          .filter(linhas => linhas.length === 1)
          .map(linhas => linhas[0]!)
          .map(primeira_linha => primeira_linha.cells.length)
          .filter(qtd => qtd > 2)
      );
      if (colunas === null) return null;

      const tBody = first(
        [tabela.tBodies]
          .filter(tbodies => tbodies.length === 1)
          .map(tb => tb[0]!)
      );
      if (tBody === null) return null;

      const linhas = [...tBody.rows].filter(
        (
          linha
        ): linha is typeof linha & {
          cells: typeof linha.cells &
            [
              HTMLTableCellElement,
              HTMLTableCellElement,
              ...HTMLTableCellElement[],
            ];
        } => linha.cells.length === colunas
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
          .map(({ linha, outras }): LinhaComContagem | null => {
            const celulas = outras
              .map((celula): CelulaComContagem | null => {
                const texto = celula.textContent.trim();
                let match: RegExpMatchArray | null;
                if ((match = texto.match(/^\d+$/)) !== null) {
                  return {
                    celula,
                    qtd: Number(match[0]!),
                    contem_scripts: false,
                  };
                } else if (
                  (match = texto.match(/^(\d+)\s+\/\s+(\d+)$/)) !== null
                ) {
                  return {
                    celula,
                    qtd: Number(match[1]!) + Number(match[2]!),
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

function common_ancestor(nodes: [Node, ...Node[]]) {
  const [first, ...rest] = [...nodes];
  const range = new Range();
  range.setStart(first, 0);
  for (const curr of rest) {
    range.setEnd(curr, 0);
    if (range.collapsed) {
      // início e fim estão invertidos
      reverse(range);
    }
    range.setStart(range.commonAncestorContainer, 0);
  }
  return range.startContainer;

  function reverse(range: Range) {
    const temp = range.startContainer;
    range.setStart(range.endContainer, 0);
    range.setEnd(temp, 0);
  }
}

function debounce(fn: { (): void }, timeout_ms = 200) {
  let timer: number;
  return () => {
    window.clearTimeout(timer);
    timer = window.setTimeout(fn, timeout_ms);
  };
}
