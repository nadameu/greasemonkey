import { Cons, L, List, Nil, isCons } from '../list';
import { Just } from '../maybe';
import { Kind } from '../typeclasses/definitions';

export interface IterableF extends Kind {
  in: Iterable<this['a']>;
  out: Iterable<this['b']>;
  indexed: true;
}

export class ConcatIterable<a> {
  constructor(
    public left: Iterable<a>,
    public right: Iterable<a>
  ) {}

  *[Symbol.iterator]() {
    let stack: List<Iterable<a>> = Cons(this.left, Cons(this.right, Nil));
    while (isCons(stack)) {
      const top: Iterable<a> = stack.head;
      if (top instanceof ConcatIterable) {
        stack = Cons(top.left, Cons(top.right, stack.tail));
      } else {
        stack = stack.tail;
        for (const a of top) yield a;
      }
    }
  }
}
