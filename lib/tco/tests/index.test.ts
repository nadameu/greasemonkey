import { describe, expect, test } from 'vitest';
import { generate } from '../examples/List';
import {
  Limitation,
  StrategyFunctions,
  strategies,
} from '../examples/strategies';

describe.each(strategies.map(x => [x.name, x.fns, x]))(
  '%s',
  (_name: string, fns: StrategyFunctions, { limitation, needsCaching }) => {
    describe('count', () => {
      test('small', test_count_small(fns.count));
      // #region large
      if (limitation === Limitation.Stack) {
        test.skip(
          'large values overflow the stack',
          test_count_large(fns.count)
        );
      } else {
        test('large', test_count_large(fns.count));
      }
      // #endregion
      // #region very large
      if (limitation === Limitation.Stack) {
        test.skip('very large (skip)', test_count_very_large(fns.count));
      } else if (limitation === Limitation.Heap) {
        test.skip(
          'very large values consume all heap space',
          test_count_very_large(fns.count)
        );
      } else if (limitation === Limitation.Performance) {
        test.skip(
          'very large values make it slow',
          test_count_very_large(fns.count)
        );
      } else {
        test('very large', test_count_very_large(fns.count));
      }
      // #endregion
    });
    describe('factorial', () => {
      test('small', test_factorial_small(fns.fac));
      if (limitation === Limitation.Stack) {
        test.skip(
          'large values overflow the stack',
          test_factorial_large(fns.fac)
        );
      } else {
        test('large', test_factorial_large(fns.fac));
      }
    });
    test(
      `fibonacci${needsCaching ? ' (cached)' : ''}`,
      test_fibonacci(fns.fib)
    );
    test('collatz', test_collatz(fns.collatz));
    describe('folding a list', () => {
      test('small', test_sum_small(fns.sum));
      if (limitation === Limitation.Stack) {
        test.skip('large lists overflow the stack', test_sum_large(fns.sum));
      } else {
        test('large', test_sum_large(fns.sum));
      }
    });
  }
);

function test_count_small(count: StrategyFunctions['count']) {
  return async function () {
    await expect(await count(10_000)).toBe(10_000);
  };
}

function test_count_large(count: StrategyFunctions['count']) {
  return async function () {
    await expect(await count(80_000)).toBe(80_000);
  };
}

function test_count_very_large(count: StrategyFunctions['count']) {
  return async function () {
    await expect(await count(100_000_000)).toBe(100_000_000);
  };
}

function test_factorial_small(fac: StrategyFunctions['fac']) {
  return async function () {
    await expect(await fac(0)).toBe(1);
    await expect(await fac(1)).toBe(1);
    await expect(await fac(2)).toBe(2);
    await expect(await fac(3)).toBe(6);
    await expect(await fac(4)).toBe(24);
    await expect(await fac(5)).toBe(120);
    await expect(await fac(10)).toBe(3628800);
    await expect(await fac(10_000)).toBe(Infinity);
  };
}

function test_factorial_large(fac: StrategyFunctions['fac']) {
  return async function () {
    await expect(await fac(50_000)).toBe(Infinity);
  };
}

function test_fibonacci(fib: StrategyFunctions['fib']) {
  return async function () {
    await expect(await fib(0)).toBe(0);
    await expect(await fib(1)).toBe(1);
    await expect(await fib(2)).toBe(1);
    await expect(await fib(3)).toBe(2);
    await expect(await fib(4)).toBe(3);
    await expect(await fib(5)).toBe(5);
    await expect(await fib(6)).toBe(8);
    await expect(await fib(7)).toBe(13);
    await expect(await fib(50)).toBe(12586269025);
    await expect(await fib(100)).toBe(354224848179262000000);
    await expect(await fib(1_476)).not.toBe(Infinity);
    await expect(await fib(1_477)).toBe(Infinity);
  };
}

function test_collatz(collatz: StrategyFunctions['collatz']) {
  return async function () {
    await expect(await collatz(123)).toBe(46);
    await expect(await collatz(12345679)).toBe(228);
    await expect(await collatz(0xfffffffffff)).toBe(538);
    await expect(await collatz(0xffffffffffff)).toBe(542);
  };
}

const list = generate(10_000);
const bigList = generate(1_000_000);

function test_sum_small(sum: StrategyFunctions['sum']) {
  return async function () {
    await expect(await sum(list)).toBe(49_995_000);
  };
}

function test_sum_large(sum: StrategyFunctions['sum']) {
  return async function () {
    await expect(await sum(bigList)).toBe(499_999_500_000);
  };
}
