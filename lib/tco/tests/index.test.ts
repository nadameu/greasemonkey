import { describe, expect, test } from 'vitest';
import * as recursion from '../examples/recursion';
import * as tailCall from '../examples/tail-call';
import * as iterative from '../examples/iterative';
import * as trampoline from '../examples/trampoline';
import * as auto from '../examples/auto';
import * as step from '../examples/step';
import * as cont from '../examples/cont';
import * as recursively from '../examples/recursively';
import * as async_ from '../examples/async';
import * as promises from '../examples/promises';
import { List, generate } from '../examples/List';

interface Strategy {
  count(x: number): number | Promise<number>;
  fac(x: number): number | Promise<number>;
  fib(x: number): number | Promise<number>;
  collatz(x: number): number | Promise<number>;
  sum(xs: List<number>): number | Promise<number>;
}

test_strategy(recursion, 'simple recursion', { limitedRecursion: true, needsCaching: true });
test_strategy(async_, 'async', { limitedRecursion: true });
test_strategy(promises, 'promises', { limitedRecursion: true });
test_strategy(tailCall, 'tail-call recursion', { limitedRecursion: true });
test_strategy(iterative, 'iterative');
test_strategy(trampoline, 'trampoline', { notEfficient: true });
test_strategy(auto, 'auto-trampoline', { notEfficient: true });
test_strategy(step, 'step', { notEfficient: true });
test_strategy(cont, 'cont', { memoryHungry: true, needsCaching: true });
test_strategy(recursively, 'recursively', { memoryHungry: true, needsCaching: true });

function test_strategy(
  strategy: Strategy,
  name: string,
  {
    limitedRecursion = false,
    memoryHungry = false,
    needsCaching = false,
    notEfficient = false,
  }: {
    limitedRecursion?: boolean;
    memoryHungry?: boolean;
    needsCaching?: boolean;
    notEfficient?: boolean;
  } = {}
) {
  describe(name, () => {
    describe('count', () => {
      test('small', test_count_small(strategy.count));
      // #region large
      if (limitedRecursion) {
        test.skip('large values overflow the stack', test_count_large(strategy.count));
      } else {
        test('large', test_count_large(strategy.count));
      }
      // #endregion
      // #region very large
      if (limitedRecursion) {
        test.skip('very large (skip)', test_count_very_large(strategy.count));
      } else if (memoryHungry) {
        test.skip(
          'very large values consume all heap space',
          test_count_very_large(strategy.count)
        );
      } else if (notEfficient) {
        test.skip('very large values make it slow', test_count_very_large(strategy.count));
      } else {
        test('very large', test_count_very_large(strategy.count));
      }
      // #endregion
    });
    describe('factorial', () => {
      test('small', test_factorial_small(strategy.fac));
      if (limitedRecursion) {
        test.skip('large values overflow the stack', test_factorial_large(strategy.fac));
      } else {
        test('large', test_factorial_large(strategy.fac));
      }
    });
    test(`fibonacci${needsCaching ? ' (cached)' : ''}`, test_fibonacci(strategy.fib));
    test('collatz', test_collatz(strategy.collatz));
    describe('folding a list', () => {
      test('small', test_sum_small(strategy.sum));
      if (limitedRecursion) {
        test.skip('large lists overflow the stack', test_sum_large(strategy.sum));
      } else {
        test('large', test_sum_large(strategy.sum));
      }
    });
  });
}

function test_count_small(count: Strategy['count']) {
  return async function () {
    await expect(await count(10_000)).toBe(10_000);
  };
}

function test_count_large(count: Strategy['count']) {
  return async function () {
    await expect(await count(80_000)).toBe(80_000);
  };
}

function test_count_very_large(count: Strategy['count']) {
  return async function () {
    await expect(await count(100_000_000)).toBe(100_000_000);
  };
}

function test_factorial_small(fac: Strategy['fac']) {
  return async function () {
    await expect(await fac(0)).toEqual(1);
    await expect(await fac(1)).toEqual(1);
    await expect(await fac(2)).toEqual(2);
    await expect(await fac(3)).toEqual(6);
    await expect(await fac(4)).toEqual(24);
    await expect(await fac(5)).toEqual(120);
    await expect(await fac(10)).toEqual(3628800);
    await expect(await fac(10_000)).toEqual(Infinity);
  };
}

function test_factorial_large(fac: Strategy['fac']) {
  return async function () {
    await expect(await fac(50_000)).toEqual(Infinity);
  };
}

function test_fibonacci(fib: Strategy['fib']) {
  return async function () {
    await expect(await fib(0)).toEqual(0);
    await expect(await fib(1)).toEqual(1);
    await expect(await fib(2)).toEqual(1);
    await expect(await fib(3)).toEqual(2);
    await expect(await fib(4)).toEqual(3);
    await expect(await fib(5)).toEqual(5);
    await expect(await fib(6)).toEqual(8);
    await expect(await fib(7)).toEqual(13);
    await expect(await fib(50)).toEqual(12586269025);
    await expect(await fib(100)).toEqual(354224848179262000000);
    await expect(await fib(1_476)).not.toEqual(Infinity);
    await expect(await fib(1_477)).toEqual(Infinity);
  };
}

function test_collatz(collatz: Strategy['collatz']) {
  return async function () {
    await expect(await collatz(123)).toEqual(46);
    await expect(await collatz(12345679)).toEqual(228);
    await expect(await collatz(0xfffffffffff)).toEqual(538);
    await expect(await collatz(0xffffffffffff)).toEqual(542);
  };
}

const list = generate(10_000);
const bigList = generate(1_000_000);

function test_sum_small(sum: Strategy['sum']) {
  return async function () {
    await expect(await sum(list)).toBe(49_995_000);
  };
}

function test_sum_large(sum: Strategy['sum']) {
  return async function () {
    await expect(await sum(bigList)).toBe(499_999_500_000);
  };
}
