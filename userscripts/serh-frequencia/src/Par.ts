import { CustomError } from './CustomError';

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

export function left<T>(pa: Parser<T>, pb: Parser<unknown>): Parser<T> {
  return map([pa, pb], (a, _) => a);
}

export function right<T>(pa: Parser<unknown>, pb: Parser<T>): Parser<T> {
  return map([pa, pb], (_, b) => b);
}

export function map<A, B = [A]>(ps: [Parser<A>], f?: (a: A) => B): Parser<B>;
export function map<A, B, C = [A, B]>(
  ps: [Parser<A>, Parser<B>],
  f?: (a: A, b: B) => C
): Parser<C>;
export function map<A, B, C, D = [A, B, C]>(
  ps: [Parser<A>, Parser<B>, Parser<C>],
  f?: (a: A, b: B, c: C) => D
): Parser<D>;
export function map<A, B, C, D, E = [A, B, C, D]>(
  ps: [Parser<A>, Parser<B>, Parser<C>, Parser<D>],
  f?: (a: A, b: B, c: C, d: D) => E
): Parser<E>;
export function map<T, U>(
  ps: Iterable<Parser<T>>,
  f?: (...values: T[]) => U
): Parser<U>;
export function map<T, U = T[]>(
  ps: Iterable<Parser<T>>,
  f: (...values: T[]) => U = (...values: T[]) => values as U
): Parser<U> {
  return input => {
    const values: T[] = [];
    for (const p of ps) {
      const r = p(input);
      if (!r.success) return r;
      values.push(r.data);
      input = r.rest;
    }
    return Ok(f(...values), input);
  };
}

export function many<T>(p: Parser<T>): Parser<T[]> {
  return input => {
    const values: T[] = [];
    while (true) {
      const r = p(input);
      if (!r.success) break;
      values.push(r.data);
      if (r.rest === input) {
        throw new CustomError('Infinite loop.', { input });
      }
      input = r.rest;
    }
    return Ok(values, input);
  };
}

export function many1<T>(p: Parser<T>): Parser<[T, ...T[]]> {
  return map([p, many(p)], (x, xs) => [x].concat(xs) as [T, ...T[]]);
}

export function sep_by1<T>(
  p: Parser<T>,
  sep: Parser<unknown>
): Parser<[T, ...T[]]> {
  return map([p, many(right(sep, p))], (first, rest) => [first, ...rest]);
}

export function sep_by<T>(p: Parser<T>, sep: Parser<unknown>): Parser<T[]> {
  return option<T[]>(sep_by1(p, sep), () => []);
}

export function choice<T>(...ps: Parser<T>[]): Parser<T> {
  return input => {
    for (const p of ps) {
      const r = p(input);
      if (r.success) return r;
    }
    return Fail;
  };
}

export function middle<T>(
  left: Parser<unknown>,
  middle: Parser<T>,
  right: Parser<unknown>
): Parser<T> {
  return map([left, middle, right], (_, x) => x);
}

export function eof(): Parser<null> {
  return input => (input === '' ? Ok(null, '') : Fail);
}

export function option<T>(p: Parser<T>, thunk: () => T): Parser<T> {
  return choice(p, input => Ok(thunk(), input));
}

export function filter<T>(
  p: Parser<T>,
  pred: (value: T, input: string) => boolean
): Parser<T>;
export function filter<T, U extends T>(
  p: Parser<T>,
  pred: (value: T, input: string) => value is U
): Parser<U>;
export function filter<T>(
  p: Parser<T>,
  pred: (value: T, input: string) => boolean
): Parser<T> {
  return input => {
    const r = p(input);
    if (!r.success) return r;
    if (pred(r.data, input)) return r;
    else return Fail;
  };
}

export function take_while<T>(
  p: Parser<T>,
  pred: (value: T, input: string) => boolean
): Parser<T[]> {
  return many(filter(p, pred));
}

export function take_while_p<T>(
  p: Parser<T>,
  cond: Parser<unknown>
): Parser<T[]> {
  return take_while(p, (_, input) => cond(input).success);
}

export function take_until<T>(
  p: Parser<T>,
  pred: (value: T, input: string) => boolean
): Parser<T[]> {
  return take_while(p, (value, input) => !pred(value, input));
}

export function take_until_p<T>(
  p: Parser<T>,
  cond: Parser<unknown>
): Parser<T[]> {
  return take_while(p, (_, input) => !cond(input).success);
}

export function any(): Parser<string> {
  return input => (input.length > 0 ? Ok(input[0]!, input.slice(1)) : Fail);
}

export function of<T>(value: T): Parser<T> {
  return input => Ok(value, input);
}

export function peek<T>(
  p: Parser<T>,
  f: (data: T, input: string, rest: string) => void
): Parser<T> {
  return input => {
    const r = p(input);
    if (!r.success) return r;
    f(r.data, input, r.rest);
    return r;
  };
}
