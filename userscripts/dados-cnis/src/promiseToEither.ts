import { Either, Left, Right } from '@nadameu/either';

export function promiseToEither<T>(
  promise: Promise<T>
): Promise<Either<Error, T>> {
  return promise.then(Right, Left);
}
