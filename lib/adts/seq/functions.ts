import { identity } from '../function';
import { isJust, Just, Maybe, Nothing } from '../maybe';
import {
  Applicative,
  derive,
  Kind,
  Monoid,
  MonoidK,
  Type,
} from '../typeclasses';
import { Seq } from './definitions';
import { SeqF } from './internal';

type Reducer<a, b> = (acc: b, a: a, i: number) => b;
type Transducer<a, b> = <c>(reducer: Reducer<b, c>) => Reducer<a, c>;

export const of = <a>(value: a): a[] => [value];
export const foldLeft =
  <a, b>(seed: b, f: Reducer<a, b>) =>
  (seq: Seq<a>): b => {
    let acc = seed;
    for (let i = 0, len = seq.length; i < len; i++) acc = f(acc, seq[i]!, i);
    return acc;
  };
const _map =
  <a, b>(f: (a: a, i: number) => b): Transducer<a, b> =>
  next =>
  (acc, a, i) =>
    next(acc, f(a, i), i);
const _filter: {
  <a, b extends a>(pred: (a: a, i: number) => a is b): Transducer<a, b>;
  <a>(pred: (a: a, i: number) => boolean): Transducer<a, a>;
} =
  <a>(pred: (a: a, i: number) => boolean): Transducer<a, a> =>
  (next, j = 0) =>
  (acc, a, i) => {
    if (pred(a, i)) {
      return next(acc, a, j++);
    }
    return acc;
  };
const _flatMap =
  <a, b>(f: (a: a, i: number) => Seq<b>): Transducer<a, b> =>
  (next, j = 0) =>
  (acc, a, i) =>
    foldLeft(acc, (acc, b: b) => next(acc, b, j++))(f(a, i));
const _transduceToArray =
  <a, b>(transducer: (reducer: Reducer<b, b[]>) => Reducer<a, b[]>) =>
  (seq: Seq<a>): b[] =>
    foldLeft(
      [],
      transducer((bs, b) => (bs.push(b), bs))
    )(seq);

export const foldMap: {
  <F extends Kind>(
    M: MonoidK<F>
  ): <a, b, e = never>(
    f: (a: a, i: number) => Type<F, e, b>
  ) => (fa: Seq<a>) => Type<F, e, b>;
  <b>(M: Monoid<b>): <a>(f: (a: a, i: number) => b) => (fa: Seq<a>) => b;
} =
  <m>(M: Monoid<m>) =>
  <a>(f: (a: a, i: number) => m) =>
    foldLeft(M.empty(), _map(f)(M.concat));
export const flatMap = <a, b>(f: (a: a, i: number) => Seq<b>) =>
  _transduceToArray(_flatMap(f)<b[]>);
export const map = <a, b>(f: (a: a, i: number) => b) =>
  _transduceToArray(_map(f)<b[]>);
export const filter: {
  <a, b extends a>(pred: (a: a, i: number) => a is b): (seq: Seq<a>) => b[];
  <a>(pred: (a: a, i: number) => boolean): (seq: Seq<a>) => a[];
} = <a>(pred: (a: a, i: number) => boolean) =>
  _transduceToArray(_filter(pred)<a[]>);
export const filterMap = <a, b>(f: (a: a, i: number) => Maybe<b>) =>
  _transduceToArray<a, b>(next =>
    _map(f)(
      _filter<Maybe<b>, Just<b>>(isJust)(_map((x: Just<b>) => x.value)(next))
    )
  );
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
    const lifted = derive.lift2(M)<b[], b, b[]>((ys, y) => (ys.push(y), ys));
    return foldLeft(M.of<b[], e>([]), (acc, a: a, i) => lifted(acc, f(a, i)))(
      fa
    );
  };
export const sequence = <F extends Kind>(
  M: Applicative<F>
): (<a, e>(tfa: Seq<Type<F, e, a>>) => Type<F, e, a[]>) =>
  traverse(M)(identity);

export const toNonEmptyArray = <a>(seq: Seq<a>): Maybe<[a, ...a[]]> =>
  seq.length === 0 ? Nothing : Just([...seq] as [a, ...a[]]);

export const first = <a>(seq: Seq<a>): Maybe<a> => {
  if (seq.length === 0) return Nothing;
  const [value] = seq;
  return Just(value as a);
};

export const reverse = <a>(fa: Seq<a>): a[] => [...fa].reverse();
