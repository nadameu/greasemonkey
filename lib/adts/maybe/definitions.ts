import { MemberOf, TaggedUnion, isTagged, tag } from '../tagged';
import { MaybeF } from './internal';

type MaybeU<a> = TaggedUnion<'Maybe', { Just: { value: a }; Nothing: {} }>;
const tagMaybe = /* #__PURE__ */ tag<MaybeF>('Maybe');

export interface Just<a> extends MemberOf<MaybeU<a>, 'Just'> {}
const tagJust = /* #__PURE__ */ tagMaybe('Just');
export const Just = <a>(value: a) => tagJust({ value });
export const isJust: <a>(maybe: Maybe<a>) => maybe is Just<a> =
  /* #__PURE__ */ isTagged<MaybeF, 'Just'>('Just');

export interface Nothing extends MemberOf<MaybeU<never>, 'Nothing'> {}
export const Nothing: Nothing = /* #__PURE__ */ tagMaybe('Nothing')({});
export const isNothing: <a>(maybe: Maybe<a>) => maybe is Nothing =
  /* #__PURE__ */ isTagged<MaybeF, 'Nothing'>('Nothing');

export type Maybe<a> = Just<a> | Nothing;
