import { Cons, isCons, List, Nil } from './definitions';

export const fromArray = <a>(xs: ArrayLike<a>): List<a> =>
  Array.prototype.reduceRight.call<
    ArrayLike<a>,
    [(tail: List<a>, head: a) => List<a>, List<a>],
    List<a>
  >(xs, (tail, head) => Cons(head, tail), Nil);

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
  (xs: List<a>): b => {
    const prev = '_prev';
    interface DLCons<a> extends Cons<a> {
      [prev]: DLCons<a> | Nil;
      tail: DLList<a>;
    }
    interface DLNil extends Nil {
      [prev]: DLCons<a> | Nil;
    }
    type DLList<a> = DLCons<a> | DLNil;
    let list = xs as DLList<a>;
    list[prev] = Nil;
    for (; isCons(list); list = list.tail) {
      list.tail[prev] = list;
    }
    let acc = seed;
    for (let curr = list[prev]; isCons(curr); curr = curr[prev]) {
      acc = f(curr.head, acc);
    }
    return acc;
  };
