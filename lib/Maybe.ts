type AllMaybes<T, Acc extends any[] = []> = T extends [Maybe<infer U>, ...infer Rest]
  ? AllMaybes<Rest, [...Acc, U]>
  : T extends []
  ? Maybe<Acc>
  : never;

export type Maybe<a> = Just<a> | Nothing<a>;
interface MaybeBase<a> {
  [Symbol.iterator](): Generator<a>;
  chain<b>(this: Maybe<a>, f: (_: a) => Maybe<b>): Maybe<b>;
  safeMap<b>(this: Maybe<a>, f: (_: a) => b | null | undefined): Maybe<b>;
  map<b>(this: Maybe<a>, f: (_: a) => b): Maybe<b>;
  then<b>(Just: (value: a) => b, Nothing: () => b): b;
}
export interface Just<a> extends MaybeBase<a> {
  isJust: true;
  isNothing: false;
  value: a;
}
export function Just<a>(value: a): Maybe<a> {
  return {
    isJust: true,
    isNothing: false,
    value,
    *[Symbol.iterator]() {
      yield value;
    },
    chain: f => f(value),
    map: f => Just(f(value)),
    safeMap: f => fromNullish(f(value)),
    then(f, _) {
      return f(value);
    },
  };
}
export interface Nothing<a = never> extends MaybeBase<a> {
  isJust: false;
  isNothing: true;
}
const returnNothing = () => Nothing;
export const Nothing: Maybe<never> = {
  isJust: false,
  isNothing: true,
  *[Symbol.iterator]() {},
  chain: returnNothing,
  map: returnNothing,
  safeMap: returnNothing,
  then(_, f) {
    return f();
  },
};

export function all<T extends Array<Maybe<any>>>(...maybes: T): AllMaybes<T>;
export function all(...maybes: Maybe<unknown>[]): Maybe<unknown[]> {
  const results: unknown[] = [];
  for (const maybe of maybes) {
    if (maybe.isNothing) return Nothing;
    results.push(maybe.value);
  }
  return Just(results);
}

export function fromNullish<T>(value: T | null | undefined): Maybe<T> {
  if (value == null) return Nothing;
  return Just(value);
}
