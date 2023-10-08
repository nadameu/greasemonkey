import { List } from './List';
import { recursively } from '../src/recursively';

export const count = recursively<number, number>(function* (x) {
  return x <= 0 ? 0 : (yield x - 1) + 1;
});
export const fac = recursively<number, number>(function* (x) {
  return x <= 1 ? 1 : x * (yield x - 1);
});
export const fib = recursively<number, number>(
  function* (x) {
    return x <= 1 ? x : (yield x - 2) + (yield x - 1);
  },
  () => new Map()
);
export const collatz = (x: number) => {
  const set = new Set<number>();
  const rec = recursively<number, number>(function* (n) {
    if (set.has(n)) return -1;
    set.add(n);
    return (yield n % 2 === 0 ? n / 2 : 3 * n + 1) + 1;
  });
  return rec(x);
};
export const sum = recursively<List<number>, number>(function* (xs) {
  return xs.empty ? 0 : xs.first + (yield xs.rest);
});
