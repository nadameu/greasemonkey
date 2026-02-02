import { assert, bench, describe } from 'vitest';
import { I } from '.';
import { done, loop, runTrampoline, Trampoline } from '../function';
import { Cons, isCons, List, Nil } from '../list';

const eq = I.makeEq<number>();

describe('concat', () => {
  const MAX = 1e4;
  const array = Array.from({ length: MAX }, (_, i) => i + 1);
  bench(
    'original',
    () => {
      let list: Iterable<number> = [];
      for (let i = MAX / 2, j = i + 1; i >= 1 && j <= MAX; i--, j++) {
        list = I.concat([i], list);
        list = I.concat(list, [j]);
      }
      assert(eq(list, array), 'not equal');
    },
    { throws: true }
  );

  const new_concat = <a>(left: Iterable<a>, right: Iterable<a>): Iterable<a> =>
    new NewConcat(left, right);
  class NewConcat<a> implements Iterable<a> {
    constructor(
      public left: Iterable<a>,
      public right: Iterable<a>
    ) {}
    [Symbol.iterator](): Iterator<a, undefined> {
      let head: Iterable<a> | null;
      let tail: List<Iterable<a>> = Cons(this.left, Cons(this.right, Nil));
      let iterator: Iterator<a> | null;
      return {
        next() {
          let tries: number;
          for (tries = Number.MAX_SAFE_INTEGER; tries > 0; tries--) {
            if (!iterator) {
              if (isCons(tail)) {
                [{ head, tail }] = [tail];
                while (head instanceof NewConcat) {
                  tail = Cons(head.right, tail);
                  head = head.left;
                }
                iterator = head[Symbol.iterator]();
              } else return { done: true, value: undefined };
            }
            const result = iterator.next();
            if (result.done) {
              iterator = null;
              continue;
            }
            return result;
          }
          if (tries <= 0) throw new Error('Too many iterations.');
          else return { done: true, value: undefined };
        },
      };
    }
  }

  bench(
    'manual iterator',
    () => {
      let list: Iterable<number> = [];
      for (let i = MAX / 2, j = i + 1; i >= 1 && j <= MAX; i--, j++) {
        list = new_concat([i], list);
        list = new_concat(list, [j]);
      }
      assert.deepEqual([...list], array);
    },
    { throws: true }
  );

  const trampoline_concat = <a>(
    left: Iterable<a>,
    right: Iterable<a>
  ): Iterable<a> => new TrampConcat(left, right);
  class TrampConcat<a> implements Iterable<a> {
    constructor(
      public left: Iterable<a>,
      public right: Iterable<a>
    ) {}
    *[Symbol.iterator](): Iterator<a, undefined> {
      type Cons = [Iterable<a>, (depth: number) => Trampoline<Rec>];
      type Rec = Cons | null;
      const MAX_RECURSION = 64;
      const go = (
        xs: Cons[0],
        next: Cons[1],
        depth: number
      ): Trampoline<Rec> => {
        if (depth > MAX_RECURSION) return loop(() => go(xs, next, 0));
        if (xs instanceof TrampConcat) {
          return go(
            xs.left,
            depth => {
              if (depth > MAX_RECURSION)
                return loop(() => go(xs.right, next, 0));
              return go(xs.right, next, depth + 1);
            },
            depth + 1
          );
        }
        return done([xs, next]);
      };
      let result = runTrampoline(go(this, () => done(null), 0));
      while (result) {
        yield* result[0];
        result = runTrampoline(result[1](0));
      }
    }
  }
  bench(
    'trampoline',
    () => {
      let list: Iterable<number> = [];
      for (let i = MAX / 2, j = i + 1; i >= 1 && j <= MAX; i--, j++) {
        list = trampoline_concat([i], list);
        list = trampoline_concat(list, [j]);
      }
      assert.deepEqual([...list], array);
    },
    { throws: true }
  );
});

describe('flatMap', () => {
  const MAX = 1e4;
  const iterable = {
    *[Symbol.iterator]() {
      for (let i = 1; i <= MAX; i++) yield i;
    },
  };
  const bench_flatMap = (
    description: string,
    flatMap: <a, b>(
      xs: Iterable<a>,
      f: (a: a, i: number) => Iterable<b>
    ) => Iterable<b>
  ) => {
    bench(
      description,
      () => {
        const result = I.toArray(flatMap(iterable, (x, i) => [x * 2 - i / 4]));
        assert.equal(result.length, MAX);
        assert.equal(result[0], 2);
        assert.equal(result[MAX - 1], 2 * MAX - (MAX - 1) / 4);
      },
      { throws: true }
    );
  };

  bench_flatMap('generator', (xs, f) => ({
    *[Symbol.iterator](i = 0) {
      for (const x of xs) for (const y of f(x, i++)) yield y;
    },
  }));

  bench_flatMap(
    'manual',
    <a, b>(xs: Iterable<a>, f: (a: a, i: number) => Iterable<b>) => ({
      [Symbol.iterator]() {
        const outer = xs[Symbol.iterator]();
        let inner: Iterator<b> | null = null;
        let index = 0;
        return {
          next() {
            while (true) {
              if (inner === null) {
                const result = outer.next();
                if (result.done === true) return result;
                inner = f(result.value, index++)[Symbol.iterator]();
              }
              const result = inner.next();
              if (result.done !== true) return result;
              inner = null;
            }
          },
        };
      },
    })
  );

  bench_flatMap(
    'native',
    <a, b>(xs: Iterable<a>, f: (a: a, i: number) => Iterable<b>): Iterable<b> =>
      Iterator.prototype.flatMap.call<Iterator<a>, [typeof f], Iterable<b>>(
        xs[Symbol.iterator](),
        f
      )
  );
});

describe('map', () => {
  const MAX = 1e4;
  const iterable = {
    *[Symbol.iterator]() {
      for (let i = 1; i <= MAX; i++) yield i;
    },
  };
  const bench_map = (
    description: string,
    map: <a, b>(xs: Iterable<a>, f: (a: a, i: number) => b) => Iterable<b>
  ) => {
    bench(
      description,
      () => {
        const result = I.toArray(map(iterable, (x, i) => x * 2 - i / 4));
        assert.equal(result.length, MAX);
        assert.equal(result[0], 2);
        assert.equal(result[MAX - 1], 2 * MAX - (MAX - 1) / 4);
      },
      { throws: true }
    );
  };

  bench_map('generator', (xs, f) => ({
    *[Symbol.iterator](i = 0) {
      for (const x of xs) yield f(x, i++);
    },
  }));

  bench_map('manual', <a, b>(xs: Iterable<a>, f: (a: a, i: number) => b) => ({
    [Symbol.iterator]() {
      const it = xs[Symbol.iterator]();
      let index = 0;
      return {
        next() {
          const result = it.next();
          if (result.done === true) return result;
          return { done: false, value: f(result.value, index++) };
        },
      };
    },
  }));

  bench_map(
    'native',
    <a, b>(xs: Iterable<a>, f: (a: a, i: number) => b): Iterable<b> =>
      Iterator.prototype.map.call<Iterator<a>, [typeof f], Iterable<b>>(
        xs[Symbol.iterator](),
        f
      )
  );
});
