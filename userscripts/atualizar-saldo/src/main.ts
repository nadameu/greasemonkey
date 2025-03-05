import { E, Either, Left, Right } from '@nadameu/adts';
import * as p from '@nadameu/predicates';
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

const isAcaoReconhecida = (x: string): x is keyof typeof paginas =>
  Object.keys(paginas).includes(x);

export function main(): Either<Error, void> {
  return E.gen(function* ($_) {
    const params = new URL(document.location.href).searchParams;
    const acao = yield* $_(
      validar(
        params,
        'acao',
        'Página desconhecida',
        isAcaoReconhecida,
        acao => `Ação desconhecida: "${acao}".`
      )
    );
    const numproc = yield* $_(
      validar(
        params,
        'num_processo',
        'Número do processo não encontrado.',
        isNumproc,
        numproc => `Número de processo inválido: "${numproc}".`
      )
    );
    return yield* $_(paginas[acao](numproc));
  });
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
