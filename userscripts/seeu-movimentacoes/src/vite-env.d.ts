/// <reference types="vite/client" />
/// <reference types="vite-plugin-monkey/client" />
//// <reference types="vite-plugin-monkey/global" />
interface ObjectConstructor {
  entries<T>(object: T): [keyof T, T[keyof T]][];
}
