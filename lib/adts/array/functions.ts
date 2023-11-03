import { I } from '../iterable';
import { monoidMin } from '../number';
import {
  InType,
  Kind,
  Monoid,
  MonoidK,
  OutType,
  SequenceTuple,
  T,
  UnsequenceTuple,
} from '../typeclasses';
import {
  ArrayF,
  arrayFoldLeft,
  arraySequence,
  arrayTraverse,
} from './internal';

export const empty = <a = never>(): a[] => [];
export const of: <a>(value: a) => a[] = x => [x];
export const forEach = <a>(f: (a: a, i: number) => void) =>
  arrayFoldLeft<a, void>(void 0, (_, a, i) => f(a, i));

const mutableAppend = <a>(xs: a[], x: a): a[] => (xs.push(x), xs);

export const flatMap = <a, b>(f: (a: a, i: number) => ArrayLike<b>) =>
  foldLeft<a, b[]>([], (bs, a, i) =>
    foldLeft<b, b[]>(bs, (bs, b) => mutableAppend(bs, b))(f(a, i))
  );
export const map = <a, b>(f: (a: a, i: number) => b) =>
  foldLeft<a, b[]>([], (bs, a, i) => mutableAppend(bs, f(a, i)));
export const ap: <a>(
  fa: ArrayLike<a>
) => <b>(ff: ArrayLike<(_: a) => b>) => b[] = T.deriveAp<ArrayF>({
  of,
  flatMap,
});

export const foldMap: {
  <a, b>(M: Monoid<b>, f: (_: a) => b): (fa: ArrayLike<a>) => b;
  <F extends Kind, a, b, e>(
    M: MonoidK<F>,
    f: (_: a) => InType<F, e, a>
  ): (fa: ArrayLike<a>) => OutType<F, e, b>;
} = <a, b>(M: Monoid<b>, f: (_: a) => b) =>
  foldLeft<a, b>(M.empty(), (acc, a) => M.concat(acc, f(a)));

export const liftN: <A extends unknown[], b>(
  f: (...args: A) => b
) => (...fs: UnsequenceTuple<ArrayF, never, A, []>) => b[] =
  T.deriveLiftN<ArrayF>({
    ap,
    map,
    of,
  });
export const zip = <A extends Array<ArrayLike<unknown>>>(
  ...args: A
): SequenceTuple<ArrayF, A> => {
  const minLength = I.foldMap<A[number], number>(
    monoidMin,
    x => x.length
  )(args);
  const result: unknown[][] = [];
  for (let i = 0; i < minLength; i += 1) {
    result.push(map<ArrayLike<unknown>, unknown>(x => x[i]!)(args));
  }
  return result as SequenceTuple<ArrayF, never, A>;
};

export const foldLeft = arrayFoldLeft;
export const traverse = arrayTraverse;
export const sequence = arraySequence;
export const filter: {
  <a, b extends a>(
    pred: (a: a, i: number) => a is b
  ): (fa: ArrayLike<a>) => b[];
  <a>(pred: (a: a, i: number) => boolean): (fa: ArrayLike<a>) => a[];
} = <a>(pred: (a: a, i: number) => boolean): ((fa: ArrayLike<a>) => a[]) =>
  flatMap<a, a>((a, i) => (pred(a, i) ? [a] : []));

export const fromIterable = <a>(xs: Iterable<a>): a[] => {
  const result: a[] = [];
  for (const x of xs) result.push(x);
  return result;
};
