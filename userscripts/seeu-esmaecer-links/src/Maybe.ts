export type Maybe<a> = Just<a> | Nothing<a>;

abstract class IMaybe<a> {
  abstract readonly empty: boolean;
  abstract readonly value?: a;
  ap<b>(ff: Maybe<(_: a) => b>): Maybe<b> {
    return this.chain(a => ff.map(f => f(a)));
  }
  abstract chain<b>(f: (_: a) => Maybe<b>): Maybe<b>;
  map<b>(f: (_: a) => b): Maybe<b> {
    return this.chain(x => new Just(f(x)));
  }
  safeMap<b>(f: (_: a) => b | null | undefined): Maybe<NonNullable<b>> {
    return this.chain(x => maybe(f(x)));
  }
}

export type { Just };
class Just<a> extends IMaybe<a> {
  readonly empty = false;
  constructor(readonly value: a) {
    super();
  }
  chain<b>(f: (_: a) => Maybe<b>): Maybe<b> {
    return f(this.value);
  }
}
export function just<a>(value: a): Maybe<a> {
  return new Just(value);
}

export type { Nothing };
class Nothing<a = never> extends IMaybe<a> {
  readonly empty = true;
  declare readonly value?: undefined;
  chain<b>(_: (_: a) => Maybe<b>): Maybe<b> {
    return this as Nothing<unknown> as Nothing;
  }
}
let _Nothing: Nothing | null = null;
export function nothing<a = never>(): Maybe<a> {
  return (_Nothing ??= new Nothing());
}

export function maybe<a>(value: a | null | undefined): Maybe<NonNullable<a>> {
  return value == null ? nothing() : just(value);
}

export function filter<a>(pred: (_: a) => boolean): (_: a) => Maybe<a> {
  return x => (pred(x) ? just(x) : nothing());
}

export const refine = filter as <a, b extends a>(
  pred: (x: a) => x is b
) => (_: a) => Maybe<b>;

export function combine<M extends Maybes>(maybes: M): CombineMaybes<M>;
export function combine<a>(maybes: Maybe<a>[]): Maybe<a[]> {
  let result: Maybe<a[]> = just([]);
  for (let i = 0; i < maybes.length; i += 1) {
    result = maybes[i]!.ap(result.map(xs => x => (xs.push(x), xs)));
  }
  return result;
}

type Maybes<a = unknown> = Maybe<a>[];
type ConsMaybe<First, Rest extends Maybes> = [Maybe<First>, ...Rest];
type CombineMaybes<
  M extends Maybes,
  Values extends unknown[] = [],
> = M extends []
  ? Maybe<Values>
  : M extends ConsMaybe<infer F, infer R>
    ? CombineMaybes<R, [...Values, F]>
    : M extends Maybes<infer A>
      ? CombineMaybes<[], [...Values, ...A[]]>
      : never;
