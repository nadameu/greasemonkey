import { toArray as fromIterable } from '../iterable/functions';
import { Cons, List, Nil } from '../list/definitions';
import { toArray as fromList } from '../list/functions';
import { filterMap as deriveFilterMap } from '../typeclasses/functions';
import { ArrayF } from './internal';
export { fromIterable, fromList };

const _forEach = <a>(xs: ArrayLike<a>, f: (a: a, i: number) => void): void => {
  for (let i = 0, len = xs.length; i < len; i++) f(xs[i]!, i);
};

export const foldLeft =
  <a, b>(
    seed: b,
    f: (acc: b, a: a, i: number) => b
  ): ((xs: ArrayLike<a>) => b) =>
  xs => {
    let acc = seed;
    _forEach(xs, (a, i) => {
      acc = f(acc, a, i);
    });
    return acc;
  };

const _foldLeftToNewArray =
  <a, b>(f: (push: (_: b) => void) => (a: a, i: number) => void) =>
  (xs: ArrayLike<a>): b[] => {
    const result: b[] = [];
    _forEach(
      xs,
      f(b => result.push(b))
    );
    return result;
  };

export const foldRight =
  <a, b>(seed: b, f: (a: a, acc: b) => b): ((xs: ArrayLike<a>) => b) =>
  xs => {
    let acc = seed;
    for (let i = xs.length - 1; i >= 0; i--) acc = f(xs[i]!, acc);
    return acc;
  };

export const flatMap = <a, b>(
  f: (a: a, i: number) => ArrayLike<b>
): ((xs: ArrayLike<a>) => b[]) =>
  _foldLeftToNewArray(push => (a, i) => _forEach(f(a, i), push));
export const map = <a, b>(
  f: (a: a, i: number) => b
): ((xs: ArrayLike<a>) => b[]) =>
  _foldLeftToNewArray(push => (a, i) => push(f(a, i)));

export const filter: {
  <a, b extends a>(
    pred: (a: a, i: number) => a is b
  ): (xs: ArrayLike<a>) => b[];
  <a>(pred: (a: a, i: number) => boolean): (xs: ArrayLike<a>) => a[];
} = <a>(pred: (a: a, i: number) => boolean) =>
  _foldLeftToNewArray<a, a>(push => (a, i) => {
    if (pred(a, i)) push(a);
  });

export const filterMap = /* #__PURE__ */ deriveFilterMap<ArrayF>({
  map,
  filter,
});

export const toList: <a>(xs: ArrayLike<a>) => List<a> =
  /* #__PURE__ */ foldRight<any, List<any>>(Nil, Cons);
