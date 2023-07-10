import { PaginaCriar } from './PaginaCriar';
import { PaginaNomeacoes } from './PaginaNomeacoes';

export function main(doc: Document) {
  const pagina = validarPagina(doc);
  pagina.adicionarAlteracoes();
}

function validarPagina(doc: Document) {
  const acao = new URL(doc.URL).searchParams.get('acao');
  switch (acao) {
    case 'nomeacoes_ajg_listar':
      return new PaginaNomeacoes(doc);

    case 'criar_solicitacao_pagamento':
      return new PaginaCriar(doc);
  }
  throw new Error('Página desconhecida.');
}
