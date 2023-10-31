import { Just, Maybe, Nothing, isJust, isNothing } from './definitions';

export const flatMap =
  <a, b>(f: (_: a) => Maybe<b>) =>
  (fa: Maybe<a>): Maybe<b> =>
    isNothing(fa) ? Nothing : f(fa.value);

export const of: <a>(value: a) => Maybe<a> = Just;

export const map = <a, b>(f: (_: a) => b) => flatMap<a, b>(x => of(f(x)));

export const zip = <a, b>(fa: Maybe<a>, fb: Maybe<b>): Maybe<[a, b]> =>
  isJust(fa) && isJust(fb) ? Just([fa.value, fb.value]) : Nothing;

export const orElse =
  <a>(ifNothing: () => Maybe<a>) =>
  (fa: Maybe<a>): Maybe<a> =>
    isNothing(fa) ? ifNothing() : fa;

export const zero = <a = never>(): Maybe<a> => Nothing;
export const alt = <a>(fa: Maybe<a>, fb: Maybe<a>): Maybe<a> => (isNothing(fa) ? fb : fa);

export const or = <a>(alternative: Maybe<a>) => orElse(() => alternative);

export const fromNullable = <a>(value: a | null | undefined): Maybe<a> =>
  value == null ? Nothing : Just(value);

export const mapNullable = <a, b>(f: (_: a) => b | null | undefined) =>
  flatMap<a, b>(x => fromNullable(f(x)));

export const getOr = <a>(defaultValue: a) => getOrElse(() => defaultValue);

export const getOrElse =
  <a>(getDefault: () => a) =>
  (fa: Maybe<a>): a =>
    isNothing(fa) ? getDefault() : fa.value;

export const maybeBool: {
  <a>(pred: (_: a) => boolean): (a: a) => Maybe<a>;
  <a, b extends a>(pred: (a: a) => a is b): (a: a) => Maybe<b>;
} =
  <a>(pred: (_: a) => boolean) =>
  (a: a): Maybe<a> =>
    pred(a) ? Just(a) : Nothing;
