type InternalResult<T, E> = { ok: true; value: T } | { ok: false; reason: E };
export class Result<T, E> {
  constructor(public _internal: InternalResult<T, E>) {}
  catch<E2, U = T>(f: (reason: E) => Result<U, E2>): Result<T | U, E2> {
    if (this._internal.ok) {
      return this as Result<T, unknown> as Result<T, E2>;
    }
    return f(this._internal.reason);
  }
  chain<U, E2 = E>(f: (value: T) => Result<U, E2>): Result<U, E | E2> {
    if (!this._internal.ok) {
      return this as Result<unknown, E> as Result<U, E>;
    }
    return f(this._internal.value);
  }
  getOr(defaultValue: T): T {
    if (!this._internal.ok) {
      return defaultValue;
    }
    return this._internal.value;
  }
  map<U>(f: (value: T) => U): Result<U, E> {
    if (!this._internal.ok) {
      return this as Result<unknown, E> as Result<U, E>;
    }
    return new Result({ ok: true, value: f(this._internal.value) });
  }
  mapErr<E2>(f: (reason: E) => E2): Result<T, E2> {
    if (this._internal.ok) {
      return this as Result<T, unknown> as Result<T, E2>;
    }
    return new Result({ ok: false, reason: f(this._internal.reason) });
  }
}
export function Ok<T, E = never>(value: T): Result<T, E> {
  return new Result({ ok: true, value });
}
export function Err<E, T = never>(reason: E): Result<T, E> {
  return new Result({ ok: false, reason });
}
