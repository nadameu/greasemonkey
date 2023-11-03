export interface Kind {
  e: unknown;
  a: unknown;
  b: unknown;
  in: unknown;
  out: unknown;
  indexed: boolean;
}

declare const TypeclassSym: unique symbol;
export interface Typeclass<F extends Kind> {
  [TypeclassSym]?: F;
}
export type InType<F extends Kind, e, a> = (F & { e: e; a: a })['in'];
export type OutType<F extends Kind, e, b> = (F & { e: e; b: b })['out'];
export type MapArgs<F extends Kind, a> = [
  a: a,
  ...(F['indexed'] extends true ? [i: number] : []),
];

export interface Semigroup<a> {
  concat(left: a, right: a): a;
}

export interface Monoid<a> extends Semigroup<a> {
  empty(): a;
}

export interface SemigroupK<F extends Kind> {
  concat<a, e>(left: InType<F, e, a>, right: InType<F, e, a>): OutType<F, e, a>;
}

export interface MonoidK<F extends Kind> extends SemigroupK<F> {
  empty<a = never, e = never>(): OutType<F, e, a>;
}

export interface Functor<F extends Kind> extends Typeclass<F> {
  map<a, b>(
    f: (...args: MapArgs<F, a>) => b
  ): <e>(fa: InType<F, e, a>) => OutType<F, e, b>;
}
export interface Ap<F extends Kind> extends Typeclass<F> {
  ap<e2, a>(
    fa: InType<F, e2, a>
  ): <e, b>(ff: InType<F, e, (_: a) => b>) => OutType<F, e | e2, b>;
}
export interface Apply<F extends Kind> extends Functor<F>, Ap<F> {}
export interface Of<F extends Kind> extends Typeclass<F> {
  of<a, e = never>(value: a): OutType<F, e, a>;
}
export interface Applicative<F extends Kind> extends Apply<F>, Of<F> {}
export interface FlatMap<F extends Kind> extends Typeclass<F> {
  flatMap<a, b, e2>(
    f: (...args: MapArgs<F, a>) => InType<F, e2, b>
  ): <e>(fa: InType<F, e, a>) => OutType<F, e | e2, b>;
}
export interface Monad<F extends Kind> extends Applicative<F>, FlatMap<F> {}

type NETupleType<F extends Kind, e, a, rest extends InType<F, e, unknown>[]> = [
  InType<F, e, a>,
  ...rest,
];
export type SequenceTuple<
  F extends Kind,
  T extends InType<F, unknown, unknown>[],
  e = never,
  R extends unknown[] = [],
> = T extends []
  ? OutType<F, e, R>
  : T extends NETupleType<F, infer e2, infer a, infer rest>
  ? SequenceTuple<F, rest, e | e2, [...R, a]>
  : T extends InType<F, infer e2, infer a>[]
  ? SequenceTuple<F, [], e | e2, [...R, ...a[]]>
  : never;

export type UnsequenceTuple<
  F extends Kind,
  e,
  T extends unknown[],
  R extends InType<F, e, unknown>[] = [],
> = T extends []
  ? R
  : T extends [infer a, ...infer rest]
  ? UnsequenceTuple<F, e, rest, [...R, InType<F, e, a>]>
  : T extends Array<infer a>
  ? UnsequenceTuple<F, e, [], [...R, ...InType<F, e, a>[]]>
  : never;
