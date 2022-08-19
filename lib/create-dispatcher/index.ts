class Dispatcher<T> {
  private _index: number = 0;
  private _promises: Promise<IteratorResult<T>>[] = [];
  private _resolves: Array<(_: IteratorResult<T>) => void> = [];

  constructor() {
    this._addPending();
  }

  private _addPending() {
    const promise = new Promise<IteratorResult<T>>(res => this._resolves.push(res));
    this._promises.push(promise);
    return promise;
  }

  [Symbol.asyncIterator](): AsyncIterator<T> {
    let i = 0;
    return {
      next: () => {
        if (i < this._promises.length) return this._promises[i++]!;
        i += 1;
        return this._addPending();
      },
    };
  }

  dispatch(value: T): void {
    this._resolves[this._index++]!({ done: false, value });
    if (this._index >= this._promises.length) {
      this._addPending();
    }
  }
}

export function createDispatcher<T>() {
  return new Dispatcher<T>();
}
