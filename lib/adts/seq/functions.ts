import { identity } from '../function';
import { Just, Maybe, Nothing, isJust } from '../maybe';
import {
  Applicative,
  Kind,
  Monoid,
  MonoidK,
  Type,
  derive,
} from '../typeclasses';
import { Seq } from './definitions';
import { Concat, SeqF } from './internal';

export const fromGenFn =
  <A extends unknown[], a>(gen: (...args: A) => Iterable<a>) =>
  (...args: A): a[] => [...gen(...args)];
export const fromArray =
  /* #__PURE__ */
  fromGenFn(function* <a>(arrayLike: ArrayLike<a>) {
    for (let i = 0, len = arrayLike.length; i < len; i += 1) {
      yield arrayLike[i] as a;
    }
  });
export const empty = <a = never>(): a[] => [];
export const of = <a>(value: a): a[] => [value];
export const concat = <a>(left: Seq<a>, right: Seq<a>): Seq<a> =>
  new Concat(left, right);
export const append = <a>(xs: Seq<a>, x: a) => concat(xs, [x]);
export const prepend = <a>(x: a, xs: Seq<a>) => concat([x], xs);
export const foldMap: {
  <F extends Kind>(
    M: MonoidK<F>
  ): <a, b, e = never>(
    f: (a: a, i: number) => Type<F, e, b>
  ) => (fa: Seq<a>) => Type<F, e, b>;
  <b>(M: Monoid<b>): <a>(f: (a: a, i: number) => b) => (fa: Seq<a>) => b;
} =
  <b>(M: Monoid<b>) =>
  <a>(f: (a: a, i: number) => b) =>
  (xs: Seq<a>) => {
    const go = (xs: a[], start: number, end: number): b => {
      if (end < start) return M.empty();
      if (end === start) return f(xs[start] as a, start);
      const pivot = start + ((end - start) >> 1);
      return M.concat(go(xs, start, pivot), go(xs, pivot + 1, end));
    };
    return go([...xs], 0, xs.length - 1);
  };
export const flatMap = /* #__PURE__ */ foldMap({ empty, concat }) as <a, b>(
  f: (a: a, i: number) => Seq<b>
) => (fa: Seq<a>) => Seq<b>;
export const map = <a, b>(f: (a: a, i: number) => b) =>
  flatMap((x: a, i) => [f(x, i)]);
export const ap = /* #__PURE__ */ derive.ap<SeqF>({ of, flatMap }) as <a>(
  fa: Seq<a>
) => <b>(ff: Seq<(_: a) => b>) => b[];
export const lift2 = /* #__PURE__ */ derive.lift2<SeqF>({ map, ap }) as <
  a,
  b,
  c,
>(
  f: (a: a, b: b) => c
) => (fa: Seq<a>, fb: Seq<b>) => c[];
export const foldLeft =
  <a, b>(seed: b, f: (acc: b, a: a, i: number) => b) =>
  (fa: Seq<a>): b => {
    let acc = seed,
      i = 0;
    for (const a of fa) acc = f(acc, a, i++);
    return acc;
  };

export const fold: {
  <F extends Kind>(
    M: MonoidK<F>
  ): <a, e = never>(fa: Seq<Type<F, e, a>>) => Type<F, e, a>;
  <a>(M: Monoid<a>): (fa: Seq<a>) => a;
} = <a>(M: Monoid<a>) => foldMap(M)<a>(identity);
export const traverse =
  <F extends Kind>(M: Applicative<F>) =>
  <a, b, e>(
    f: (a: a, i: number) => Type<F, e, b>
  ): ((fa: Seq<a>) => Type<F, e, b[]>) => {
    const lifted = derive.lift2(M)<b[], b, b[]>((ys, y) => (ys.push(y), ys));
    return foldLeft(M.of<b[], e>([]), (acc, x, i) => lifted(acc, f(x, i)));
  };
export const sequence = <F extends Kind>(
  M: Applicative<F>
): (<a, e>(tfa: Seq<Type<F, e, a>>) => Type<F, e, a[]>) =>
  traverse(M)(identity);
export const filterMap = <a, b>(f: (a: a, i: number) => Maybe<b>) =>
  fromGenFn<[fa: Seq<a>], b>(function* (fa: Seq<a>, i = 0) {
    for (const a of fa) {
      const maybe = f(a, i++);
      if (isJust(maybe)) yield maybe.value;
    }
  });
export const filter: {
  <a, b extends a>(pred: (a: a, i: number) => a is b): (fa: Seq<a>) => b[];
  <a>(pred: (a: a, i: number) => boolean): (fa: Seq<a>) => a[];
} = <a>(pred: (a: a, i: number) => boolean) =>
  fromGenFn<[fa: Seq<a>], a>(function* (fa: Seq<a>, i = 0) {
    for (const a of fa) if (pred(a, i++)) yield a;
  });
export const reverse = <a>(fa: Seq<a>): a[] => [...fa].reverse();
export const toNonEmptyArray = <a>(seq: Seq<a>): Maybe<[a, ...a[]]> =>
  seq.length === 0 ? Nothing : Just([...seq] as [a, ...a[]]);
export const first = <a>(seq: Seq<a>): Maybe<a> => {
  if (seq.length === 0) return Nothing;
  const [value] = seq;
  return Just(value as a);
};
