export function getFormulario(doc: Document) {
  return doc.querySelector<HTMLFormElement>('form[name="formulario"]');
}
