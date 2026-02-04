import { GM_addStyle, GM_info } from '$';

try_catch(main);

function try_catch(fn: () => void) {
  try {
    fn();
  } catch (err) {
    console.group(`<${GM_info.script.name}>`);
    console.error(err);
    console.groupEnd();
  }
}

function main() {
  const mut = new MutationObserver(mutation_list => {
    try_catch(() => {
      if (document.location.pathname !== '/alertas') return;
      mutation_list
        .values()
        .flatMap(m => m.addedNodes)
        .filter(eh_alerta_vazio)
        .forEach(alerta_vazio => {
          alerta_vazio.classList.add('gm-bnmp-destacar-alertas__vazio');
        });
    });
  });
  mut.observe(document.body, { childList: true, subtree: true });
  window.addEventListener('beforeunload', () => {
    mut.disconnect();
  });
  document.body.classList.add('gm-bnmp-destacar-alertas');
  GM_addStyle(`
.gm-bnmp-destacar-alertas {
  .gm-bnmp-destacar-alertas__vazio {
    opacity: 0.25;
    transform: scale(0.75);
  }
}
`);
}

function eh_alerta_vazio(node: Node): node is HTMLElement {
  if (!(node instanceof HTMLElement)) return false;
  if (!node.matches('mat-chip')) return false;
  const elt_quantidade = node.querySelector('.component-total-box');
  if (elt_quantidade === null) throw new QuantidadeNaoEncontradaError(node);
  return elt_quantidade.textContent.trim() === '0';
}

class QuantidadeNaoEncontradaError extends Error {
  constructor(public origem: HTMLElement) {
    super('Erro ao obter a quantidade de alertas.');
  }
}
