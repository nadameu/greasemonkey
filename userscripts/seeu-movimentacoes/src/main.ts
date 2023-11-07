import { D, E, M, S, Seq, isNothing } from '@nadameu/adts';
import { Handler } from '@nadameu/handler';
import { pipe } from '@nadameu/pipe';
import css from './estilos.scss?inline';
import { eitherBool } from '@nadameu/adts/either/functions';

interface Noop {
  (): void;
}

export const main = () => {
  const abaCorreta = pipe(
    document,
    D.query('li[name="tabMovimentacoesProcesso"].currentTab')
  );
  if (isNothing(abaCorreta)) return;
  const links = pipe(
    document,
    D.queryAll<HTMLImageElement>('img[id^=iconmovimentacoes]')
  );
  const obs = createIntersectionObserver();
  const mut = createMutationObserver();
  for (const link of links) {
    const nextRow = link.closest('tr')?.nextElementSibling;
    if (nextRow) {
      const target = nextRow.querySelector('.extendedinfo');
      if (target) {
        mut.observe(target, node => {
          if (!(node instanceof HTMLTableElement)) return;
          onTabelaAdicionada(node);
        });
      }
    }

    console.log('next row', nextRow);

    const { unobserve } = obs.observe(link, () => {
      unobserve();
      link.click();
    });
  }
  const style = document.head.appendChild(document.createElement('style'));
  style.textContent = css;
};

const createIntersectionObserver = () => {
  const callbacks = new Map<Element, Set<Noop>>();
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (entry.isIntersecting && callbacks.has(entry.target)) {
        for (const callback of callbacks.get(entry.target)!) {
          callback();
        }
      }
    }
  });
  return {
    observe<T extends Element>(
      target: T,
      callback: Noop
    ): { unobserve(): void } {
      if (!callbacks.has(target)) {
        callbacks.set(target, new Set());
      }
      callbacks.get(target)!.add(callback);
      observer.observe(target);
      return {
        unobserve() {
          callbacks.get(target)?.delete(callback);
          if ((callbacks.get(target)?.size ?? 0) === 0) {
            callbacks.delete(target);
            if (callbacks.size === 0) {
              observer.disconnect();
            }
          }
        },
      };
    },
  };
};

const createMutationObserver = () => {
  const callbacks = new Map<Node, Set<Handler<Node>>>();
  const mut = new MutationObserver(records => {
    for (const record of records) {
      if (callbacks.has(record.target)) {
        for (const callback of callbacks.get(record.target)!) {
          for (const node of record.addedNodes) {
            callback(node);
          }
        }
      }
    }
  });
  return {
    observe(target: Node, addedNodeHandler: Handler<Node>) {
      if (!callbacks.has(target)) {
        callbacks.set(target, new Set());
      }
      callbacks.get(target)!.add(addedNodeHandler);
      mut.observe(target, { childList: true, subtree: true });
      return {
        unobserve() {
          callbacks.get(target)?.delete(addedNodeHandler);
          if (callbacks.get(target)?.size ?? 0 === 0) {
            callbacks.delete(target);
            if (callbacks.size === 0) {
              mut.disconnect();
            }
          }
        },
      };
    },
  };
};

const onTabelaAdicionada = (table: HTMLTableElement) => {
  const linhas = pipe(
    table.rows,
    S.map(linha =>
      pipe(
        linha.cells,
        S.filter((_, i) => i % 2 === 0),
        S.flatMap((celula, c): Seq<Node | string> => {
          if (c === 0) {
            return pipe(
              celula,
              D.text,
              M.mapNullable(txt =>
                txt.match(/^\s*([0-9\.]+)\s+Arquivo:\s+(.+)\s*$/)
              ),
              M.map(([, _1, _2]) => [_1!, _2!]),
              M.getOr([])
            );
          } else if (c === 1) {
            return pipe(
              celula,
              D.text,
              M.mapNullable(txt => txt.match(/^\s*Ass\.:\s+(.*)\s*$/)),
              M.map(([, _1]) => [_1!]),
              M.getOr([])
            );
          } else {
            return pipe(
              celula.childNodes,
              S.map(x => (x instanceof Text ? x.nodeValue?.trim() ?? '' : x)),
              S.filter(x => x !== '')
            );
          }
        })
      )
    )
  );
  const novasLinhas = pipe(
    linhas,
    S.map(
      S.foldLeft<string | Node, HTMLTableRowElement>(
        document.createElement('tr'),
        (tr, i) => {
          const td = document.createElement('td');
          td.append(i);
          tr.append(td);
          return tr;
        }
      )
    )
  );
  console.log({ linhas, table, novasLinhas });
  table.replaceChildren(...novasLinhas);
};
