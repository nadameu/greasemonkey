const _tag: unique symbol = '@nadameu/match/tag' as any;
type TaggedWith<T extends string = string> = { [_tag]: T };
export type Tagged<T extends string, O extends object = {}> = Struct<TaggedWith<T> & O>;
export type TaggedUnion<D extends Record<string, object>> = {
  [T in keyof D & string]: Tagged<T, D[T]>;
}[keyof D & string];

type Struct<T> = { result: { [K in keyof T]: T[K] } }['result'];
type TagOf<T extends TaggedWith> = T[typeof _tag];

export type MemberOf<T extends TaggedWith, K extends TagOf<T> = TagOf<T>> = Extract<
  T,
  TaggedWith<K>
>;

export function taggedWith<T extends string>(tag: T) {
  return function tagged<O extends object = {}>(properties: O = {} as any): Tagged<T, O> {
    (properties as any)[_tag] = tag;
    return properties as any;
  };
}
