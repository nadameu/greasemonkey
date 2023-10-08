import { List } from './List';

export const count = (n: number): number => {
  let acc = 0;
  for (let i = n; i > 0; i -= 1) acc += 1;
  return acc;
};
export const fac = (x: number): number => {
  let acc = 1;
  for (let i = x; i > 1; i -= 1) acc *= i;
  return acc;
};
export const fib = (x: number): number => {
  let [a, b] = [0, 1];
  for (let i = x; i > 0; i -= 1) [a, b] = [b, a + b];
  return a;
};
export const collatz = (x: number): number => {
  const set = new Set<number>();
  let n = x;
  let i = 0;
  while (!set.has(n)) {
    set.add(n);
    n = n % 2 === 0 ? n / 2 : 3 * n + 1;
    i += 1;
  }
  return i - 1;
};
export const sum = (xs: List<number>): number => {
  let acc = 0;
  for (let curr = xs; !curr.empty; curr = curr.rest) acc += curr.first;
  return acc;
};
