export const tuple: {
  <a>(a: a): a extends infer fst ? [fst] : [a];
  <a, b>(
    a: a,
    b: b
  ): a extends infer fst
    ? b extends infer snd
      ? [fst, snd]
      : [fst, b]
    : b extends infer snd
      ? [a, snd]
      : [a, b];
  <T extends unknown[]>(...values: T): T;
} = <T extends unknown[]>(...values: T): T => values;
export const fst = <a, b>(tuple: [a, b]): a => tuple[0];
export const snd = <a, b>(tuple: [a, b]): b => tuple[1];
