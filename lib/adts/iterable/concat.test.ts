import { describe, expect, test } from 'vitest';
import { concat, makeEq } from './functions';

const eq = makeEq<number | string>();

test('empty', () => {
  expect(eq(concat([], []), [])).toBe(true);
});

test('left identity', () => {
  expect(eq(concat([], ['a']), ['a'])).toBe(true);
});

test('right identity', () => {
  expect(eq(concat(['a'], []), ['a'])).toBe(true);
});

describe('big sequences', () => {
  const MAX = 1e4;

  let left: Iterable<number> = [];

  let right: Iterable<number> = [];

  const expected = Array.from({ length: MAX }, (_, i) => i + 1);
  const doubleExpected = expected.concat(expected);

  test('left tree', { sequential: true }, () => {
    for (let i = MAX; i > 0; i -= 1) {
      left = concat([i], left);
    }
    expect(eq(left, expected)).toBe(true);
  });

  test('right tree', { sequential: true }, () => {
    for (let i = 1; i <= MAX; i += 1) {
      right = concat(right, [i]);
    }
    expect(eq(right, expected)).toBe(true);
  });

  test('left-right', { sequential: true }, () => {
    const leftRight = concat(left, right);
    expect(eq(leftRight, doubleExpected)).toBe(true);
  });

  test('right-left', { sequential: true }, () => {
    const rightLeft = concat(right, left);
    expect(eq(rightLeft, doubleExpected)).toBe(true);
  });

  test('mixed', () => {
    let list: Iterable<number> = [];
    for (let i = MAX, j = 1; i > 0 && j <= MAX; i -= 1, j += 1) {
      list = concat([i], list);
      list = concat(list, [j]);
    }
    expect(eq(list, doubleExpected)).toBe(true);
  });
});
