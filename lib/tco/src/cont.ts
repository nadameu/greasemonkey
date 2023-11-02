export type Result<T, U> =
  | { done: true; value: U }
  | { done: false; input: T; andThen: (value: U) => Result<T, U> };
const done = <U, T = never>(value: U): Result<T, U> => ({
  done: true,
  value,
});
const loop = <T, U>(
  input: T,
  andThen: (value: U) => Result<T, U>
): Result<T, U> => ({
  done: false,
  input,
  andThen,
});

interface Cache<T, U> {
  get(input: T): [U] | null;
  set(input: T, value: U): void;
}
function getCache<T, U, K = unknown>(hashFn: (input: T) => K): Cache<T, U> {
  const map = new Map<K, U>();
  return {
    get(input) {
      const hash = hashFn(input);
      return map.has(hash) ? [map.get(hash)!] : null;
    },
    set(input, value) {
      map.set(hashFn(input), value);
    },
  };
}

export type CreatedFunction<T, U> = {
  (input: T): U;
  loop(input: T, andThen: (value: U) => Result<T, U>): Result<T, U>;
  done(value: U): Result<T, U>;
};
export function create<T, U>(
  f: (input: T) => Result<T, U>
): CreatedFunction<T, U>;
export function create<T, U>(
  f: (input: T) => Result<T, U>,
  memoize: boolean
): CreatedFunction<T, U>;
export function create<T, U, K>(
  f: (input: T) => Result<T, U>,
  hashFn: { (input: T): K }
): CreatedFunction<T, U>;
export function create<T, U, K>(
  f: (input: T) => Result<T, U>,
  hashFn?: boolean | { (input: T): K }
): CreatedFunction<T, U> {
  function rec(input: T): U {
    const cache =
      typeof hashFn === 'function'
        ? getCache<T, U, K>(hashFn)
        : typeof hashFn === 'boolean' && hashFn
        ? getCache<T, U, T>(x => x)
        : false;
    type Prev = null | {
      prev: Prev;
      input: T;
      transform: (value: U) => Result<T, U>;
    };
    let prev: Prev = null;
    let curr: Result<T, U> = f(input);
    if (!cache) {
      while (true) {
        if (curr.done) {
          if (prev === null) {
            return curr.value;
          } else {
            curr = prev.transform(curr.value);
            prev = prev.prev;
          }
        } else {
          const next = f(curr.input);
          prev = { prev, input: curr.input, transform: curr.andThen };
          curr = next;
        }
      }
    }
    while (true) {
      if (curr.done) {
        if (prev === null) {
          return curr.value;
        } else {
          cache.set(prev.input, curr.value);
          curr = prev.transform(curr.value);
          prev = prev.prev;
        }
      } else {
        const seen = cache.get(curr.input) || null;
        const next = seen ? done(seen[0]) : f(curr.input);
        prev = { prev, input: curr.input, transform: curr.andThen };
        curr = next;
      }
    }
  }
  rec.loop = loop;
  rec.done = done;
  return rec;
}
