import { E, Just, M, Maybe, Nothing, S, isLeft } from '@nadameu/adts';
import { pipe } from '@nadameu/pipe';
import * as alteracoes from './alteracoes';

export const main = (): Maybe<{ erro: string }> => {
  const url = new URL(document.location.href);
  const processadas = pipe(
    Object.entries(alteracoes),
    S.filterMap(([name, f]) =>
      pipe(f(url), M.map(E.mapLeft(err => `[${name}]: ${err}`)))
    )
  );
  if (processadas.length === 0) {
    return Just({ erro: `Página não reconhecida: ${url.pathname}.` });
  }
  const erros = processadas.flatMap(resultado =>
    isLeft(resultado) ? [resultado.left] : []
  );
  if (erros.length > 0) {
    return Just({ erro: erros.join('\n') });
  }
  return Nothing;
};
