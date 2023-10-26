const _tag: unique symbol = '@nadameu/match/tag' as any;
type TaggedWith<T extends string = string> = { [_tag]: T };
export type Tagged<T extends string, O extends object = {}> = Struct<TaggedWith<T> & O>;
export type TaggedUnion<D extends Record<string, object>> = {
  result: {
    [T in keyof D & string]: Tagged<T, D[T]>;
  }[keyof D & string];
}['result'];

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
export function isTaggedObject(obj: unknown): obj is TaggedWith {
  return typeof obj === 'object' && obj !== null && _tag in obj;
}
export function isTaggedWith<T extends string>(tag: T) {
  return function isTagged<O extends TaggedWith>(obj: O): obj is Extract<O, TaggedWith<T>> {
    return obj[_tag] === tag;
  };
}

type MatchResult<T, R> = [T] extends [never]
  ? MatchExhaustive<R>
  : [T] extends [TaggedWith]
  ? MatchByTag<T, R>
  : Match<T, R>;

export interface MatchExhaustive<R = never> {
  get(): R;
}
export interface Match<T, R = never> {
  otherwise<R2>(action: (_: T) => R2): MatchExhaustive<R | R2>;
  unsafeGet(): R;
  when<U extends T, R2>(
    pred: (_: T) => _ is U,
    action: (_: U) => R2
  ): MatchResult<Exclude<T, U>, R | R2>;
  when<R2>(pred: (_: T) => boolean, action: (_: T) => R2): MatchResult<T, R | R2>;
}
export interface MatchByTag<T extends TaggedWith, R = never> extends Match<T, R> {
  case<K extends T[typeof _tag], R2>(
    tag: K,
    action: (_: MemberOf<T, K>) => R2
  ): MatchResult<Exclude<T, MemberOf<T, K>>, R | R2>;
}

const enum MatchTag {
  NOT_FOUND = 'MatchNotFound',
  FOUND = 'MatchFound',
}

export function match<T>(obj: T): MatchResult<T, never> {
  let status: TaggedUnion<{ [MatchTag.NOT_FOUND]: {}; [MatchTag.FOUND]: { result: any } }> =
    taggedWith(MatchTag.NOT_FOUND)();
  const returnObject: MatchByTag<any, unknown> & MatchExhaustive<unknown> = {
    case: (tag, action) => when(isTaggedWith(tag), action),
    get: unsafeGet,
    otherwise: action => when(() => true, action),
    unsafeGet,
    when,
  };
  return returnObject as MatchResult<T, never>;

  function unsafeGet() {
    switch (status[_tag]) {
      case MatchTag.FOUND:
        return status.result;
      case MatchTag.NOT_FOUND:
        throw new Error('Match was not exhaustive.');
    }
  }

  function when(pred: Function, action: Function) {
    switch (status[_tag]) {
      case MatchTag.FOUND:
        return returnObject;
      case MatchTag.NOT_FOUND: {
        if (pred(obj)) {
          status = taggedWith(MatchTag.FOUND)({ result: action(obj) });
        }
        return returnObject;
      }
    }
  }
}
