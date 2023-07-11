import { Nomeacao } from './Nomeacao';
import { query } from './query';

export async function nomeacaoFromLinha(linha: HTMLTableRowElement): Promise<Nomeacao> {
  const linkCriar = await query<HTMLAnchorElement>(
    'a[href^="controlador.php?acao=criar_solicitacao_pagamento&"]',
    linha
  );
  const parametros = new URL(linkCriar.href).searchParams;
  const idUnica = parametros.get('id_unica') || null;
  const numProcesso = idUnica?.split('|')[1] || null;
  const numeroNomeacao = linha.cells[2]?.textContent?.trim() || null;
  if (idUnica && numProcesso && numeroNomeacao) return { idUnica, numProcesso, numeroNomeacao };
  throw new ErroNomeacaoLinha(linha);
}

class ErroNomeacaoLinha extends Error {
  name = 'ErroNomeacaoLinha';
  constructor(public linha: HTMLTableRowElement) {
    super('Não foi possível obter os dados para a nomeação.');
  }
}
