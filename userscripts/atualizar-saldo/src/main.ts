import { Either, Left, Right, validateAll } from '@nadameu/either';
import * as p from '@nadameu/predicates';
import { isNumproc, NumProc } from './NumProc';
import { paginaContas } from './paginaContas';
import { paginaDepositos } from './paginaDepositos';
import { paginaProcesso } from './paginaProcesso';
import './main.scss';

const paginas = {
  processo_selecionar: paginaProcesso,
  processo_precatorio_rpv: paginaContas,
  processo_depositos_judiciais: paginaDepositos,
};

const isAcaoReconhecida = p.isAnyOf(
  ...(Object.keys(paginas) as Array<keyof typeof paginas>).map(k => p.isLiteral(k))
);
type AcaoReconhecida = p.Static<typeof isAcaoReconhecida>;

export function main() {
  const params = new URL(document.location.href).searchParams;
  return validateAll([obterAcao(params), obterNumProc(params)]).chain(([acao, numproc]) =>
    paginas[acao](numproc)
  );
}

function obterAcao(params: URLSearchParams): Either<Error, AcaoReconhecida> {
  const acao = params.get('acao');
  if (p.isNull(acao)) return Left(new Error('Página desconhecida'));
  if (!isAcaoReconhecida(acao)) return Left(new Error(`Ação desconhecida: "${acao}".`));
  return Right(acao);
}

function obterNumProc(params: URLSearchParams): Either<Error, NumProc> {
  const numproc = params.get('num_processo');
  if (p.isNull(numproc)) return Left(new Error('Número do processo não encontrado.'));
  if (!isNumproc(numproc)) return Left(new Error(`Número de processo inválido: "${numproc}".`));
  return Right(numproc);
}
