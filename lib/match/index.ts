const _tag: unique symbol = '@nadameu/match/tag' as any;
type ValidTagName = string | number | symbol;
type ValidTag = string | number | symbol;

type Tag<TN extends ValidTagName, T extends ValidTag> = { [K in TN]: T };

type ObjectWithoutKey<TN extends ValidTagName> = object & {
  [K in TN]?: never;
};
export type ExtraProperties<T extends Tagged<ValidTag, object>> = {
  [K in Exclude<keyof T, typeof _tag>]: T[K];
};

export type TaggedWith<
  TN extends ValidTagName,
  T extends ValidTag,
  O extends ObjectWithoutKey<TN>,
> = Tag<TN, T> & O;
export type Tagged<T extends ValidTag, O> = Tag<typeof _tag, T> & O;

export type TaggedWithUnion<
  TN extends ValidTagName,
  D extends Record<ValidTag, ObjectWithoutKey<TN>>,
> = {
  [K in keyof D]: TaggedWith<TN, K, D[K]>;
}[keyof D];
export type TaggedUnion<D extends Record<ValidTag, object>> = {
  [K in keyof D]: Tagged<K, D[K]>;
}[keyof D];
export const makeConstructorsWith = <
  TN extends ValidTagName,
  C extends Record<ValidTag, (...args: never[]) => ObjectWithoutKey<TN>>,
>(
  tagName: TN,
  constructors: C
): {
  [K in keyof C]: C[K] extends ((
    ...args: infer A
  ) => infer R extends ObjectWithoutKey<TN>)
    ? (...args: A) => TaggedWith<TN, K, R>
    : never;
} =>
  Object.fromEntries(
    Object.entries(constructors).map(
      ([k, v]) =>
        [k, (...args: never[]) => tagWith(tagName)(k)(v(...args))] as const
    )
  ) as any;
export const makeConstructors = <
  C extends Record<
    ValidTag,
    (...args: never[]) => ObjectWithoutKey<typeof _tag>
  >,
>(
  constructors: C
): {
  [K in keyof C]: C[K] extends ((
    ...args: infer A
  ) => infer R extends ObjectWithoutKey<typeof _tag>)
    ? (...args: A) => Tagged<K, R>
    : never;
} => makeConstructorsWith(_tag, constructors);

export type FromConstructorsWith<
  TN extends ValidTagName,
  C extends {
    [T in ValidTag]: (...args: never[]) => Tag<TN, T>;
  },
> = C extends never ? never : ReturnType<C[keyof C]>;
export type FromConstructors<
  C extends {
    [T in ValidTag]: (...args: never[]) => Tag<typeof _tag, T>;
  },
> = C extends never ? never : ReturnType<C[keyof C]>;

export type MemberWith<
  U,
  TN extends keyof U,
  T extends U[TN] = U[TN],
> = U extends { [k in TN]: T } ? U : never;
export type MemberOf<
  U extends Tag<typeof _tag, ValidTag>,
  T extends U[typeof _tag] = U[typeof _tag],
> = MemberWith<U, typeof _tag, T>;
export type MemberTag<U extends Tag<typeof _tag, ValidTag>> = U[typeof _tag];

export const tagWith =
  <TN extends ValidTagName>(tagName: TN) =>
  <T extends ValidTag>(tag: T) =>
  <O extends ObjectWithoutKey<TN>>(
    obj: O = {} as any
  ): TaggedWith<TN, T, O> => {
    (obj as any)[tagName] = tag;
    return obj as any;
  };
export const tag = tagWith(_tag);

export const isTaggedWith =
  <TN extends ValidTagName>(tagName: TN) =>
  <T extends ValidTag>(tag: T) =>
  <O>(obj: O): obj is Extract<O, Tag<TN, T>> =>
    typeof obj === 'object' &&
    obj !== null &&
    tagName in obj &&
    obj[tagName as keyof O & object] === tag;
export const isTagged = isTaggedWith(_tag);

type MatchWithResult<TN extends ValidTagName, T, R> = [T] extends [never]
  ? MatchExhaustive<R>
  : [T] extends [Tag<TN, ValidTag>]
    ? MatchTaggedWith<TN, T, R>
    : MatchWithPending<TN, T, R>;

type MatchResult<T, R> = [T] extends [never]
  ? MatchExhaustive<R>
  : [T] extends [Tag<typeof _tag, ValidTag>]
    ? MatchTagged<T, R>
    : MatchPending<T, R>;

interface MatchExhaustive<R> {
  get(): R;
}
interface MatchWithPending<TN extends ValidTagName, T, R> {
  otherwise<R2>(action: (obj: T) => R2): MatchWithResult<TN, never, R | R2>;
  unsafeGet(): R;
  when<U extends T, R2>(
    predicate: (obj: T) => obj is U,
    action: (obj: U) => R2
  ): MatchWithResult<TN, Exclude<T, U>, R | R2>;
  when<R2>(
    predicate: (obj: T) => boolean,
    action: (obj: T) => R2
  ): MatchWithResult<TN, T, R | R2>;
}
interface MatchPending<T, R> {
  otherwise<R2>(action: (obj: T) => R2): MatchResult<never, R | R2>;
  unsafeGet(): R;
  when<U extends T, R2>(
    predicate: (obj: T) => obj is U,
    action: (obj: U) => R2
  ): MatchResult<Exclude<T, U>, R | R2>;
  when<R2>(
    predicate: (obj: T) => boolean,
    action: (obj: T) => R2
  ): MatchResult<T, R | R2>;
}
interface MatchTaggedWith<
  TN extends ValidTagName,
  T extends Tag<TN, ValidTag>,
  R,
> extends MatchWithPending<TN, T, R> {
  case<K extends T[TN], R2>(
    tag: K,
    action: (obj: Extract<T, Tag<TN, K>>) => R2
  ): MatchWithResult<TN, Exclude<T, Tag<TN, K>>, R | R2>;
}
interface MatchTagged<T extends Tag<typeof _tag, ValidTag>, R>
  extends MatchPending<T, R> {
  case<K extends T[typeof _tag], R2>(
    tag: K,
    action: (obj: Extract<T, Tag<typeof _tag, K>>) => R2
  ): MatchResult<Exclude<T, Tag<typeof _tag, K>>, R | R2>;
}
const Matching = { NOT_FOUND: 'NOT_FOUND', FOUND: 'FOUND' } as const;
export const matchWith =
  <TN extends ValidTagName>(tagName: TN) =>
  <T>(obj: T): MatchWithResult<TN, T, never> => {
    let status: TaggedWithUnion<
      'tag',
      { [Matching.NOT_FOUND]: {}; [Matching.FOUND]: { result: unknown } }
    > = tagWith('tag')(Matching.NOT_FOUND)();
    const isTagged = isTaggedWith(tagName);
    const ret = {
      case(tag: keyof any, action: Function) {
        return ret.when(isTagged(tag), action);
      },
      get() {
        if (status.tag === Matching.FOUND) return status.result;
        else throw new Error('Match not exhaustive.');
      },
      otherwise(action: Function) {
        return ret.when(() => true, action);
      },
      unsafeGet() {
        return ret.get();
      },
      when(predicate: Function, action: Function) {
        if (status.tag === Matching.NOT_FOUND && predicate(obj)) {
          status = tagWith('tag')(Matching.FOUND)({ result: action(obj) });
        }
        return ret;
      },
    };
    return ret as any;
  };
export const match = <T>(obj: T): MatchResult<T, never> => matchWith(_tag)(obj);
