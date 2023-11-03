import { T } from '../../typeclasses';
import { IteratorYieldResult, isIteratorReturnResult } from './definitions';
import { IteratorResultF } from './internal';

export const of: <a, b = never>(value: a) => IteratorResult<a, b> =
  IteratorYieldResult;
export const flatMap =
  <a, b, e2>(f: (a: a) => IteratorResult<b, e2>) =>
  <e>(fa: IteratorResult<a, e>): IteratorResult<b, e2 | e> =>
    isIteratorReturnResult(fa) ? fa : f(fa.value);
export const map = T.deriveMap<IteratorResultF>({ of, flatMap });
export const ap = T.deriveAp<IteratorResultF>({ of, flatMap });
export const liftN = T.deriveLiftN<IteratorResultF>({ ap, map, of });
