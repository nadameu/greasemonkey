export as namespace maybe;

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
export function Just<a>(value: a): Maybe<a>;
export interface Nothing<a = never> extends MaybeBase<a> {
  isJust: false;
  isNothing: true;
}
export const Nothing: Maybe<never>;

export function all<T extends Array<Maybe<any>>>(...maybes: T): AllMaybes<T>;

export function fromNullish<T>(value: T | null | undefined): Maybe<T>;
