import { createDispatcher } from '@nadameu/create-dispatcher';
import { h } from '@nadameu/create-element';
import { expectUnreachable } from '@nadameu/expect-unreachable';
import { check, isNotNull } from '@nadameu/predicates';
import { NumProc } from './NumProc';
import { adicionarProcessoAguardando } from './processosAguardando';

export async function paginaProcesso(numproc: NumProc) {
  const [capa, url] = await Promise.all([obterCapa(), obterLink().then(link => link.href)]);
  await modificarPaginaProcesso({ capa, numproc, url });
}
async function modificarPaginaProcesso({
  capa,
  numproc,
  url,
}: {
  capa: HTMLElement;
  numproc: NumProc;
  url: string;
}) {
  const botao = h('button', { type: 'button' }, 'Atualizar saldo RPV');
  botao.addEventListener('click', onClick);
  capa.insertAdjacentElement('beforebegin', botao);

  const dispatcher = createDispatcher<'CLICK'>();

  try {
    for await (const evt of dispatcher) {
      if (evt === 'CLICK') {
        adicionarProcessoAguardando(numproc);
        window.open(url);
      } else {
        expectUnreachable(evt);
      }
    }
  } catch (e) {
    botao.disabled = true;
    window.alert('Ocorreu um erro com a atualização de saldo de RPV.');
  } finally {
    dispatcher.end();
    botao.removeEventListener('click', onClick);
  }

  function onClick(evt: Event) {
    evt.preventDefault();
    dispatcher.dispatch('CLICK');
  }
}

async function obterLink() {
  return obter<HTMLAnchorElement>('a#labelPrecatorios', 'Link não encontrado.');
}

async function obterCapa() {
  return obter('#fldCapa', 'Capa não encontrada.');
}

async function obter<T extends HTMLElement>(selector: string, msg: string) {
  return check(isNotNull, document.querySelector<T>(selector), msg);
}
