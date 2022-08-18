import { expectUnreachable } from '@nadameu/expect-unreachable';

export type Query<T> = Fail<T> | One<T> | Many<T>;
interface QueryBase<T> {
  history: string[];
  [Symbol.iterator](): Generator<T>;
  chain<U>(f: (_: T) => Query<U>): Query<U>;
  concatMap<U>(f: (_: T) => Query<U>): Query<U>;
  map<U>(f: (_: T) => U): Query<U>;
  mapIterable<U>(f: (_: T) => Iterable<U>): Query<U>;
  one(): QueryMaybe<T>;
  safeMap<U>(f: (_: T) => U | null | undefined): Query<U>;
  tap(f: (_: T) => void): Query<T>;
}
type QueryMaybe<T> = Fail<T> | One<T>;
interface QueryMaybeBase<T> extends QueryBase<T> {
  chain<U>(f: (_: T) => QueryMaybe<U>): QueryMaybe<U>;
  chain<U>(f: (_: T) => Query<U>): Query<U>;
  map<U>(f: (_: T) => U): QueryMaybe<U>;
  query<T extends Element>(this: QueryMaybe<ParentNode>, selector: string): Query<T>;
  safeMap<U>(f: (_: T) => U | null | undefined): QueryMaybe<U>;
  tap(f: (_: T) => void): QueryMaybe<T>;
}

export interface Fail<T = never> extends QueryMaybeBase<T> {
  tag: 'Fail';
}
export function Fail<T = never>(history: string[]): Fail<T> {
  const returnThis = () => _this as Fail;
  const _this: Fail<T> = {
    tag: 'Fail',
    history,
    *[Symbol.iterator]() {},
    chain: returnThis,
    concatMap: returnThis,
    map: returnThis,
    mapIterable: returnThis,
    one: returnThis,
    query: returnThis,
    safeMap: returnThis,
    tap: returnThis,
  };
  return _this;
}

export interface One<T> extends QueryMaybeBase<T> {
  tag: 'One';
  value: T;
}
export function One<T>(value: T, history: string[]): One<T> {
  return {
    tag: 'One',
    value,
    history,

    *[Symbol.iterator]() {
      yield value;
    },
    chain,
    concatMap: chain,
    map: f => One(f(value), [...history, 'map(f)']),
    mapIterable: f =>
      _mapHistory(
        chain(x => fromIterable(f(x))),
        () => [...history, 'mapIterable(f)']
      ),
    one: () => One(value, [...history, 'one()']),
    query: <U extends Element>(selector: string): Query<U> => {
      const newHistory = [...history, `query(\`${selector}\`)`];
      const result = (value as unknown as ParentNode).querySelectorAll<U>(selector);
      if (result.length === 0) return Fail(newHistory);
      if (result.length === 1) return One(result[0]!, newHistory);
      return Many(Array.from(result), newHistory);
    },
    safeMap: f => {
      const newHistory = [...history, 'safeMap(f)'];
      const result = f(value);
      if (result == null) return Fail(newHistory);
      return One(result, newHistory);
    },
    tap: f => {
      f(value);
      return One(value, history);
    },
  };

  function chain<U>(f: (_: T) => QueryMaybe<U>): QueryMaybe<U>;
  function chain<U>(f: (_: T) => Query<U>): Query<U>;
  function chain<U>(f: (_: T) => Query<U>): any {
    const newHistory = [...history, 'chain(f)'];
    const result = f(value);
    switch (result.tag) {
      case 'Fail':
        return Fail(newHistory);

      case 'One':
        return One(result.value, newHistory);

      case 'Many':
        return Many(result.values, newHistory);

      default:
        return expectUnreachable(result);
    }
  }
}

