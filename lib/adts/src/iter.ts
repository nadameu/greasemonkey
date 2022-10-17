export interface Iter<T> {
  [Symbol.iterator](): Iterator<T>;
  chain<U>(f: (value: T, index: number) => Iterable<U>): Iter<U>;
  toArray(): T[];
}
interface IterConstructor {
  <T>(iterable: Iterable<T>): Iter<T>;
  fromArray<T>(array: ArrayLike<T>): Iter<T>;
  of<T>(...items: T[]): Iter<T>;
}
export const Iter: IterConstructor = <T>(xs: Iterable<T>): Iter<T> =>
  generate(function* () {
    let i = 0;
    for (const x of xs) yield Value(x, i++);
    return Done;
  });
Iter.fromArray = <T>(array: ArrayLike<T>): Iter<T> =>
  generate(function* () {
    for (let i = 0; i < array.length; i++) yield Value(array[i] as T, i);
    return Done;
  });
Iter.of = (...items) => Iter.fromArray(items);

type Source<T> = () => SourceGenerator<T>;
type SourceGenerator<T> = Generator<Value<T>, Done, never>;

type Transformer<T, U> = () => TransformerGenerator<T, U>;
type TransformerGenerator<T, U> = Generator<Value<U> | Ask, Done, Value<T> | Done>;

type Yielder<T, Prev = unknown> =
  | {
      previous: null;
      generator: Source<T>;
    }
  | {
      previous: Yielder<Prev>;
      generator: Transformer<Prev, T>;
    };

function generate<T>(generator: Source<T>): Iter<T> {
  return makeIter({ previous: null, generator });
}
function derive<T, U>(previous: Yielder<T>, generator: Transformer<T, U>): Iter<U> {
  return makeIter<U>({ previous, generator });
}

declare const AskSymbol: unique symbol;
type Ask = 1 & {
  [AskSymbol]: never;
};
const Ask = 1 as Ask;

type Value<T> = [value: T, index: number];
const Value: <T>(value: T, index: number) => Value<T> = <T>(...args: Value<T>): Value<T> => args;

declare const DoneSymbol: unique symbol;
type Done = 0 & {
  [DoneSymbol]: never;
};
const Done = 0 as Done;

function makeIter<T, Prev = unknown>(yielder: Yielder<T, Prev>): Iter<T> {
  const iter: Iter<T> = {
    [Symbol.iterator]: () => createIterator(yielder),
    chain: <U>(f: (value: T, index: number) => Iterable<U>): Iter<U> =>
      derive(yielder, function* () {
        let index = 0;
        while (true) {
          const item: Value<T> | Done = yield Ask;
          if (!item) return Done;
          for (const x of f(...item)) yield Value(x, index++);
        }
      }),
    toArray: () => Array.from(iter),
  };
  return iter;
}

interface MyNode<Prev, T, Next> {
  prev: MyNode<unknown, Prev, T> | null;
  generator: Transformer<Prev, T>;
  iterator: TransformerGenerator<Prev, T> | null;
  next: MyNode<T, Next, unknown> | null;
}

interface Suspend<T> {
  type: 'Suspend';
  input: T;
}
const Suspend = <T>(input: T): Suspend<T> => ({ type: 'Suspend', input });
interface Resume<U> {
  type: 'Resume';
  output: U;
}
const Resume = <U>(output: U): Resume<U> => ({ type: 'Resume', output });
const tailRec =
  <T, U>(f: (input: T) => Suspend<T> | Resume<U>) =>
  (input: T): U => {
    let result = f(input);
    while (true) {
      if (result.type === 'Resume') return result.output;
      result = f(result.input);
    }
  };

const createIterator = <T, Prev = unknown, Next = unknown>(
  yielder: Yielder<T, Prev>
): Iterator<T> => {
  const last: MyNode<Prev, T, Next> = {
    prev: null,
    generator: yielder.generator,
    iterator: null,
    next: null,
  };
  {
    let current: Yielder<unknown> | null = yielder.previous;
    let next: MyNode<unknown, unknown, unknown> = last;
    while (current !== null) {
      const node: MyNode<unknown, unknown, unknown> = {
        prev: null,
        generator: current.generator,
        iterator: null,
        next,
      };
      next.prev = node;
      next = node;
      current = current.previous;
    }
  }
  const forEachActiveGenerator = (f: (it: TransformerGenerator<unknown, unknown>) => void) => {
    for (
      let current: MyNode<unknown, unknown, unknown> | null = last;
      current;
      current = current.prev
    ) {
      if (!current.iterator) break;
      f(current.iterator);
    }
  };
  return {
    next: () => {
      let node = last;
      let maybeResult: [] | [result: Value<Prev> | Done] = [];
      while (true) {
        const iterator = (node.iterator ??= node.generator());
        const next = iterator.next(...maybeResult);
        if (next.done) {
          if (next.value !== Done) {
            const error = new Error('Unexpected logic.');
            forEachActiveGenerator(g => g.throw(error));
            throw error;
          }
          if (node.next) {
            node = node.next as never;
            maybeResult = [Done];
            continue;
          }
          forEachActiveGenerator(g => g.return(Done));
          return { done: true, value: undefined };
        }
        const result = next.value;
        if (result === 1) {
          if (!node.prev) {
            const error = new Error('Unexpected logic.');
            forEachActiveGenerator(g => g.throw(error));
            throw error;
          }
          node = node.prev as never;
          maybeResult = [];
          continue;
        }
        if (node.next) {
          node = node.next as never;
          maybeResult = [result as Value<never>];
          continue;
        }
        return { done: false, value: result[0] };
      }
    },
  };
};

const handleNode = <Prev, T, Next>({
  node,
  maybeResult = [],
}: {
  node: MyNode<Prev, T, Next>;
  maybeResult?: [] | [result: Value<Prev> | Done];
}):
  | Suspend<{
      node: MyNode<T, Next, unknown>;
      maybeResult: [result: Value<T> | Done];
    }>
  | Suspend<{ node: MyNode<unknown, Prev, T> }>
  | Resume<Value<T>>
  | Resume<Done> => {
  const iterator = (node.iterator ??= node.generator());
  const next = iterator.next(...maybeResult);
  if (next.done) {
    if (next.value !== Done) throw new Error('Unexpected logic.');
    if (node.next) return Suspend({ node: node.next, maybeResult: [Done] });
    let current: MyNode<unknown, unknown, unknown> | null = node.prev;
    while (current) {
      if (!current.iterator) break;
      current.iterator.return(Done);
      current = current.prev;
    }
    return Resume(Done);
  }
  const result = next.value;
  if (result === 1) {
    if (!node.prev) throw new Error('Unexpected logic.');
    return Suspend({ node: node.prev });
  }
  if (node.next) return Suspend({ node: node.next, maybeResult: [result] });
  return Resume(result);
};
