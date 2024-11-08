import { assert, bench, describe } from 'vitest';
import { L } from '.';
import { A } from '../array';
import { done, flow, loop, runTrampoline, Trampoline } from '../function';
import { Cons, isCons, List, Nil } from './definitions';
import { I } from '../iterable';

describe('forEach', () => {
  const MAX = 1e4;
  let list: List<number> = Nil;
  for (let i = MAX; i > 0; i--) {
    list = Cons(i, list);
  }

  const bench_forEach = (
    description: string,
    forEach: <a>(xs: List<a>, f: (a: a, i: number) => void) => void
  ) => {
    bench(description, () => {
      let sum = 0;
      forEach(list, x => (sum += x));
      assert.equal(sum, (MAX * (MAX + 1)) / 2);
    });
  };

  bench_forEach(
    'loop, compare tag',
    <a>(xs: List<a>, f: (a: a, i: number) => void): void => {
      for (
        let i = 0, curr = xs;
        curr._tag === 'Cons';
        f(curr.head, i++), curr = curr.tail
      );
    }
  );

  bench_forEach(
    'loop, isCons()',
    <a>(xs: List<a>, f: (a: a, i: number) => void): void => {
      for (let i = 0, curr = xs; isCons(curr); curr = curr.tail) {
        f(curr.head, i++);
      }
    }
  );

  bench_forEach(
    'trampoline',
    <a>(xs: List<a>, f: (a: a, i: number) => void): void => {
      type T = (() => T) | null;
      const go = (xs: List<a>, i: number, depth: number): T => {
        if (xs._tag === 'Nil') return null;
        f(xs.head, i);
        if (depth > 64) return () => go(xs.tail, i + 1, 0);
        return go(xs.tail, i + 1, depth + 1);
      };
      for (let result = go(xs, 0, 0); result !== null; result = result());
    }
  );
});

describe('foldLeft', () => {
  const MAX = 1e4;
  let list: List<number> = Nil;
  for (let i = MAX; i > 0; i--) {
    list = Cons(i, list);
  }

  const bench_foldLeft = (
    description: string,
    foldLeft: <a, b>(
      xs: List<a>,
      seed: b,
      f: (acc: b, a: a, i: number) => b
    ) => b
  ) => {
    bench(description, () => {
      assert.equal(
        foldLeft(list, 0, (a, b) => a + b),
        (MAX * (MAX + 1)) / 2
      );
    });
  };

  bench_foldLeft('loop', (xs, seed, f) => {
    let acc = seed;
    for (let i = 0, curr = xs; curr._tag === 'Cons'; curr = curr.tail) {
      acc = f(acc, curr.head, i++);
    }
    return acc;
  });

  bench_foldLeft('array', (xs, seed, f) =>
    flow(xs, L.toArray, A.foldLeft(seed, f))
  );

  bench_foldLeft(
    'trampoline',
    <a, b>(xs: List<a>, seed: b, f: (acc: b, a: a, i: number) => b): b => {
      type T = [done: true, value: b] | [done: false, loop: () => T];
      const go = (acc: b, list: List<a>, i: number, depth: number): T => {
        if (list._tag === 'Nil') return [true, acc];
        if (depth > 64)
          return [false, () => go(f(acc, list.head, i), list.tail, i + 1, 0)];
        return go(f(acc, list.head, i), list.tail, i + 1, depth + 1);
      };
      let result;
      for (result = go(seed, xs, 0, 0); !result[0]; result = result[1]());
      return result[1];
    }
  );
});

describe('foldRight', () => {
  const MAX = 1e4;
  let list: List<number> = Nil;
  for (let i = MAX; i > 0; i--) {
    list = Cons(i, list);
  }

  const bench_foldRight = (
    description: string,
    foldRight: <a, b>(xs: List<a>, seed: b, f: (a: a, acc: b) => b) => b
  ) => {
    bench(description, () => {
      assert.equal(
        foldRight(list, 0, (a, b) => a + b),
        (MAX * (MAX + 1)) / 2
      );
    });
  };

  bench_foldRight(
    'reverse',
    <a, b>(xs: List<a>, seed: b, f: (a: a, acc: b) => b): b => {
      type Rev = [Rev, a] | null;
      let rev: Rev = null;
      for (let curr = xs; curr._tag === 'Cons'; curr = curr.tail) {
        rev = [rev, curr.head];
      }
      let acc = seed;
      for (let curr = rev; curr !== null; curr = curr[0]) {
        acc = f(curr[1], acc);
      }
      return acc;
    }
  );

  bench_foldRight(
    'trampoline',
    <a, b>(xs: List<a>, seed: b, f: (a: a, acc: b) => b): b => {
      const MAX_RECURSION = 64;
      const go = (
        list: List<a>,
        next: (acc: b, depth: number) => Trampoline<b>,
        depth: number
      ): Trampoline<b> => {
        if (depth > MAX_RECURSION) return loop(() => go(list, next, 0));
        if (list._tag === 'Nil') {
          return done(runTrampoline(next(seed, depth + 1)));
        }
        return go(
          list.tail,
          (acc, depth) => {
            if (depth > MAX_RECURSION) {
              return loop(() => next(f(list.head, acc), 0));
            }
            return next(f(list.head, acc), depth + 1);
          },
          depth + 1
        );
      };

      return runTrampoline(go(xs, done, 0));
    }
  );

  bench_foldRight(
    'array',
    <a, b>(xs: List<a>, seed: b, f: (a: a, acc: b) => b): b =>
      flow(xs, L.toArray, A.foldRight(seed, f))
  );

  bench_foldRight(
    'iterable',
    <a, b>(xs: List<a>, seed: b, f: (a: a, acc: b) => b): b =>
      flow(xs, L.toIterable, A.fromIterable, A.foldRight(seed, f))
  );
});

