export async function sequence<T>(xs: AsyncIterable<T>): Promise<T[]> {
  return traverse(xs, x => x);
}

export async function traverse<T, U>(
  xs: AsyncIterable<T>,
  f: (x: T, i: number) => U
): Promise<U[]> {
  const result: U[] = [];
  let i = -1;
  for await (const x of xs) result.push(f(x, ++i));
  return result;
}
