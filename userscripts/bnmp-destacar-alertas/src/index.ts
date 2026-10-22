import * as pkg from '../package.json';
import classes from './index.module.css';

wrap_error(main)();

function wrap_error<A extends unknown[]>(fn: (...args: A) => void) {
  return (...args: A) => {
    try {
      fn(...args);
    } catch (err) {
      console.group(`<${pkg.name}>`);
      console.error(err);
      console.groupEnd();
    }
  };
}

function main() {
  const observer = new MutationObserver(mutation_list => {
    if (document.location.pathname !== '/alertas') return;
    const grid_novo = mutation_list
      .values()
      .reduce(
        (prev: HTMLElement | null, mut) =>
          mut.target instanceof HTMLElement &&
          mut.target.matches('section.alertas-dashboard') &&
          mut.addedNodes.length === 1 &&
          mut.addedNodes[0] instanceof HTMLElement &&
          mut.addedNodes[0].matches('div.dashboard-grid') &&
          mut.removedNodes.length === 0
            ? mut.addedNodes[0]!
            : prev,
        null
      );
    if (!grid_novo) return;
    const adicionados = mutation_list
      .values()
      .filter(m => m.target === grid_novo)
      .flatMap(m => m.addedNodes)
      .filter(n => n instanceof HTMLElement)
      .filter(n => n.matches('bnmp-alertas-card'))
      .toArray();
    if (isNonEmptyArray(adicionados)) {
      // disconnect();
      console.log({ adicionados });
      update(grid_novo, adicionados);
    }
  });
  window.addEventListener('beforeunload', () => observer.disconnect());
  document.body.classList.add(classes.body!);
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}

const update = wrap_error(
  (grid: HTMLElement, adicionados: NEArray<HTMLElement>) => {
    if (adicionados.some(c => c.parentElement !== grid)) {
      throw new Error('Não foi possível obter o elemento pai dos cards.');
    }
    const collator = new Intl.Collator('pt', { sensitivity: 'base' });
    const cards = adicionados
      .map(card => {
        const next = card.nextSibling;
        const description = card.querySelector<HTMLElement>(
          '.alert-card__description'
        );
        const tipo_baixa = description
          ?.querySelector<HTMLElement>('.alert-card__tipo-baixa')
          ?.textContent?.trim();
        const texto = description?.lastChild?.textContent?.trim();
        const total = Number(
          card.querySelector<HTMLElement>('.alert-card__total')?.textContent ??
            'NaN'
        );
        if (
          next === null ||
          (tipo_baixa !== 'Alerta Automático-' &&
            tipo_baixa !== 'Alerta Manual-') ||
          texto === undefined ||
          Number.isNaN(total)
        ) {
          throw new Error('Não foi possível obter as informações necessárias.');
        }
        const manual = tipo_baixa === 'Alerta Manual-';
        card.classList.add(classes.card!);
        if (manual) {
          card.classList.add(classes.manual!);
        } else {
          card.classList.add(classes.automatico!);
        }
        if (total === 0) {
          card.classList.add(classes.vazio!);
        }
        return {
          card,
          next,
          manual,
          texto,
          total,
        };
      })
      .sort(
        concatCompare(
          compareBy(c => (c.total > 0 ? -1 : 1)),
          compareBy(c => (c.manual ? -1 : 1)),
          compareBy(c => c.texto, collator.compare)
        )
      );
    grid.append(...cards.flatMap(c => [c.card, c.next]));
  }
);

const NEArraySymbol = Symbol();
type NEArray<T> = [T, ...T[]] & { [NEArraySymbol]: NEArray<any> };
function isNonEmptyArray<T>(arr: T[]): arr is NEArray<T> {
  return arr.length > 0;
}

function defaultCompare<T>(a: T, b: T): number {
  if (a < b) return -1;
  if (a > b) return +1;
  return 0;
}
function concatCompare<T>(
  ...fns: ((a: T, b: T) => number)[]
): (a: T, b: T) => number {
  return (a, b) => {
    for (const fn of fns) {
      const result = fn(a, b);
      if (result !== 0) return result;
    }
    return 0;
  };
}
function compareBy<T, K>(
  keyFn: (item: T) => K,
  compareFn: (a: K, b: K) => number = defaultCompare
): (a: T, b: T) => number {
  return (a, b) => compareFn(keyFn(a), keyFn(b));
}
