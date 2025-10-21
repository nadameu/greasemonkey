import { createBroadcastService } from '@nadameu/create-broadcast-service';
import { assert } from '@nadameu/predicates';
import { isMensagem } from './Mensagem';
import { isNumProcFormatado, remover_formatacao } from './NumProc';

export async function pdpj_processo() {
  const params = new URL(document.location.href).searchParams;
  const numero_formatado = params.get('processo');
  assert(isNumProcFormatado(numero_formatado), 'Número do processo inválido.');
  const numero = remover_formatacao(numero_formatado);
  const bc = createBroadcastService('gm-precatorias', isMensagem);
  bc.publish({ processo_aberto: numero });
  bc.destroy();
}
