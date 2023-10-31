import { bench, describe } from 'vitest';
import { List, generate } from '../examples/List';
import { auto } from '../src/auto';

const SIZE = 1 << 17;
const list = generate(SIZE);

const makeSum =
  (maxRecursion: number) =>
  (list: List<number>): number => {
    const rec = auto((xs: List<number>, acc: number): number => {
      if (xs.empty) return acc;
      else return rec(xs.rest, acc + xs.first);
    }, maxRecursion);
    return rec(list, 0);
  };

describe(`Sum over a list with ${SIZE} numbers`, () => {
  for (const maxRecursion of Array.from({ length: 15 }, (_, i) => 1 << i)) {
    const sum = makeSum(maxRecursion);
    bench(`Max recursion: ${maxRecursion}`, () => void sum(list), { time: 1500 });
  }
});
