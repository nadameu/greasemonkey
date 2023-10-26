type ValidTagName = string | number | symbol;
type ValidTag = string | number | symbol;

type Struct<T> = { 0: { [K in keyof T]: T[K] } }[0];
type Tag<TN extends ValidTagName, T extends ValidTag> = { [K in TN]: T };
export type Tagged<TN extends ValidTagName, T extends ValidTag, O> = O extends unknown[]
  ? TaggedTuple<TN, T, O>
  : Struct<Tag<TN, T> & O>;
type ObjectWithoutKey<TN extends ValidTagName> =
  | unknown[]
  | ({ [K in keyof unknown]: unknown } & { [K in TN]?: never });
export type TaggedUnion<
  TN extends ValidTagName,
  D extends Record<ValidTag, ObjectWithoutKey<TN>>,
> = {
  [K in keyof D]: Tagged<TN, K, D[K]>;
}[keyof D];
type TaggedTuple<
  TN extends ValidTagName,
  T extends ValidTag,
  A extends unknown[],
> = TaggedTupleHelper<A, []> & Tag<TN, T>;
type NETuple<H, T extends unknown[]> = [H, ...T];
type TaggedTupleHelper<A extends unknown[], Result extends unknown[]> = A extends NETuple<
  infer H,
  infer T
>
  ? TaggedTupleHelper<T, [...Result, H]>
  : [...Result, ...A];
export type From<U, TN extends keyof U, T extends U[TN] = U[TN]> = U extends { [k in TN]: T }
  ? U
  : never;

// TESTS

type Maybe<a> = TaggedUnion<
  'tag',
  { Just: { value: a; other: boolean }; Nothing: { value: number; isJust: false } }
>;
type Just<a> = From<Maybe<a>, 'tag', 'Just'>;

type Digit<a> = TaggedUnion<
  'tag',
  { Digit1: [a]; Digit2: [a, a]; Digit3: [a, a, a]; Digit4: [a, a, a, a] }
>;
interface Digit1<a> extends From<Digit<a>, 'tag', 'Digit1'> {}
type Digit2<a> = From<Digit<a>, 'tag', 'Digit2'>;
