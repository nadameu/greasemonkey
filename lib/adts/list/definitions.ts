export type List<a> = Cons<a> | Nil;
interface ListImpl<a> {
  _type: 'List';
}
export interface Cons<a> extends ListImpl<a> {
  _tag: 'Cons';
  head: a;
  tail: List<a>;
}
export const Cons = <a>(head: a, tail: List<a>): Cons<a> => ({
  _type: 'List',
  _tag: 'Cons',
  head,
  tail,
});
export const isCons = <a>(list: List<a>): list is Cons<a> =>
  list._tag === 'Cons';
export interface Nil extends ListImpl<never> {
  _tag: 'Nil';
}
export const Nil: Nil = { _type: 'List', _tag: 'Nil' };
export const isNil = <a>(list: List<a>): list is Nil => list._tag === 'Nil';
