import { describe, test, expect } from 'vitest';

describe('flatMap', () => {
  const initialArray = Array.from({ length: 10 }, (_, i) => i + 1);
  const flatMap1 = <a, b>(
    fa: Iterable<a>,
    f: (a: a, i: number) => Iterable<b>
  ): Iterable<b> => ({
    *[Symbol.iterator]() {
      let i = 0;
      for (const a of fa) yield* f(a, i++);
    },
  });
  function* flatMap2<a, b>(
    fa: Iterable<a>,
    f: (a: a, i: number) => Iterable<b>
  ): Iterable<b> {
    let i = 0;
    for (const a of fa) yield* f(a, i++);
  }

  test('partial', () => {
    const f1 = flatMap1(initialArray, x => [x + 1, x - 1]);
    const f2 = flatMap2(initialArray, x => [x + 1, x - 1]);
    const expected = initialArray.flatMap(x => [x + 1, x - 1]);

    const it1 = f1[Symbol.iterator]();
    const it2 = f2[Symbol.iterator]();

    it1.next();
    it2.next();
    it1.next();
    it2.next();

    expect([...f1]).toEqual(expected);
    expect([...f2]).toEqual(expected);
  });
});
