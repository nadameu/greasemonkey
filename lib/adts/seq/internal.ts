import { Cons, List, Nil, isNil } from '../list';
import { Kind } from '../typeclasses';

export interface Seq<a> extends Iterable<a> {
  length: number;
}

export class Concat<a> implements Seq<a> {
  length: number;
  constructor(
    public left: Seq<a>,
    public right: Seq<a>
  ) {
    this.length = left.length + right.length;
  }
  *[Symbol.iterator]() {
    let { head, tail }: Cons<Seq<a>> = Cons(this, Nil);
    while (true) {
      while (head instanceof Concat) {
        tail = Cons(head.right, tail);
        head = head.left;
      }
      yield* head;
      if (isNil(tail)) return;
      head = tail.head;
      tail = tail.tail;
    }
  }
}

export interface SeqF extends Kind {
  type: Seq<this['a']>;
}
