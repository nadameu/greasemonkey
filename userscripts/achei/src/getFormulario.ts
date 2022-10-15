import { throwError } from './throwError';

export const getFormulario = async (doc: Document) =>
  doc.querySelector<HTMLFormElement>('form[name="formulario"]') ??
  throwError('Não foi possível obter o formulário.');
