import { Either, isLeft } from '../either';

export const thrush =
  <a>(a: a) =>
  <b>(f: (_: a) => b): b =>
    f(a);

export const apply: {
  <A, B>(f: (_: A) => B, a: A): B;
  <A extends unknown[], B>(f: (...args: A) => B, ...args: A): B;
} = <A extends unknown[], B>(f: (...args: A) => B, ...args: A): B => f(...args);

export function assert(condition: any, msg?: string): asserts condition {
  if (!condition) throw new Error(msg);
}

export const identity = <a>(x: a): a => x;

export const tailRec = <a, b>(seed: a, f: (_: a) => Either<a, b>): b => {
  let result = f(seed);
  while (isLeft(result)) result = f(result.left);
  return result.right;
};

export const constant =
  <a>(
    a: a
  ): {
    (...args: any[]): a;
  } =>
  <b>(_: b): a =>
    a;
