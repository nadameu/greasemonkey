export interface Reader<R, E, A> {
  <B>(env: R, Left: (_: E) => B, Right: (_: A) => B): B;
}
export const Reader = <R, E, A>(reader: Reader<R, E, A>): Reader<R, E, A> => reader;
export interface DOMContext {
  document: Document;
}
export const chainReader =
  <A, B, R1 = unknown, E1 = never>(f: (_: A) => Reader<R1, E1, B>) =>
  <R0, E0>(reader: Reader<R0, E0, A>) =>
    Reader<R0 & R1, E0 | E1, B>((env, L, R) => reader(env, L, x => f(x)(env, L, R)));
export const mapReader =
  <A, B>(f: (_: A) => B) =>
  <R, E>(reader: Reader<R, E, A>) =>
    Reader<R, E, B>((env, L, R) => reader(env, L, x => R(f(x))));
export const mapLeft =
  <E0, E1>(f: (_: E0) => E1) =>
  <R, A>(reader: Reader<R, E0, A>) =>
    Reader<R, E1, A>((env, L, R) => reader(env, x => L(f(x)), R));
