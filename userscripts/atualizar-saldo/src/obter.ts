import { E, Either } from '@nadameu/adts';
import * as p from '@nadameu/predicates';

export function obter<T extends HTMLElement>(
  selector: string,
  msg: string
): Either<Error, T> {
  return E.tryCatch(
    () => p.check(p.isNotNull, document.querySelector<T>(selector)),
    () => new Error(msg)
  );
}
