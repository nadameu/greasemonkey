import { Either } from '@nadameu/either';

export function eitherToPromise<T>(either: Either<Error, T>): Promise<T> {
  return either.match({ Left: x => Promise.reject(x), Right: x => Promise.resolve(x) });
}
