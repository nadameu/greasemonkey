type CreatorFn<
  Tag extends keyof any,
  Args extends any[] = any[],
  R extends Record<keyof any, unknown> = Record<keyof any, unknown>
> = (...args: Args) => Result<Tag, R>;
type Definitions<Tag extends keyof any, D> = {
  [K in keyof D]: K extends 'match' ? never : CreatorFn<Tag> | null;
};
type Result<
  Tag extends keyof any,
  R extends Record<keyof any, unknown> = Record<keyof any, unknown>
> = R & {
  [T in Tag]?: never;
};
type CVal<Name extends keyof any = keyof any> = [Name];
type CFn<
  Name extends keyof any = keyof any,
  Args extends any[] = any[],
  Data extends [keyof any, unknown] = [keyof any, unknown]
> = [Name, Args, Data];
type Def<
  Name extends keyof any = keyof any,
  Data extends [keyof any, unknown] = [keyof any, unknown]
> = CFn<Name, any[], Data>;
type Join<T> = (T extends never ? never : (_: T) => void) extends (_: infer U) => void
  ? Simplify<U>
  : never;
type Tagged<
  TagName extends keyof any,
  Tag extends keyof any,
  Extra extends [keyof any, unknown]
> = {
  [K in TagName]: Tag;
} & { [K in Extra[0]]: Extra extends [K, infer R] ? R : never };
type Simplify<T> = { result: { [K in keyof T]: T[K] } }['result'];
type Constructors<TagName extends keyof any, D extends CFn | CVal> = {
  [Tag in 'match' | D[0]]: Tag extends 'match'
    ? MatchBy<TagName>
    : D extends CFn<Tag, infer A, infer R>
    ? (...args: A) => Tagged<TagName, Tag, R>
    : D extends CVal<Tag>
    ? Tagged<TagName, Tag, never>
    : never;
};
type FromDef<TagName extends keyof any, D extends CFn | CVal> = D extends CFn<
  infer K,
  any[],
  infer R
>
  ? Tagged<TagName, K, R>
  : D extends CVal<infer K>
  ? Tagged<TagName, K, never>
  : never;
type MatchBy<TagName extends keyof any> = {
  match<T extends Tagged<TagName, keyof any, any>, P extends T[TagName], U>(
    tagged: T,
    matchers: { [K in P]: (tagged: Extract<T, Tagged<TagName, K, any>>) => U },
    ...otherwise: [Exclude<T, Tagged<TagName, P, any>>] extends [never]
      ? []
      : [otherwise: (tagged: Exclude<T, Tagged<TagName, P, any>>) => U]
  ): U;
}['match'];

export function createTaggedUnion<D extends Definitions<Tag, D>, Tag extends keyof any = 'tag'>(
  definitions: D,
  tagName: Tag = 'tag' as Tag
): Constructors<
  Tag,
  {
    [K in keyof D]: D[K] extends CreatorFn<Tag, infer A, infer R>
      ? CFn<K, A, { [K in keyof R]: [K, R[K]] }[keyof R]>
      : CVal<K>;
  }[keyof D]
> {
  const ctors: Partial<Record<keyof D, unknown>> = {};
  for (const [tag, f] of Object.entries(definitions) as [keyof D, CreatorFn | null][]) {
    if (f === null) {
      ctors[tag] = new Matching(tag);
    } else {
      ctors[tag] = (...args: any[]) => new MatchingWith(tag, f(...args));
    }
  }

  return ctors;
}

export const matchBy = <T extends keyof any>(tagName: T): MatchBy<T, any> => function () {};

export type Static<C extends Record<keyof C, unknown>> = {
  result: {
    [K in keyof C]: K extends 'match' ? never : C[K] extends (...args: any[]) => infer R ? R : C[K];
  }[keyof C];
}['result'];
