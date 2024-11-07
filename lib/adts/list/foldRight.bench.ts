import { bench, expect } from 'vitest';
import { Cons, isCons, isNil, List, Nil } from '.';
import { auto } from '../../tco/src/auto';
import { runTrampoline, Trampoline } from '../function';

const MAX = 1e4;
let list: List<number> = Nil;
for (let i = MAX; i >= 1; i--) list = Cons(i, list);

const trampolined_foldRight = <a, b>(
  xs: List<a>,
  seed: b,
  f: (a: a, acc: b) => b
): b => {
  const MAX_RECURSION = 64;
  const go = (
    list: List<a>,
    next: (acc: b, depth: number) => Trampoline<b>,
    depth: number
  ): Trampoline<b> => {
    if (depth > MAX_RECURSION) return () => go(list, next, 0);
    if (isNil(list)) return next(seed, depth + 1);
    return go(
      list.tail,
      (acc, depth) => {
        if (depth > MAX_RECURSION) return () => next(f(list.head, acc), 0);
        return next(f(list.head, acc), depth + 1);
      },
      depth + 1
    );
  };

  return runTrampoline(go(xs, value => ({ value }), 0));
};
bench('trampolined foldRight', () => {
  const sum = trampolined_foldRight(list, 0, (a, b) => a + b);
  expect(sum).toBe((MAX * (MAX + 1)) / 2);
});

const reverse_foldRight = <a, b>(
  xs: List<a>,
  seed: b,
  f: (a: a, acc: b) => b
): b => {
  let reversed: List<a> = Nil;
  for (let curr = xs; isCons(curr); curr = curr.tail) {
    reversed = Cons(curr.head, reversed);
  }
  let acc = seed;
  for (let curr = reversed; isCons(curr); curr = curr.tail) {
    acc = f(curr.head, acc);
  }
  return acc;
};
bench('reverse first', () => {
  const sum = reverse_foldRight(list, 0, (a, b) => a + b);
  expect(sum).toBe((MAX * (MAX + 1)) / 2);
});

const auto_foldRight = <a, b>(
  xs: List<a>,
  seed: b,
  f: (a: a, acc: b) => b
): b => {
  const goRight = auto((xs: List<a>, next: (acc: b) => b): b => {
    if (isNil(xs)) return next(seed);
    return goRight(xs.tail, (acc: b) => goLeft(f(xs.head, acc), next));
  });
  const goLeft = auto((acc: b, next: (acc: b) => b): b => {
    return next(acc);
  });
  return goRight(xs, value => value);
};
bench(
  'auto foldRight',
  () => {
    const sum = auto_foldRight(list, 0, (a, b) => a + b);
    expect(sum).toBe((MAX * (MAX + 1)) / 2);
  },
  { throws: true }
);