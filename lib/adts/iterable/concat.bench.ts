import { assert, bench, describe } from 'vitest';
import { I } from '.';
import { runTrampoline, Trampoline } from '../function';
import { Cons, isCons, List, Nil } from '../list';
import { makeEq } from './functions';

const eq = makeEq<number>();

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
    'candidate',
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
        if (depth > MAX_RECURSION) return () => go(xs, next, 0);
        if (xs instanceof TrampConcat) {
          return go(
            xs.left,
            depth => {
              if (depth > MAX_RECURSION) return () => go(xs.right, next, 0);
              return go(xs.right, next, depth + 1);
            },
            depth + 1
          );
        }
        return { value: [xs, next] };
      };
      let result = runTrampoline(go(this, () => ({ value: null }), 0));
      while (result) {
        yield* result[0];
        result = runTrampoline(result[1](0));
      }
    }
  }
  bench(
    'tramp',
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
