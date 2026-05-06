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
export const Fail: Result<never> = { success: false };

export function str<T extends string>(str: T): Parser<T> {
  return input => {
    if (input.startsWith(str)) return Ok(str, input.slice(str.length));
    return Fail;
  };
}

export function re(re: RegExp): Parser<string> {
  return input => {
    const match = input.match(re);
    if (match?.index === 0) return Ok(match[0], input.slice(match[0].length));
    return Fail;
  };
}

export function map<T, U>(p: Parser<T>, f: (_: T) => U): Parser<U> {
  return (input, result = p(input)) =>
    result.success ? Ok(f(result.data), result.rest) : result;
}

export function map2<A, B, C = [A, B]>(
  pa: Parser<A>,
  pb: Parser<B>,
  f: (a: A, b: B) => C = (a, b) => [a, b] as C
): Parser<C> {
  return map_n([pa, pb], f);
}

export function left<A, B>(pa: Parser<A>, pb: Parser<B>): Parser<A> {
  return map_n([pa, pb], (a, _) => a);
}

export function right<A, B>(pa: Parser<A>, pb: Parser<B>): Parser<B> {
  return map_n([pa, pb], (_, b) => b);
}

export function map3<A, B, C, D = [A, B, C]>(
  pa: Parser<A>,
  pb: Parser<B>,
  pc: Parser<C>,
  f: (a: A, b: B, c: C) => D = (a, b, c) => [a, b, c] as D
): Parser<D> {
  return map_n([pa, pb, pc], f);
}

export function map_n<A, B = [A]>(ps: [Parser<A>], f?: (a: A) => B): Parser<B>;
export function map_n<A, B, C = [A, B]>(
  ps: [Parser<A>, Parser<B>],
  f?: (a: A, b: B) => C
): Parser<C>;
export function map_n<A, B, C, D = [A, B, C]>(
  ps: [Parser<A>, Parser<B>, Parser<C>],
  f?: (a: A, b: B, c: C) => D
): Parser<D>;
export function map_n<A, B, C, D, E = [A, B, C, D]>(
  ps: [Parser<A>, Parser<B>, Parser<C>, Parser<D>],
  f?: (a: A, b: B, c: C, d: D) => E
): Parser<E>;
export function map_n<T, U>(
  ps: Iterable<Parser<T>>,
  f?: (...values: T[]) => U
): Parser<U>;
export function map_n<T, U = T[]>(
  ps: Iterable<Parser<T>>,
  f: (...values: T[]) => U = (...values: T[]) => values as U
): Parser<U> {
  return input => {
    let result: Result<U> | null = null;
    const values = [
      ...(function* () {
        for (const p of ps) {
          const r = p(input);
          if (!r.success) {
            result = r;
            break;
          }
          yield r.data;
          input = r.rest;
        }
      })(),
    ];
    if (result) return result;
    return Ok(f(...values), input);
  };
}

export function many<T>(p: Parser<T>): Parser<T[]> {
  return input => {
    const values = [
      ...(function* () {
        while (true) {
          const r = p(input);
          if (!r.success) break;
          yield r.data;
          input = r.rest;
        }
      })(),
    ];
    return Ok(values, input);
  };
}

export function sep_by1<T, U>(
  p: Parser<T>,
  sep: Parser<U>
): Parser<[T, ...T[]]> {
  return map_n([p, many(right(sep, p))], (first, rest) => [first, ...rest]);
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
    return Fail;
  };
}

export function middle<A, B, C>(
  left: Parser<A>,
  middle: Parser<B>,
  right: Parser<C>
): Parser<B> {
  return map_n([left, middle, right], (_, x) => x);
}

export function eof(): Parser<null> {
  return input => (input === '' ? Ok(null, '') : Fail);
}
