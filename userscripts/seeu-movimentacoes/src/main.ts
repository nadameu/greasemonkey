import { pipe as _ } from '@nadameu/pipe';
import { mapLeft, mapReader } from './Reader';
import css from './estilos.scss?inline';
import { query } from './query';

export const main = _(
  query('li[name="tabMovimentacoesProcesso"].currentTab'),
  mapLeft(() => 'IGNORE' as const),
  mapReader(() => {
    const links = document.querySelectorAll<HTMLImageElement>('img[id^=iconmovimentacoes]');
    const listening = new Set<Element>();
    const observer = new IntersectionObserver(function onIntersection(entries) {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          if (listening.has(entry.target)) {
            observer.unobserve(entry.target);
            listening.delete(entry.target);
            if (listening.size === 0) observer.disconnect();
            (entry.target as HTMLImageElement).click();
          }
        }
      }
    });
    const mut = new MutationObserver(mutations => {
      for (const mutation of mutations) {
        mutation.addedNodes.forEach(node => {
          if (!(node instanceof HTMLTableElement)) return;
          const linhas = Array.from(node.rows).map(linha => {
            const infoDoc = Array.from(linha.cells)
              .map((celula, c): Array<Array<string | Node>> => {
                if (c % 2 === 1) return [];
                if (c === 0) {
                  const text = celula.textContent ?? '';
                  const match = text.match(/^\s*([0-9\.]+)\s+Arquivo:\s+(.+)\s*$/);
                  if (!match) return [];
                  return [[match[1]!, match[2]!]];
                } else if (c === 2) {
                  const text = celula.textContent ?? '';
                  const match = text.match(/^\s*Ass\.:\s+(.*)\s*$/);
                  if (!match) return [];
                  return [[match[1]!]];
                }
                return [
                  Array.from(celula.childNodes)
                    .map(x => (x instanceof Text ? x.nodeValue?.trim() ?? '' : x))
                    .filter(x => x !== ''),
                ];
              })
              .flat();
            return infoDoc;
          });
          node.replaceChildren(
            ...linhas.map(celulas => {
              const tr = document.createElement('tr');
              tr.append(
                ...celulas.map(children => {
                  const td = document.createElement('td');
                  td.append(...children);
                  return td;
                })
              );
              return tr;
            })
          );
        });
      }
      console.log(mutations);
    });
    links.forEach(link => {
      const nextRow = link.closest('tr')?.nextElementSibling;
      if (nextRow) {
        mut.observe(nextRow, { childList: true, subtree: true });
      }
      console.log('next row', nextRow);
      observer.observe(link);
      listening.add(link);
    });
    const style = document.head.appendChild(document.createElement('style'));
    style.textContent = css;
  })
);
