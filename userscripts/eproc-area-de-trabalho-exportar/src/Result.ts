export type Result<a, e> = Ok<a, e> | Err<e, a>;

abstract class ResultImpl<a, e> {
  abstract readonly ok: boolean;
  abstract catch<b, g>(f: (_: e) => Result<b, g>): Result<a | b, g>;
  abstract chain<b, g>(f: (_: a) => Result<b, g>): Result<b, e | g>;
  map<b>(f: (_: a) => b): Result<b, e> {
    return this.chain(x => new Ok(f(x)));
  }
  mapErr<g>(f: (_: e) => g): Result<a, g> {
    return this.catch(x => new Err(f(x)));
  }
}

export type { Ok };
class Ok<a, e = never> extends ResultImpl<a, e> {
  readonly ok = true;
  constructor(readonly value: a) {
    super();
  }
  catch<b, g>(_: (_: e) => Result<b, g>): Result<a | b, g> {
    return this as Ok<a, unknown> as Ok<a>;
  }
  chain<b, g>(f: (_: a) => Result<b, g>): Result<b, e | g> {
    return f(this.value);
  }
}
export function ok<a, e = never>(value: a): Result<a, e> {
  return new Ok(value);
}

export type { Err };
class Err<e, a = never> extends ResultImpl<a, e> {
  readonly ok = false;
  constructor(readonly reason: e) {
    super();
  }
  catch<b, g>(f: (_: e) => Result<b, g>): Result<a | b, g> {
    return f(this.reason);
  }
  chain<b, g>(_: (_: a) => Result<b, g>): Result<b, e | g> {
    return this as Err<e, unknown> as Err<e>;
  }
}
export function err<e, a = never>(reason: e): Result<a, e> {
  return new Err(reason);
}

export function map2<a, b, c, e, g>(
  ra: Result<a, e>,
  rb: Result<b, g>,
  f: (a: a, b: b) => c
): Result<c, e | g> {
  return ra.chain(a => rb.map(b => f(a, b)));
}
