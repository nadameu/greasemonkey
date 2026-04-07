import * as P from '@nadameu/predicates';
import * as db from './database';
import { isNumProc } from './NumProc';
import { tela_com_barra_superior } from './tela_com_barra_superior';
import { tela_processo } from './tela_processo';

export async function main() {
  const actions: Array<() => Promise<void>> = [];
  const url = new URL(document.location.href);
  if (url.searchParams.get('acao') === 'processo_selecionar') {
    const numproc = P.check(
      P.refine(P.isString, isNumProc),
      url.searchParams.get('num_processo'),
      'Erro ao obter o número do processo.'
    );
    await db.acrescentar_historico(numproc);
    actions.push(tela_processo);
  }

  actions.push(tela_com_barra_superior);

  await Promise.all(actions.map(action => action()));
}
