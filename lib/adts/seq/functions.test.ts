import { describe, expect, it, test } from 'vitest';
import { S } from '.';
import { thrush } from '../function';
import { monoidSum } from '../number';

describe('map', () => {
  it('iterates from left to right', () => {
    const expected = Array.from({ length: 1e3 }, (_, i) => i + 1);
    let i = 1;
    const seq = S.map((x, j) => x === j + 1 && x === i && i++)(expected);
    expect([...seq]).toEqual(expected);
  });
});

describe('flatMap', () => {
  it('iterates from left to right', () => {
    const expected = Array.from({ length: 1e3 }, (_, i) => i + 1);
    let i = 1;
    const seq = S.flatMap((x, j) => [x === j + 1 && x === i && i++])(expected);
    expect([...seq]).toEqual(expected);
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

test('shape', () => {
  const toString = S.foldMap<string>({
    concat: (l, r) => `[${l},${r}]`,
    empty: () => '',
  })(x => ``);
  expect(toString('a')).toMatchInlineSnapshot(`""`);
  expect(toString('ab')).toMatchInlineSnapshot(`"[,]"`);
  expect(toString('abc')).toMatchInlineSnapshot(`"[[,],]"`);
  expect(toString('abcd')).toMatchInlineSnapshot(`"[[,],[,]]"`);
  expect(toString('abcde')).toMatchInlineSnapshot(`"[[[,],[,]],]"`);
  expect(toString('abcdef')).toMatchInlineSnapshot(`"[[[,],[,]],[,]]"`);
  expect(toString('abcdefg')).toMatchInlineSnapshot(`"[[[,],[,]],[[,],]]"`);
  expect(toString('abcdefgh')).toMatchInlineSnapshot(`"[[[,],[,]],[[,],[,]]]"`);
});

test('foldLeft', () => {
  const num = 1e3;
  const array = Array.from({ length: num }, (_, i) => i);
  const sum = thrush(array)(S.foldLeft(0, (a, b) => a + b));
  expect(sum).toEqual((num * (num - 1)) / 2);
});
