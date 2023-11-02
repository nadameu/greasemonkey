export const Ordering = {
  LT: -1,
  EQ: 0,
  GT: +1,
} as const;
export type Ordering = typeof Ordering;

export function compareBy<T, U>(
  f: (_: T) => U,
  order: 'ASC' | 'DESC' = 'ASC'
): (a: T, b: T) => Ordering[keyof Ordering] {
  if (order === 'ASC')
    return (a, b) =>
      f(a) < f(b) ? Ordering.LT : f(a) > f(b) ? Ordering.GT : Ordering.EQ;
  return (a, b) =>
    f(a) < f(b) ? Ordering.GT : f(a) > f(b) ? Ordering.LT : Ordering.EQ;
}
