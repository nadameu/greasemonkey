import { List } from './List';

export const count = (x: number): number => (x <= 0 ? 0 : count(x - 1) + 1);
export const fac = (x: number): number => (x <= 1 ? 1 : x * fac(x - 1));
const memoize = <K, T>(f: (_: K) => T): ((_: K) => T) => {
  const map = new Map<K, T>();
  return key => {
    if (map.has(key)) return map.get(key)!;
    const value = f(key);
    map.set(key, value);
    return value;
  };
};
export const fib = memoize((x: number): number => (x <= 1 ? x : fib(x - 2) + fib(x - 1)));
export const collatz = (x: number) => {
  const set = new Set<number>();
  const rec = (n: number): number => {
    if (set.has(n)) return -1;
    set.add(n);
    return rec(n % 2 === 0 ? n / 2 : 3 * n + 1) + 1;
  };
  return rec(x);
};
export const sum = (xs: List<number>): number => (xs.empty ? 0 : xs.first + sum(xs.rest));
