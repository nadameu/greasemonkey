export interface Kind {
  e: unknown;
  a: unknown;
  type: unknown;
}

declare const TypeclassSym: unique symbol;
export interface Typeclass<F extends Kind> {
  [TypeclassSym]?: F;
}
export type Type<F extends Kind, e, a> = (F & { e: e; a: a })['type'];

export interface Semigroup<a> {
  concat(left: a, right: a): a;
}

export interface Monoid<a> extends Semigroup<a> {
  empty(): a;
}

export interface SemigroupK<F extends Kind> extends Typeclass<F> {
  concat<a, e>(left: Type<F, e, a>, right: Type<F, e, a>): Type<F, e, a>;
}

export interface MonoidK<F extends Kind> extends SemigroupK<F> {
  empty<a = never, e = never>(): Type<F, e, a>;
}

export interface Functor<F extends Kind> extends Typeclass<F> {
  map<a, b>(f: (_: a) => b): <e>(fa: Type<F, e, a>) => Type<F, e, b>;
}
export interface FilterableFunctor<F extends Kind> extends Functor<F> {
  map<a, b>(f: (a: a, i: number) => b): <e>(fa: Type<F, e, a>) => Type<F, e, b>;
  filter<a, b extends a>(
    pred: (a: a, i: number) => a is b
  ): <e>(fa: Type<F, e, a>) => Type<F, e, b>;
  filter<a>(
    pred: (a: a, i: number) => boolean
  ): <e>(fa: Type<F, e, a>) => Type<F, e, a>;
}
export interface Ap<F extends Kind> extends Typeclass<F> {
  ap<a, e2>(
    fa: Type<F, e2, a>
  ): <b, e>(ff: Type<F, e, (_: a) => b>) => Type<F, e | e2, b>;
}
export interface Apply<F extends Kind> extends Functor<F>, Ap<F> {}
export interface Of<F extends Kind> extends Typeclass<F> {
  of<a, e = never>(value: a): Type<F, e, a>;
}
export interface Applicative<F extends Kind> extends Apply<F>, Of<F> {}
export interface FlatMap<F extends Kind> extends Typeclass<F> {
  flatMap<a, b, e2>(
    f: (_: a) => Type<F, e2, b>
  ): <e>(fa: Type<F, e, a>) => Type<F, e | e2, b>;
}
export interface Monad<F extends Kind> extends Applicative<F>, FlatMap<F> {}

type NETupleType<F extends Kind, e, a, rest extends Type<F, e, unknown>[]> = [
  Type<F, e, a>,
  ...rest,
];
export type SequenceTuple<
  F extends Kind,
  T extends Type<F, unknown, unknown>[],
  e = never,
  R extends unknown[] = [],
> = T extends []
  ? Type<F, e, R>
  : T extends NETupleType<F, infer e2, infer a, infer rest>
    ? SequenceTuple<F, rest, e | e2, [...R, a]>
    : T extends Type<F, infer e2, infer a>[]
      ? SequenceTuple<F, [], e | e2, [...R, ...a[]]>
      : never;

export type UnsequenceTuple<
  F extends Kind,
  e,
  T extends unknown[],
  R extends Type<F, e, unknown>[] = [],
> = T extends []
  ? R
  : T extends [infer a, ...infer rest]
    ? UnsequenceTuple<F, e, rest, [...R, Type<F, e, a>]>
    : T extends Array<infer a>
      ? UnsequenceTuple<F, e, [], [...R, ...Type<F, e, a>[]]>
      : never;
