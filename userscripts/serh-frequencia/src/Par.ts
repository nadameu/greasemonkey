import * as P from '@nadameu/predicates';
import { CustomError } from './CustomError';

const ParserSym = Symbol();
export interface Parser<T> {
  constructor: typeof Parser;
  [ParserSym]: true;
  match(input: string, start: number): Result<T>;
}
export const Parser: ParserConstructor = function <T>(
  match: (input: string, start: number) => Result<T>
): Parser<T> {
  P.assert(P.isFunction(match));
  return Object.assign(Object.create(Parser.prototype) as Parser<T>, {
    match(input: string, start: number) {
      P.assert(
        P.isString(input) &&
          P.isNonNegativeInteger(start) &&
          start <= input.length
      );
      const result = match(input, start);
      P.assert(isResult(result));
      return result;
    },
  });
};
Parser.prototype = {
  constructor: Parser,
  [ParserSym]: true,
  match() {
    throw new Error('Unimplemented.');
  },
};
export interface ParserConstructor {
  <T>(match: (input: string, start: number) => Result<T>): Parser<T>;
  prototype: Parser<unknown>;
}

const ResultSym = Symbol();
export type Result<T> = { [ResultSym]: true } & (Ok<T> | Fail);
type ResultBase<T> = { [K in keyof Result<T>]: Result<T>[K] };
function isResultBase(obj: unknown): obj is ResultBase<unknown> {
  return typeof obj === 'object' && obj !== null && ResultSym in obj;
}
export function isResult(obj: unknown): obj is Result<unknown> {
  return isResultBase(obj) && (isOk(obj) || isFail(obj));
}
const OkSym = Symbol();
export interface Ok<T> {
  [ResultSym]: true;
  [OkSym]: true;
  matched: true;
  data: T;
  input: string;
  start: number;
  end: number;
}
export function Ok<T>(
  data: T,
  input: string,
  start: number,
  end: number
): Result<T> {
  P.assert(
    P.isString(input) &&
      P.isNonNegativeInteger(start) &&
      P.isNonNegativeInteger(end) &&
      start <= end &&
      end <= input.length
  );
  return {
    [ResultSym]: true,
    [OkSym]: true,
    matched: true,
    data,
    input,
    start,
    end,
  };
}
export function isOk(result: ResultBase<unknown>): result is Ok<unknown> {
  return OkSym in result;
}
const FailSym = Symbol();
export interface Fail {
  [ResultSym]: true;
  [FailSym]: true;
  matched: false;
  input: string;
  start: number;
}
export function Fail<T = never>(input: string, start: number): Result<T> {
  P.assert(
    P.isString(input) && P.isNonNegativeInteger(start) && start <= input.length
  );
  return { [ResultSym]: true, [FailSym]: true, matched: false, input, start };
}
export function isFail(result: ResultBase<unknown>): result is Fail {
  return FailSym in result;
}

export function str<T extends string>(str: T): Parser<T> {
  P.assert(P.isString(str));
  return Parser((input, start) => {
    const end = start + str.length;
    if (input.slice(start, end) === str) return Ok(str, input, start, end);
    return Fail(input, start);
  });
}

function isRegExp(re: unknown): re is RegExp {
  return (
    typeof re === 'object' &&
    re !== null &&
    ((Symbol.match in re && !!re[Symbol.match]) || re instanceof RegExp)
  );
}
export function re(re: RegExp): Parser<string> {
  P.assert(isRegExp(re));
  const exp = RegExp(re.source, [...new Set([...re.flags, 'd', 'y'])].join(''));
  return Parser((input, start) => {
    exp.lastIndex = start;
    const match = exp.exec(input);
    if (!match) return Fail(input, start);
    const [, end] = match.indices![0]!;
    return Ok(match[0], input, start, end);
  });
}

export function left<T>(pa: Parser<T>, pb: Parser<unknown>): Parser<T> {
  P.assert(pa instanceof Parser && pb instanceof Parser);
  return map([pa, pb], (a, _) => a);
}

