import { ErroLinkCriarNaoExiste } from './ErroLinkCriarNaoExiste';
import { adicionarAvisoCarregando } from './adicionarAvisoCarregando';
import { adicionarEstilos } from './adicionarEstilos';
import { adicionarFormulario } from './adicionarFormulario';
import { getTabela } from './getTabela';
import { query } from './query';

export async function main() {
  let linkCriar: HTMLAnchorElement;
  try {
    linkCriar = await query<HTMLAnchorElement>(
      'a[href^="controlador.php?acao=criar_solicitacao_pagamento&"]'
    );
  } catch (_) {
    return;
  }
  adicionarEstilos();
  const areaTelaD = await query<HTMLElement>('#divInfraAreaTelaD');
  const tabela = await getTabela();
  const aviso = adicionarAvisoCarregando({ tabela });
  try {
    await adicionarFormulario({ areaTelaD, linkCriar });
    aviso.carregado = true;
  } catch (err) {
    aviso.carregado = false;
    if (err instanceof ErroLinkCriarNaoExiste) return;
    throw err;
  }
}
