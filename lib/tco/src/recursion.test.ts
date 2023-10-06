import { expect, test } from 'vitest';
import { Recur, count, recursiveCount, stepCount, trampolineCount } from './recursion';

test('How high can you count?', () => {
  let result = -1;
  expect(() => {
    for (let i = 0; i < Number.MAX_SAFE_INTEGER; i += 1e4) {
      result = count(i);
    }
  }).toThrow();
  expect(result).toBeLessThan(80_000);
});

test('How high can you jump? More than 80,000!', () => {
  expect(trampolineCount(1_000_000)).toBe(1_000_000);
});

test('How far can you walk? More than 80,000!', () => {
  expect(stepCount(1_000_000)).toBe(1_000_000);
});

test('Recursive', () => {
  expect(recursiveCount(1_000_000)).toBe(1_000_000);
});

test('Recursive collatz', () => {
  const c = (x: number) => {
    const s = new Set<number>();
    return Recur<[number, number], number>(([n, i]) => {
      if (s.has(n)) return Recur.done(i);
      s.add(n);
      if (n % 2 === 0) return Recur.loop([n / 2, i + 1]);
      return Recur.loop([3 * n + 1, i + 1]);
    })([x, -1]);
  };

  expect(c(123)).toEqual(46);
  expect(c(12345679)).toEqual(228);
  expect(c(0xfffffffffff)).toEqual(538);
  expect(c(0xffffffffffff)).toEqual(542);
});

test('range', () => {
  type MyList<a> = [a, MyList<a>] | null;
  const range = Recur<[from: number, to: number], MyList<number>>(([from, to]) => {
    if (from > to) return Recur.done<MyList<number>>(null);
    return Recur.loop([from + 1, to], tail => [from, tail]);
  });
  const length = Recur<MyList<unknown>, number>(xs =>
    xs === null ? Recur.done(0) : Recur.loop(xs[1], x => x + 1)
  );
  expect(length(range([1, 10]))).toEqual(10);
  expect(length(range([1, 1_000_000]))).toEqual(1_000_000);
});
