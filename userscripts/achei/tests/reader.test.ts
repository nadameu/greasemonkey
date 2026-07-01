import { describe, expect, test } from 'vitest';
import { Reader, lift2, reader } from '../src/04_reader';

test('Stack safety', () => {
  /** Careful when pow > 20 */
  function test_iterations(pow: number, div: number) {
    if (!Number.isInteger(pow) || !Number.isInteger(div)) {
      throw new Error('pow and div must be integers.');
    }
    if (div < 1) throw new Error('div has to be at least 1.');
    if (div >= pow) throw new Error('div has to be less than pow');
    const iterations = 1 << pow;

    let test0 = reader((x: number) => x);
    for (let i = 0; i < iterations; i += 1) {
      test0 = test0.chain(x => reader(y => x + y / (1 << div) + 1));
    }
    const expected = (1 << pow) | (1 << (pow - div)) | 1;

    const actual = test0.run(1);
    expect(actual).toEqual(expected);
  }

  test_iterations(17, 8);
});

describe('Fibonacci', () => {
  const fib = (n: number): number => {
    const memo: number[] = Array(n + 1).fill(-1);
    const go = (n: number): Reader<unknown, number> => {
      return reader(() => n).chain(n => {
        if (memo[n] !== -1) {
          return reader(_ => memo[n]!);
        }

        if (n < 2) return reader(() => (memo[n] = n));
        return lift2((n2: number, n1: number) => (memo[n] = n2 + n1))(
          go(n - 2),
          go(n - 1)
        );
      });
    };

    return go(n).run(null);
  };
  function test_fib(n: number) {
    const arr = new Array(n);
    for (let i = 0; i < 2; i += 1) {
      arr[i] = i;
    }
    for (let i = 2; i <= n; i += 1) {
      arr[i] = arr[i - 2] + arr[i - 1];
    }
    test(String(n), () => expect(fib(n)).toEqual(arr[n]));
  }

  test_fib(0);
  test_fib(1);
  test_fib(2);
  test_fib(3);
  test_fib(4);
  test_fib(5);
  test_fib(6);
  test_fib(7);
  test_fib(1000);
});
