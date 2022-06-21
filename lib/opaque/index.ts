namespace Internal {
  declare const OpaqueSymbol: unique symbol;
  declare class Opaque<S extends Record<string, symbol>> {
    private [OpaqueSymbol]: S;
  }
  export type OpaqueType<T, S extends Record<string, symbol>> = T & Opaque<S>;
}
export type Opaque<T, S extends { readonly [key: string]: symbol }> = Internal.OpaqueType<T, S>;
