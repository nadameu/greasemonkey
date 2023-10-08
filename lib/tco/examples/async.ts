import { List } from './List';

export const count = async (x: number): Promise<number> => (x <= 0 ? 0 : (await count(x - 1)) + 1);
export const fac = async (x: number): Promise<number> => (x <= 1 ? 1 : x * (await fac(x - 1)));
const memoize = <K, T>(f: (_: K) => T): ((_: K) => T) => {
  const map = new Map<K, T>();
  return key => {
    if (map.has(key)) return map.get(key)!;
    const value = f(key);
    map.set(key, value);
    return value;
  };
};
export const fib = memoize(
  async (x: number): Promise<number> => (x <= 1 ? x : (await fib(x - 2)) + (await fib(x - 1)))
);
export const collatz = (x: number): Promise<number> => {
  const set = new Set<number>();
  const rec = async (n: number): Promise<number> => {
    if (set.has(n)) return -1;
    set.add(n);
    return (await rec(n % 2 === 0 ? n / 2 : 3 * n + 1)) + 1;
  };
  return rec(x);
};
export const sum = async (xs: List<number>): Promise<number> =>
  xs.empty ? 0 : xs.first + (await sum(xs.rest));
