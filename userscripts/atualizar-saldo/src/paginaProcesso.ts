import { check, isNotNull } from '@nadameu/predicates';
import { NumProc } from './NumProc';
import { adicionarProcessoAguardando } from './processosAguardando';

export async function paginaProcesso(numproc: NumProc) {
  const capa = check(isNotNull, document.getElementById('fldCapa'), 'Capa não encontrada.');
  const linkContas = check(
    isNotNull,
    document.querySelector<HTMLAnchorElement>('a#labelPrecatorios'),
    'Link não encontrado.'
  );
  const url = linkContas.href;
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
  const botao = document.createElement('button');
  botao.type = 'button';
  botao.textContent = 'Atualizar saldo RPV';
  // botao.addEventListener('click', makeOnBotaoClick({ botao, numproc, url }), { once: true });
  botao.addEventListener('click', makeOnBotaoClick({ botao, numproc, url }));
  capa.insertAdjacentElement('beforebegin', botao);
}

function makeOnBotaoClick({
  botao,
  numproc,
  url,
}: {
  botao: HTMLButtonElement;
  numproc: NumProc;
  url: string;
}) {
  return function onBotaoClick(evt: Event) {
    evt.preventDefault();
    // botao.disabled = true;
    adicionarProcessoAguardando(numproc);
    window.open(url);
  };
}
