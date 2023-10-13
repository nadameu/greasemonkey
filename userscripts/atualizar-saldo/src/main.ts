import * as p from '@nadameu/predicates';
import { A, E, Either, Left, O, Right, applicativeEither, pipeValue as pipe } from 'adt-ts';
import { isNumproc } from './NumProc';
import './main.scss';
import { paginaContas } from './paginaContas';
import { paginaDepositos } from './paginaDepositos';
import { paginaProcesso } from './paginaProcesso';

const paginas = {
  processo_selecionar: paginaProcesso,
  processo_precatorio_rpv: paginaContas,
  processo_depositos_judiciais: paginaDepositos,
};

const isAcaoReconhecida = p.isAnyOf(
  ...(Object.keys(paginas) as Array<keyof typeof paginas>).map(k => p.isLiteral(k))
);
type AcaoReconhecida = p.Static<typeof isAcaoReconhecida>;

export function main(): Either<Error, void> {
  const params = new URL(document.location.href).searchParams;
  const acao = validar(
    params,
    'acao',
    'Página desconhecida',
    isAcaoReconhecida,
    acao => `Ação desconhecida: "${acao}".`
  );
  const numproc = validar(
    params,
    'num_processo',
    'Número do processo não encontrado.',
    isNumproc,
    numproc => `Número de processo inválido: "${numproc}".`
  );
  return pipe(
    { acao, numproc },
    O.sequence(applicativeEither),
    E.bind(({ acao, numproc }) => paginas[acao](numproc))
  );
}

function validar<T extends string>(
  params: URLSearchParams,
  nomeParametro: string,
  mensagemSeVazio: string,
  validacao: (x: string) => x is T,
  mensagemSeInvalido: (_: string) => string
): Either<Error, T> {
  const valor = params.get(nomeParametro);
  if (p.isNull(valor)) return Left(new Error(mensagemSeVazio));
  if (!validacao(valor)) return Left(new Error(mensagemSeInvalido(valor)));
  return Right(valor);
}
