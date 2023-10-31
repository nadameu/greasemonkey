import { List, isCons } from './definitions';

export const foldLeft =
  <a, b>(seed: b, f: (b: b, a: a, i: number) => b) =>
  (fa: List<a>): b => {
    let acc = seed;
    let i = 0;
    for (let curr = fa; isCons(curr); curr = curr.tail) acc = f(acc, curr.head, i++);
    return acc;
  };
