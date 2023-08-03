import * as p from '@nadameu/predicates';
import './main.scss';
import { isNumproc } from './NumProc';
import { paginaContas } from './paginaContas';
import { paginaDepositos } from './paginaDepositos';
import { paginaProcesso } from './paginaProcesso';
import { Result } from './Result';

const paginas = {
  processo_selecionar: paginaProcesso,
  processo_precatorio_rpv: paginaContas,
  processo_depositos_judiciais: paginaDepositos,
};

const isAcaoReconhecida = p.isAnyOf(
  ...(Object.keys(paginas) as Array<keyof typeof paginas>).map(k => p.isLiteral(k))
);
type AcaoReconhecida = p.Static<typeof isAcaoReconhecida>;

export function main(): Result<void> {
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
  return Result.sequence(acao, numproc).chain(([acao, numproc]) => paginas[acao](numproc));
}

function validar<T extends string>(
  params: URLSearchParams,
  nomeParametro: string,
  mensagemSeVazio: string,
  validacao: (x: string) => x is T,
  mensagemSeInvalido: (_: string) => string
): Result<T> {
  const valor = params.get(nomeParametro);
  if (p.isNull(valor)) return Result.err(new Error(mensagemSeVazio));
  if (!validacao(valor)) return Result.err(new Error(mensagemSeInvalido(valor)));
  return Result.ok(valor);
}
