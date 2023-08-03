export abstract class Result<T> {
  abstract catch<U>(f: (error: Error) => Result<U>): Result<T | U>;
  abstract chain<U>(f: (value: T) => Result<U>): Result<U>;
  abstract ifErr(f: (error: Error) => void): void;
  abstract ifOk(f: (value: T) => void): void;
  abstract isErr(): this is Err;
  abstract isOk(): this is Ok<T>;
  abstract map<U>(f: (value: T) => U): Result<U>;
  abstract match<U>(matchers: { Err(error: Error): U; Ok(value: T): U }): U;

  static err<T = never>(error: Error): Result<T> {
    return new Err(error);
  }
  static sequence(): Result<[]>;
  static sequence<T>(r0: Result<T>): Result<[T]>;
  static sequence<T, U>(r0: Result<T>, r1: Result<U>): Result<[T, U]>;
  static sequence<T, U, V>(r0: Result<T>, r1: Result<U>, r2: Result<V>): Result<[T, U, V]>;
  static sequence<T, U, V, W>(
    r0: Result<T>,
    r1: Result<U>,
    r2: Result<V>,
    r3: Result<W>
  ): Result<[T, U, V, W]>;
  static sequence<T, U, V, W, X>(
    r0: Result<T>,
    r1: Result<U>,
    r2: Result<V>,
    r3: Result<W>,
    r4: Result<X>
  ): Result<[T, U, V, W, X]>;
  static sequence<T>(...results: Array<Result<T>>): Result<T[]>;
  static sequence<T>(...results: Array<Result<T>>): Result<T[]> {
    return Result.traverse(results, x => x);
  }
  static traverse<T, U>(iterable: Iterable<T>, f: (_: T) => Result<U>): Result<U[]> {
    const values: U[] = [];
    for (const value of iterable) {
      const result = f(value);
      if (result.isOk()) values.push(result.value);
      else return result as Err;
    }
    return Result.ok(values);
  }
  static ok<T>(value: T): Result<T> {
    return new Ok(value);
  }
}
class Err extends Result<never> {
  constructor(public error: Error) {
    super();
  }
  catch<U>(f: (error: Error) => Result<U>): Result<U> {
    return f(this.error);
  }
  chain<U>(f: (value: never) => Result<U>): Result<U> {
    return this;
  }
  ifErr(f: (error: Error) => void): void {
    f(this.error);
  }
  ifOk(f: (value: never) => void): void {}
  isErr(): this is Err {
    return true;
  }
  isOk(): this is Ok<never> {
    return false;
  }
  map<U>(f: (value: never) => U): Result<U> {
    return this;
  }
  match<U>(matchers: { Err(error: Error): U; Ok(value: never): U }): U {
    return matchers.Err(this.error);
  }
}
class Ok<T> extends Result<T> {
  constructor(public value: T) {
    super();
  }
  catch<U>(f: (error: Error) => Result<U>): Result<T | U> {
    return this;
  }
  chain<U>(f: (value: T) => Result<U>): Result<U> {
    return f(this.value);
  }
  ifErr(f: (error: Error) => void): void {}
  ifOk(f: (value: T) => void): void {
    f(this.value);
  }
  isErr(): this is Err {
    return false;
  }
  isOk(): this is Ok<T> {
    return true;
  }
  map<U>(f: (value: T) => U): Result<U> {
    return Result.ok(f(this.value));
  }
  match<U>(matchers: { Err(error: Error): U; Ok(value: T): U }): U {
    return matchers.Ok(this.value);
  }
}