describe('eager / lazy', () => {
  const MAX = 1e4;
  const SUM = (MAX * (MAX + 1)) / 2;

  let eager: List<number> = Nil;
  for (let i = MAX; i > 0; i--) {
    eager = Cons(i, eager);
  }
  type LazyList<a> = () => [head: a, tail: LazyList<a>] | null;
  const range =
    (first: number, last: number): LazyList<number> =>
    () =>
      first > last ? null : [first, range(first + 1, last)];
  const iterable: Iterable<number> = {
    *[Symbol.iterator]() {
      for (let i = 1; i <= MAX; ++i) yield i;
    },
  };
  bench('eager', () => {
    let sum = 0;
    for (
      let curr = eager;
      curr._tag === 'Cons';
      sum += curr.head, curr = curr.tail
    );
    assert.equal(sum, SUM);
  });

  bench('lazy', () => {
    let sum = 0;
    for (
      let curr = range(1, MAX)();
      curr !== null;
      sum += curr[0], curr = curr[1]()
    );
    assert.equal(sum, SUM);
  });

  bench('iterable', () => {
    let sum = 0;
    for (const x of iterable) sum += x;
    assert.equal(sum, SUM);
  });
});

describe('forEach vs. foldLeft', () => {
  const MAX = 1e4;
  const SUM = (MAX * (MAX + 1)) / 2;

  let list: List<number> = Nil;
  for (let i = MAX; i > 0; i--) {
    list = Cons(i, list);
  }

  const forEach = <a>(xs: List<a>, f: (a: a, i: number) => void): void => {
    for (let i = 0, curr = xs; curr._tag === 'Cons'; curr = curr.tail) {
      f(curr.head, ++i);
    }
  };
  const foldLeft = <a, b>(
    xs: List<a>,
    seed: b,
    f: (acc: b, a: a, i: number) => b
  ): b => {
    let acc = seed;
    for (let i = 0, curr = xs; curr._tag === 'Cons'; curr = curr.tail) {
      acc = f(acc, curr.head, i++);
    }
    return acc;
  };

  bench('forEach', () => {
    let sum = 0;
    forEach(list, x => {
      sum += x;
    });
    assert.equal(sum, SUM);
  });
  bench('foldLeft', () => {
    const sum = foldLeft(list, 0, (a, b) => a + b);
    assert.equal(sum, SUM);
  });
});

describe('toIterable', () => {
  const MAX = 1e4;
  const SUM = (MAX * (MAX + 1)) / 2;

  let list: List<number> = Nil;
  for (let i = MAX; i > 0; i--) {
    list = Cons(i, list);
  }

  const bench_toIterable = (
    description: string,
    toIterable: <a>(xs: List<a>) => Iterable<a>
  ) => {
    bench(description, () => {
      let sum = 0;
      for (const x of toIterable(list)) sum += x;

      assert.equal(sum, SUM);
    });
  };

  bench_toIterable(
    'Generator',
    <a>(xs: List<a>): Iterable<a> => ({
      *[Symbol.iterator]() {
        for (let curr = xs; curr._tag === 'Cons'; curr = curr.tail) {
          yield curr.head;
        }
      },
    })
  );

  bench_toIterable(
    'Manual',
    <a>(xs: List<a>): Iterable<a> => ({
      [Symbol.iterator](): Iterator<a, void> {
        let done = false,
          value: a | undefined,
          next = xs;
        return {
          next() {
            if (next._tag === 'Cons') {
              value = next.head;
              next = next.tail;
            } else {
              done = true;
              value = undefined;
            }
            return { done, value } as IteratorResult<a, void>;
          },
        };
      },
    })
  );
});
