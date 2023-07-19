import { Either, Left } from '@nadameu/either';
import { paginaListar } from './paginaListar';
import { paginaProcessoSelecionar } from './paginaProcessoSelecionar';

export async function main(): Promise<Either<Error, void>> {
  const url = new URL(document.URL);
  const acao = url.searchParams.get('acao');
  if (!acao) return Left(new Error(`Página desconhecida: ${JSON.stringify(url.href)}.`));
  if (acao === 'pessoa_consulta_integrada/listar') return paginaListar();
  if (acao === 'processo_selecionar') return paginaProcessoSelecionar();
  return Left(new Error(`Ação desconhecida: ${JSON.stringify(acao)}.`));
}
