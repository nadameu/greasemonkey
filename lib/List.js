const List = (function () {
  const List = function (iterator) {
    if (!(this instanceof List)) return new List(iterator);
    this[Symbol.iterator] = iterator;
  };
  List.prototype = {
    constructor: List,
    ap(a) {
      const list = this;
      return new List(function* () {
        for (let f of a) {
          for (let x of list) {
            yield f(x);
          }
        }
      });
    },
    concat(y) {
      const list = this;
      return new List(function* () {
        yield* list;
        yield* y;
      });
    },
    chain(f) {
      const list = this;
      return new List(function* () {
        for (let x of list) yield* f(x);
      });
    },
    equals(ys) {
      const iterX = this[Symbol.iterator]();
      const iterY = ys[Symbol.iterator]();
      let x = iterX.next();
      let y = iterY.next();
      while (!(x.done && y.done)) {
        if (x.done !== y.done) return false;
        if (typeof x.value === 'object' && typeof x.value.equals === 'function') {
          if (!x.value.equals(y.value)) return false;
        } else {
          if (x.value !== y.value) return false;
        }
        x = iterX.next();
        y = iterY.next();
      }
      return true;
    },
    extend(f) {
      const list = this;
      const value = f(this);
      return new List(function* () {
        for (let x of list) yield value;
      });
    },
    map(f) {
      const list = this;
      return new List(function* () {
        for (let x of list) yield f(x);
      });
    },
    reduce(f, acc) {
      for (let x of this) {
        acc = f(acc, x);
      }
      return acc;
    },
    traverse(A, f) {
      return this.reduce(
        (acc, x) => f(x).ap(acc.map(list => x => (list.push(x), list))),
        A.of([])
      ).map(List.from);
    },
  };
  List.chainRec = (f, i) =>
    new List(function* () {
      const next = value => ({ done: false, value });
      const done = value => ({ done: true, value });
      let current = f(next, done, i);
      while (!current.done) {
        yield current.value;
        current = f(next, done, current.value);
      }
      return current.value;
    });
  List.empty = () => new List(function* () {});
  List.from = iterable =>
    new List(function* () {
      yield* iterable;
    });
  List.of = x =>
    new List(function* () {
      yield x;
    });
  return List;
})();
