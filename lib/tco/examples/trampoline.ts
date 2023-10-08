import { List } from './List';
import * as T from '../src/trampoline';
import { Trampoline } from '../src/trampoline';

export const count = (x: number): number => {
  const rec = (n: number, acc: number): Trampoline<number> => {
    if (n <= 0) return acc;
    else return T.loop(() => rec(n - 1, acc + 1));
  };
  return T.run(rec(x, 0));
};
export const fac = (x: number): number => {
  const rec = (n: number, acc: number): Trampoline<number> => {
    if (n <= 1) return acc;
    else return T.loop(() => rec(n - 1, acc * n));
  };
  return T.run(rec(x, 1));
};
export const fib = (x: number): number => {
  const rec = (n: number, a: number, b: number): Trampoline<number> => {
    if (n <= 0) return a;
    else return T.loop(() => rec(n - 1, b, a + b));
  };
  return T.run(rec(x, 0, 1));
};
export const collatz = (x: number): number => {
  const set = new Set<number>();
  const rec = (n: number, acc: number): Trampoline<number> => {
    if (set.has(n)) return acc;
    set.add(n);
    return T.loop(() => rec(n % 2 === 0 ? n / 2 : 3 * n + 1, acc + 1));
  };
  return T.run(rec(x, -1));
};
export const sum = (list: List<number>): number => {
  const rec = (xs: List<number>, acc: number): Trampoline<number> => {
    if (xs.empty) return acc;
    else return T.loop(() => rec(xs.rest, acc + xs.first));
  };
  return T.run(rec(list, 0));
};
