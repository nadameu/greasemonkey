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
  const observer = new MutationObserver(
    wrap_error(mutation_list => {
      if (document.location.pathname !== '/alertas') return;
      for (const mutation of mutation_list) {
        for (const node of mutation.addedNodes) {
          if (eh_alerta_vazio(node)) {
            node.classList.add(classes.vazio!);
          }
        }
      }
    })
  );
  observer.observe(document.body, { childList: true, subtree: true });
  window.addEventListener('beforeunload', () => {
    observer.disconnect();
  });
  document.body.classList.add(classes.body!);
}

function eh_alerta_vazio(node: Node): node is HTMLElement {
  if (!(node instanceof HTMLElement) || !node.matches('mat-chip')) return false;
  return (
    query_or_throw('.component-total-box', node).textContent.trim() === '0'
  );
}

function query_or_throw<T extends Element>(
  selector: string,
  parentNode: ParentNode
): T {
  const elt = parentNode.querySelector<T>(selector);
  if (elt === null) throw new QuerySelectorError(selector, parentNode);
  return elt;
}

class QuerySelectorError extends Error {
  public name = 'QuerySelectorError';
  constructor(
    selector: string,
    public parentNode: ParentNode
  ) {
    super(`Elemento não encontrado: \`${selector}\`.`);
  }
}
