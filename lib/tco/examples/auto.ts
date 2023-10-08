import { auto } from '../src/auto';
import { List } from './List';

export const count = (x: number): number => {
  const rec = auto((n: number, acc: number): number => {
    if (n <= 0) return acc;
    else return rec(n - 1, acc + 1);
  });
  return rec(x, 0);
};
export const fac = (x: number): number => {
  const rec = auto((n: number, acc: number): number => {
    if (n <= 1) return acc;
    else return rec(n - 1, acc * n);
  });
  return rec(x, 1);
};
export const fib = (x: number): number => {
  const rec = auto((n: number, a: number, b: number): number => {
    if (n <= 0) return a;
    else return rec(n - 1, b, a + b);
  });
  return rec(x, 0, 1);
};
export const collatz = (x: number): number => {
  const set = new Set<number>();
  const rec = auto((n: number, acc: number): number => {
    if (set.has(n)) return acc;
    set.add(n);
    return rec(n % 2 === 0 ? n / 2 : 3 * n + 1, acc + 1);
  });
  return rec(x, -1);
};
export const sum = (list: List<number>): number => {
  const rec = auto((xs: List<number>, acc: number): number => {
    if (xs.empty) return acc;
    else return rec(xs.rest, acc + xs.first);
  });
  return rec(list, 0);
};
