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

let updated = false;
function main() {
  const observer = new MutationObserver(mutation_list => {
    if (updated) return;
    if (document.location.pathname !== '/alertas') return;
    const nodes = mutation_list
      .values()
      .flatMap(m => m.addedNodes)
      .filter(n => n instanceof HTMLElement)
      .filter(n => n.matches('bnmp-alertas-card'))
      .reduce(n => n + 1, 0);
    if (nodes > 0) {
      disconnect();
      update();
    }
  });
  const disconnect = () => observer.disconnect();
  window.addEventListener('beforeunload', disconnect);
  document.body.classList.add(classes.body!);
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}

const update = wrap_error(() => {
  if (updated) return;
  if (document.location.pathname !== '/alertas') return;
  const collator = new Intl.Collator('pt', { sensitivity: 'base' });
  const cards = document
    .querySelectorAll<HTMLElement>('bnmp-alertas-card')
    .values()
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
    .toArray()
    .sort((a, b) => {
      if ((a.total === 0) === (b.total === 0)) {
        if (a.manual === b.manual) {
          return collator.compare(a.texto, b.texto);
        } else if (a.manual) {
          return -1;
        } else {
          return +1;
        }
      } else if (a.total === 0) {
        return +1;
      } else {
        return -1;
      }
    });
  if (cards.length === 0) return;
  const parent = cards[0]!.card.parentElement!;
  if (cards.some(c => c.card.parentElement !== parent)) {
    throw new Error('Não foi possível obter o elemento pai dos cards.');
  }
  parent.append(...cards.flatMap(c => [c.card, c.next]));
  updated = true;
});
