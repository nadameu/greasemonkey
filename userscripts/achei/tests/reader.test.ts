import { describe, expect, test } from 'vitest';
import { Reader, lift2, reader } from '../src/04_reader';

test('Stack safety', () => {
  function generate(iterations: number, div: number) {
    const rec =
      (n: number) =>
      (x: number): Reader<number, number> => {
        const r = reader((y: number) => x + y / (1 << div) + 1);
        if (n > 1) return r.chainReader(rec(n - 1));
        else return r;
      };
    return reader((x: number) => x).chainReader(rec(iterations));
  }

  /** Careful when pow > 20 */
  function test_iterations(pow: number, div: number) {
    if (!Number.isInteger(pow) || !Number.isInteger(div)) {
      throw new Error('pow and div must be integers.');
    }
    if (div < 1) throw new Error('div has to be at least 1.');
    if (div >= pow) throw new Error('div has to be less than pow');
    const iterations = 1 << pow;

    const test0 = generate(iterations, div);
    const expected = (1 << pow) | (1 << (pow - div)) | 1;
    const actual = test0.run(1);
    expect(actual).toEqual(expected);
  }

  test_iterations(17, 8);
});

test('lift2', () => {
  const r = reader((x: number) => x);

  const two_x = r.mapReader(x => 2 * x);
  const y_plus_one = r.mapReader(x => x + 1);

  const pure_pure = lift2((x: number, y: number) => 2 * x + y + 1)(r, r);
  const pure_chain = lift2((x: number, y: number) => 2 * x + y)(r, y_plus_one);
  const chain_pure = lift2((x: number, y: number) => x + y + 1)(two_x, r);
  const chain_chain = lift2((x: number, y: number) => x + y)(two_x, y_plus_one);

  for (let i = 0; i < 9; i += 1) {
    const expected = 3 * i + 1;
    expect(pure_pure.run(i)).toEqual(expected);
    expect(pure_chain.run(i)).toEqual(expected);
    expect(chain_pure.run(i)).toEqual(expected);
    expect(chain_chain.run(i)).toEqual(expected);
  }
});

describe('Fibonacci', () => {
  const fib = (n: number): number => {
    const memo: number[] = Array(n + 1).fill(-1);
    const go = (n: number): Reader<unknown, number> => {
      return reader(() => n).chainReader(n => {
        if (memo[n] !== -1) {
          return reader(() => memo[n]!);
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
  const test_fib = (() => {
    let n = 1000;
    const arr = new Array(n);
    for (let i = 0; i < 2; i += 1) {
      arr[i] = i;
    }
    for (let i = 2; i <= n; i += 1) {
      arr[i] = arr[i - 2] + arr[i - 1];
    }
    return (n: number) => {
      test(String(n), () => expect(fib(n)).toEqual(arr[n]));
    };
  })();

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
