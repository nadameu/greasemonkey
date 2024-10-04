export function getFormulario(doc: Document) {
  const form = doc.querySelector<HTMLFormElement>('form[name="formulario"]');
  if (!form) throw new Error('Não foi possível obter o formulário.');
  return form;
}