export function right<T>(pa: Parser<unknown>, pb: Parser<T>): Parser<T> {
  P.assert(pa instanceof Parser && pb instanceof Parser);
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
  P.assert(
    P.isTypedArray((p): p is Parser<unknown> => p instanceof Parser)(ps) &&
      P.isFunction(f)
  );
  return Parser((input, start) => {
    const values: T[] = [];
    let current = start;
    for (const p of ps) {
      const r = p.match(input, current);
      if (!r.matched) return Fail(input, start);
      values.push(r.data);
      current = r.end;
    }
    return Ok(f(...values), input, start, current);
  });
}

export function many<T>(p: Parser<T>): Parser<T[]> {
  return Parser((input, start) => {
    const values: T[] = [];
    let curr = start;
    while (true) {
      const r = p.match(input, curr);
      if (!r.matched) break;
      values.push(r.data);
      if (r.end === curr) {
        throw new CustomError('Infinite loop.', { input, start });
      }
      curr = r.end;
    }
    return Ok(values, input, start, curr);
  });
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
  return Parser((input, start) => {
    for (const p of ps) {
      const r = p.match(input, start);
      if (r.matched) return r;
    }
    return Fail(input, start);
  });
}

export function middle<T>(
  left: Parser<unknown>,
  middle: Parser<T>,
  right: Parser<unknown>
): Parser<T> {
  return map([left, middle, right], (_, x) => x);
}

export function eof(): Parser<null> {
  return Parser((input, start) => {
    const length = input.length;
    if (start >= length) return Ok(null, input, length, length);
    return Fail(input, start);
  });
}

export function option<T>(p: Parser<T>, thunk: () => T): Parser<T> {
  return choice(
    p,
    Parser((input, start) => Ok(thunk(), input, start, start))
  );
}

export function filter<T>(
  p: Parser<T>,
  pred: (data: T, input: string, start: number, end: number) => boolean
): Parser<T>;
export function filter<T, U extends T>(
  p: Parser<T>,
  pred: (data: T, input: string, start: number, end: number) => data is U
): Parser<U>;
export function filter<T>(
  p: Parser<T>,
  pred: (data: T, input: string, start: number, end: number) => boolean
): Parser<T> {
  return Parser((input, start) => {
    const r = p.match(input, start);
    if (!r.matched) return r;
    if (pred(r.data, r.input, r.start, r.end)) return r;
    else return Fail(input, start);
  });
}

export function take_while<T>(
  p: Parser<T>,
  pred: (data: T, input: string, start: number, end: number) => boolean
): Parser<T[]>;
export function take_while<T, U extends T>(
  p: Parser<T>,
  pred: (data: T, input: string, start: number, end: number) => data is U
): Parser<U[]>;
export function take_while<T>(
  p: Parser<T>,
  pred: (data: T, input: string, start: number, end: number) => boolean
): Parser<T[]> {
  return many(filter(p, pred));
}

export function take_while_p<T>(
  p: Parser<T>,
  cond: Parser<unknown>
): Parser<T[]> {
  return take_while(p, (_, input, start) => cond.match(input, start).matched);
}

export function take_until<T>(
  p: Parser<T>,
  pred: (data: T, input: string, start: number, end: number) => boolean
): Parser<T[]> {
  return take_while(p, (...args) => !pred(...args));
}

export function take_until_p<T>(
  p: Parser<T>,
  cond: Parser<unknown>
): Parser<T[]> {
  return take_while(p, (_, input, start) => !cond.match(input, start).matched);
}

export function any(): Parser<string> {
  return Parser((input, start) => {
    const end = input.length;
    if (end > start) {
      return Ok(input.slice(start, start + 1), input, start, start + 1);
    } else {
      return Fail(input, start);
    }
  });
}

export function of<T>(value: T): Parser<T> {
  return Parser((input, start) => Ok(value, input, start, start));
}

export function peek<T>(
  p: Parser<T>,
  f: (data: T, input: string, start: number, end: number) => void
): Parser<T> {
  return Parser((input, start) => {
    const r = p.match(input, start);
    if (!r.matched) return r;
    f(r.data, r.input, r.start, r.end);
    return r;
  });
}
