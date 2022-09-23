type ValidTagName = string | number | symbol;
type ValidTag = string | number | symbol;
type CreatorFn<
  Tag extends ValidTagName,
  Args extends any[] = any[],
  R extends Record<keyof any, unknown> = Record<keyof any, unknown>
> = (...args: Args) => ValidResult<Tag, R>;
type Definitions<Tag extends ValidTagName, D extends Record<keyof D, unknown>> = {
  [K in keyof D]: K extends 'match' ? never : CreatorFn<Tag> | null;
};
type ValidResult<
  Tag extends ValidTagName,
  R extends Record<keyof any, unknown> = Record<keyof any, unknown>
> = R & { [T in Tag]?: never };
type Tagged<TagName extends ValidTagName, Tag extends ValidTag, Value> = Value & {
  [K in TagName]: Tag;
};
type Constructors<TagName extends ValidTagName, D extends Definitions<TagName, D>> = {
  result: {
    [Tag in Extract<keyof D, ValidTag> as Exclude<Tag, 'match'>]: D[Tag] extends CreatorFn<
      TagName,
      infer A,
      infer R
    >
      ? (...args: A) => Tagged<TagName, Tag, R>
      : D[Tag] extends null
      ? Tagged<TagName, Tag, {}>
      : never;
  } & MatchBy<TagName>;
}['result'];
type Tagged__<TagName extends ValidTagName> = Tagged_<TagName, ValidTag>;
type Tagged_<TagName extends ValidTagName, Tag extends ValidTag> = Tagged<TagName, Tag, {}>;
type Matchers<
  TagName extends ValidTagName,
  T extends Tagged__<TagName>,
  Tags extends T[TagName],
  U
> = {
  [Tag in Tags]: (tagged: Extract<T, Tagged_<TagName, Tag>>) => U;
};
type Matchers_<
  TagName extends ValidTagName,
  T extends Tagged__<TagName>,
  Tags extends T[TagName]
> = Matchers<TagName, T, Tags, unknown>;
type Matchers__<TagName extends ValidTagName, T extends Tagged__<TagName>> = Matchers_<
  TagName,
  T,
  T[TagName]
>;
interface MatchBy<TagName extends ValidTagName> {
  match<T extends Tagged__<TagName>, M extends Matchers__<TagName, T>>(
    tagged: T,
    matchers: M
  ): M extends Matchers<TagName, T, T[TagName], infer U> ? U : never;
  match<T extends Tagged__<TagName>, P extends T[TagName], U>(
    tagged: T,
    matchers: { [K in P]: (tagged: Extract<T, Tagged_<TagName, K>>) => U },
    otherwise: (tagged: Exclude<T, Tagged_<TagName, P>>) => U
  ): U;
}

export function createTaggedUnion<D extends Definitions<Tag, D>, Tag extends ValidTagName = 'tag'>(
  definitions: D,
  tagName: Tag = 'tag' as Tag
): Constructors<Tag, D> {
  const ctors: Record<keyof D, object | Function> = {} as any;
  for (const tag of (Object.getOwnPropertyNames(definitions) as Array<keyof D>).concat(
    Object.getOwnPropertySymbols(definitions) as Array<keyof D>
  )) {
    if (tag === 'match') throw new Error('Invalid tag: "match".');
    const f = definitions[tag];
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
  (ctors as Constructors<Tag, D>).match = matchBy(tagName);
  return ctors as any;
}

export function matchBy<T extends ValidTagName>(tagName: T): MatchBy<T>['match'] {
  return (obj: any, matchers: any, otherwise?: Function) => {
    const tag = obj[tagName];
    if (tag === undefined)
      throw new Error(`Object does not have a valid "${String(tagName)}" property.`);
    const fn = matchers[tag] ?? otherwise ?? matchNotFound;
    return fn(obj);
  };
  function matchNotFound(obj: any) {
    throw new Error(`Not matched: "${obj[tagName]}".`);
  }
}

export type Static<C extends Record<keyof C, unknown>> = {
  result: {
    [K in keyof C]: K extends 'match' ? never : C[K] extends (...args: any[]) => infer R ? R : C[K];
  }[keyof C];
}['result'];
