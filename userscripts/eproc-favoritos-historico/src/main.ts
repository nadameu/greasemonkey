import * as P from '@nadameu/predicates';
import * as db from './database';
import { tela_com_barra_superior } from './tela_com_barra_superior';
import { tela_processo } from './tela_processo';

export async function main() {
  const url = new URL(document.location.href);
  if (url.searchParams.get('acao') === 'processo_selecionar') {
    const numproc = url.searchParams.get('num_processo');
    P.assert(P.isNotNull(numproc), 'Erro ao obter o número do processo.');
    await db.acrescentar_historico(numproc, new Date().getTime());
    await tela_processo();
  }

  await tela_com_barra_superior();
}
