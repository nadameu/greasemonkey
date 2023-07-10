export class PaginaCriar {
  get formElement() {
    return this.doc.getElementById('frmRequisicaoPagamentoAJG');
  }

  constructor(public doc: Document) {}

  adicionarAlteracoes(): void {}
}
