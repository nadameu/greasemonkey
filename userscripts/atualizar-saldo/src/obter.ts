import * as p from '@nadameu/predicates';
import { Either, Left, Right } from 'adt-ts';

export function obter<T extends HTMLElement>(selector: string, msg: string): Either<Error, T> {
  const elt = document.querySelector<T>(selector);
  if (p.isNull(elt)) return Left(new Error(msg));
  else return Right(elt);
}
