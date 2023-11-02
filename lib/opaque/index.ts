declare namespace Internal {
  const OpaqueSymbol: unique symbol;
  class Opaque<S> {
    private [OpaqueSymbol]: S;
  }
}
export type Opaque<T, S extends Record<keyof any, unknown>> = T &
  Internal.Opaque<S>;
