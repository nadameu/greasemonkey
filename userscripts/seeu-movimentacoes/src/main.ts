import {
  E,
  Either,
  Left,
  M,
  S,
  constant,
  makeApplicativeValidation,
  monoidString,
  semigroupArray,
} from '@nadameu/adts';
import { pipe } from '@nadameu/pipe';
import * as alteracoes from './alteracoes';

export const main = (): Either<string, void> => {
  const url = new URL(document.location.href);
  return pipe(
    Object.entries(alteracoes),
    S.filterMap(([name, f]) =>
      pipe(f(url), M.map(E.mapLeft(err => [`[${name}]: ${err}`])))
    ),
    S.toNonEmptyArray,
    M.map(S.sequence(makeApplicativeValidation(semigroupArray))),
    M.getOrElse(() => Left([`Página não reconhecida: ${url.pathname}.`])),
    E.mapBoth(S.fold(monoidString), constant(undefined))
  );
};
