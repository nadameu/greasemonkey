export class ErroLinkCriarNaoExiste extends Error {
  name = 'ErroLinkCriarNaoExiste';
  constructor() {
    super('Link para criar solicitação de pagamentos não existe!');
  }
}
