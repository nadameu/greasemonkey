export class ErroLinkCriarNaoExiste extends Error {
  constructor() {
    super('Link para criar solicitação de pagamentos não existe!');
  }
}
