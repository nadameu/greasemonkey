import { h } from '@nadameu/create-element';
import { Handler } from '@nadameu/handler';
import { check, isNotNull } from '@nadameu/predicates';
import { NumProc } from './NumProc';
import { adicionarProcessoAguardando } from './processosAguardando';

export async function paginaProcesso(numproc: NumProc) {
  const capa = await obterCapa();
  const url = await obterLink().then(link => link.href);
  const botao = h('button', { type: 'button' }, 'Atualizar saldo RPV');
  capa.insertAdjacentElement('beforebegin', botao);

  let emit: Handler<'CLICKED'>;
  botao.addEventListener('click', evt => {
    evt.preventDefault();
    emit('CLICKED');
  });

  do {
    const result = await new Promise<'CLICKED'>(res => (emit = res));
    if (result === 'CLICKED') {
      adicionarProcessoAguardando(numproc);
      window.open(url);
    }
  } while (true);
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
