import { describe, expect, test, vitest } from 'vitest';
import { E, Either, Left, Right } from '.';
import { tuple } from '../tuple';

test('generators', () => {
  let done = false;
  const iter = vitest.fn((value: 4): IteratorResult<8, 3> => {
    if (done) return { done, value: 3 };
    done = true;
    return { done: false, value: 8 };
  });
  const obj = vitest.fn((): Iterator<8, 3, 4> => ({ next: iter }));
  const f = vitest.fn((_: 3) => 5);
  function* yields() {
    const a = yield* { [Symbol.iterator]: obj };
    return f(a);
  }
  const yielded = yields();
  expect(yielded).toBeTypeOf('object');
  expect(yielded.next(4)).toEqual({ done: false, value: 8 });
  expect(yielded.next(4)).toEqual({ done: true, value: 5 });

  expect(obj.mock.calls).toEqual([[]]);
  expect(iter.mock.calls).toEqual([[undefined], [4]]);
  expect(f.mock.calls).toEqual([[3]]);
});

describe('gen', () => {
  test('success 1', () => {
    const result = E.gen(function* ($) {
      const fst = yield* $(Right('hey'));
      return tuple(fst);
    });
    expect(result).toEqual(Right(['hey']));
  });
  test('success 2', () => {
    const result = E.gen(function* ($) {
      const fst = yield* $(Right('hey'));
      const snd = yield* $(Right(42));
      return tuple(fst, snd);
    });
    expect(result).toEqual(Right(['hey', 42]));
  });
  test('success 3', () => {
    const result = E.gen(function* ($) {
      const fst = yield* $(Right('hey'));
      const snd = yield* $(Right(42));
      const third = yield* $(Right(false));
      return tuple(fst, snd, third);
    });
    expect(result).toEqual(Right(['hey', 42, false]));
  });
  test('success 4', () => {
    const result = E.gen(function* ($) {
      const fst = yield* $(Right('hey'));
      const snd = yield* $(Right(42));
      const third = yield* $(Right(false));
      const fourth = yield* $(Right('bye'));
      return tuple(fst, snd, third, fourth);
    });
    expect(result).toEqual(Right(['hey', 42, false, 'bye']));
  });
  test('failure 3', () => {
    const result = E.gen(function* ($) {
      const fst = yield* $(Right('hey'));
      const snd = yield* $(Left('err') as Either<string, number>);
      const third = yield* $(Right(false));
      return tuple(fst, snd, third);
    });
    expect(result).toEqual(Left('err'));
  });
  test('try/catch', () => {
    const result = E.gen(function* ($) {
      try {
        const fst = yield* $(Right('hey'));
        const snd = yield* $(Left('err') as Either<string, number>);
        const third = yield* $(Right(false));
        return tuple(fst, snd, third);
      } catch (err) {
        const fourth = yield* $(Right(err + ' caught'));
        return fourth;
      }
    });
    expect(result).toEqual(Right('err caught'));
  });
  test('uncaught, unexpected error', () => {
    const getResult = () =>
      E.gen(function* () {
        throw 'abcde';
      });
    expect(getResult).toThrow('abcde');
  });
});
