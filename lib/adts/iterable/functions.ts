import { apply, identity } from '../function';
import { toIterable as fromList } from '../list/functions';
import { Just, Maybe, Nothing } from '../maybe';
import {
  Applicative,
  derive,
  Kind,
  Monoid,
  MonoidK,
  Type,
} from '../typeclasses';
import { Concat, IterableF } from './internal';
export { fromList };

type Reducer<a, b> = (acc: b, a: a, i: number) => b;

const makeEqIterable =
  <T>(eq: (a: T, b: T) => boolean = (a, b) => a === b) =>
  (left: Iterable<T>, right: Iterable<T>): boolean => {
    const itL = left[Symbol.iterator]();
    const itR = right[Symbol.iterator]();
    let resultL = itL.next();
    let resultR = itR.next();
    let i = 0;
    for (; i < Number.MAX_SAFE_INTEGER; i++) {
      if (resultL.done || resultR.done) {
        if (itL.return) itL.return();
        if (itR.return) itR.return();
        return resultL.done === resultR.done;
      }
      if (!eq(resultL.value, resultR.value)) {
        if (itL.return) itL.return();
        if (itR.return) itR.return();
        return false;
      }
      resultL = itL.next();
      resultR = itR.next();
    }
    if (i >= Number.MAX_SAFE_INTEGER) throw new Error('Too many iterations.');
    return false;
  };
export { makeEqIterable as makeEq };

const forEachInIterable =
  <a>(f: (a: a, i: number) => void) =>
  (xs: Iterable<a>): void => {
    let i = 0;
    for (const x of xs) f(x, i++);
  };
export { forEachInIterable as forEach };

const ofIterable = <a>(value: a): a[] => [value];
export { ofIterable as of };
const foldLeftIterable =
  <a, b>(seed: b, f: Reducer<a, b>) =>
  (xs: Iterable<a>): b => {
    let acc = seed;
    let i = 0;
    for (const x of xs) acc = f(acc, x, i++);
    return acc;
  };
export { foldLeftIterable as foldLeft };
const concatIterable = <a>(
  left: Iterable<a>,
  right: Iterable<a>
): Iterable<a> => new Concat(left, right);
export { concatIterable as concat };
const foldMapIterable: {
  <F extends Kind>(
    M: MonoidK<F>
  ): <a, b, e = never>(
    f: (a: a, i: number) => Type<F, e, b>
  ) => (fa: Iterable<a>) => Type<F, e, b>;
  <b>(M: Monoid<b>): <a>(f: (a: a, i: number) => b) => (fa: Iterable<a>) => b;
} =
  <m>(M: Monoid<m>) =>
  <a>(f: (a: a, i: number) => m) =>
  (xs: Iterable<a>) =>
    foldLeftIterable<a, m>(M.empty(), (left, x, i) => M.concat(left, f(x, i)))(
      xs
    );
export { foldMapIterable as foldMap };
const flatMapIterable =
  <a, b>(f: (a: a, i: number) => Iterable<b>) =>
  (xs: Iterable<a>): Iterable<b> => ({
    [Symbol.iterator]() {
      const outer = xs[Symbol.iterator]();
      let inner: Iterator<b> | null = null;
      let index = 0;
      return {
        next() {
          while (true) {
            if (inner === null) {
              const result = outer.next();
              if (result.done === true) return result;
              inner = f(result.value, index++)[Symbol.iterator]();
            }
            const result = inner.next();
            if (result.done === false) return result;
            inner = null;
          }
        },
      };
    },
  });
export { flatMapIterable as flatMap };
const mapIterable =
  <a, b>(f: (a: a, i: number) => b) =>
  (xs: Iterable<a>): Iterable<b> => ({
    [Symbol.iterator]() {
      const it = xs[Symbol.iterator]();
      let index = 0;
      return {
        next() {
          const result = it.next();
          if (result.done === true) return result;
          return { done: false, value: f(result.value, index++) };
        },
      };
    },
  });
export { mapIterable as map };
const filterIterable: {
  <a, b extends a>(
    pred: (a: a, i: number) => a is b
  ): (xs: Iterable<a>) => Iterable<b>;
  <a>(pred: (a: a, i: number) => boolean): (xs: Iterable<a>) => Iterable<a>;
} =
  <a>(pred: (a: a, i: number) => boolean) =>
  (xs: Iterable<a>): Iterable<a> => ({
    [Symbol.iterator]() {
      const it = xs[Symbol.iterator]();
      let index = 0;
      return {
        next() {
          let result = it.next();
          while (result.done !== true && pred(result.value, index++) !== true) {
            result = it.next();
          }
          return result;
        },
      };
    },
  });
export { filterIterable as filter };
export const filterMap = /* #__PURE__ */ derive.filterMap<IterableF>({
  map: mapIterable,
  filter: filterIterable,
});

const iterableToArray = <a>(xs: Iterable<a>): a[] =>
  foldLeftIterable<a, a[]>([], (acc, x) => (acc.push(x), acc))(xs);
export { iterableToArray as toArray };
const lift2Iterable =
  <a, b, c>(f: (a: a, b: b) => c) =>
  (fa: Iterable<a>, fb: Iterable<b>): Iterable<c> => ({
    *[Symbol.iterator]() {
      for (const a of fa) for (const b of fb) yield f(a, b);
    },
  });
export { lift2Iterable as lift2 };
const apIterable =
  <a>(fa: Iterable<a>) =>
  <b>(ff: Iterable<(_: a) => b>): Iterable<b> =>
    lift2Iterable<(_: a) => b, a, b>(apply)(ff, fa);
export { apIterable as ap };

const foldIterable: {
  <F extends Kind>(
    M: MonoidK<F>
  ): <a, e = never>(fa: Iterable<Type<F, e, a>>) => Type<F, e, a>;
  <a>(M: Monoid<a>): (fa: Iterable<a>) => a;
} = <a>(M: Monoid<a>) => foldMapIterable(M)<a>(identity);
export { foldIterable as fold };
const traverseIterable =
  <F extends Kind>(M: Applicative<F>) =>
  <a, b, e>(f: (a: a, i: number) => Type<F, e, b>) =>
  (fa: Iterable<a>): Type<F, e, b[]> =>
    sequenceIterable(M)(mapIterable(f)(fa));
export { traverseIterable as traverse };

const sequenceIterable =
  <F extends Kind>(M: Applicative<F>) =>
  <a, e>(tfa: Iterable<Type<F, e, a>>): Type<F, e, a[]> => {
    const appendPartial = M.map((xs: a[]) => (x: a) => (xs.push(x), xs));
    let result = M.of<a[], e>([]);
    for (const fa of tfa) {
      result = M.ap(fa)<a[], e>(appendPartial(result));
    }
    return result;
  };
export { sequenceIterable as sequence };

const iterableToNonEmptyArray = <a>(xs: Iterable<a>): Maybe<[a, ...a[]]> => {
  const arr = [...xs];
  if (arr.length > 0) return Just(xs as [a, ...a[]]);
  return Nothing;
};
export { iterableToNonEmptyArray as toNonEmptyArray };

const firstElementOfIterable = <a>(xs: Iterable<a>): Maybe<a> => {
  for (const x of xs) return Just(x);
  return Nothing;
};
export { firstElementOfIterable as first };

const reverseIterable = <a>(fa: Iterable<a>): a[] => [...fa].reverse();
export { reverseIterable as reverse };
