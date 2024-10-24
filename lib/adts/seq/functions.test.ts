import { describe, expect, test } from 'vitest';
import { S } from '.';
import { identity } from '../function';
import { monoidSum } from '../number';

test('map', () => {
  const expected = Array.from({ length: 1e3 }, (_, i) => i + 1);
  const seq = S.map(identity)(expected);
  expect([...seq]).toEqual(expected);
});

test('flatMap', () => {
  const expected = Array.from({ length: 1e3 }, (_, i) => i + 1);
  const seq = S.flatMap(S.of)(expected);
  expect([...seq]).toEqual(expected);
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
