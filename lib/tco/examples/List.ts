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
export const prepend = <a>(first: a, rest: List<a>): NEList<a> => ({
  empty: false,
  first,
  rest,
});
export const generate = (size: number): List<number> => {
  if (size <= 0) return empty;
  let curr: List<number> = empty;
  for (let i = size - 1; i > -1; i -= 1) {
    curr = prepend(i, curr);
  }
  return curr;
};
