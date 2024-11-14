import { toArray as fromIterable } from '../iterable/functions';
import { Cons, List, Nil } from '../list/definitions';
import { toArray as fromList } from '../list/functions';
import { filterMap as deriveFilterMap } from '../typeclasses/functions';
import { ArrayF } from './internal';
export { fromIterable, fromList };

const _forEachInArray = <a>(
  xs: ArrayLike<a>,
  f: (a: a, i: number) => void
): void => {
  for (let i = 0, len = xs.length; i < len; i++) f(xs[i]!, i);
};

const foldLeftArray =
  <a, b>(seed: b, f: (acc: b, a: a, i: number) => b) =>
  (xs: ArrayLike<a>): b => {
    let acc = seed;
    _forEachInArray(xs, (a, i) => {
      acc = f(acc, a, i);
    });
    return acc;
  };
export { foldLeftArray as foldLeft };

const _foldLeftArrayToNew =
  <a, b>(f: (push: (_: b) => void) => (a: a, i: number) => void) =>
  (xs: ArrayLike<a>): b[] => {
    const result: b[] = [];
    _forEachInArray(
      xs,
      f(b => result.push(b))
    );
    return result;
  };

const foldRightArray =
  <a, b>(seed: b, f: (a: a, acc: b) => b): ((xs: ArrayLike<a>) => b) =>
  xs => {
    let acc = seed;
    for (let i = xs.length - 1; i >= 0; i--) acc = f(xs[i]!, acc);
    return acc;
  };
export { foldRightArray as foldRight };

const flatMapArray = <a, b>(
  f: (a: a, i: number) => ArrayLike<b>
): ((xs: ArrayLike<a>) => b[]) =>
  _foldLeftArrayToNew(push => (a, i) => _forEachInArray(f(a, i), push));
export { flatMapArray as flatMap };

const mapArray = <a, b>(
  f: (a: a, i: number) => b
): ((xs: ArrayLike<a>) => b[]) =>
  _foldLeftArrayToNew(push => (a, i) => push(f(a, i)));
export { mapArray as map };

const filterArray: {
  <a, b extends a>(
    pred: (a: a, i: number) => a is b
  ): (xs: ArrayLike<a>) => b[];
  <a>(pred: (a: a, i: number) => boolean): (xs: ArrayLike<a>) => a[];
} = <a>(pred: (a: a, i: number) => boolean) =>
  _foldLeftArrayToNew<a, a>(push => (a, i) => {
    if (pred(a, i)) push(a);
  });
export { filterArray as filter };

const filterMapArray = /* #__PURE__ */ deriveFilterMap<ArrayF>({
  map: mapArray,
  filter: filterArray,
});
export { filterMapArray as filterMap };

const arrayToList: <a>(xs: ArrayLike<a>) => List<a> =
  /* #__PURE__ */ foldRightArray<any, List<any>>(Nil, Cons);
export { arrayToList as toList };
