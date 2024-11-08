import { MemberOf, TaggedUnion, isTagged, tag } from '../tagged';
import { ListF } from './internal';

type ListU<a> = TaggedUnion<
  'List',
  { Cons: { head: a; tail: List<a> }; Nil: {} }
>;
const tagList = /* #__PURE__ */ tag<ListF>('List');

export interface Cons<a> extends MemberOf<ListU<a>, 'Cons'> {}
const tagCons = /* #__PURE__ */ tagList('Cons');
export const Cons = <a>(head: a, tail: List<a>) => tagCons({ head, tail });
export const isCons: <a>(list: List<a>) => list is Cons<a> =
  /* #__PURE__ */ isTagged<ListF, 'Cons'>('Cons');

export interface Nil extends MemberOf<ListU<never>, 'Nil'> {}
export const Nil: Nil = /* #__PURE__ */ tagList('Nil')({});
export const isNil: <a>(list: List<a>) => list is Nil =
  /* #__PURE__ */ isTagged<ListF, 'Nil'>('Nil');

export type List<a> = Cons<a> | Nil;
