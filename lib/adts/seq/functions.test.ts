import { describe, expect, it, test } from 'vitest';
import { S, Seq } from '.';
import { thrush } from '../function';
import { monoidSum } from '../number';
import { Just, Nothing } from '../maybe';

describe('map', () => {
  it('iterates from left to right', () => {
    const expected = Array.from({ length: 10 }, (_, i) => i + 1);
    let i = 1;
    const run = S.map((x: number, j) => (x === j + 1 && x === i && i++) || -1);
    expect(run(expected)).toEqual(expected);
    i = 1;
    expect(run(expected)).toEqual(expected);
  });
});

describe('flatMap', () => {
  it('iterates from left to right', () => {
    const expected = Array.from({ length: 10 }, (_, i) => i + 1);
    let i = 1;
    const run = S.flatMap((x: number, j) => [
      (x === j + 1 && x === i && i++) || -1,
    ]);
    expect(run(expected)).toEqual(expected);
    i = 1;
    expect(run(expected)).toEqual(expected);
  });
});

describe('filter', () => {
  it('iterates from left to right', () => {
    const expected = Array.from({ length: 10 }, (_, i) => i + 1);
    const run = S.filter((x: number, i) => (x + i) % 3 === 0);
    expect(run(expected)).toEqual([2, 5, 8]);
    expect(run(expected)).toEqual([2, 5, 8]);
  });
});

describe('filterMap', () => {
  it('iterates from left to right', () => {
    const expected = Array.from({ length: 10 }, (_, i) => i + 1);
    let i = 0;
    const run = S.filterMap((x: number, j) =>
      j === i ? ((i += 2), Just(`${j} -> ${x}`)) : Nothing
    );
    expect(run(expected)).toEqual([
      '0 -> 1',
      '2 -> 3',
      '4 -> 5',
      '6 -> 7',
      '8 -> 9',
    ]);
    i = 0;
    expect(run(expected)).toEqual([
      '0 -> 1',
      '2 -> 3',
      '4 -> 5',
      '6 -> 7',
      '8 -> 9',
    ]);
  });
});

describe('sum', () => {
  test('empty', () => {
    expect(S.fold(monoidSum)([])).toEqual(0);
  });
  test('not empty', () => {
    const array = Array.from({ length: 1e3 }, (_, i) => i + 1);
    const sum = S.fold(monoidSum)(array);
    const expected = array.reduce((x, y) => x + y, 0);
    expect(sum).toEqual(expected);
  });
});

test('foldLeft', () => {
  const num = 1e3;
  const array = Array.from({ length: num }, (_, i) => i);
  const sum = thrush(array)(S.foldLeft(0, (a, b) => a + b));
  expect(sum).toEqual((num * (num - 1)) / 2);
});
