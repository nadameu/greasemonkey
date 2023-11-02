import { List } from './List';

export const count = (x: number): Promise<number> =>
  x <= 0 ? Promise.resolve(0) : count(x - 1).then(x => x + 1);
export const fac = (x: number): Promise<number> =>
  x <= 1 ? Promise.resolve(1) : fac(x - 1).then(y => x * y);
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
  (x: number): Promise<number> =>
    x <= 1
      ? Promise.resolve(x)
      : Promise.all([fib(x - 2), fib(x - 1)]).then(([a, b]) => a + b)
);
export const collatz = (x: number): Promise<number> => {
  const set = new Set<number>();
  const rec = (n: number): Promise<number> => {
    if (set.has(n)) return Promise.resolve(-1);
    set.add(n);
    return rec(n % 2 === 0 ? n / 2 : 3 * n + 1).then(x => x + 1);
  };
  return rec(x);
};
export const sum = (xs: List<number>): Promise<number> =>
  xs.empty ? Promise.resolve(0) : sum(xs.rest).then(y => xs.first + y);
