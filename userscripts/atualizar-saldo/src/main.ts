import { expectUnreachable } from '@nadameu/expect-unreachable';
import * as p from '@nadameu/predicates';
import { Left, Right, Either, validateAll } from '@nadameu/either';
import { isNumproc } from './NumProc';
import { paginaContas } from './paginaContas';
import { paginaProcesso } from './paginaProcesso';

const isAcaoReconhecida = p.isAnyOf(
  p.isLiteral('processo_selecionar'),
  p.isLiteral('processo_precatorio_rpv')
);

export function main() {
  const params = new URL(document.location.href).searchParams;
  const acao = ((acao) =>
    p.isNull(acao)
      ? Left(new Error('Página desconhecida'))
      : !isAcaoReconhecida(acao)
      ? Left(new Error(`Ação desconhecida: "${acao}".`))
      : Right(acao))(params.get('acao'));

  const numproc = ((numproc) =>
    p.isNull(numproc)
      ? Left(new Error('Número do processo não encontrado.'))
      : !isNumproc(numproc)
      ? Left(new Error(`Número de processo inválido: "${numproc}".`))
      : Right(numproc))(params.get('num_processo'));

  return validateAll([acao, numproc]).chain(([acao, numproc]) => {
    switch (acao) {
      case 'processo_selecionar':
        return paginaProcesso(numproc);

      case 'processo_precatorio_rpv':
        return paginaContas(numproc);

      default:
        return expectUnreachable(acao);
    }
  });
}
