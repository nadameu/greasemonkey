export type Result<a, e> = Ok<a> | Err<e>;

abstract class ResultCommon<a, e> {
  abstract catch<b, g>(f: (_: e) => Result<b, g>): Result<a | b, g>;
  abstract chain<b, g>(f: (_: a) => Result<b, g>): Result<b, e | g>;
  map<b>(f: (_: a) => b): Result<b, e> {
    return this.chain(x => new Ok(f(x)));
  }
  mapErr<g>(f: (_: e) => g): Result<a, g> {
    return this.catch(x => new Err(f(x)));
  }
  abstract toMaybe(): Maybe<a>;
}

export type { Ok };
class Ok<a> extends ResultCommon<a, never> {
  readonly ok: true = true;
  constructor(readonly value: a) {
    super();
  }
  *[Symbol.iterator](this: Just<a>) {
    yield this.value;
  }
  catch<b, g>(_: (_: never) => Result<b, g>): Result<a | b, g> {
    return this;
  }
  chain<b, g>(f: (_: a) => Result<b, g>): Result<b, g> {
    return f(this.value);
  }
  toMaybe(): Maybe<a> {
    return this;
  }
}
export const ok = <a, e = never>(value: a): Result<a, e> => new Ok(value);

export type { Err };
class Err<e> extends ResultCommon<never, e> {
  readonly ok: false = false;
  constructor(readonly reason: e) {
    super();
  }
  *[Symbol.iterator]<a>(this: Maybe<a>) {}
  catch<b, g>(f: (_: e) => Result<b, g>): Result<b, g> {
    return f(this.reason);
  }
  chain<b, g>(_: (_: never) => Result<b, g>): Result<b, e | g> {
    return this;
  }
  toMaybe(): Maybe<never> {
    return nothing();
  }
}
export const err = <e, a = never>(reason: e): Result<a, e> => new Err(reason);

export type Maybe<a> = Just<a> | Nothing;

export interface Just<a> extends Ok<a> {}
export const just: <a>(value: a) => Maybe<a> = ok;

export interface Nothing extends Err<undefined> {}
let Nothing: Nothing | null = null;
export const nothing = <a = never>(): Maybe<a> =>
  (Nothing ??= err(undefined) as Err<undefined>);

export interface Box<a> extends Ok<a> {}
export const box = ok as <a>(value: a) => Box<a>;
