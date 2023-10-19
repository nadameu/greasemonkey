import { Opaque } from '@nadameu/opaque';

export class AssertionError extends Error {
  readonly name = 'AssertionError';
  constructor(message?: string) {
    super(message);
  }
}

export function assert(condition: boolean, message?: string): asserts condition {
  if (!condition) throw new AssertionError(message);
}

export function check<T, U extends T>(
  predicate: Negate<U>,
  value: T,
  message?: string
): Exclude<T, U>;
export function check<T>(predicate: Predicate<T>, value: unknown, message?: string): T;
export function check<T>(predicate: Predicate<T>, value: unknown, message?: string): T {
  assert(predicate(value), message);
  return value;
}

export interface Refinement<T, U extends T> {
  (value: T): value is U;
}
export interface Predicate<T> extends Refinement<unknown, T> {}
export interface OptionalPropertyPredicate<T> extends Predicate<T> {
  optional: true;
}

export interface Negate<U> {
  <T>(value: T | U): value is T;
}

export type Static<T> = T extends Predicate<infer U> ? U : never;

export const isUnknown: Predicate<unknown> = (_value: unknown): _value is unknown => true;

interface IsOfTypeMap {
  bigint: bigint;
  boolean: boolean;
  function: Function;
  number: number;
  object: object | null;
  string: string;
  symbol: symbol;
  undefined: undefined;
}

export function isOfType<K extends keyof IsOfTypeMap>(
  typeRepresentation: K
): Predicate<IsOfTypeMap[K]> {
  return (value: unknown): value is IsOfTypeMap[K] => typeof value === typeRepresentation;
}

export const isBigInt = /* @__PURE__ */ isOfType('bigint');
export const isBoolean = /* @__PURE__ */ isOfType('boolean');
export const isFunction = /* @__PURE__ */ isOfType('function');
export const isNumber = /* @__PURE__ */ isOfType('number');
export const isOfTypeObject = /* @__PURE__ */ isOfType('object');
export const isString = /* @__PURE__ */ isOfType('string');
export const isSymbol = /* @__PURE__ */ isOfType('symbol');

export function isLiteral<T extends string | number | bigint | boolean | symbol | null | undefined>(
  literal: T
): Predicate<T> {
  return (value: unknown): value is T => value === literal;
}
export const isUndefined = /* @__PURE__ */ isLiteral(undefined);
export const isNull = /* @__PURE__ */ isLiteral(null);

export function negate<U>(predicate: Predicate<U>): Negate<U> {
  return <T>(value: T | U): value is T => !predicate(value);
}
export const isNotNull = /* @__PURE__ */ negate(isNull);
export const isDefined = /* @__PURE__ */ negate(isUndefined);

type Refine<T, V = unknown> = T extends [Negate<infer Exc>, ...infer R]
  ? Refine<R, Exclude<V, Exc>>
  : T extends [Refinement<infer From, infer To>, ...infer R]
  ? V extends From
    ? Refine<R, To>
    : unknown
  : T extends []
  ? Predicate<V>
  : never;

export function refine<T, U extends T>(
  predicate: Predicate<T>,
  refinement: Refinement<T, U>
): Predicate<U>;
export function refine<T extends Array<Refinement<any, any> | Negate<any>>>(
  ...predicates: T
): Refine<T>;
export function refine(...predicates: Function[]) {
  return (value: unknown) => predicates.every(p => p(value));
}
export const isObject = /* @__PURE__ */ refine(isOfTypeObject, isNotNull);
export type Integer = Opaque<number, { Integer: Integer }>;
export const isInteger: Predicate<Integer> = /* @__PURE__*/ (x): x is Integer =>
  Number.isInteger(x);
export type Natural = Opaque<Integer, { Natural: Natural }>;
export const isNatural = /* @__PURE__*/ refine(isInteger, (x: number): x is Natural => x > 0);
export type NonNegativeInteger = Opaque<Integer, { NonNegativeInteger: NonNegativeInteger }>;
export const isNonNegativeInteger = /* @__PURE__*/ refine(
  isInteger,
  (x): x is NonNegativeInteger => x > -1
);
export type NonEmptyString = Opaque<string, { NonEmptyString: NonEmptyString }>;
export const isNonEmptyString = /* @__PURE__*/ refine(
  isString,
  (x): x is NonEmptyString => x.trim().length > 0
);

export function isAnyOf<T extends Predicate<any>[]>(
  ...predicates: T
): Predicate<T extends Predicate<infer U>[] ? U : never> {
  return (value): value is any => predicates.some(p => p(value));
}
export const isNullish: Predicate<null | undefined> = (x): x is null | undefined => x == null;
export const isNotNullish = /* @__PURE__ */ negate(isNullish);

export const isArray: Predicate<unknown[]> = (x): x is unknown[] => Array.isArray(x);
export function isTypedArray<T>(predicate: Predicate<T>): Predicate<T[]> {
  return refine(isArray, (xs): xs is T[] => xs.every(predicate));
}

export function hasKeys<K extends string>(...keys: K[]): Predicate<Record<K, unknown>> {
  return refine(isObject, (obj): obj is Record<K, unknown> => keys.every(key => key in obj));
}

export function hasShape<T extends Record<string, Predicate<any> | OptionalPropertyPredicate<any>>>(
  predicates: T
): Predicate<Shape<T>> {
  return refine(isObject, ((obj: { [K in string & keyof T]?: unknown }) =>
    (
      Object.entries(predicates) as [string & keyof T, Predicate<any> & { optional?: boolean }][]
    ).every(([key, predicate]) =>
      key in obj ? predicate(obj[key]) : predicate.optional === true
    )) as Refinement<object, Shape<T>>);
}

type Shape<T> = Simplify<
  {
    [K in keyof T as T[K] extends { optional: true } ? never : K]-?: T[K] extends Predicate<infer U>
      ? U
      : never;
  } & {
    [K in keyof T as T[K] extends { optional: true } ? K : never]?: T[K] extends Predicate<infer U>
      ? U
      : never;
  }
>;

type Simplify<T> = T extends never
  ? never
  : {
      [K in keyof T]: T[K];
    };

export function isOptional<T>(predicate: Predicate<T>): OptionalPropertyPredicate<T> {
  const p: OptionalPropertyPredicate<T> = (x): x is T => predicate(x);
  p.optional = true;
  return p;
}

export function isTaggedUnion<
  T extends string,
  P extends Record<string, Record<string, Predicate<any>>>,
>(tagName: T, union: P): TaggedUnion<T, P> {
  return isAnyOf(
    ...Object.entries(union).map(
      ([tag, extraProperties]: [string, Record<string, Predicate<any>>]) =>
        hasShape({ [tagName]: isLiteral(tag), ...extraProperties })
    )
  ) as TaggedUnion<T, P>;
}

type TaggedUnion<
  T extends string,
  P extends Record<string, Record<string, Predicate<any>>>,
> = T extends never
  ? never
  : Predicate<
      {
        [Tag in keyof P]: Simplify<{ [TagName in T]: Tag } & Shape<P[Tag]>>;
      }[keyof P]
    >;
