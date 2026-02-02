import { assert, bench, describe } from 'vitest';
import { I } from '.';

describe('forEach', () => {
  const MAX = 1e4;
  const iterable: Iterable<number> = {
    *[Symbol.iterator]() {
      for (let i = 1; i <= MAX; ++i) yield i;
    },
  };

  const bench_forEach = (
    description: string,
    forEach: <a>(xs: Iterable<a>, f: (a: a, i: number) => void) => void
  ) => {
    bench(
      description,
      () => {
        let sum = 0;
        forEach(iterable, x => (sum += x));
        assert.equal(sum, (MAX * (MAX + 1)) / 2);
      },
      { throws: true }
    );
  };

  bench_forEach('for const ... of', (xs, f) => {
    let i = 0;
    for (const x of xs) f(x, i++);
  });

  bench_forEach(
    'manual iteration',
    <a>(xs: Iterable<a>, f: (a: a, i: number) => void) => {
      const iter = xs[Symbol.iterator]();
      for (
        let i = 0, result = iter.next();
        result.done === false;
        f(result.value, i++), result = iter.next()
      );
    }
  );

  bench_forEach('native', (xs, f) =>
    Iterator.prototype.forEach.call(xs[Symbol.iterator](), f)
  );
});

describe('toArray', () => {
  const MAX = 1e4;
  const iterable: Iterable<number> = {
    *[Symbol.iterator]() {
      for (let i = 1; i <= MAX; ++i) yield i;
    },
  };

  const bench_toArray = (
    description: string,
    toArray: <a>(xs: Iterable<a>) => a[]
  ) => {
    bench(
      description,
      () => {
        const array = toArray(iterable);
        assert.equal(array.length, MAX);
      },
      { throws: true }
    );
  };

  bench_toArray('spread', xs => [...xs]);

  bench_toArray('push', <a>(xs: Iterable<a>): a[] => {
    const array: a[] = [];
    for (const x of xs) array.push(x);
    return array;
  });

  bench_toArray('foldLeft', <a>(xs: Iterable<a>): a[] =>
    I.foldLeft<a, a[]>([], (xs, x) => (xs.push(x), xs))(xs)
  );

  bench_toArray('native', xs =>
    Iterator.prototype.toArray.call(xs[Symbol.iterator]())
  );
});
