import { h } from '@nadameu/create-element';
import html from './adicionarFormulario.html?raw';
import { buscarDocumento } from './buscarDocumento';
import { onEnviarClicado } from './onEnviarClicado';
import { query } from './query';
import { validarFormularioExterno } from './validarFormularioExterno';

export async function adicionarFormulario({
  areaTelaD,
  linkCriar,
}: {
  areaTelaD: HTMLElement;
  linkCriar: HTMLAnchorElement;
}): Promise<void> {
  const div = areaTelaD.appendChild(
    h(
      'div',
      { className: 'gm-ajg__div' },
      h('label', null, 'Aguarde, carregando formulário...')
    )
  );
  await new Promise(res => {
    window.setTimeout(res, 1000);
  });
  let doc: Document;
  try {
    doc = await buscarDocumento(linkCriar.href);
  } finally {
    div.textContent = '';
  }
  const form = await query<HTMLFormElement>(
    'form[id="frmRequisicaoPagamentoAJG"]',
    doc
  ).then(x => x.cloneNode(true) as HTMLFormElement);

  if (!validarFormularioExterno(form))
    throw new Error('Formulário não foi validado!');

  div.innerHTML = html;
  const formularioAdicionado = document.querySelector<HTMLFormElement>(
    '.gm-ajg__formulario'
  )!;
  formularioAdicionado.method = form.method;
  formularioAdicionado.action = form.action;
  const enviar = document.querySelector('.gm-ajg__formulario__enviar')!;
  enviar.addEventListener('click', () => {
    onEnviarClicado().catch(err => {
      console.error(err);
    });
  });
}
