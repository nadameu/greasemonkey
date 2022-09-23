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
type Tagged__<TagName extends keyof any> = Tagged_<TagName, keyof any>;
type Tagged_<TagName extends keyof any, Tag extends keyof any> = Tagged<TagName, Tag, never>;
type Matchers<
  TagName extends keyof any,
  T extends Tagged__<TagName>,
  Tags extends T[TagName],
  U
> = {
  [Tag in Tags]: (tagged: Extract<T, Tagged_<TagName, Tag>>) => U;
};
type Matchers_<
  TagName extends keyof any,
  T extends Tagged__<TagName>,
  Tags extends T[TagName]
> = Matchers<TagName, T, Tags, unknown>;
type Matchers__<TagName extends keyof any, T extends Tagged__<TagName>> = Matchers_<
  TagName,
  T,
  T[TagName]
>;
type Matchers___<TagName extends keyof any> = Matchers__<TagName, Tagged__<TagName>>;
type MatchBy<TagName extends keyof any> = {
  match<T extends Tagged__<TagName>, M extends Matchers__<TagName, T>>(
    tagged: T,
    matchers: M
  ): M extends Matchers<TagName, T, T[TagName], infer U> ? U : never;
  match<T extends Tagged__<TagName>, P extends T[TagName], U>(
    tagged: T,
    matchers: { [K in P]: (tagged: Extract<T, Tagged_<TagName, K>>) => U },
    otherwise: (tagged: Exclude<T, Tagged_<TagName, P>>) => U
  ): U;
}['match'];

type GetResult<All extends keyof any, P extends All, U> = [
  Exclude<All, P>
] extends infer Remaining extends [any]
  ? Remaining extends [never]
    ? U
    : { error: Remaining[0] }
  : never;

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
  const ctors: Partial<Record<keyof D, object | Function>> = {};
  for (const [tag, f] of Object.entries(definitions) as [keyof D, CreatorFn<Tag> | null][]) {
    if (f === null) {
      ctors[tag] = { [tagName]: tag };
    } else {
      ctors[tag] = (...args: any[]) => {
        const obj: any = f(...args);
        obj[tagName] = tag;
        return obj;
      };
    }
  }
  (ctors as any).match = matchBy(tagName);
  return ctors as any;
}

export function matchBy<T extends keyof any>(tagName: T): MatchBy<T> {
  return (obj: any, matchers: any, otherwise?: Function) => {
    const tag = obj[tagName];
    if (!tag) throw new Error(`Object does not have a valid "${String(tagName)}" property.`);
    const fn = matchers[tag] ?? otherwise ?? matchNotFound;
    return fn(obj);
  };
  function matchNotFound(obj: any) {
    throw new Error(`Not matched: "${obj[tagName]}".`);
  }
}

export type Static<C extends Record<keyof C, unknown>> = {
  result: {
    [K in keyof C]: K extends 'match'
      ? never
      : Simplify<C[K] extends (...args: any[]) => infer R ? R : C[K]>;
  }[keyof C];
}['result'];
