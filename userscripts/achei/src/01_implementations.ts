abstract class IData<a, e, r> {
  abstract readonly isReader: boolean;
  abstract catch<b, f, s>(f: (_: e) => Data<b, f, s>): Data<a | b, f, r & s>;
  abstract chain<b, f, s>(f: (_: a) => Data<b, f, s>): Data<b, e | f, r & s>;
  map<b>(f: (_: a) => b): Data<b, e, r> {
    return this.chain(x => new Ok(f(x)));
  }
  mapErr<f>(f: (_: e) => f): Data<a, f, r> {
    return this.catch(x => new Err(f(x)));
  }
}
const Data = IData;
export type Data<a, e, r> = Result<a, e> | ReaderResult<a, e, r>;

abstract class IResult<a, e> extends Data<a, e, unknown> {
  readonly isReader: false;
  abstract readonly ok: boolean;

  constructor() {
    super();
    this.isReader = false;
  }

  abstract catch<b, f>(f: (_: e) => Result<b, f>): Result<a | b, f>;
  abstract catch<b, f, s>(
    f: (_: e) => ReaderResult<b, f, s>
  ): ReaderResult<a | b, f, s>;

  abstract chain<b, f>(f: (_: a) => Result<b, f>): Result<b, e | f>;
  abstract chain<b, f, s>(
    f: (_: a) => ReaderResult<b, f, s>
  ): ReaderResult<b, e | f, s>;

  map<b>(f: (_: a) => b): Result<b, e>;
  map<b>(f: (_: a) => b): Data<b, e, unknown> {
    return super.map(f);
  }

  mapErr<f>(f: (_: e) => f): Result<a, f>;
  mapErr<f>(f: (_: e) => f): Data<a, f, unknown> {
    return super.mapErr(f);
  }
}
const Result = IResult;
export type Result<a, e> = Ok<a, e> | Err<e, a>;

class Ok<a, e> extends Result<a, e> {
  readonly ok: true;
  readonly value: a;

  constructor(value: a) {
    super();
    this.ok = true;
    this.value = value;
  }
  catch<b, f>(f: (_: e) => Result<b, f>): Result<a | b, f>;
  catch<b, f, s>(f: (_: e) => ReaderResult<b, f, s>): ReaderResult<a | b, f, s>;
  catch<b, f, s>(_: (_: e) => Data<b, f, s>): Data<a | b, f, s> {
    return this as Ok<a, unknown> as Ok<a, never>;
  }

  chain<b, f>(f: (_: a) => Result<b, f>): Result<b, e | f>;
  chain<b, f, s>(f: (_: a) => ReaderResult<b, f, s>): ReaderResult<b, e | f, s>;
  chain<b, f, s>(f: (_: a) => Data<b, f, s>): Data<b, e | f, s> {
    return f(this.value);
  }
}
export type { Ok };
export const ok = <a, e = never>(value: a): Result<a, e> => new Ok(value);
class Err<e, a> extends Result<a, e> {
  readonly ok: false;
  readonly reason: e;

  constructor(reason: e) {
    super();
    this.ok = false;
    this.reason = reason;
  }

  catch<b, f>(f: (_: e) => Result<b, f>): Result<a | b, f>;
  catch<b, f, s>(f: (_: e) => ReaderResult<b, f, s>): ReaderResult<a | b, f, s>;
  catch<b, f, s>(f: (_: e) => Data<b, f, s>): Data<a | b, f, s> {
    return f(this.reason);
  }

  chain<b, f>(f: (_: a) => Result<b, f>): Result<b, e | f>;
  chain<b, f, s>(f: (_: a) => ReaderResult<b, f, s>): ReaderResult<b, e | f, s>;
  chain<b, f, s>(_: (_: a) => Data<b, f, s>): Data<b, e | f, s> {
    return this as Err<e, unknown> as Err<e, never>;
  }
}
export type { Err };
export const err = <e, a = never>(reason: e): Result<a, e> => new Err(reason);

interface IMaybe<a> extends IResult<a, undefined> {
  catch<b, f>(f: (_: undefined) => Maybe<b>): Maybe<a | b>;
  catch<b, f>(f: (_: undefined) => Result<b, f>): Result<a | b, f>;
  catch<b, f, s>(
    f: (_: undefined) => ReaderResult<b, f, s>
  ): ReaderResult<a | b, f, s>;

  chain<b>(f: (_: a) => Maybe<b>): Maybe<b>;
  chain<b, e>(f: (_: a) => Result<b, e>): Result<b, e | undefined>;
  chain<b, e, r>(
    f: (_: a) => ReaderResult<b, e, r>
  ): ReaderResult<b, e | undefined, r>;

  map<b>(f: (_: a) => b): Maybe<b>;
}
export type Maybe<a> = Just<a> | Nothing<a>;

export interface Just<a> extends IMaybe<a> {
  readonly ok: true;
  readonly value: a;
}
export const just: <a>(value: a) => Maybe<a> = ok;
export interface Nothing<a = never> extends IMaybe<a> {
  readonly ok: false;
  readonly reason: undefined;
}
export const nothing: <a = never>() => Maybe<a> = err as <
  a = never,
>() => Result<a, undefined>;

class ReaderResult<a, e, r> extends Data<a, e, r> {
  readonly isReader: true;
  readonly run: (env: r) => Result<a, e>;

  constructor(run: (env: r) => Result<a, e>) {
    super();
    this.isReader = true;
    this.run = run;
  }

  catch<b, f, s>(f: (_: e) => Data<b, f, s>): ReaderResult<a | b, f, r & s> {
    return new ReaderResult<a | b, f, r & s>(env => {
      const result = this.run(env);
      if (result.ok) return result as Ok<a, never>;
      const next = f(result.reason);
      return next.isReader ? next.run(env) : next;
    });
  }

  chain<b, f, s>(f: (_: a) => Data<b, f, s>): ReaderResult<b, e | f, r & s> {
    return new ReaderResult<b, e | f, r & s>(env => {
      const result = this.run(env);
      if (!result.ok) return result as Err<e, never>;
      const next = f(result.value);
      return next.isReader ? next.run(env) : next;
    });
  }

  map<b>(f: (_: a) => b): ReaderResult<b, e, r>;
  map<b>(f: (_: a) => b): Data<b, e, r> {
    return super.map(f);
  }

  mapErr<f>(f: (_: e) => f): ReaderResult<a, f, r>;
  mapErr<f>(f: (_: e) => f): Data<a, f, r> {
    return super.mapErr(f);
  }
}
export type { ReaderResult };
export const readerResult = <a, e, r>(
  run: (env: r) => Result<a, e>
): ReaderResult<a, e, r> => new ReaderResult(run);

export interface Reader<r, a> extends ReaderResult<a, never, r> {
  chain<b, s>(f: (_: a) => Reader<s, b>): Reader<b, r & s>;
  chain<b, e, s>(f: (_: a) => Data<b, e, s>): ReaderResult<b, e, r & s>;

  map<b>(f: (_: a) => b): Reader<r, b>;
}
export const reader = <r, a>(run: (_: r) => a): Reader<r, a> =>
  readerResult<a, never, r>(env => ok(run(env))) as Reader<r, a>;
