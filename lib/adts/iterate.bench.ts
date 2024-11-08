import { assert, bench, describe } from 'vitest';
import { A } from './array';
import { L } from './list';
import { I } from './iterable';

const MAX = 1e4;
const SUM = (MAX * (MAX + 1)) / 2;
const iterable: Iterable<number> = {
  *[Symbol.iterator]() {
    for (let i = 1; i <= MAX; ++i) yield i;
  },
};
const array = A.fromIterable(iterable);
const list = L.fromArray(array);

describe('iterate', () => {
  bench('iterable', () => {
    const sum = I.foldLeft<number, number>(0, (a, b) => a + b)(iterable);
    assert.equal(sum, SUM);
  });

  bench('array', () => {
    const sum = A.foldLeft<number, number>(0, (a, b) => a + b)(array);
    assert.equal(sum, SUM);
  });

  bench('List', () => {
    const sum = L.foldLeft<number, number>(0, (a, b) => a + b)(list);
    assert.equal(sum, SUM);
  });
});
