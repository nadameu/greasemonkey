import { createBroadcastService } from '@nadameu/create-broadcast-service';
import { assert } from '@nadameu/predicates';
import { validar_mensagem } from './validar_mensagem';

export async function pdpj_processo() {
  const params = new URL(document.location.href).searchParams;
  const numero_formatado = params.get('processo');
  assert(numero_formatado !== null, 'Número do processo não encontrado.');
  const numero = numero_formatado.replace(/[.-]/g, '');
  assert(
    /^[0-9]{20}$/.test(numero),
    `Número de processo inválido: ${numero_formatado}.`
  );
  const bc = createBroadcastService('gm-precatorias', validar_mensagem);
  bc.publish({ processo_aberto: numero });
  bc.destroy();
}
