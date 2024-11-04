import { tailRec } from '../function';
import { Cons, isCons, isNil, L, List, Nil } from '../list';
import { Kind } from '../typeclasses';

export interface IterableF extends Kind {
  type: Iterable<this['a']>;
}

export class FlatMap<b, a = unknown> implements Iterable<b> {
  constructor(
    private _xs: Iterable<a>,
    private _f: (a: a, i: number) => Iterable<b>
  ) {}
  *[Symbol.iterator]() {
    let i = 0;
    for (const x of this._xs) yield* this._f(x, i++);
  }
}

export class Concat<a> implements Iterable<a> {
  constructor(
    private _left: Iterable<a>,
    private _right: Iterable<a>
  ) {}

  *[Symbol.iterator]() {
    type Iter = Iterable<a>;
    type Cons = [Iter, List];
    type List = Cons | null;
    let head: Iter;
    let tail: List = [this._left, [this._right, null]];
    while (tail) {
      [head, tail] = tail;
      while (head instanceof Concat) {
        tail = [head._right, tail];
        head = head._left;
      }
      yield* head;
    }
  }
}
