export type Data<a, e> = Box<a> | Maybe<a> | Result<a, e>;

export type Result<a, e> = Ok<a, e> | Err<e, a>;

abstract class ResultBase<a, e> {
  abstract readonly ok: boolean;

  abstract catch<b>(f: (_: e) => Result<b, never>): Box<a | b>;
  abstract catch<b>(f: (_: e) => Result<b, undefined>): Maybe<a | b>;
  abstract catch<b, e2>(f: (_: e) => Result<b, e2>): Result<a | b, e2>;

  abstract chain<b>(
    this: Result<a, never>,
    f: (_: a) => Result<b, never>
  ): Box<b>;
  abstract chain<b>(
    this: Result<a, undefined>,
    f: (_: a) => Result<b, undefined>
  ): Maybe<b>;
  abstract chain<b, e2, e>(
    this: Result<a, e>,
    f: (_: a) => Result<b, e2>
  ): Result<b, e | e2>;
  abstract chain<b, e2>(f: (_: a) => Result<b, e2>): Result<b, e | e2>;

  map<b>(this: Result<a, never>, f: (_: a) => b): Box<b>;
  map<b>(this: Result<a, undefined>, f: (_: a) => b): Maybe<b>;
  map<b>(this: Result<a, e>, f: (_: a) => b): Result<b, e>;
  map<b>(f: (_: a) => b): Box<b> | Maybe<b> | Result<b, e> {
    return this.chain(a => new Ok(f(a)));
  }

  mapErr(f: (_: e) => never): Box<a>;
  mapErr(f: (_: e) => undefined): Maybe<a>;
  mapErr<e2>(f: (_: e) => e2): Result<a, e2>;
  mapErr<e2>(f: (_: e) => e2): Box<a> | Maybe<a> | Result<a, e2> {
    return this.catch(e => new Err(f(e)));
  }
}

export type { Ok };
class Ok<a, e = never> extends ResultBase<a, e> {
  readonly ok: true;
  readonly value: a;
  constructor(value: a) {
    super();
    this.ok = true;
    this.value = value;
  }

  catch<b>(f: (_: e) => Result<b, never>): Box<a | b>;
  catch<b>(f: (_: e) => Result<b, undefined>): Maybe<a | b>;
  catch<b, e2>(f: (_: e) => Result<b, e2>): Result<a | b, e2>;
  catch<b, e2>(_: (_: e) => Result<b, e2>): Ok<a> {
    return this as Ok<a, unknown> as Ok<a>;
  }

  chain<b>(this: Result<a, never>, f: (_: a) => Result<b, never>): Box<b>;
  chain<b>(
    this: Result<a, undefined>,
    f: (_: a) => Result<b, undefined>
  ): Maybe<b>;
  chain<b, e2, e>(
    this: Result<a, e>,
    f: (_: a) => Result<b, e2>
  ): Result<b, e2 | e>;
  chain<b, e2>(f: (_: a) => Result<b, e2>): Result<b, e | e2>;
  chain<b, e2>(
    f: (_: a) => Result<b, e2>
  ): Box<b> | Maybe<b> | Result<b, e2 | e> | Result<b, e | e2> {
    return f(this.value);
  }
}
export const ok = <a, e = never>(value: a): Result<a, e> => new Ok(value);

export type { Err };
class Err<e, a = never> extends ResultBase<a, e> {
  readonly ok: false = false;
  readonly reason: e;
  constructor(reason: e) {
    super();
    this.ok = false;
    this.reason = reason;
  }

  catch<b>(f: (_: e) => Result<b, never>): Box<a | b>;
  catch<b>(f: (_: e) => Result<b, undefined>): Maybe<a | b>;
  catch<b, e2>(f: (_: e) => Result<b, e2>): Result<a | b, e2>;
  catch<b, e2>(f: (_: e) => Result<b, e2>): Result<a | b, e2> {
    return f(this.reason);
  }

  chain<b>(this: Result<a, never>, f: (_: a) => Result<b, never>): Box<b>;
  chain<b>(
    this: Result<a, undefined>,
    f: (_: a) => Result<b, undefined>
  ): Maybe<b>;
  chain<b, e2>(f: (_: a) => Result<b, e2>): Result<b, e | e2>;
  chain<b, e2>(_: (_: a) => Result<b, e2>): Result<b, e | e2> {
    return this as Err<e, unknown> as Err<e>;
  }
}
export const err = <e, a = never>(reason: e): Result<a, e> => new Err(reason);

export type Maybe<a> = Just<a> | Nothing<a>;

interface MaybeBase<a> extends ResultBase<a, undefined> {
  readonly value?: a;
}

export interface Just<a> extends MaybeBase<a> {
  readonly ok: true;
  readonly value: a;
}
export const just = <a>(value: a): Maybe<a> => new Ok(value);

export interface Nothing<a = never> extends MaybeBase<a> {
  readonly ok: false;
  readonly value?: a;
  readonly reason: undefined;
}
let _nothing: Nothing | null = null;
export const nothing = <a = never>(): Maybe<a> =>
  (_nothing ??= new Err(undefined));

export interface Box<a> extends ResultBase<a, never> {
  readonly ok: true;
  readonly value: a;
}
export const box = <a>(value: a): Box<a> => new Ok(value);

export type { Reader };
class Reader<r, a> {
  private _run: (_: r) => a;
  constructor(run: (_: r) => a) {
    this._run = run;
  }
  asParser<a, e>(this: Reader<r, Result<a, e>>): Parser<r, a, e> {
    return this;
  }
  catch<b, e, c, e2>(
    this: Parser<r, b, e>,
    f: (_: e) => Result<c, e2>
  ): Parser<r, b | c, e2> {
    return this.mapReader(r => r.catch(f));
  }
  chain<b, e, c, e2>(
    this: Parser<r, b, e>,
    f: (_: b) => Result<c, e2>
  ): Parser<r, c, e | e2> {
    return this.mapReader(r => r.chain(f));
  }
  chainReader<s, b>(f: (_: a) => Reader<s, b>): Reader<r & s, b> {
    return new Reader(a => f(this.run(a)).run(a));
  }
  map<b, e, c>(this: Parser<r, b, e>, f: (_: b) => c): Parser<r, c, e> {
    return this.mapReader(r => r.map(f));
  }
  mapErr<b, e, e2>(this: Parser<r, b, e>, f: (_: e) => e2): Parser<r, b, e2> {
    return this.mapReader(r => r.mapErr(f));
  }
  mapReader<b>(f: (_: a) => b): Reader<r, b> {
    return new Reader(a => f(this.run(a)));
  }
  run(input: r): a {
    return this._run(input);
  }
}
export const reader = <r, a>(f: (_: r) => a): Reader<r, a> => new Reader(f);

export interface Parser<r, a, e> extends Reader<r, Result<a, e>> {}
