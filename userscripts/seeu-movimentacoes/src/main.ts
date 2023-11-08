import {
  D,
  E,
  Left,
  M,
  Right,
  S,
  T,
  applicativeEither,
  tailRec,
  tuple,
} from '@nadameu/adts';
import { Handler } from '@nadameu/handler';
import { pipe } from '@nadameu/pipe';
import * as P from '@nadameu/predicates';
import css from './estilos.scss?inline';

interface Noop {
  (): void;
}

export const main = () =>
  pipe(
    document,
    D.query('li[name="tabMovimentacoesProcesso"].currentTab'),
    M.map(() => {
      return pipe(
        document,
        D.queryAll<HTMLImageElement>('img[id^=iconmovimentacoes]'),
        S.map((link, i) =>
          pipe(
            link.closest('tr'),
            M.fromNullable,
            M.mapNullable(x => x.nextElementSibling),
            M.filter(x => x.matches('tr')),
            M.flatMap(D.query('.extendedinfo')),
            M.map(mutationTarget => ({ link, mutationTarget })),
            M.toEither(() => `Lista de eventos não reconhecida: ${i}.`)
          )
        ),
        S.sequence(applicativeEither),
        E.map(links => {
          const obs = createIntersectionObserver();
          const mut = createMutationObserver();
          for (const { link, mutationTarget } of links) {
            mut.observe(mutationTarget, node => {
              if (!(node instanceof HTMLTableElement)) return;
              onTabelaAdicionada(node);
            });

            const { unobserve } = obs.observe(link, () => {
              unobserve();
              link.click();
            });
          }
          const style = document.head.appendChild(
            document.createElement('style')
          );
          style.textContent = css;
          const janelasAbertas = new Map<string, Window>();
          const onDocumentClick = createOnDocumentClick(janelasAbertas);
          document.addEventListener('click', onDocumentClick);
          window.addEventListener('beforeunload', () => {
            for (const win of janelasAbertas.values()) {
              if (!win.closed) win.close();
            }
          });
          pipe(
            document,
            D.queryAll<HTMLTableRowElement>('table.resultTable > tbody > tr'),
            S.map(row => {
              if (row.cells.length === 1) {
                const previousRow = row.previousElementSibling;
                if (previousRow instanceof HTMLTableRowElement) {
                  row.insertCell(0).colSpan = previousRow.cells.length - 1;
                  row.cells[1]!.colSpan = 1;
                }
              } else {
                const len = row.cells.length;
                const colunaDataHora = len - 3;
                pipe(
                  row.cells,
                  S.map((cell, i) => {
                    if (i !== colunaDataHora) {
                      cell.removeAttribute('nowrap');
                    }
                  })
                );
              }
            })
          );
          pipe(
            document,
            D.query('table.resultTable > colgroup'),
            M.map(g => {
              pipe(g.children, c => {
                pipe(
                  c,
                  S.map(c => c.removeAttribute('width'))
                );
              });
            })
          );
        })
      );
    })
  );

function createOnDocumentClick(janelasAbertas: Map<string, Window>) {
  return function onDocumentClick(evt: Event) {
    if (
      evt.target instanceof HTMLElement &&
      evt.target.matches('a[href][data-gm-doc-link]')
    ) {
      const link = evt.target as HTMLAnchorElement;
      evt.preventDefault();
      const id = link.dataset.gmDocLink!;
      if (janelasAbertas.has(id)) {
        const win = janelasAbertas.get(id)!;
        if (!win.closed) {
          win.focus();
          return;
        }
      }
      const win = window.open(
        link.href,
        `doc${id}`,
        `top=0,left=${(window.screen.width / 6) | 0},width=${
          ((window.screen.width * 2) / 3) | 0
        },height=${window.screen.availHeight}`
      );
      janelasAbertas.set(id, win!);
    }
  };
}
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

const onTabelaAdicionada = (table: HTMLTableElement) =>
  pipe(
    table.rows,
    S.traverse(applicativeEither)((linha, l) => {
      if (linha.cells.length !== 7)
        return Left(`Formato de linha desconhecido: ${l}.`);
      const sequencialNome = pipe(
        linha.cells[0]!,
        D.text,
        M.mapNullable(x => x.match(/^\s*(\d+\.\d+)\s+Arquivo:\s+(.*)\s*$/)),
        M.filter((x): x is [string, string, string] => x.length === 3),
        M.map(([, sequencial, nome]) => ({ sequencial, nome })),
        M.toEither(() => `Sequencial e nome não reconhecidos: ${l}.`)
      );
      const assinatura = pipe(
        linha.cells[2]!,
        D.text,
        M.mapNullable(x => x.match(/^\s*Ass\.:\s+(.*)\s*$/)),
        M.filter((x): x is [string, string] => x.length === 2),
        M.map(([, assinatura]) => ({ assinatura })),
        M.toEither(() => `Assinatura não reconhecida: ${l}.`)
      );
      const link = pipe(
        linha.cells[4]!.childNodes,
        S.filter(x => !(x instanceof Text && /^\s*$/.test(x.nodeValue ?? ''))),
        childNodes => {
          return E.tryCatch(
            () => {
              P.assert(
                P.isTuple(
                  P.isInstanceOf(HTMLImageElement),
                  P.isInstanceOf(HTMLDivElement),
                  P.isInstanceOf(HTMLAnchorElement)
                )(childNodes)
              );
              const [menu, popup, link] = childNodes;
              return { menu, popup, link };
            },
            () => `Link para documento não reconhecido: ${l}.`
          );
        }
      );
      const result = pipe(
        tuple(sequencialNome, assinatura, link),
        T.sequence(applicativeEither),
        E.map(
          ([{ sequencial, nome }, { assinatura }, { menu, popup, link }]) => {
            link.textContent = nome.replace(/_/g, ' ');
            const frag = document.createDocumentFragment();
            frag.append(menu, popup);
            const url = new URL(link.href);
            const tjParam = url.searchParams.get('_tj')!;
            const id = getId(tjParam);
            link.dataset.gmDocLink = id.toString();
            return [sequencial, frag, link];
          }
        )
      );
      return result;
    }),
    E.map(linhas => {
      table.replaceChildren(
        ...pipe(
          linhas,
          S.map((linha, r) => {
            const tr = document.createElement('tr');
            tr.classList.add(r % 2 === 0 ? 'even' : 'odd');
            return S.foldLeft<string | Node, HTMLTableRowElement>(
              tr,
              (tr, i) => {
                const td = document.createElement('td');
                td.append(i);
                tr.append(td);
                return tr;
              }
            )(linha);
          })
        )
      );
    })
  );

function getId(sp: string) {
  return pipe(
    tailRec({ acc: [] as string[], curr: sp }, ({ acc, curr }) =>
      curr.length > 0
        ? Left({
            acc: [...acc, curr.slice(0, 8)],
            curr: curr.slice(8),
          })
        : Right(acc)
    ),
    x => x.slice(6, 8),
    S.map(x => parseInt(x, 16)),
    S.foldLeft(0n, (acc, x) => acc * 4294967296n + BigInt(x))
  );
}
