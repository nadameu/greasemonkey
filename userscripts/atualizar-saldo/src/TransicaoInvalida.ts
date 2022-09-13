export class TransicaoInvalida extends Error {
  name = 'TransicaoInvalida';
  constructor(public estado: any, public acao: any) {
    super();
  }
}
