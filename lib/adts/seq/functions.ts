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
  left.length === 0
    ? right
    : right.length === 0
      ? left
      : new Concat(left, right);
export const append = <a>(xs: Seq<a>, x: a): Seq<a> =>
  xs.length === 0 ? [x] : new Concat(xs, [x]);
export const prepend = <a>(x: a, xs: Seq<a>): Seq<a> =>
  xs.length === 0 ? [x] : new Concat([x], xs);
export const flatMap = <a, b>(f: (a: a, i: number) => Seq<b>) =>
  fromGenFn<[fa: Seq<a>], b>(function* (fa: Seq<a>, i = 0) {
    for (const a of fa) yield* f(a, i++);
  });
export const map = <a, b>(f: (a: a, i: number) => b) =>
  fromGenFn<[fa: Seq<a>], b>(function* (fa, i = 0) {
    for (const a of fa) yield f(a, i++);
  });
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
    foldLeft<a, b>(M.empty(), (bs, a, i) => M.concat(bs, f(a, i)));
export const fold: {
  <F extends Kind>(
    M: MonoidK<F>
  ): <a, e = never>(fa: Seq<Type<F, e, a>>) => Type<F, e, a>;
  <a>(M: Monoid<a>): (fa: Seq<a>) => a;
} = <a>(M: Monoid<a>) => foldMap(M)<a>(identity);
export const traverse =
  <F extends Kind>(M: Applicative<F>) =>
  <a, b, e>(f: (a: a, i: number) => Type<F, e, b>) =>
  (fa: Seq<a>): Type<F, e, b[]> => {
    const lifted = derive.lift2(M)<Seq<b>, b, Seq<b>>(append);
    return M.map<Seq<b>, b[]>(xs => [...xs])<e>(
      foldLeft<a, Type<F, e, Seq<b>>>(M.of(empty()), (ftb, a, i) =>
        lifted(ftb, f(a, i))
      )(fa)
    );
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
  filterMap<a, a>((a, i) => (pred(a, i) ? Just(a) : Nothing));
export const reverse = <a>(fa: Seq<a>): a[] => [...fa].reverse();
export const toNonEmptyArray = <a>(seq: Seq<a>): Maybe<[a, ...a[]]> =>
  seq.length === 0 ? Nothing : Just([...seq] as [a, ...a[]]);
