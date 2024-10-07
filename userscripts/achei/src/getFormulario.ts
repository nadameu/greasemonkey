import { assert } from './assert';

export function getFormulario(doc: typeof document) {
  const form = doc.querySelector<HTMLFormElement>('form[name="formulario"]');
  assert(form !== null, 'Não foi possível obter o formulário.');
  return form;
}
