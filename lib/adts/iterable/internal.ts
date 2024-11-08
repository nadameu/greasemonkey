import { Kind } from '../typeclasses';

export interface IterableF extends Kind {
  type: Iterable<this['a']>;
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
