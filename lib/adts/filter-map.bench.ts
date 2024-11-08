import { assert, bench, describe } from 'vitest';
import { A } from './array';
import { flow } from './function';
import { I } from './iterable';
import { L, List } from './list';
import { Kind, Type } from './typeclasses';
import { Just, Maybe, Nothing } from './maybe';

const MAX = 1e4;
const iterable: Iterable<number> = {
  *[Symbol.iterator]() {
    for (let i = 1; i <= MAX; ++i) yield i;
  },
};
const array = A.fromIterable(iterable);
const list = L.fromArray(array);

describe('filterMap().filter().map().foldLeft()', () => {
  type Transform<F extends Kind, a, b> = (
    xs: Type<F, never, a>
  ) => Type<F, never, b>;
  const bench_op = <F extends Kind>(
    description: string,
    M: {
      filter<a, b extends a>(
        pred: (a: a, i: number) => a is b
      ): Transform<F, a, b>;
      filter<a>(pred: (a: a, i: number) => boolean): Transform<F, a, a>;
      map<a, b>(f: (a: a, i: number) => b): Transform<F, a, b>;
      foldLeft<a, b>(
        seed: b,
        f: (acc: b, a: a, i: number) => b
      ): (xs: Type<F, never, a>) => b;
    },
    collection: Type<F, never, number>
  ) => {
    bench(
      description,
      () => {
        const filterMap =
          <a, b>(f: (a: a, i: number) => Maybe<b>): Transform<F, a, b> =>
          xs =>
            flow(
              xs,
              M.map(f),
              M.filter(m => m._tag === 'Just'),
              M.map(j => j.value)
            );
        const result = flow(
          collection,
          filterMap(x => ((x & 0b0111) !== 0b0001 ? Just(x) : Nothing)),
          filterMap(x => ((x & 0b0111) !== 0b0100 ? Just(x) : Nothing)),
          M.foldLeft(0, (a, b) => a + b)
        );
        assert.equal(result, 37508750);
      },
      { throws: true, time: 1500 }
    );
  };

  interface ArrayF extends Kind {
    type: Array<this['a']>;
  }
  interface IterableF extends Kind {
    type: Iterable<this['a']>;
  }
  interface ListF extends Kind {
    type: List<this['a']>;
  }

  bench_op<ArrayF>('array', A, array);
  bench_op<IterableF>('iterable', I, iterable);
  bench_op<ListF>('list', L, list);
});
