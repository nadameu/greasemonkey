import { apply, flow, identity } from '../function';
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
export { toIterable as fromList } from '../list/functions';

type Reducer<a, b> = (acc: b, a: a, i: number) => b;

export const makeEq =
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
export const of = <a>(value: a): a[] => [value];
export const foldLeft =
  <a, b>(seed: b, f: Reducer<a, b>) =>
  (xs: Iterable<a>): b => {
    let acc = seed;
    let i = 0;
    for (const x of xs) acc = f(acc, x, i++);
    return acc;
  };
export const concat = <a>(left: Iterable<a>, right: Iterable<a>): Iterable<a> =>
  new Concat(left, right);
export const foldMap: {
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
    foldLeft<a, m>(M.empty(), (left, x, i) => M.concat(left, f(x, i)))(xs);
export const flatMap =
  <a, b>(f: (a: a, i: number) => Iterable<b>) =>
  (xs: Iterable<a>): Iterable<b> => ({
    *[Symbol.iterator](i = 0) {
      for (const x of xs) {
        for (const y of f(x, i++)) yield y;
      }
    },
  });
export const map =
  <a, b>(f: (a: a, i: number) => b) =>
  (xs: Iterable<a>): Iterable<b> => ({
    *[Symbol.iterator](i = 0) {
      for (const x of xs) yield f(x, i++);
    },
  });
export const filter: {
  <a, b extends a>(
    pred: (a: a, i: number) => a is b
  ): (xs: Iterable<a>) => Iterable<b>;
  <a>(pred: (a: a, i: number) => boolean): (xs: Iterable<a>) => Iterable<a>;
} =
  <a>(pred: (a: a, i: number) => boolean) =>
  (xs: Iterable<a>): Iterable<a> => ({
    *[Symbol.iterator](i = 0) {
      for (const x of xs) if (pred(x, i++)) yield x;
    },
  });
export const filterMap = /* #__PURE__ */ derive.filterMap<IterableF>({
  map,
  filter,
});

export const toArray = <a>(xs: Iterable<a>): a[] =>
  foldLeft<a, a[]>([], (acc, x) => (acc.push(x), acc))(xs);
export const lift2 =
  <a, b, c>(f: (a: a, b: b) => c) =>
  (fa: Iterable<a>, fb: Iterable<b>): Iterable<c> => ({
    *[Symbol.iterator]() {
      for (const a of fa) for (const b of fb) yield f(a, b);
    },
  });
export const ap =
  <a>(fa: Iterable<a>) =>
  <b>(ff: Iterable<(_: a) => b>): Iterable<b> =>
    lift2<(_: a) => b, a, b>(apply)(ff, fa);

export const fold: {
  <F extends Kind>(
    M: MonoidK<F>
  ): <a, e = never>(fa: Iterable<Type<F, e, a>>) => Type<F, e, a>;
  <a>(M: Monoid<a>): (fa: Iterable<a>) => a;
} = <a>(M: Monoid<a>) => foldMap(M)<a>(identity);
export const traverse =
  <F extends Kind>(M: Applicative<F>) =>
  <a, b, e>(f: (a: a, i: number) => Type<F, e, b>) =>
  (fa: Iterable<a>): Type<F, e, b[]> =>
    sequence(M)(map(f)(fa));

export const sequence =
  <F extends Kind>(M: Applicative<F>) =>
  <a, e>(tfa: Iterable<Type<F, e, a>>): Type<F, e, a[]> => {
    const appendPartial = M.map((xs: a[]) => (x: a) => (xs.push(x), xs));
    let result = M.of<a[], e>([]);
    for (const fa of tfa) {
      result = M.ap(fa)<a[], e>(appendPartial(result));
    }
    return result;
  };

export const toNonEmptyArray = <a>(xs: Iterable<a>): Maybe<[a, ...a[]]> => {
  const arr = [...xs];
  if (arr.length > 0) return Just(xs as [a, ...a[]]);
  return Nothing;
};

export const first = <a>(xs: Iterable<a>): Maybe<a> => {
  for (const x of xs) return Just(x);
  return Nothing;
};

export const reverse = <a>(fa: Iterable<a>): a[] => [...fa].reverse();
