import { Either, Left, Right } from '@nadameu/adts';

export function obter<T extends HTMLElement>(
  selector: string,
  msg: string
): Either<Error, T> {
  const element = document.querySelector<T>(selector);
  if (element === null) return Left(new Error(msg));
  else return Right(element);
}
