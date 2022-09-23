import { assert, isNonNegativeInteger, isNumber, NonNegativeInteger } from '@nadameu/predicates';
import { LocalizadorProcessoLista } from './paginas/LocalizadorProcessoLista';
import { ProcessoSelecionar } from './paginas/ProcessoSelecionar';
import { isNumProc } from './types/NumProc';

function createIncrementId(lastId?: number) {
  let current = isNumber(lastId) ? lastId + 1 : 0;
  assert(isNonNegativeInteger(current), `${lastId} inválido.`);
  return () => current++ as NonNegativeInteger;
}

async function main() {
  const url = new URL(document.location.href);
  const params = url.searchParams;
  const acao = params.get('acao');
  switch (acao) {
    case 'localizador_processos_lista':
      return LocalizadorProcessoLista();

    case 'processo_selecionar': {
      const numproc = params.get('num_processo');
      assert(
        isNumProc(numproc),
        `Não foi possível analisar o número do proceso: ${JSON.stringify(numproc)}.`
      );
      return ProcessoSelecionar(numproc);
    }
  }
}

main().catch(e => {
  console.error(e);
});
