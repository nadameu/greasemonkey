import { describe, expect, test } from 'vitest';
import { concat } from './functions';
import { Seq } from './internal';

test('left identity', () => {
  expect(concat([], ['a'])).toEqual(['a']);
});

test('right identity', () => {
  expect(concat(['a'], [])).toEqual(['a']);
});

describe('big sequences', () => {
  const MAX = 1e4;

  let left: Seq<number> = [];

  let right: Seq<number> = [];

  const expected = Array.from({ length: MAX }, (_, i) => i + 1);
  const doubleExpected = expected.concat(expected);

  test('left tree', { sequential: true }, () => {
    for (let i = MAX; i > 0; i -= 1) {
      left = concat([i], left);
    }
    expect([...left]).toEqual(expected);
  });

  test('right tree', { sequential: true }, () => {
    for (let i = 1; i <= MAX; i += 1) {
      right = concat(right, [i]);
    }
    expect([...right]).toEqual(expected);
  });

  test('left-right', { sequential: true }, () => {
    const leftRight = concat(left, right);
    expect([...leftRight]).toEqual(doubleExpected);
  });

  test('right-left', { sequential: true }, () => {
    const rightLeft = concat(right, left);
    expect([...rightLeft]).toEqual(doubleExpected);
  });
});
