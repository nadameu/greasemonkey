import { describe, expect, test } from 'vitest';
import { S } from '.';
import { identity } from '../function';
import { monoidSum } from '../number';
import { monoidString } from '../string';

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
  const toString = S.fold<string>({
    concat: (l, r) => `[${l},${r}]`,
    empty: () => '',
  });
  expect(toString('a')).toMatchInlineSnapshot(`"a"`);
  expect(toString('ab')).toMatchInlineSnapshot(`"[a,b]"`);
  expect(toString('abc')).toMatchInlineSnapshot(`"[[a,b],c]"`);
  expect(toString('abcd')).toMatchInlineSnapshot(`"[[a,b],[c,d]]"`);
  expect(toString('abcde')).toMatchInlineSnapshot(`"[[[a,b],c],[d,e]]"`);
  expect(toString('abcdef')).toMatchInlineSnapshot(`"[[[a,b],c],[[d,e],f]]"`);
  expect(toString('abcdefg')).toMatchInlineSnapshot(
    `"[[[a,b],[c,d]],[[e,f],g]]"`
  );
  expect(toString('abcdefgh')).toMatchInlineSnapshot(
    `"[[[a,b],[c,d]],[[e,f],[g,h]]]"`
  );
});
