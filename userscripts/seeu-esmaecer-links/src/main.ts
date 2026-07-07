import { GM_addStyle, unsafeWindow } from '$';
import { name as pkg_name } from '../package.json' with { type: 'json' };
import { combine, maybe } from './Maybe';
import { lift_throwable } from './try_catch';

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

export function main() {
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
    const observer = new MutationObserver(
      debounce(
        lift_throwable(() => {
          const linhas = obter_linhas_rotulo_valor(common);
          for (const linha of linhas) {
            aplicar_alteracoes_linha(linha);
          }
        })
      )
    );
    observer.observe(common, { childList: true, subtree: true });
  }
  for (const linha of linhas) {
    aplicar_alteracoes_linha(linha);
  }
  GM_addStyle(/* css */ `.${NOME_CLASSE_CONTAGEM_ZERADA} { opacity: 0.3; }`);
}

function aplicar_alteracoes_linha({ linha, celulas }: LinhaComContagem) {
  linha.classList.remove(NOME_CLASSE_CONTAGEM_ZERADA);
  const celulas_vazias: HTMLTableCellElement[] = [];
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

interface LinhaComDuasCelulas extends HTMLTableRowElement {
  cells: DuasCelulas;
}
interface DuasCelulas extends HTMLCollectionOf<HTMLTableCellElement> {
  0: HTMLTableCellElement;
  1: HTMLTableCellElement;
  length: 2;
}

interface LinhaComMaisDeDuasCelulas extends HTMLTableRowElement {
  cells: MaisDeDuasCelulas;
}
type MaisDeDuasCelulas = HTMLCollectionOf<HTMLTableCellElement> &
  [
    HTMLTableCellElement,
    ...[HTMLTableCellElement, HTMLTableCellElement, ...HTMLTableCellElement[]],
  ];
function parse_linha_com_mais_de_duas_celulas(qtd: NumeroMaiorQueDois) {
  return (linha: HTMLTableRowElement): LinhaComMaisDeDuasCelulas | null => {
    return linha.cells.length === qtd
      ? (linha as LinhaComMaisDeDuasCelulas)
      : null;
  };
}

declare const NumeroMaiorQueDoisSymbol: unique symbol;
type NumeroMaiorQueDois = number & {
  [NumeroMaiorQueDoisSymbol]: NumeroMaiorQueDois;
};
function parse_maior_que_dois(value: number): NumeroMaiorQueDois | null {
  return value > 2 ? (value as NumeroMaiorQueDois) : null;
}

type NonEmpty<T> = [T, ...T[]];
function parse_non_empty<T>(xs: T[]): NonEmpty<T> | null {
  return xs.length > 0 ? (xs as NonEmpty<T>) : null;
}

function obter_linhas_rotulo_valor(context: ParentNode) {
  return [
    ...context.querySelectorAll<LinhaComDuasCelulas>(
      'tr:has(> td:first-child.label + td:last-child)'
    ),
  ].flatMap((linha): LinhaComContagem[] => {
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

function extrair_dados_celula(celula: Element) {
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

function obter_tabelas_outros_cumprimentos(context: ParentNode) {
  const tabelas = [
    ...context.querySelectorAll<HTMLTableElement>('table.resultTable'),
  ]
    .map(extrair_dados_tabela_cumprimentos)
    .filter(x => x !== null);
  return single_element(tabelas)?.linhas ?? null;
}

function extrair_dados_tabela_cumprimentos(tabela: HTMLTableElement) {
  const colunas = parse_thead(tabela);
  if (colunas === null) return null;

  const secoes = parse_tbodies(colunas)(tabela);
  if (secoes === null) return null;

  const footer = parse_footer(secoes.footer);
  if (footer === null) return null;

  const linhas_dados = secoes.linhas.map(parse_linha).filter(x => x !== null);
  if (linhas_dados.length === 0) return null;

  const linhas = linhas_dados
    .concat([footer])
    .map(parse_linha_dados)
    .filter(x => x !== null);
  return {
    tabela,
    linhas,
  };
}

function parse_thead(tabela: HTMLTableElement): NumeroMaiorQueDois | null {
  return (
    maybe(tabela.tHead)
      .map(t => t.rows)
      .safeMap(single_element)
      .map(r => r.cells.length)
      .safeMap(parse_maior_que_dois).value ?? null
  );
}

function parse_tbodies(colunas: NumeroMaiorQueDois) {
  return (
    tabela: HTMLTableElement
  ): {
    linhas: LinhaComMaisDeDuasCelulas[];
    footer: LinhaComMaisDeDuasCelulas;
  } | null => {
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
      footer: linhas.value.slice(-1)[0]!,
    };
  };
}

function parse_linha(linha: LinhaComMaisDeDuasCelulas) {
  const [primeira, ...outras] = linha.cells;
  if (primeira.querySelector('a[href]') !== null) return null;
  if (!outras.some(c => c.querySelector('a[href]') !== null)) {
    return null;
  }
  return { linha, celulas: outras };
}

function parse_footer(linha: LinhaComMaisDeDuasCelulas) {
  if (linha.querySelector('a[href]') !== null) return null;
  const [primeira, ...outras] = linha.cells;
  if (primeira.textContent.trim() !== 'Total') return null;
  return { linha, celulas: outras };
}

function parse_linha_dados(dados: {
  linha: LinhaComMaisDeDuasCelulas;
  celulas: HTMLTableCellElement[];
}): LinhaComContagem | null {
  const celulas = dados.celulas.map(parse_celula).filter(x => x !== null);
  if (celulas.length === 0) return null;
  return { linha: dados.linha, celulas };
}

function parse_celula(celula: HTMLTableCellElement): CelulaComContagem | null {
  const texto = celula.textContent.trim();
  let match: RegExpMatchArray | null;
  if ((match = texto.match(/^\d+$/)) !== null) {
    return {
      celula,
      qtd: Number(match[0]!),
      contem_scripts: false,
    };
  } else if ((match = texto.match(/^(\d+)\s+\/\s+(\d+)$/)) !== null) {
    return {
      celula,
      qtd: Number(match[1]!) + Number(match[2]!),
      contem_scripts: false,
    };
  } else {
    return null;
  }
}

function single_element<T extends ArrayLike<unknown>>(
  xs: T
): (T extends ArrayLike<infer U> ? U : never) | null {
  if (xs.length === 1) return xs[0] as any;
  return null;
}

function common_ancestor(nodes: NonEmpty<Node>) {
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
  return range.startContainer as ParentNode;

  function reverse(range: Range) {
    const temp = range.startContainer;
    range.setStart(range.endContainer, 0);
    range.setEnd(temp, 0);
  }
}

function debounce(fn: { (): void }, timeout_ms = 200) {
  let timer: number;
  return () => {
    unsafeWindow.clearTimeout(timer);
    timer = unsafeWindow.setTimeout(fn, timeout_ms);
  };
}
