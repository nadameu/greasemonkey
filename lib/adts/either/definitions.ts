import { MemberOf, TaggedUnion, isTagged, tag } from '../tagged';
import { EitherF } from './internal';

type EitherU<a, b> = TaggedUnion<
  'Either',
  { Left: { left: a }; Right: { right: b } }
>;
const tagEither = /* #__PURE__ */ tag<EitherF>('Either');

export interface Left<a> extends MemberOf<EitherU<a, never>, 'Left'> {}
export const Left = <a>(left: a) => tagEither('Left')({ left });
export const isLeft = /* #__PURE__ */ isTagged<EitherF, 'Left'>('Left');

export interface Right<b> extends MemberOf<EitherU<never, b>, 'Right'> {}
export const Right = <b>(right: b) => tagEither('Right')({ right });
export const isRight = /* #__PURE__ */ isTagged<EitherF, 'Right'>('Right');

export type Either<a, b> = Left<a> | Right<b>;
