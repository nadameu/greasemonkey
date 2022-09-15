type Ctor<Data extends any[] = any[], Out = unknown> = (...args: Data) => Out;

interface Definitions {
  [key: string]: Ctor | null;
}

type Result<D extends Definitions> = {
  [K in keyof D]: D[K] extends Ctor<any[], infer Data> ? Data : never;
} extends infer Mid extends Record<keyof D, unknown>
  ? {
      [V in keyof D]: D[V] extends null
        ? EmptyMemberValue<V, Mid>
        : D[V] extends Ctor<infer Args>
        ? (...args: Args) => MemberValue<V, Mid>
        : never;
    }
  : never;
interface EmptyMemberValue<V extends keyof D, D extends Record<keyof D, unknown>> {
  variant: V;
  match<Out>(matchers: MatchersWithUnderscore<D, Out>): Out;
  match<Out>(matchers: Matchers<D, Out>): Out;
}
interface MemberValue<V extends keyof D, D extends Record<keyof D, unknown>>
  extends EmptyMemberValue<V, D> {
  data: D[V];
}

type Matchers<D extends Record<keyof D, unknown>, Out> = D extends never
  ? never
  : {
      [V in keyof D]: [D[V]] extends [never] ? () => Out : (data: D[V]) => Out;
    };

type MatchersWithUnderscore<D extends Record<keyof D, unknown>, Out> = D extends never
  ? never
  : Simplify<Partial<Matchers<D, Out>> & { _: () => Out }>;

type Simplify<T> = T extends never ? never : { [K in keyof T]: T[K] };
export type Static<
  D extends Record<
    string,
    { variant: string } | ((...args: any[]) => { variant: string; data: unknown })
  >
> = {
  [V in keyof D]: D[V] extends (...args: any[]) => infer R ? R : D[V];
}[keyof D];

export function createTaggedUnion<D extends Definitions>(definitions: D): Result<D> {
  const result: any = {};
  for (const [variant, f] of Object.entries(definitions)) {
    if (f === null) {
      result[variant] = {
        variant,
        match(this: any, matchers: Record<string, Function>) {
          if (this.variant in matchers) return matchers[this.variant]!();
          if ('_' in matchers) return matchers._!();
          throw new Error(`Variant not matched: ${(this as { variant: string }).variant}`);
        },
      };
    } else {
      result[variant] = (...args: any[]) => ({
        variant,
        data: f(...args),
        match(this: any, matchers: Record<string, Function>) {
          if (this.variant in matchers) return matchers[this.variant]!(this.data);
          if ('_' in matchers) return matchers._!(this.data);
          throw new Error(`Variant not matched: ${(this as { variant: string }).variant}`);
        },
      });
    }
  }
  return result;
}
