import { Kind, Type } from '../typeclasses';

export type Tagged<
  _type extends string = string,
  _tag extends string = string,
  props extends object = object,
> = { _type: _type; _tag: _tag } & props;
export interface TaggedKind extends Kind {
  type: Tagged;
}
export type TaggedUnion<
  _type extends string,
  D extends Record<keyof D, object>,
> = {
  [_tag in keyof D & string]: Tagged<_type, _tag, D[_tag]>;
}[keyof D & string];
export type MemberOf<U extends Tagged, _tag extends U['_tag']> = Extract<
  U,
  { _tag: _tag }
>;
export const tag: {
  <_type extends string>(
    _type: _type
  ): <_tag extends string>(
    _tag: _tag
  ) => <T extends object>(props: T) => Tagged<_type, _tag, T>;
  <F extends TaggedKind>(
    _type: F['type']['_type']
  ): <_tag extends F['type']['_tag']>(
    _tag: _tag
  ) => <a, e>(
    props: Omit<MemberOf<Type<F, e, a>, _tag>, '_type' | '_tag'>
  ) => MemberOf<Type<F, e, a>, _tag>;
} = (_type: string) => (_tag: string) => (props: any) =>
  Object.assign(props, { _type, _tag });
export const isTagged =
  <F extends TaggedKind, _tag extends F['type']['_tag']>(_tag: _tag) =>
  <a, e>(obj: Type<F, e, a>): obj is MemberOf<Type<F, e, a>, _tag> =>
    obj._tag === _tag;
