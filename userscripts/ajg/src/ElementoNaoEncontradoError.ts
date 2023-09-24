export class ElementoNaoEncontradoError extends Error {
  name = 'ElementoNaoEncontradoError';
  constructor(
    selector: string,
    public context: ParentNode
  ) {
    super(`Elemento não encontrado: \'${selector}\'.`);
  }
}
