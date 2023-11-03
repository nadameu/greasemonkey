export const thrush =
  <a>(a: a) =>
  <b>(f: (_: a) => b): b =>
    f(a);

export const apply: {
  <A, B>(f: (_: A) => B, a: A): B;
  <A extends unknown[], B>(f: (...args: A) => B, ...args: A): B;
} = <A extends unknown[], B>(f: (...args: A) => B, ...args: A): B => f(...args);
