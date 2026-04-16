import { try_catch } from './try_catch';

let observado = false;
export function main() {
  let ha_scripts = false;
  const linhas = document
    .querySelectorAll<HTMLTableRowElement>(
      'tr:has(> td:first-child.label + td:last-child)'
    )
    .values()
    .flatMap(linha => {
      const [texto, possui_script] = obter_texto_celula(linha.cells[1]!);
      ha_scripts ||= possui_script;
      const qtd = texto.trim().match(/^\d+$/);
      if (qtd === null) {
        return [];
      } else {
        return [{ linha, qtd: Number(qtd[0]) }];
      }
    })
    .toArray();
  if (!observado && ha_scripts && linhas.length > 0) {
    const common = common_ancestor(
      linhas.map(x => x.linha) as unknown[] as [Node, ...Node[]]
    );
    const observer = new MutationObserver(() => try_catch(main));
    observer.observe(common, { childList: true, subtree: true });
    observado = true;
  }
  for (const { linha: linha_vazia } of linhas.filter(l => l.qtd === 0)) {
    linha_vazia.style.opacity = '0.5';
  }
}
function obter_texto_celula(
  celula: Element
): [texto: string, contem_scripts: boolean] {
  if (celula.querySelector('script') === null)
    return [celula.textContent, false];
  else {
    const texto = [...celula.childNodes]
      .filter(
        node =>
          !(node instanceof HTMLScriptElement) && !(node instanceof Comment)
      )
      .map(x => x.textContent)
      .join('');
    return [texto, true];
  }
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
