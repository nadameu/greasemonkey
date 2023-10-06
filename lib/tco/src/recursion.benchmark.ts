import { bench, describe } from 'vitest';
import { stepCount, trampolineCount, recursiveCount } from './recursion';
import { recursively } from './index';

const recursivelyCount = recursively<number, number>(function* (n) {
  if (n <= 0) return 0;
  return (yield n - 1) + 1;
});

describe('Which one is faster?', () => {
  const SIZE = 800_000;
  bench('trampoline', () => {
    trampolineCount(SIZE);
  });
  bench('step', () => {
    stepCount(SIZE);
  });
  bench('Recur', () => {
    recursiveCount(SIZE);
  });
  bench('recursively', () => {
    recursivelyCount(SIZE);
  });
});
