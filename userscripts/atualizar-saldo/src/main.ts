import { expectUnreachable } from '@nadameu/expect-unreachable';
import * as p from '@nadameu/predicates';
import { E, makeApplicativeValidation, maybeBool, O, pipeValue, semigroupArray } from 'adt-ts';
import { isNumproc } from './NumProc';
import { paginaContas } from './paginaContas';
import { paginaProcesso } from './paginaProcesso';

const isAcaoReconhecida = p.isAnyOf(
  p.isLiteral('processo_selecionar'),
  p.isLiteral('processo_precatorio_rpv')
);

export function main() {
  const params = new URL(document.location.href).searchParams;
  const acao = pipeValue(
    params.get('acao'),
    maybeBool(p.isNotNull),
    E.noteL(() => [new Error('Página desconhecida')]),
    E.bind(acao =>
      pipeValue(
        acao,
        maybeBool(isAcaoReconhecida),
        E.noteL(() => [new Error(`Ação desconhecida: "${acao}".`)])
      )
    )
  );

  const numproc = pipeValue(
    params.get('num_processo'),
    maybeBool(p.isNotNull),
    E.noteL(() => [new Error('Número do processo não encontrado.')]),
    E.bind(numproc =>
      pipeValue(
        numproc,
        maybeBool(isNumproc),
        E.noteL(() => [new Error(`Número de processo inválido: "${numproc}".`)])
      )
    )
  );

  return pipeValue(
    O.sequence(makeApplicativeValidation(semigroupArray))({ acao, numproc }),
    E.map(({ acao, numproc }) => {
      switch (acao) {
        case 'processo_selecionar':
          return paginaProcesso(numproc);

        case 'processo_precatorio_rpv':
          return paginaContas(numproc);

        default:
          return expectUnreachable(acao);
      }
    })
  );
}
