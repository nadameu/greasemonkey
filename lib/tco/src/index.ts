type Recursive<a> = { done: true; value: a } | { done: false; next: () => Recursive<a> };
export class TCO<a> {
  constructor(private _representation: Recursive<a>) {}

  chain<b>(f: (_: a) => TCO<b>): TCO<b> {
    return new TCO({
      done: false,
      next: () => {
        const value = this.run();
        return f(value)._representation;
      },
    });
  }
  map<b>(f: (_: a) => b): TCO<b> {
    return this.chain(x => TCO.of(f(x)));
  }
  run() {
    let result = this._representation;
    while (!result.done) result = result.next();
    return result.value;
  }

  static of<a>(value: a): TCO<a> {
    return new TCO({ done: true, value });
  }
}

export function recursively<a, b>(recursiveFunction: (_: a) => Iterator<a, b, b>): (_: a) => b {
  return initialValue => {
    type Info = {
      arg: a;
      iter: Iterator<a, b, b>;
      result: IteratorResult<a, b>;
      next: Info | null;
    };
    const initialIter = recursiveFunction(initialValue);
    const initialResult = initialIter.next();
    let current: Info = { arg: initialValue, iter: initialIter, result: initialResult, next: null };
    const results = new Map<a, b>();
    for (let max = Number.MAX_SAFE_INTEGER; max > 0; max -= 1) {
      if (current.result.done) {
        if (current.next === null) {
          return current.result.value;
        }
        results.set(current.arg, current.result.value);
        const next = current.next;
        const value = current.result.value;
        const result = next.iter.next(value);
        current = { ...next, result };
      } else {
        if (results.has(current.result.value)) {
          const result = current.iter.next(results.get(current.result.value)!);
          current = { ...current, result };
          continue;
        }
        const iter = recursiveFunction(current.result.value);
        const result = iter.next();
        current = { arg: current.result.value, iter, result, next: current };
      }
    }
    throw new RangeError('Too much recursion.');
  };
}
