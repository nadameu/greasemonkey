interface IMaybe<a> {
  chain<b>(f: (_: a) => Maybe<b>): Maybe<b>;
  map<b>(f: (_: a) => b): Maybe<b>;
  safeMap<b>(f: (_: a) => b | null | undefined): Maybe<b>;
  valueOr(defaultValue: a): a;
  valueOr<b>(defaultValue: b): a | b;
  valueOrElse(f: () => a): a;
  valueOrElse<b>(f: () => b): a | b;
  where<b extends a>(p: (x: a) => x is b): Maybe<b>;
  where(p: (_: a) => boolean): Maybe<a>;
}
export interface Just<a> extends IMaybe<a> {}
const Just: <a>(value: a) => Maybe<a> = <a>(x: a, self: Maybe<a> | undefined = undefined) =>
  (self = {
    chain: f => f(x),
    map: f => Just(f(x)),
    safeMap: f => Maybe.from(f(x)),
    valueOr: (_: any) => x,
    valueOrElse: (_: any) => x,
    where: (p: (_: any) => boolean) => (p(x) ? self! : Nothing),
  });
export interface Nothing<a = never> extends IMaybe<a> {}
const returnNothing = (_: any) => Nothing;
const Nothing: Nothing = {
  chain: returnNothing,
  map: returnNothing,
  safeMap: returnNothing,
  valueOr: (x: never) => x,
  valueOrElse: (f: () => never) => f(),
  where: returnNothing,
};
export type Maybe<a> = Just<a> | Nothing<a>;
interface MaybeConstructor {
  from<a>(value: a | null | undefined): Maybe<a>;
  of<a>(value: a): Maybe<a>;
}
export const Maybe: MaybeConstructor = {
  from: x => (x == null ? Nothing : Just(x)),
  of: x => Just(x),
};
