export function throwError(message?: string, options?: ErrorOptions): never {
  throw Error(message, options);
}
