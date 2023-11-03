import { I } from '../iterable';
import { Just, Maybe, Nothing, isJust, isNothing } from '../maybe';
import { Cons, List, Nil, isCons, isNil } from './definitions';

export const empty = <a = never>(): List<a> => Nil;
export const of = <a>(value: a): List<a> => Cons(value, Nil);

export const unfold = <a, b>(
  z: b,
  f: (b: b, i: number) => Maybe<[a, b]>
): List<a> => {
  let i = 0;
  const result = f(z, i++);
  if (isNothing(result)) return Nil;
  let [a, b] = result.value;
  const first = Cons(a, Nil);
  let last = first;
  for (let res = f(b, i++); isJust(res); res = f(b, i++)) {
    [a, b] = res.value;
    last = last.tail = Cons(a, Nil);
  }
  return first;
};

export const map =
  <a, b>(f: (a: a, i: number) => b) =>
  (fa: List<a>): List<b> =>
    unfold(fa, (xs, i) =>
      isNil(xs) ? Nothing : Just([f(xs.head, i), xs.tail])
    );

export const flatMap =
  <a, b>(f: (a: a, i: number) => List<b>) =>
  (fa: List<a>): List<b> => {
    let first: List<b> = Nil;
    let last: Cons<b>;
    let i = 0;
    for (const a of fa) {
      for (const b of f(a, i++)) {
        if (isCons(first)) last = last!.tail = Cons(b, Nil);
        else last = first = Cons(b, Nil);
      }
    }
    return first;
  };

export const concat = <a>(fa: List<a>, fb: List<a>): List<a> => {
  if (isNil(fb)) return fa;
  if (isNil(fa)) return fb;
  const first = Cons(fa.head, Nil);
  const last = I.foldLeft<a, Cons<a>>(
    first,
    (last, a) => (last.tail = Cons(a, Nil))
  )(fa.tail);
  last.tail = fb;
  return first;
};

export const fromIterable = <a>(xs: Iterable<a>): List<a> =>
  unfold(xs[Symbol.iterator](), it => {
    const next = it.next();
    if (next.done) return Nothing;
    return Just([next.value, it]);
  });
