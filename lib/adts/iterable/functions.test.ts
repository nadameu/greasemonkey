import { describe, expect, it, test } from 'vitest';
import { I } from '.';
import { thrush } from '../function';
import { monoidSum } from '../number';
import { Just, Nothing } from '../maybe';
import { makeEq } from './functions';

const eq = makeEq<number | string>();

describe('eq', () => {
  test('empty', () => {
    expect(eq([], [])).toBe(true);
  });
  test('equal', () => {
    expect(eq([1, 2, 3], [1, 2, 3])).toBe(true);
  });
  test('not equal in length', () => {
    expect(eq([1, 2, 3], [1, 2, 3, 4])).toBe(false);
    expect(eq([1, 2, 3, 4], [1, 2, 3])).toBe(false);
  });
  test('not equal in content', () => {
    expect(eq([0, 1, 2, 8, 9], [0, 1, 37, 8, 9])).toBe(false);
  });
});

describe('map', () => {
  it('iterates from left to right', () => {
    const expected = Array.from({ length: 10 }, (_, i) => i + 1);
    let i = 1;
    const run = I.map((x: number, j) => (x === j + 1 && x === i && i++) || -1);
    expect(eq(run(expected), expected)).toBe(true);
    i = 1;
    expect(eq(run(expected), expected)).toBe(true);
  });
});

describe('flatMap', () => {
  it('iterates from left to right', () => {
    const expected = Array.from({ length: 10 }, (_, i) => i + 1);
    let i = 1;
    const run = I.flatMap((x: number, j) => [
      (x === j + 1 && x === i && i++) || -1,
    ]);
    expect(eq(run(expected), expected)).toBe(true);
    i = 1;
    expect(eq(run(expected), expected)).toBe(true);
  });
});

describe('filter', () => {
  it('iterates from left to right', () => {
    const expected = Array.from({ length: 10 }, (_, i) => i + 1);
    const run = I.filter((x: number, i) => (x + i) % 3 === 0);
    expect(eq(run(expected), [2, 5, 8])).toBe(true);
    expect(eq(run(expected), [2, 5, 8])).toBe(true);
  });
});

describe('filterMap', () => {
  it('iterates from left to right', () => {
    const expected = Array.from({ length: 10 }, (_, i) => i + 1);
    let i = 0;
    const run = I.filterMap((x: number, j) =>
      j === i ? ((i += 2), Just(`${j} -> ${x}`)) : Nothing
    );
    expect(
      eq(run(expected), ['0 -> 1', '2 -> 3', '4 -> 5', '6 -> 7', '8 -> 9'])
    ).toBe(true);
    i = 0;
    expect(
      eq(run(expected), ['0 -> 1', '2 -> 3', '4 -> 5', '6 -> 7', '8 -> 9'])
    ).toBe(true);
  });
});

describe('sum', () => {
  test('empty', () => {
    expect(I.fold(monoidSum)([])).toEqual(0);
  });
  test('not empty', () => {
    const array = Array.from({ length: 1e3 }, (_, i) => i + 1);
    const sum = I.fold(monoidSum)(array);
    const expected = array.reduce((x, y) => x + y, 0);
    expect(sum).toEqual(expected);
  });
});

test('foldLeft', () => {
  const num = 1e3;
  const array = Array.from({ length: num }, (_, i) => i);
  const sum = thrush(array)(I.foldLeft(0, (a, b) => a + b));
  expect(sum).toEqual((num * (num - 1)) / 2);
});
