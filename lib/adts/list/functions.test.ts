import { expect, test } from 'vitest';
import { Cons, L, List, Nil } from '.';
import { Either, isLeft, Left, Right } from '../either';

test('foldLeft', () => {
  let list: List<number> = Nil;
  const num = 1e6;
  for (let i = num - 1; i >= 0; i -= 1) {
    list = Cons(i, list);
  }
  const sum = L.foldLeft(0, (a, b: number) => a + b);
  expect(() => sum(list)).not.toThrow();
  expect(sum(Nil)).toEqual(0);
  expect(sum(list)).toEqual((num * (num - 1)) / 2);
});

test('reverse', () => {
  const array = Array.from({ length: 10 }, (_, i) => i);
  const list = L.fromArray(array);
  expect(L.reverse(list)).toEqual(L.fromArray(array.toReversed()));
});

test('foldRight', () => {
  let list: List<number> = Nil;
  const num = 1e6;
  for (let i = 0; i < num; i += 1) {
    list = Cons(i, list);
  }
  const reduce = L.foldRight(
    Right(-1) as Either<number, number>,
    (x: number, prev) => {
      if (isLeft(prev)) return prev;
      const { right: p } = prev;
      if (p >= x) return Left(x);
      return Right(x);
    }
  );
  expect(() => reduce(list)).not.toThrow();
  expect(reduce(Nil)).toEqual(Right(-1));
  expect(reduce(list)).toEqual(Right(num - 1));
});
