import { bench, describe } from 'vitest';
import { generate } from '../examples/List';
import { Limitation, strategies } from '../examples/strategies';

describe.each([1 << 14, 1 << 16, 1 << 18, 1 << 20])('Sum over a list with %i numbers', SIZE => {
  const list = generate(SIZE);
  const selected = (() => {
    if (SIZE < 1 << 15) return strategies;
    else if (SIZE < 1 << 17) return strategies.filter(x => x.limitation > Limitation.Stack);
    else if (SIZE < 1 << 19) return strategies.filter(x => x.limitation > Limitation.Heap);
    else return strategies.filter(x => x.limitation > Limitation.Performance);
  })();
  for (const [name, sum] of selected.map(({ name, fns: { sum } }) => [name, sum] as const)) {
    bench(
      name,
      () => {
        sum(list);
      },
      { time: 750 }
    );
  }
});
