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
export function isTaggedObject(obj: unknown): obj is TaggedWith {
  return typeof obj === "object" && obj !== null && _tag in obj;
}
export function isTaggedWith<T extends string>(tag: T) {
  return function isTagged<O extends TaggedWith>(obj: O): obj is TaggedWith<T> {
    return obj[_tag] === tag;
  };
}

type MatchResult<T, R> = [T] extends [never]
  ? MatchExhaustive<R>
  : T extends TaggedWith
  ? MatchByTag<T, R>
  : Match<T, R>;

export interface MatchExhaustive<R = never> {
  get(): R;
}
export interface Match<T, R = never> {
  when<U, R2>(
    pred: (_: T) => _ is U,
    action: (_: U) => R2
  ): MatchResult<Exclude<T, U>, R | R2>;
  when<R2>(
    pred: (_: T) => boolean,
    action: (_: T) => R2
  ): MatchResult<T, R | R2>;
  unsafeGet(): R;
}
export interface MatchByTag<T extends TaggedWith, R = never>
  extends Match<T, R> {
  case<K extends string, R2>(
    tag: K,
    action: (_: MemberOf<T, K>) => R2
  ): MatchResult<Exclude<T, MemberOf<T, K>>, R | R2>;
}

const neverSym = Symbol();

export function match<T>(obj: T): MatchResult<T, never> {
  let result: TaggedUnion<{ Pending: { obj: any }; Done: { result: any } }> =
    taggedWith("Pending")({ obj });
  const returnObject: MatchByTag<any, any> & MatchExhaustive<any> = {
    case(tag, action) {
      return when(isTaggedWith(tag), action);
    },
    get: unsafeGet,
    when,
    unsafeGet,
  };
  return returnObject;

  function unsafeGet() {
    switch (result[_tag]) {
      case "Done":
        return result.result;
      case "Pending": {
        throw new Error("Match was not exhaustive.");
      }
      default: {
        const _exhaustive: never = result;
        return _exhaustive;
      }
    }
  }

  function when(pred, action) {
    switch (result[_tag]) {
      case "Done":
        return returnObject;
      case "Pending": {
        const obj = result.obj;
        if (pred(obj)) {
          result = taggedWith("Done")({ result: action(obj) });
        }
        return returnObject;
      }
      default: {
        const _exhaustive: never = result;
        return _exhaustive;
      }
    }
  }
}
