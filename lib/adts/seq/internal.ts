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
    let left = this.left;
    let rights: List<Seq<a>> = Cons(this.right, Nil);
    while (true) {
      while (left instanceof Concat) {
        rights = Cons(left.right, rights);
        left = left.left;
      }
      yield* left;
      if (isNil(rights)) return;
      left = rights.head;
      rights = rights.tail;
    }
  }
}

export interface SeqF extends Kind {
  type: Seq<this['a']>;
}
