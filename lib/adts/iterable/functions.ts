import { A } from '../array';
import { Just, Maybe, Nothing, isJust, isNothing } from '../maybe';
import { monoidSum } from '../number';
import {
  InType,
  Kind,
  Monoid,
  MonoidK,
  OutType,
  SequenceTuple,
  T,
} from '../typeclasses';
import { ConcatIterable, IterableF } from './internal';
import { applicativeIteratorResult } from './result';

const _done: IteratorReturnResult<void> = { done: true, value: void 0 };
const Si: typeof Symbol.iterator = Symbol.iterator;
export const empty = <a = never>(): Iterable<a> => [];
export const of = <a>(value: a): Iterable<a> => [value];
export const flatMap =
  <a, b>(f: (a: a, i: number) => Iterable<b>) =>
  (fa: Iterable<a>): Iterable<b> =>
    Array.from(fa).flatMap((x, i) => Array.from(f(x, i)));
export const map: <a, b>(
  f: (a: a, i: number) => b
) => (fa: Iterable<a>) => Iterable<b> = T.deriveMap<IterableF>({ of, flatMap });
export const ap = T.deriveAp<IterableF>({ of, flatMap });
export const liftN = T.deriveLiftN<IterableF>({ ap, map, of });
export const unfold = <a, b>(
  seed: b,
  f: (seed: b) => Maybe<[value: a, next: b]>
): Iterable<a> => ({
  [Si]: () => {
    const obj = {
      next: () => {
        const maybe = f(seed);
        if (isNothing(maybe)) return (obj.next = () => _done)();
        seed = maybe.value[1];
        return { done: false, value: maybe.value[0] };
      },
    };
    return obj;
  },
});

const getNexts = <a>(fa: Iterator<a>[]): IteratorResult<a[]> =>
  A.traverse(applicativeIteratorResult)<Iterator<a>, a, any>(it => it.next())(
    fa
  );

export const zip: {
  <a, b>(as: Iterable<a>, bs: Iterable<b>): Iterable<[a, b]>;
  <T extends Iterable<unknown>[]>(...iterables: T): SequenceTuple<IterableF, T>;
} = <a>(...iterables: Iterable<a>[]) =>
  ({
    [Si]: (): Iterator<a[]> => {
      const its = A.map((it: Iterable<a>) => it[Si]())(iterables);
      return { next: () => getNexts(its) };
    },
  }) as any;
export const range = (from = 0, to = Infinity): Iterable<number> => {
  if (to < from)
    return unfold(from, x => (x < to ? Nothing : Just([x, x - 1])));
  return unfold(from, x => (x > to ? Nothing : Just([x, x + 1])));
};
export const entries = <a>(fa: Iterable<a>): Iterable<[number, a]> =>
  zip(range(), fa);

export const fromArray = function* <a>(fa: ArrayLike<a>): Iterable<a> {
  const len = fa.length;
  for (let i = 0; i < len; i += 1) yield fa[i]!;
};

export const mapArray = <a, b>(f: (a: a, i: number) => ArrayLike<b>) =>
  flatMap<a, b>((a, i) => fromArray(f(a, i)));

export const foldLeft =
  <a, b>(seed: b, f: (acc: b, a: a, i: number) => b) =>
  (fa: Iterable<a>): b => {
    let acc = seed;
    for (const [i, a] of entries(fa)) acc = f(acc, a, i);
    return acc;
  };

export const foldMap: {
  <a, b>(M: Monoid<b>, f: (_: a) => b): (fa: Iterable<a>) => b;
  <F extends Kind, a, b, e>(
    M: MonoidK<F>,
    f: (_: a) => InType<F, e, a>
  ): (fa: Iterable<a>) => OutType<F, e, b>;
} = <a, b>(M: Monoid<b>, f: (_: a) => b) =>
  foldLeft<a, b>(M.empty(), (acc, a) => M.concat(acc, f(a)));

export const fold = <a>(M: Monoid<a>) => foldMap<a, a>(M, x => x);

export const filterMap =
  <a, b>(f: (a: a, i: number) => Maybe<b>) =>
  (fa: Iterable<a>): Iterable<b> => ({
    *[Si]() {
      for (const [i, a] of entries(fa)) {
        const maybe = f(a, i);
        if (isJust(maybe)) yield maybe.value;
      }
    },
  });
export const compact: <a>(fa: Iterable<Maybe<a>>) => Iterable<a> = filterMap(
  x => x
);

export const filter: {
  <a, b extends a>(
    pred: (a: a, i: number) => a is b
  ): (fa: Iterable<a>) => Iterable<b>;
  <a>(pred: (a: a, i: number) => boolean): (fa: Iterable<a>) => Iterable<a>;
} = <a>(pred: (a: a, i: number) => boolean) =>
  filterMap<a, a>((x, i) => (pred(x, i) ? Just(x) : Nothing));

export const concat = <a>(fa: Iterable<a>, fb: Iterable<a>): Iterable<a> =>
  new ConcatIterable(fa, fb);

export const length = foldMap<unknown, number>(monoidSum, _ => 1);

export const isEmpty = <a>(fa: Iterable<a>): boolean => isNothing(head(fa));

export const take =
  (n: number) =>
  <a>(fa: Iterable<a>): Iterable<a> => ({
    *[Si]() {
      const it = fa[Si]();
      while (n-- > 0) {
        const res = it.next();
        if (!res.done) yield res.value;
      }
    },
  });

export const head = <a>(fa: Iterable<a>): Maybe<a> =>
  reduce<a, Maybe<a>>(Nothing, (_, x) => Just(x))(take(1)(fa));

export const reduce =
  <a, b>(seed: b, f: (acc: b, a: a, i: number) => b) =>
  (fa: Iterable<a>): b => {
    let acc = seed;
    for (const [i, a] of entries(fa)) acc = f(acc, a, i);
    return acc;
  };

export const toArray = <a>(fa: Iterable<a>): a[] => Array.from(fa);
