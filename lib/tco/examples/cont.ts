import { Result, create } from '../src/cont';
import { List } from './List';

export const count = create(
  (x: number): Result<number, number> =>
    x <= 0 ? count.done(0) : count.loop(x - 1, x => count.done(x + 1))
);
export const fac = create(
  (x: number): Result<number, number> =>
    x <= 1 ? fac.done(1) : fac.loop(x - 1, x1 => fac.done(x * x1))
);
export const fib = create(
  (x: number): Result<number, number> =>
    x <= 1 ? fib.done(x) : fib.loop(x - 2, x2 => fib.loop(x - 1, x1 => fib.done(x2 + x1))),
  true
);
export const collatz = (x: number) => {
  const set = new Set<number>();
  const rec = create((n: number): Result<number, number> => {
    if (set.has(n)) return rec.done(-1);
    set.add(n);
    return rec.loop(n % 2 === 0 ? n / 2 : 3 * n + 1, i => rec.done(i + 1));
  });
  return rec(x);
};
export const sum = create(
  (xs: List<number>): Result<List<number>, number> =>
    xs.empty ? sum.done(0) : sum.loop(xs.rest, n => sum.done(xs.first + n))
);
