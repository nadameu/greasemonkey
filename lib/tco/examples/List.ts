export type List<a> = NEList<a> | Empty;
interface NEList<a> {
  empty: false;
  first: a;
  rest: List<a>;
}
interface Empty {
  empty: true;
}
export const empty: List<never> = { empty: true };
export const prepend = <a>(first: a, rest: List<a>): NEList<a> => ({ empty: false, first, rest });
export const generate = (size: number): List<number> => {
  if (size <= 0) return empty;
  const first: NEList<number> = prepend(0, empty);
  let curr = first;
  for (let i = 1; i < size; i += 1) {
    curr = curr.rest = prepend(i, empty);
  }
  return first;
};
