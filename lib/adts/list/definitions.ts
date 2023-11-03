import * as Internal from './internal';
export type List<a> = Cons<a> | Nil;
export interface Cons<a> extends Internal.Cons<a> {}
export const Cons = <a>(head: a, tail: List<a>): Cons<a> =>
  new Internal.Cons(head, tail);
export const isCons = <a>(list: List<a>): list is Cons<a> =>
  list._tag === 'Cons';
export interface Nil extends Internal.Nil {}
export const Nil: Nil = new Internal.Nil();
export const isNil = <a>(list: List<a>): list is Nil => list._tag === 'Nil';
