import { expect, describe, it } from 'vitest';
import { Iter } from '../src/iter';

describe('Iter', () => {
  it('can be created from iterables', () => {
    const iter = Iter<number>({
      *[Symbol.iterator]() {
        yield 4;
        yield 9;
        yield 2;
      },
    });
    expect([...iter]).toEqual([4, 9, 2]);
  });

  it('can be created from input values', () => {
    expect([...Iter.of(2, 1, 7)]).toEqual([2, 1, 7]);
  });

  it('can be created from array-like structures', () => {
    expect([...Iter.fromArray({ length: 3, 0: 'a', 1: 'b', 2: 'c' })]).toEqual('abc'.split(''));
  });

  it.skip("doesn't blow up the stack", () => {
    const LIMIT = 5e5;
    let it = Iter.of(0);
    for (let i = 0; i < LIMIT; i++) {
      it = it.chain(x => [x + 1]);
    }
    expect(() => it.toArray()).not.toThrow();
    expect(it.toArray()).toEqual([LIMIT]);
  });
});
