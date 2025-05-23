import { A } from '../array';
import { toList as fromArray } from '../array/functions';
import { flow } from '../function';
import { derive } from '../typeclasses';
import { Cons, List, Nil } from './definitions';
import { ListF } from './internal';
export { fromArray };

export const toIterable = <a>(xs: List<a>): Iterable<a, void> => ({
  [Symbol.iterator]() {
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
});

export const foldLeft =
  <a, b>(seed: b, f: (acc: b, a: a, i: number) => b) =>
  (xs: List<a>): b => {
    let acc = seed;
    for (let curr = xs, i = 0; curr._tag === 'Cons'; curr = curr.tail) {
      acc = f(acc, curr.head, i++);
    }
    return acc;
  };

export const toArray = <a>(xs: List<a>): a[] =>
  foldLeft<a, a[]>([], (xs, x) => (xs.push(x), xs))(xs);

export const reverse: <a>(list: List<a>) => List<a> = /* #__PURE__ */ foldLeft<
  any,
  List<any>
>(Nil, (tail, head) => Cons(head, tail));

export const foldRight =
  <a, b>(seed: b, f: (a: a, acc: b) => b) =>
  (xs: List<a>): b =>
    flow(xs, toArray, A.foldRight(seed, f));

export const filter: {
  <a, b extends a>(pred: (a: a, i: number) => a is b): (xs: List<a>) => List<b>;
  <a>(pred: (a: a, i: number) => boolean): (xs: List<a>) => List<a>;
} =
  <a>(pred: (a: a, i: number) => boolean) =>
  (xs: List<a>) => {
    const array: a[] = [];
    for (let i = 0, curr = xs; curr._tag === 'Cons'; curr = curr.tail) {
      if (pred(curr.head, i++)) array.push(curr.head);
    }
    return fromArray(array);
  };

export const map =
  <a, b>(f: (a: a, i: number) => b) =>
  (xs: List<a>) => {
    let array: b[] = [];
    for (
      let i = 0, curr = xs;
      curr._tag === 'Cons';
      array.push(f(curr.head, i++)), curr = curr.tail
    );
    return fromArray(array);
  };

export const filterMap = /* #__PURE__ */ derive.filterMap<ListF>({
  map,
  filter,
});
