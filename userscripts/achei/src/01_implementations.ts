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
  readonly ok: true;
  readonly value: a;
  constructor(value: a) {
    super();
    this.ok = true;
    this.value = value;
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
  readonly ok: false;
  readonly reason: e;
  constructor(reason: e) {
    super();
    this.ok = false;
    this.reason = reason;
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
export const just = ok as <a>(value: a) => Maybe<a>;

export interface Nothing extends Err<undefined> {}
let Nothing: Nothing | null = null;
export const nothing = <a = never>(): Maybe<a> =>
  (Nothing ??= err(undefined) as Err<undefined>);

export interface Box<a> extends Ok<a> {}
export const box = ok as <a>(value: a) => Box<a>;

export type { Reader };
class Reader<r, v> {
  private _run: (env: r) => v;
  constructor(run: (env: r) => v) {
    this._run = run;
  }
  catch<a, e, b, g>(
    this: Parser<r, a, e>,
    f: (_: e) => Result<b, g>
  ): Parser<r, a | b, g> {
    return this._compose((_, r) => r.catch(f));
  }
  chain<a, e, b, g>(
    this: Parser<r, a, e>,
    f: (_: a) => Result<b, g>
  ): Parser<r, b, e | g> {
    return this._compose((_, r) => r.chain(f));
  }
  chainParser<a, e, s, b, g>(
    this: Parser<r, a, e>,
    f: (_: a) => Parser<s, b, g>
  ): Parser<r & s, b, e | g> {
    return this._compose((env, res) => res.chain(x => f(x)._run(env)));
  }
  chainReader<s, w>(f: (_: v) => Reader<s, w>): Reader<r & s, w> {
    return this._compose((r, v) => f(v)._run(r));
  }
  map<a, e, b>(this: Parser<r, a, e>, f: (_: a) => b): Parser<r, b, e> {
    return this._compose((_, r) => r.map(f));
  }
  mapErr<a, e, g>(this: Parser<r, a, e>, f: (_: e) => g): Parser<r, a, g> {
    return this._compose((_, r) => r.mapErr(f));
  }
  mapReader<w>(f: (_: v) => w): Reader<r, w> {
    return this._compose((_, v) => f(v));
  }
  private _compose<a, e, s, b, g>(
    this: Parser<r, a, e>,
    f: (env: r & s, result: v) => Result<b, g>
  ): Parser<r & s, b, g>;
  private _compose<s, w>(f: (env: r & s, v: v) => w): Reader<r & s, w>;
  private _compose<s, w>(f: (env: r & s, v: v) => w): Reader<r & s, w> {
    return new Reader(env => f(env, this._run(env)));
  }
  run(env: r) {
    return this._run(env);
  }
  toParser(): Parser<r, v, never> {
    return this.mapReader(ok);
  }
}
export const reader = <r, v>(run: (env: r) => v): Reader<r, v> =>
  new Reader(run);

export interface Parser<r, a, e> extends Reader<r, Result<a, e>> {}
export const parser = reader as <r, a, e>(
  run: (env: r) => Result<a, e>
) => Parser<r, a, e>;
