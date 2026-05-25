export function map_nullish<T, U>(value: T | null, f: (_: T) => U): U | null;
export function map_nullish<T, U>(
  value: T | undefined,
  f: (_: T) => U
): U | undefined;
export function map_nullish<T, U>(
  value: T | null | undefined,
  f: (_: T) => U
): U | null | undefined;
export function map_nullish<T, U>(
  value: T | null | undefined,
  f: (_: T) => U
): U | null | undefined {
  return value != null ? f(value) : (value as null | undefined);
}
