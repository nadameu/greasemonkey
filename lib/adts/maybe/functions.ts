import { Either, Left, Right } from '../either';
import { derive } from '../typeclasses';
import { Just, Maybe, Nothing, isJust, isNothing } from './definitions';
import { MaybeF } from './internal';

export const flatMap =
  <a, b>(f: (_: a) => Maybe<b>) =>
  (fa: Maybe<a>): Maybe<b> =>
    isNothing(fa) ? Nothing : f(fa.value);

export const flatten: <a>(ffa: Maybe<Maybe<a>>) => Maybe<a> =
  /* #__PURE__*/ flatMap(x => x);

export const of: <a>(value: a) => Maybe<a> = Just;

export const map = /* #__PURE__ */ derive.map<MaybeF>({ of, flatMap });
export const ap = /* #__PURE__ */ derive.ap<MaybeF>({ of, flatMap });
export const lift2 = /* #__PURE__ */ derive.lift2<MaybeF>({ map, ap });

export const zip = <a, b>(fa: Maybe<a>, fb: Maybe<b>): Maybe<[a, b]> =>
  isJust(fa) && isJust(fb) ? Just([fa.value, fb.value]) : Nothing;

export const orElse =
  <a>(ifNothing: () => Maybe<a>) =>
  (fa: Maybe<a>): Maybe<a> =>
    isNothing(fa) ? ifNothing() : fa;

export const zero = <a = never>(): Maybe<a> => Nothing;
export const alt = <a>(fa: Maybe<a>, fb: Maybe<a>): Maybe<a> =>
  isNothing(fa) ? fb : fa;

export const or = <a>(alternative: Maybe<a>) => orElse(() => alternative);

export const fromNullable = <a>(value: a | null | undefined): Maybe<a> =>
  value == null ? Nothing : Just(value);

export const mapNullable = <a, b>(f: (_: a) => b | null | undefined) =>
  flatMap<a, b>(x => fromNullable(f(x)));

export const getOr = <a>(defaultValue: a) => getOrElse(() => defaultValue);

export const getOrElse: <a>(
  getDefault: () => a
) => <b>(fa: Maybe<b>) => a extends b ? b : a | b =
  <a>(getDefault: () => a) =>
  <b>(fa: Maybe<b>): any =>
    isNothing(fa) ? getDefault() : fa.value;

export const maybeBool: {
  <a, b extends a>(pred: (a: a) => a is b): (a: a) => Maybe<b>;
  <a>(pred: (_: a) => boolean): (a: a) => Maybe<a>;
} =
  <a>(pred: (_: a) => boolean) =>
  (a: a): Maybe<a> =>
    pred(a) ? Just(a) : Nothing;

export const filter: {
  <a, b extends a>(pred: (a: a) => a is b): (fa: Maybe<a>) => Maybe<b>;
  <a>(pred: (_: a) => boolean): (fa: Maybe<a>) => Maybe<a>;
} = <a>(pred: (_: a) => boolean) => flatMap(maybeBool(pred));

export const mapProp = <T, K extends keyof T>(
  prop: K
): ((fa: Maybe<T>) => Maybe<NonNullable<T[K]>>) =>
  mapNullable<T, any>(obj => obj[prop]);

export const toEither =
  <a>(whenLeft: () => a) =>
  <b>(fb: Maybe<b>): Either<a, b> =>
    isNothing(fb) ? Left(whenLeft()) : Right(fb.value);
