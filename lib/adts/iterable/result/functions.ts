import { isDone } from './definitions';

export const flatMap =
  <a, b, r>(f: (_: a) => IteratorResult<b, r>) =>
  (fa: IteratorResult<a, r>): IteratorResult<b, r> =>
    isDone(fa) ? fa : f(fa.value);

export const of = <a, r = never>(value: a): IteratorResult<a, r> => ({ done: false, value });

export const map = <a, b>(
  f: (_: a) => b
): (<r>(fa: IteratorResult<a, r>) => IteratorResult<b, r>) => flatMap<a, b, any>(x => of(f(x)));

export const zip = <a, b, r>(
  fa: IteratorResult<a, r>,
  fb: IteratorResult<b, r>
): IteratorResult<[a, b], r> => (isDone(fa) ? fa : isDone(fb) ? fb : of([fa.value, fb.value]));
