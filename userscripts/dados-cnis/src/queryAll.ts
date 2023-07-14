export function queryAll<T extends HTMLElement>(
  selector: string,
  context: ParentNode = document
): Result<T> {
  return new Result(context.querySelectorAll<T>(selector));
}

class Result<T> {
  constructor(private _elements: Iterable<T>) {}

  [Symbol.iterator]() {
    return this._elements[Symbol.iterator]();
  }

  get length() {
    return this.reduce(x => x + 1, 0);
  }

  filter<U extends T>(pred: (x: T) => x is U): Result<U>;
  filter(pred: (_: T) => boolean): Result<T>;
  filter(pred: (_: T) => boolean): Result<T> {
    const xs = this;
    return new Result({
      *[Symbol.iterator]() {
        for (const x of xs) if (pred(x)) yield x;
      },
    });
  }

  map<U>(f: (x: T, i: number) => U): Result<U> {
    const xs = this;
    return new Result({
      *[Symbol.iterator]() {
        let i = 0;
        for (const x of xs) yield f(x, i++);
      },
    });
  }

  one(): Promise<T> {
    const it = this[Symbol.iterator]();
    const first = it.next();
    if (first.done) return Promise.reject(new Error(`Elemento não encontrado.`));
    const second = it.next();
    if (!second.done) return Promise.reject(new Error(`Mais de um elemento encontrado.`));
    return Promise.resolve(first.value);
  }

  reduce<U>(f: (acc: U, x: T, i: number) => U, z: U): U {
    let acc = z;
    let i = 0;
    for (const x of this._elements) acc = f(acc, x, i++);
    return acc;
  }
}
