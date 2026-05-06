export interface Parser<T> {
  (input: string): Result<T>;
}
export type Result<T> = Ok<T> | Fail;
export interface Ok<T> {
  success: true;
  data: T;
  rest: string;
}
export function Ok<T>(data: T, rest: string): Result<T> {
  return { success: true, data, rest };
}
export interface Fail {
  success: false;
}
export function Fail<T = []>(): Result<T> {
  return { success: false };
}

export function str<T extends string>(str: T): Parser<T> {
  return input => {
    if (input.startsWith(str)) return Ok(str, input.slice(str.length));
    return Fail();
  };
}

export function re(re: RegExp): Parser<string> {
  return input => {
    const match = input.match(re);
    if (match?.index === 0) return Ok(match[0], input.slice(match[0].length));
    return Fail();
  };
}

export function map<T, U>(p: Parser<T>, f: (_: T) => U): Parser<U> {
  return input => {
    const result = p(input);
    if (result.success) return Ok(f(result.data), result.rest);
    return result;
  };
}

export function two<T, U, V = [T, U]>(
  pa: Parser<T>,
  pb: Parser<U>,
  f: (a: T, b: U) => V = (a, b) => [a, b] as V
): Parser<V> {
  return input => {
    const ra = pa(input);
    if (!ra.success) return ra;
    const rb = pb(ra.rest);
    if (!rb.success) return rb;
    return Ok(f(ra.data, rb.data), rb.rest);
  };
}

export function left<T, U>(pa: Parser<T>, pb: Parser<U>): Parser<T> {
  return two(pa, pb, a => a);
}

export function right<T, U>(pa: Parser<T>, pb: Parser<U>): Parser<U> {
  return two(pa, pb, (_, b) => b);
}

export function three<T, U, V, W = [T, U, V]>(
  pa: Parser<T>,
  pb: Parser<U>,
  pc: Parser<V>,
  f: (a: T, b: U, c: V) => W = (a, b, c) => [a, b, c] as W
): Parser<W> {
  return two(two(pa, pb), pc, ([a, b], c) => f(a, b, c));
}

export function many<T>(p: Parser<T>): Parser<T[]> {
  return input => {
    const acc: T[] = [];
    let rest = input;
    while (true) {
      const r = p(rest);
      if (!r.success) return Ok(acc, rest);
      acc.push(r.data);
      rest = r.rest;
    }
  };
}

export function sep_by1<T, U>(
  p: Parser<T>,
  sep: Parser<U>
): Parser<[T, ...T[]]> {
  return two(p, many(right(sep, p)), (first, rest) => [first, ...rest]);
}

export function choice<T>(...ps: [Parser<T>]): Parser<T>;
export function choice<T, U>(...ps: [Parser<T>, Parser<U>]): Parser<T | U>;
export function choice<T>(...ps: Parser<T>[]): Parser<T>;
export function choice<T>(...ps: Parser<T>[]): Parser<T> {
  return input => {
    for (const p of ps) {
      const r = p(input);
      if (r.success) return r;
    }
    return Fail();
  };
}

export function wrap<T, U, V>(
  left: Parser<T>,
  middle: Parser<U>,
  right: Parser<V>
): Parser<U> {
  return three(left, middle, right, (_, x) => x);
}

export function eof(): Parser<null> {
  return input => (input === '' ? Ok(null, '') : Fail());
}
