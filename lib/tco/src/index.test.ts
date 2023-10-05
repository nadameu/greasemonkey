import { describe, expect, test } from 'vitest';
import { TCO } from '.';

describe('Tail-call-optimization', () => {
  function factorial(n: number): number {
    if (n <= 1) return 1;
    return n * factorial(n - 1);
  }
  test('ok for small values', () => {
    expect(factorial(10)).toEqual(3628800);
  });
  test('stack overflow on large numbers', () => {
    expect(() => factorial(5e4)).toThrowError(RangeError);
  });
});

describe('Trampoline', () => {
  function factorial(n: number): number {
    type Rec = number | (() => Rec);
    function rec(acc: number, n: number): Rec {
      if (n <= 0) return acc;
      return () => rec(acc * n, n - 1);
    }
    let result = rec(1, n);
    while (typeof result === 'function') result = result();
    return result;
  }

  test('Works, but tricky to type', () => {
    expect(factorial(50000)).toEqual(Infinity);
  });
});

describe('TCO monad', () => {
  function factorial(n: number): TCO<number> {
    return TCO.of(n).chain(n => {
      if (n <= 1) return TCO.of(1);
      return TCO.of(n - 1)
        .chain(factorial)
        .map(x => x * n);
    });
  }

  test("Doesn't raise errors", () => {
    expect(() => factorial(10).run()).not.toThrow();
    expect(() => factorial(5e4).run()).not.toThrow();
    expect(factorial(10).run()).toEqual(3628800);
    expect(factorial(5e4).run()).toEqual(Infinity);
  });

  const memo = new Map<number, number>();
  function fib(n: number): TCO<number> {
    return TCO.of(n).chain(n => {
      if (memo.has(n)) return TCO.of(memo.get(n)!);
      if (n <= 1) {
        memo.set(n, n);
        return TCO.of(n);
      }
      return TCO.of(n - 1)
        .chain(fib)
        .chain(n1 =>
          TCO.of(n - 2)
            .chain(fib)
            .map(n2 => {
              memo.set(n, n1 + n2);
              return n1 + n2;
            })
        );
    });
  }

  test('Fibonacci', () => {
    expect(fib(50).run()).toEqual(12586269025);
    expect(fib(100).run()).toEqual(354224848179262000000);
  });
});
