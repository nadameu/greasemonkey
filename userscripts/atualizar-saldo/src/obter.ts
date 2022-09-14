import { Either, Left, Right } from '@nadameu/either';
import * as p from '@nadameu/predicates';

export function obter<T extends HTMLElement>(selector: string, msg: string): Either<Error, T> {
  const elt = document.querySelector<T>(selector);
  if (p.isNull(elt)) return Left(new Error(msg));
  else return Right(elt);
}
