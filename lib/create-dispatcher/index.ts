class Dispatcher<T> {
  private _writeIndex = 0;
  private _isDone = false;
  private _values: PromiseWithResolvers<IteratorResult<T>>[] = [];

  private _get(index: number) {
    while (index >= this._values.length) {
      this._values.push(Promise.withResolvers<IteratorResult<T>>());
    }
    return this._values[index]!;
  }

  private _write(result: IteratorResult<T>) {
    this._get(this._writeIndex++).resolve(result);
  }

  async *[Symbol.asyncIterator](): AsyncIterator<T> & {
    return: {};
    throw: {};
  } {
    try {
      for (let i = 0; !this._isDone; i += 1) {
        const result = await this._get(i).promise;
        if (result.done) return result.value;
        else yield result.value;
      }
    } finally {
      this._isDone = true;
    }
  }

  dispatch(value: T): void {
    this._write({ done: false, value });
  }

  end() {
    this._write({ done: true, value: undefined });
  }
}

export function createDispatcher<T>() {
  return new Dispatcher<T>();
}
