type AllMaybes<T, Acc extends any[] = []> = T extends [
  Maybe<infer U>,
  ...infer Rest,
]
  ? AllMaybes<Rest, [...Acc, U]>
  : T extends []
  ? Maybe<Acc>
  : never;

export type Maybe<a> = Just<a> | Nothing<a>;
abstract class _Maybe<a> {
  *[Symbol.iterator]() {
    if ((this as unknown as Maybe<a>).isJust)
      yield (this as unknown as Just<a>).value;
  }
  abstract match<b>(Nothing: () => b, Just: (value: a) => b): b;
  apply<a, b>(this: Maybe<(_: a) => b>, that: Maybe<a>): Maybe<b> {
    return this.chain(f => that.map(f));
  }
  chain<b>(f: (_: a) => Maybe<b>): Maybe<b>;
  chain<b>(this: Maybe<a>, f: (_: a) => Maybe<b>): Maybe<b> {
    return this.match(() => Nothing, f);
  }
  safeMap<b>(f: (_: a) => b | null | undefined): Maybe<b>;
  safeMap<b>(this: Maybe<a>, f: (_: a) => b | null | undefined): Maybe<b> {
    return this.chain(x => {
      const y = f(x);
      if (y == null) return Nothing;
      return Just(y);
    });
  }
  map<b>(f: (_: a) => b): Maybe<b>;
  map<b>(this: Maybe<a>, f: (_: a) => b): Maybe<b> {
    return this.chain(x => Just(f(x)));
  }
}

export interface Just<a> extends _Maybe<a> {
  isJust: true;
  isNothing: false;
  value: a;
}
class _Just<a> extends _Maybe<a> implements Just<a> {
  isJust: true = true;
  isNothing: false = false;
  constructor(public value: a) {
    super();
  }
  match<b>(Nothing: () => b, Just: (value: a) => b): b {
    return Just(this.value);
  }
}
export function Just<a>(value: a): Just<a> {
  return new _Just(value);
}

export interface Nothing<a = never> extends _Maybe<a> {
  isJust: false;
  isNothing: true;
}
class _Nothing<a = never> extends _Maybe<a> implements Nothing<a> {
  isJust: false = false;
  isNothing: true = true;
  match<b>(Nothing: () => b, Just: (value: a) => b): b {
    return Nothing();
  }
}
export const Nothing: Nothing<never> = /* @__PURE__ */ new _Nothing();

export function all<T extends Array<Maybe<any>>>(...maybes: T): AllMaybes<T>;
export function all(...maybes: Maybe<unknown>[]): Maybe<unknown[]> {
  const results: unknown[] = [];
  for (const maybe of maybes) {
    if (maybe.isNothing) return Nothing;
    results.push(maybe.value);
  }
  return Just(results);
}

export function lift2<a, b, c>(
  f: (_: a) => (_: b) => c,
  fx: Maybe<a>,
  fy: Maybe<b>
): Maybe<c> {
  return Just(f).apply(fx).apply(fy);
}

export function fromNullish<T>(value: T | null | undefined): Maybe<T> {
  return Just(value).safeMap(x => x);
}
