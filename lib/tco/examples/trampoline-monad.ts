import { done, loop, Trampoline, zip } from '../src/trampoline-monad';
import { List } from './List';

export const count = (x: number): number => {
  const rec = (x: number): Trampoline<number> =>
    x <= 0 ? done(0) : loop(() => rec(x - 1)).map(x1 => x1 + 1);
  return rec(x).run();
};
export const fac = (x: number): number => {
  const rec = (x: number): Trampoline<number> =>
    x <= 1 ? done(1) : loop(() => rec(x - 1)).map(x1 => x * x1);
  return rec(x).run();
};
export const fib = (x: number): number => {
  let cache = new Map<number, number>([
    [0, 0],
    [1, 1],
  ]);
  const rec = (x: number): Trampoline<number> => {
    if (cache.has(x)) return done(cache.get(x)!);
    return loop(() => zip(rec(x - 2), rec(x - 1))).map(([x2, x1]) =>
      (result => (cache.set(x, result), result))(x2 + x1)
    );
  };
  return rec(x).run();
};
export const collatz = (x: number): number => {
  const set = new Set<number>();
  const rec = (n: number): Trampoline<number> => {
    if (set.has(n)) return loop(() => done(-1));
    set.add(n);
    return loop(() => rec(n % 2 === 0 ? n / 2 : 3 * n + 1)).map(i => i + 1);
  };
  return rec(x).run();
};
export const sum = (xs: List<number>): number => {
  const rec = (xs: List<number>): Trampoline<number> =>
    xs.empty ? done(0) : loop(() => rec(xs.rest)).map(s => xs.first + s);
  return rec(xs).run();
};
