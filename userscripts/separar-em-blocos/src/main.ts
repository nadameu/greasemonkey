import { Either, Left, Right } from '@nadameu/either';
import { LocalizadorProcessoLista } from './paginas/LocalizadorProcessoLista';
import { ProcessoSelecionar } from './paginas/ProcessoSelecionar';
import { isNumProc } from './types/NumProc';

export function main(): Either<Error, void> {
  const url = new URL(document.location.href);
  const params = url.searchParams;
  const acao = params.get('acao');
  if (!acao) return Left(new Error('Página desconhecida.'));
  switch (acao) {
    case 'localizador_processos_lista':
      return LocalizadorProcessoLista();

    case 'processo_selecionar': {
      const numproc = params.get('num_processo');
      if (!numproc) return Left(new Error('Número do processo não encontrado.'));
      if (!isNumProc(numproc))
        return Left(
          new Error(`Não foi possível analisar o número do proceso: ${JSON.stringify(numproc)}.`)
        );
      return ProcessoSelecionar(numproc);
    }

    case 'relatorio_geral_consultar':
      return Right(undefined);

    default:
      return Left(new Error(`Ação desconhecida: "${acao}".`));
  }
}
