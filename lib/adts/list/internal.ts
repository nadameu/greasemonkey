export class Cons<a> implements Iterable<a> {
  _type: 'List' = 'List';
  _tag: 'Cons' = 'Cons';
  constructor(
    public head: a,
    public tail: Cons<a> | Nil
  ) {}
  [Symbol.iterator](): Iterator<a, void> {
    let curr: Cons<a> | Nil = this;
    return {
      next() {
        if (curr._tag === 'Cons') {
          const value = curr.head;
          curr = curr.tail;
          return { done: false, value };
        } else {
          return { done: true, value: undefined };
        }
      },
    };
  }
}
export class Nil implements Iterable<never> {
  _type: 'List' = 'List';
  _tag: 'Nil' = 'Nil';
  [Symbol.iterator](): Iterator<never, void> {
    return {
      next() {
        return { done: true, value: undefined };
      },
    };
  }
}
