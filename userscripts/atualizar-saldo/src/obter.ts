import * as p from '@nadameu/predicates';
import { Result } from './Result';

export function obter<T extends HTMLElement>(selector: string, msg: string): Result<T> {
  const elt = document.querySelector<T>(selector);
  if (p.isNull(elt)) return Result.err(new Error(msg));
  else return Result.ok(elt);
}
