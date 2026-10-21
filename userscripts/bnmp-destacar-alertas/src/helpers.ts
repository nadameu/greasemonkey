import { Err, Ok, Result } from './Result';

export function queryUnique<T extends Element>(selector: string) {
  return (context: ParentNode): Result<T, QueryUniqueError> => {
    const elts = context.querySelectorAll<T>(selector);
    if (elts.length !== 1) {
      return Err(new QueryUniqueError(selector, context));
    } else {
      return Ok(elts[0]!);
    }
  };
}

export class QueryUniqueError extends Error {
  name = 'QueryUniqueError';
  constructor(
    selector: string,
    public context: ParentNode
  ) {
    super(`Not unique: \`${selector}\`.`);
  }
}

export function filter<T, E = T>(
  pred: (value: T) => boolean,
  reason: (_: T) => E = x => x as unknown as E
) {
  return (value: T): Result<T, E> => {
    if (pred(value)) {
      return Ok(value);
    } else {
      return Err(reason(value));
    }
  };
}

export function refine<T, U extends T, E = Exclude<T, U>>(
  pred: (value: T) => value is U,
  reason: (_: Exclude<T, U>) => E = x => x as unknown as E
) {
  return (value: T): Result<U, E> => {
    if (pred(value)) {
      return Ok(value);
    } else {
      return Err(reason(value as Exclude<T, U>));
    }
  };
}

export function sequence<T, E>(results: Result<T, E>[]): Result<T[], E> {
  const values: T[] = [];
  for (const result of results) {
    if (!result._internal.ok) {
      return Err(result._internal.reason);
    }
    values.push(result._internal.value);
  }
  return Ok(values);
}
