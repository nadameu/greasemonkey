import { apply } from '../function/functions';
import { monoidSum } from '../index';
import { Just, Maybe, Nothing, isJust, isNothing } from '../maybe/definitions';
import { tuple } from '../tuple/definitions';
import { Monoid } from '../typeclasses/definitions';
import { isYield } from './result/definitions';

const Si: typeof Symbol.iterator = Symbol.iterator;
export const empty = <a = never>(): Iterable<a> => [];
export const of = <a>(value: a): Iterable<a> => [value];
export const range = (from = 0, to = Infinity): Iterable<number> => {
  if (to < from) throw new Error('Range must be in ascending order.');
  return {
    *[Si]() {
      for (let i = from; i <= to; i += 1) yield i;
    },
  };
};
export const entries = <a>(fa: Iterable<a>): Iterable<[a, number]> => zip(fa, range());
export const flatMap =
  <a, b>(f: (a: a, i: number) => Iterable<b>) =>
  (fa: Iterable<a>): Iterable<b> => ({
    *[Si]() {
      for (const [a, i] of entries(fa)) for (const b of f(a, i)) yield b;
    },
  });

export const fromArray = <a>(fa: ArrayLike<a>): Iterable<a> => ({
  *[Si]() {
    const len = fa.length;
    for (let i = 0; i < len; i += 1) yield fa[i]!;
  },
});

export const mapArray = <a, b>(f: (a: a, i: number) => ArrayLike<b>) =>
  flatMap<a, b>((a, i) => fromArray(f(a, i)));

export const map =
  <a, b>(f: (a: a, i: number) => b) =>
  (fa: Iterable<a>): Iterable<b> => ({
    *[Si]() {
      for (const [a, i] of entries(fa)) yield f(a, i);
    },
  });

export const zip = <a, b>(fa: Iterable<a>, fb: Iterable<b>): Iterable<[a, b]> => ({
  *[Si]() {
    const ia = fa[Si]();
    const ib = fb[Si]();
    for (
      let ra = ia.next(), rb = ib.next();
      isYield(ra) && isYield(rb);
      ra = ia.next(), rb = ib.next()
    ) {
      yield tuple(ra.value, rb.value);
    }
  },
});

export const foldMap =
  <a, b>(M: Monoid<b>, f: (_: a) => b) =>
  (fa: Iterable<a>): b => {
    let m = M.empty();
    for (const a of fa) m = M.concat(m, f(a));
    return m;
  };

export const fold = <a>(M: Monoid<a>) => foldMap<a, a>(M, x => x);

export const filterMap =
  <a, b>(f: (a: a, i: number) => Maybe<b>) =>
  (fa: Iterable<a>): Iterable<b> => ({
    *[Si]() {
      for (const [a, i] of entries(fa)) {
        const maybe = f(a, i);
        if (isJust(maybe)) yield maybe.value;
      }
    },
  });
export const compact: <a>(fa: Iterable<Maybe<a>>) => Iterable<a> = filterMap(x => x);

export const filter: {
  <a, b extends a>(pred: (a: a, i: number) => a is b): (fa: Iterable<a>) => Iterable<b>;
  <a>(pred: (a: a, i: number) => boolean): (fa: Iterable<a>) => Iterable<a>;
} = <a>(pred: (a: a, i: number) => boolean) =>
  filterMap<a, a>((x, i) => (pred(x, i) ? Just(x) : Nothing));

export const concat = <a>(fa: Iterable<a>, fb: Iterable<a>): Iterable<a> => ({
  *[Si]() {
    for (const a of fa) yield a;
    for (const b of fb) yield b;
  },
});

export const length = foldMap<unknown, number>(monoidSum, _ => 1);

export const isEmpty = <a>(fa: Iterable<a>): boolean => isNothing(head(fa));

export const fromMaybe = <a>(fa: Maybe<a>): Iterable<a> => (isJust(fa) ? [fa.value] : []);

export const take =
  (n: number) =>
  <a>(fa: Iterable<a>): Iterable<a> => ({
    *[Si]() {
      const it = fa[Si]();
      while (n-- > 0) {
        const res = it.next();
        if (isYield(res)) yield res.value;
      }
    },
  });

export const head = <a>(fa: Iterable<a>): Maybe<a> =>
  reduce<a, Maybe<a>>(Nothing, (_, x) => Just(x))(take(1)(fa));

export const reduce =
  <a, b>(seed: b, f: (acc: b, a: a, i: number) => b) =>
  (fa: Iterable<a>): b => {
    let acc = seed;
    for (const [a, i] of entries(fa)) acc = f(acc, a, i);
    return acc;
  };

export const toArray = <a>(fa: Iterable<a>): a[] => Array.from(fa);
