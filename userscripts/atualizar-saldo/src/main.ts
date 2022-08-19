import * as p from '@nadameu/predicates';
import { expectUnreachable } from '@nadameu/expect-unreachable';
import { isNumproc } from './NumProc';
import { paginaProcesso } from './paginaProcesso';
import { paginaContas } from './paginaContas';

const isAcaoReconhecida = p.isAnyOf(
  p.isLiteral('processo_selecionar'),
  p.isLiteral('processo_precatorio_rpv')
);

export async function main() {
  const acao = new URL(document.location.href).searchParams.get('acao');
  p.assert(p.isNotNull(acao), 'Página desconhecida.');
  p.assert(isAcaoReconhecida(acao), `Ação desconhecida: "${acao}".`);

  const numproc = new URL(document.location.href).searchParams.get('num_processo');
  p.assert(p.isNotNull(numproc), 'Número do processo não encontrado.');
  p.assert(isNumproc(numproc), `Número de processo inválido: "${numproc}".`);

  switch (acao) {
    case 'processo_selecionar':
      return paginaProcesso(numproc);

    case 'processo_precatorio_rpv':
      return paginaContas(numproc);

    default:
      expectUnreachable(acao);
  }
}