export interface Many<T> extends QueryBase<T> {
  tag: 'Many';
  values: T[];
}
export function Many<T>(values: T[], history: string[]): Many<T> {
  return {
    tag: 'Many',
    values,
    history,
    *[Symbol.iterator]() {
      yield* values;
    },
    chain,
    concatMap: f => {
      const newHistory = [...history, 'concatMap(f)'];
      const results = values.flatMap(x => Array.from(f(x)));
      if (results.length === 0) return Fail(newHistory);
      if (results.length === 1) return One(results[0]!, newHistory);
      return Many(results, newHistory);
    },
    map: f =>
      Many(
        values.map(x => f(x)),
        [...history, 'map(f)']
      ),
    mapIterable: f =>
      _mapHistory(
        chain(x => fromIterable(f(x))),
        () => [...history, 'mapIterable(f)']
      ),
    one: () => Fail([...history, 'one()']),
    safeMap: <U>(f: (_: T) => U | null | undefined): Query<U> => {
      const newHistory = [...history, 'safeMap(f)'];
      const results: U[] = [];
      for (const value of values) {
        const result = f(value);
        if (result == null) return Fail(newHistory);
        results.push(result);
      }
      return Many(results, newHistory);
    },
    tap: f => {
      values.forEach(x => f(x));
      return Many(values, history);
    },
  };

  function chain<U>(f: (_: T) => Query<U>): Query<U> {
    const newHistory = [...history, 'chain(f)'];
    const results: U[] = [];
    for (const value of values) {
      const result = f(value);
      if (result.tag === 'Fail') return Fail(newHistory);
      if (result.tag === 'One') results.push(result.value);
      else results.push(...result.values);
    }
    return Many(results, newHistory);
  }
}

export const of = <T>(value: T): One<T> => One(value, ['of(value)']);
export function lift2<T, U, V>(
  fx: QueryMaybe<T>,
  fy: QueryMaybe<U>,
  f: (x: T, y: U) => V
): QueryMaybe<V>;
export function lift2<T, U, V>(fx: Query<T>, fy: Query<U>, f: (x: T, y: U) => V): Query<V>;
export function lift2<T, U, V>(fx: Query<T>, fy: Query<U>, f: (x: T, y: U) => V): any {
  if (fx.tag === 'Fail') return fx as Fail;
  if (fy.tag === 'Fail') return fy as Fail;
  const newHistory = [`lift2(${fx.history.join('.')}, ${fy.history.join('.')}, f)`];
  if (fx.tag === 'One' && fy.tag === 'One') return One(f(fx.value, fy.value), newHistory);
  const xs = fx.tag === 'One' ? [fx.value] : fx.values;
  const ys = fy.tag === 'One' ? [fy.value] : fy.values;
  return Many(
    xs.flatMap(x => ys.map(y => f(x, y))),
    newHistory
  );
}

export function unfold<T, U>(seed: U, f: (seed: U) => [value: T, nextSeed: U] | null): Query<T> {
  return _mapHistory(
    fromIterable(
      (function* () {
        let s = seed,
          current: [T, U] | null;
        while ((current = f(s))) {
          yield current[0];
          s = current[1];
        }
      })()
    ),
    () => ['unfold(seed, f)']
  );
}

export const fromIterable = <T>(iterable: Iterable<T>): Query<T> => {
  const results = Array.from(iterable);
  const h = ['fromIterable(iterable)'];
  if (results.length === 0) return Fail(h);
  if (results.length === 1) return One(results[0]!, h);
  return Many(results, h);
};

export const concat = <T>(fx: Query<T>, fy: Query<T>): Query<T> => {
  const newHistory = [`concat(${fx.history.join('.')}, ${fy.history.join('.')})`];
  const k = () => newHistory;
  if (fy.tag === 'Fail') return _mapHistory(fx, k);
  if (fx.tag === 'Fail') return _mapHistory(fy, k);
  return _mapHistory(fromIterable(Array.from(fx).concat(Array.from(fy))), k);
};

function _mapHistory<T>(fx: Query<T>, f: (history: string[]) => string[]): Query<T> {
  const newHistory = f(fx.history);
  if (fx.tag === 'Fail') return Fail(newHistory);
  if (fx.tag === 'One') return One(fx.value, newHistory);
  return Many(fx.values, newHistory);
}
