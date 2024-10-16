import { MemberOf, TaggedUnion, isTagged, tag } from '../tagged';
import { EitherF } from './internal';

type EitherU<a, b> = TaggedUnion<
  'Either',
  { Left: { left: a }; Right: { right: b } }
>;
const tagEither = /* #__PURE__ */ tag<EitherF>('Either');

export interface Left<a> extends MemberOf<EitherU<a, never>, 'Left'> {}
const tagLeft = /* #__PURE__ */ tagEither('Left');
export const Left = <a>(left: a) => tagLeft({ left });
export const isLeft: <a, e>(either: Either<e, a>) => either is Left<e> =
  /* #__PURE__ */ isTagged<EitherF, 'Left'>('Left');

export interface Right<b> extends MemberOf<EitherU<never, b>, 'Right'> {}
const tagRight = /* #__PURE__ */ tagEither('Right');
export const Right = <b>(right: b) => tagRight({ right });
export const isRight: <a, e>(either: Either<e, a>) => either is Right<a> =
  /* #__PURE__ */ isTagged<EitherF, 'Right'>('Right');

export type Either<a, b> = Left<a> | Right<b>;
