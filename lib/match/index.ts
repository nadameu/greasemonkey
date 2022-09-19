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
class Matching<Tag extends keyof any> implements Tagged<Tag> {
  constructor(public tag: Tag) {}
  match<U>(matchers: { [K in Tag]: () => U }): U;
  match(matchers: Matchers<this>) {
    return _match(this as AnyTagged as TaggedWith<Tag, unknown>, matchers);
  }

  matchOr<U>(matchers: {}, otherwise: (tagged: Matching<Tag>) => U): U {
    return _match(this as AnyTagged as TaggedWith<Tag, unknown>, matchers, otherwise);
  }
}

class MatchingWith<Tag extends keyof any, Data>
  extends Matching<Tag>
  implements TaggedWith<Tag, Data>
{
  constructor(tag: Tag, public data: Data) {
    super(tag);
  }
  match<U>(matchers: { [K in Tag]: (data: Data) => U }): U;
  match(matchers: Matchers<this>) {
    return _match(this, matchers);
  }

  matchOr<U>(matchers: {}, otherwise: (tagged: MatchingWith<Tag, Data>) => U): U {
    return _match(this, matchers, otherwise);
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

function _match(
  obj: TaggedWith<keyof any, unknown>,
  matchers: Record<keyof any, Function>,
  otherwise: Function = matchNotFound
) {
  if (!obj.tag) throw new Error('Object does not have a valid "tag" property.');
  return obj.tag in matchers ? matchers[obj.tag]!(obj.data) : otherwise(obj);
}

export function match<T extends AnyTagged, M extends Matchers<T>>(
  obj: T,
  matchers: M
): M[keyof M] extends (...args: any[]) => infer U ? U : never {
  return _match(obj as TaggedWith<keyof any, unknown>, matchers);
}

export function matchOr<T extends AnyTagged, P extends T['tag'], U>(
  obj: T,
  matchers: PartialMatchers<T, P, U>,
  otherwise: (tagged: Extract<T, { tag: Exclude<T['tag'], P> }>) => U
): U {
  return _match(obj as TaggedWith<keyof any, unknown>, matchers, otherwise);
}

export function createTaggedUnion<D extends Definitions<D>>(definitions: D) {
  const ctors: Partial<Record<keyof D, unknown>> = {};
  for (const [tag, f] of Object.entries(definitions) as [keyof D, CreatorFn | null][]) {
    if (f === null) {
      ctors[tag] = new Matching(tag);
    } else {
      ctors[tag] = (...args: any[]) => new MatchingWith(tag, f(...args));
    }
  }

  return ctors as {
    [K in keyof D]: D[K] extends CreatorFn<infer A, infer D>
      ? (...args: A) => MatchingWith<K, D>
      : Matching<K>;
  };
}

export type Static<C extends Record<keyof C, unknown>> = {
  [K in keyof C]: C[K] extends CreatorFn<any[], infer R> ? R : C[K];
}[keyof C];
