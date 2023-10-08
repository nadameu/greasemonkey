import { List } from './List';
import * as S from '../src/step';
import { Step } from '../src/step';

export const count = (x: number): number => {
  const rec = (n: number, acc: number): Step<number> => {
    if (n <= 0) return S.done(acc);
    else return S.loop(() => rec(n - 1, acc + 1));
  };
  return S.run(rec(x, 0));
};
export const fac = (x: number): number => {
  const rec = (n: number, acc: number): Step<number> => {
    if (n <= 1) return S.done(acc);
    else return S.loop(() => rec(n - 1, acc * n));
  };
  return S.run(rec(x, 1));
};
export const fib = (x: number): number => {
  const rec = (n: number, a: number, b: number): Step<number> => {
    if (n <= 0) return S.done(a);
    else return S.loop(() => rec(n - 1, b, a + b));
  };
  return S.run(rec(x, 0, 1));
};
export const collatz = (x: number): number => {
  const set = new Set<number>();
  const rec = (n: number, acc: number): Step<number> => {
    if (set.has(n)) return S.done(acc);
    set.add(n);
    return S.loop(() => rec(n % 2 === 0 ? n / 2 : 3 * n + 1, acc + 1));
  };
  return S.run(rec(x, -1));
};
export const sum = (list: List<number>): number => {
  const rec = (xs: List<number>, acc: number): Step<number> => {
    if (xs.empty) return S.done(acc);
    else return S.loop(() => rec(xs.rest, acc + xs.first));
  };
  return S.run(rec(list, 0));
};
