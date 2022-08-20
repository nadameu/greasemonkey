class Dispatcher<T> {
  private _readIndex = 0;
  private _writeIndex = 0;
  private _isDone = false;
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

  [Symbol.asyncIterator](): AsyncIterator<T> & { return: {}; throw: {} } {
    return {
      next: async () => {
        if (this._isDone) {
          return { done: this._isDone, value: undefined };
        }
        if (this._readIndex < this._promises.length) {
          const result = await this._promises[this._readIndex++]!;
          if (result.done) {
            this._isDone = true;
          }
          return result;
        }
        this._readIndex += 1;
        return this._addPending();
      },
      return: (value?: any) => {
        this._isDone = true;
        return Promise.resolve({ done: this._isDone, value });
      },
      throw: (reason?: any) => {
        this._isDone = true;
        return Promise.reject(reason);
      },
    };
  }

  dispatch(value: T): void {
    this._resolves[this._writeIndex++]!({ done: false, value });
    if (this._writeIndex >= this._promises.length) {
      this._addPending();
    }
  }

  end() {
    this._resolves[this._writeIndex++]!({ done: true, value: undefined });
  }
}

export function createDispatcher<T>() {
  return new Dispatcher<T>();
}
