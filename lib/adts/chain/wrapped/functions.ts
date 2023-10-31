import { Wrapped, isWArr } from './definitions';

export const foldLeft =
  <a, b>(seed: b, f: (acc: b, a: a, i: number) => b) =>
  (fa: Wrapped<a>): b => {
    let acc = seed;
    if (isWArr(fa)) {
      const len = fa.values.length;
      for (let i = 0; i < len; i += 1) acc = f(acc, fa.values[i]!, i);
    } else {
      let i = 0;
      for (const a of fa.values) acc = f(acc, a, i++);
    }
    return acc;
  };
