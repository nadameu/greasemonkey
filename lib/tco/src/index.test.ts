import { describe, expect, test } from 'vitest';
import { recursively } from '.';

describe('naive recursion', () => {
  function fac(n: number): number {
    if (n <= 1) return 1;
    return n * fac(n - 1);
  }

  test_factorial_small_values('factorial is ok for small values', fac);
  test_factorial_large_value_err('factorial overflows the stack for large numbers', fac);

  function fib(n: number): number {
    const cache = new Map<number, number>();
    function rec(n: number): number {
      if (cache.has(n)) return cache.get(n)!;
      const result = n <= 1 ? n : rec(n - 2) + rec(n - 1);
      cache.set(n, result);
      return result;
    }
    return rec(n);
  }

  test_fibonacci('fibonacci (with cache) is ok', fib);

  test_performance.skip('is very fast', 'naive', fac);
});

describe('iterative', () => {
  function fac(n: number): number {
    let acc = 1;
    for (let i = 1; i <= n; i += 1) {
      acc = i * acc;
    }
    return acc;
  }

  test_factorial_small_values('factorial is ok with small values', fac);
  test_factorial_large_value_ok('factorial is ok with large values', fac);

  function fib(n: number): number {
    if (n <= 1) return n;
    let a = 0;
    let b = 1;
    for (let i = 2; i < n; i += 1) {
      [a, b] = [b, a + b];
    }
    return a + b;
  }

  test_fibonacci('fibonacci is ok (no cache needed)', fib);

  test_performance.skip('is the fastest, but harder to reason about', 'iterative', fac);
});

describe('trampoline', () => {
  type Trampoline<a> = a extends Function ? never : a | { (): Trampoline<a> };
  function run<a>(f: Trampoline<a>): a {
    let result = f;
    while (typeof result === 'function') result = result();
    return result as a;
  }

  function fac(n: number): number {
    function rec(n: number, acc: number = 1): Trampoline<number> {
      if (n <= 0) return acc;
      return () => rec(n - 1, acc * n);
    }
    return run(rec(n));
  }

  test_factorial_small_values('factorial is ok with small values', fac);
  test_factorial_large_value_ok('factorial is ok with large values', fac);

  function fib(n: number): number {
    function rec(n: number, a: number = 0, b: number = 1): Trampoline<number> {
      if (n === 0) return a;
      if (n === 1) return b;
      if (n === 2) return a + b;
      return () => rec(n - 1, b, a + b);
    }
    return run(rec(n));
  }

  test_fibonacci('fibonacci is ok (no cacche needed)', fib);

  test_performance.skip('is as fast as recursion, but safer. still complicated', 'trampoline', fac);
});

describe('recursively', () => {
  const fac = recursively<number, number>(function* (n) {
    if (n <= 1) return 1;
    const next = yield n - 1;
    return n * next;
  });

  test_factorial_small_values('factorial is ok with small values', fac);
  test_factorial_large_value_ok('factorial is ok with large values', fac);

  const fib = recursively<number, number>(
    function* (n) {
      return n <= 1 ? n : (yield n - 2) + (yield n - 1);
    },
    () => new Map<number, number>()
  );

  test_fibonacci('fibonacci is ok. caching easier to implement', fib);

  test_performance.skip('not as fast, but safe and easy to reason about', 'recursively', fac);
});

function test_factorial_small_values(description: string, fac: (_: number) => number) {
  test(description, () => {
    expect(fac(0)).toEqual(1);
    expect(fac(1)).toEqual(1);
    expect(fac(2)).toEqual(2);
    expect(fac(3)).toEqual(6);
    expect(fac(4)).toEqual(24);
    expect(fac(5)).toEqual(120);
    expect(fac(10)).toEqual(3628800);
    expect(fac(10_000)).toEqual(Infinity);
  });
}

function test_factorial_large_value_ok(description: string, fac: (_: number) => number) {
  test(description, () => {
    expect(fac(5e4)).toEqual(Infinity);
  });
}

function test_factorial_large_value_err(description: string, fac: (_: number) => number) {
  test(description, () => {
    expect(() => fac(5e4)).toThrowError(RangeError);
  });
}

function test_fibonacci(description: string, fib: (_: number) => number) {
  test(description, () => {
    expect(fib(0)).toEqual(0);
    expect(fib(1)).toEqual(1);
    expect(fib(2)).toEqual(1);
    expect(fib(3)).toEqual(2);
    expect(fib(4)).toEqual(3);
    expect(fib(5)).toEqual(5);
    expect(fib(6)).toEqual(8);
    expect(fib(7)).toEqual(13);
    expect(fib(50)).toEqual(12586269025);
    expect(fib(100)).toEqual(354224848179262000000);
    expect(fib(10_000)).toEqual(Infinity);
  });
}

function test_performance(description: string, tag: string, fac: (_: number) => number) {
  test(description, () => {
    console.time(tag);
    let result;
    for (let max = 1_000; max > 0; max -= 1) {
      result = fac(10_000);
    }
    console.timeEnd(tag);
    expect(result).toBeGreaterThan(1e150);
  });
}
test_performance.skip = function (description: string, tag: string, fac: (_: number) => number) {
  test.skip(description, () => {});
};
