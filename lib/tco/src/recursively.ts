export interface Cache<a, b> {
  has(key: a): boolean;
  get(key: a): b | undefined;
  set(key: a, value: b): void;
}

function noop(): Cache<unknown, never> {
  return {
    has: _key => false,
    get: _key => undefined,
    set: (_key, _value) => {},
  };
}

interface Info<a, b> {
  arg: a;
  iter: Iterator<a, b, b>;
  result: IteratorResult<a, b>;
  next: Info<a, b> | null;
}

export function recursively<a, b>(
  recursiveFunction: (_: a) => Iterator<a, b, b>,
  getCache: () => Cache<a, b>
): (_: a) => b;
export function recursively<a, b>(recursiveFunction: (_: a) => Iterator<a, b, b>): (_: a) => b;
export function recursively<a, b>(
  recursiveFunction: (_: a) => Iterator<a, b, b>,
  getCache: () => Cache<a, b> = noop
): (_: a) => b {
  return initialValue => {
    const initialIter = recursiveFunction(initialValue);
    const initialResult = initialIter.next();
    let current: Info<a, b> = {
      arg: initialValue,
      iter: initialIter,
      result: initialResult,
      next: null,
    };
    const cache = getCache();
    for (let max = Number.MAX_SAFE_INTEGER; max > 0; max -= 1) {
      if (current.result.done) {
        if (current.next === null) {
          return current.result.value;
        }
        cache.set(current.arg, current.result.value);
        const next = current.next;
        const value = current.result.value;
        const result = next.iter.next(value);
        current = { ...next, result };
      } else {
        if (cache.has(current.result.value)) {
          const result = current.iter.next(cache.get(current.result.value)!);
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
