import { Cons, isCons, isNil, List, Nil } from './definitions';

export const fromArray = <a>(xs: ArrayLike<a>): List<a> =>
  Array.prototype.reduceRight.call<
    ArrayLike<a>,
    [(tail: List<a>, head: a) => List<a>, List<a>],
    List<a>
  >(xs, (tail, head) => Cons(head, tail), Nil);

export const toIterable = <a>(xs: List<a>): Iterable<a, void> => ({
  [Symbol.iterator]() {
    let curr = xs;
    return {
      next() {
        if (isNil(curr)) return { done: true } as IteratorReturnResult<void>;
        const value = curr.head;
        curr = curr.tail;
        return { done: false, value };
      },
    };
  },
});

export const foldLeft =
  <a, b>(seed: b, f: (acc: b, a: a, i: number) => b) =>
  (xs: List<a>): b => {
    let acc = seed;
    for (let curr = xs, i = 0; isCons(curr); curr = curr.tail) {
      acc = f(acc, curr.head, i++);
    }
    return acc;
  };

export const reverse: <a>(list: List<a>) => List<a> = /* #__PURE__ */ foldLeft<
  any,
  List<any>
>(Nil, (tail, head) => Cons(head, tail));

export const foldRight =
  <a, b>(seed: b, f: (a: a, acc: b) => b) =>
  (xs: List<a>): b =>
    [...toIterable(xs)].reduceRight((acc, x) => f(x, acc), seed);
