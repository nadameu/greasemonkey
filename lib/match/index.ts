type CreatorFn<Args extends any[] = any[], Result = unknown> = (...args: Args) => Result;
type Definitions<D> = { [K in keyof D]: CreatorFn | null };

function matchNotFound(variant: Tagged<keyof any>) {
  throw new Error(`Not matched: "${String(variant.tag)}".`);
}

interface Tagged<Tag extends keyof any> {
  tag: Tag;
}
interface TaggedWith<Tag extends keyof any, Data> extends Tagged<Tag> {
  data: Data;
}
class _TaggedWith<Tag extends keyof any, Data> implements TaggedWith<Tag, Data> {
  constructor(public tag: Tag, public data: Data) {}
  match(matchers: {}, otherwise?: Function) {
    return match(this, matchers, otherwise as never);
  }
}
type AnyTagged = Tagged<keyof any> | TaggedWith<keyof any, unknown>;
type PartialMatchers<T extends AnyTagged, P extends T['tag'], U> = {
  [K in P]: T extends TaggedWith<K, infer Data>
    ? (data: Data) => U
    : T extends Tagged<K>
    ? () => U
    : never;
};
type Matchers<T extends AnyTagged> = {
  [K in T['tag']]: T extends TaggedWith<K, infer Data>
    ? (data: Data) => unknown
    : T extends Tagged<K>
    ? () => unknown
    : never;
};

export function match<T extends AnyTagged, M extends Matchers<T>>(
  obj: T,
  matchers: M
): M[keyof M] extends (...args: any[]) => infer U ? U : never;
export function match<T extends AnyTagged, P extends T['tag'], U>(
  obj: T,
  matchers: PartialMatchers<T, P, U>,
  otherwise: (tagged: Extract<T, { tag: Exclude<T['tag'], P> }>) => U
): U;
export function match(
  obj: TaggedWith<keyof any, unknown>,
  matchers: Record<keyof any, Function>,
  otherwise: Function = matchNotFound
) {
  if (!obj.tag) throw new Error('Object does not have a valid "tag" property.');
  return obj.tag in matchers ? matchers[obj.tag]!(obj.data) : otherwise(obj);
}

export function createTaggedUnion<D extends Definitions<D>>(definitions: D) {
  type Tagged<Tag extends keyof any> = {
    tag: Tag;
    match<U>(matchers: Matchers<U>): U;
    match<P extends keyof D, U>(
      matchers: PartialMatchers<P, U>,
      otherwise: (_: Remaining<Exclude<keyof D, P>>) => U
    ): U;
  };
  type TaggedWith<Tag extends keyof any, Data> = Tagged<Tag> & {
    data: Data;
  };
  type MembersDict = {
    [K in keyof D]: D[K] extends CreatorFn<any[], infer R> ? TaggedWith<K, R> : Tagged<K>;
  };
  type GetConstructors = {
    result: {
      [K in keyof D]: D[K] extends CreatorFn<infer A>
        ? (...args: A) => MembersDict[K]
        : MembersDict[K];
    };
  };

  type PartialMatchers<P extends keyof D, U> = {
    [K in P]: MembersDict[K] extends TaggedWith<K, infer Data> ? (data: Data) => U : () => U;
  };
  type Matchers<U> = PartialMatchers<keyof D, U>;

  type Remaining<P extends keyof D> = MembersDict[P];

  const ctors: Partial<Record<keyof D, unknown>> = {};
  for (const [tag, f] of Object.entries(definitions) as [keyof D, CreatorFn | null][]) {
    if (f === null) {
      ctors[tag] = new _TaggedWith(tag, undefined as never);
    } else {
      ctors[tag] = (...args: any[]) => new _TaggedWith(tag, f(...args));
    }
  }

  return ctors as GetConstructors['result'];
}

export type Static<C extends Record<keyof C, unknown>> = {
  [K in keyof C]: C[K] extends CreatorFn<any[], infer R> ? R : C[K];
}[keyof C];
