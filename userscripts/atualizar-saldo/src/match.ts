type CreatorFn<Args extends any[] = any[], Result = unknown> = (...args: Args) => Result;
type Definitions<D> = { [K in keyof D]: CreatorFn | null };

function matchNotFound(_data?: unknown) {
  throw new Error('Match not found.');
}

class Variant {
  constructor(readonly tag: keyof any) {}
  match(matchers: Record<keyof any, Function>, otherwise: Function = matchNotFound) {
    return this.tag in matchers ? matchers[this.tag]!() : otherwise();
  }
}

class VariantWith<Data> extends Variant {
  constructor(tag: keyof any, readonly data: Data) {
    super(tag);
  }
  match(matchers: Record<keyof any, Function>, otherwise: Function = matchNotFound) {
    return this.tag in matchers ? matchers[this.tag]!(this.data) : otherwise(this.data);
  }
}

interface Tagged<Tag extends keyof any> {
  tag: Tag;
}
interface TaggedWith<Tag extends keyof any, Data> extends Tagged<Tag> {
  data: Data;
}
type AnyTagged = Tagged<keyof any> | TaggedWith<keyof any, unknown>;
type PartialMatchers<T extends AnyTagged, P extends T['tag'], U> = {
  [K in P]: T extends TaggedWith<K, infer Data>
    ? (data: Data) => U
    : T extends Tagged<K>
    ? () => U
    : never;
};
type Matchers<T extends AnyTagged, U> = {
  [K in T['tag']]: T extends TaggedWith<K, infer Data>
    ? (data: Data) => U
    : T extends Tagged<K>
    ? () => U
    : never;
};

export function match<T extends AnyTagged, U>(obj: T, matchers: Matchers<T, U>): U;
export function match<T extends AnyTagged, P extends T['tag'], U>(
  obj: T,
  matchers: PartialMatchers<T, P, U>,
  otherwise: () => U
): U;
export function match() {}

const result0 = match(null as any as MyType, {
  Pending: () => 42,
  Rejected: ({ error }) => 3,
  Resolved: x => x,
});
const result1 = match(null as any as MyType, { Resolved: x => x, Pending: () => 8 }, () => 3);

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
  // type TaggedWith<K extends keyof D, R = unknown> = { [T in TagName]: K } & R extends infer Dict
  //   ? { [K in keyof Dict]: Dict[K] }
  //   : never;
  type MembersDict = {
    [K in keyof D]: D[K] extends CreatorFn<any[], infer R> ? TaggedWith<K, R> : Tagged<K>;
  };
  // type Tagged = MembersDict[keyof D];
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

  // type GetMatch = {
  //   result: {
  //     <P extends keyof D, U>(
  //       obj: Tagged,
  //       matchers: PartialMatchers<P, U>,
  //       otherwise: (_: Remaining<Exclude<keyof D, P>>) => U
  //     ): U;
  //     <U>(obj: Tagged, matchers: Matchers<U>): U;
  //   };
  // };

  const constructors: Partial<Record<keyof D, unknown>> = {};
  for (const [tag, ctor] of Object.entries(definitions) as [keyof D, CreatorFn | null][]) {
    constructors[tag] =
      ctor === null ? new Variant(tag) : (...args: any[]) => new VariantWith(tag, ctor(...args));
  }

  return constructors as GetConstructors['result'];
}

export type Static<C extends Record<keyof C, unknown>> = {
  [K in keyof C]: C[K] extends CreatorFn<any[], infer R> ? R : C[K];
}[keyof C];

const MyType = createTaggedUnion({
  Pending: null,
  Resolved: (value: number) => value,
  Rejected: (msg?: string, cause?: Error) => ({ error: new Error(msg, { cause }) }),
});

const pending = MyType.Pending;
const resolved = MyType.Resolved(42);
const rejected = MyType.Rejected('a');

type MyType = Static<typeof MyType>;

const result = (rejected as MyType).match({
  Pending: () => 42,
  Rejected: () => 3,
  Resolved: () => 17,
});
const result2 = (pending as MyType).match({ Resolved: x => x }, x => x.tag.length);

function manualMatch(obj: MyType): number {
  switch (obj.tag) {
    case 'Pending':
      obj;
      return 0;

    case 'Rejected':
      obj;
      return 1;

    case 'Resolved':
      obj;
      return 2;

    default:
      return obj;
  }
}

type A<T> = { real: (T extends 2 | 4 ? never : { value: T })['value'] };
type B = A<1 | 2 | 3 | 4 | 5>;
