declare namespace Internal {
  const OpaqueSymbol: unique symbol;
  class Opaque<S> {
    private [OpaqueSymbol]: S;
  }
}
/**
 * @example
 * type Integer = Opaque<number, { Integer: Integer }>;
 */
export type Opaque<T, S extends Record<keyof any, unknown>> = T &
  Internal.Opaque<S>;
