import { MemberOf, TaggedUnion, isTagged, tag } from '../tagged';
import { EitherF } from './internal';

type EitherU<a, b> = TaggedUnion<
  'Either',
  { Left: { left: a }; Right: { right: b } }
>;
const tagEither = tag<EitherF>('Either');
export interface Left<a> extends MemberOf<EitherU<a, never>, 'Left'> {}
export const Left = <a>(left: a) => tagEither('Left')({ left });
export const isLeft = isTagged<EitherF, 'Left'>('Left');
export interface Right<b> extends MemberOf<EitherU<never, b>, 'Right'> {}
export const Right = <b>(right: b) => tagEither('Right')({ right });
export const isRight = isTagged<EitherF, 'Right'>('Right');
export type Either<a, b> = Left<a> | Right<b>;
