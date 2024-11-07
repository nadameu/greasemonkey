import { afterAll, assert, beforeAll, bench, describe } from 'vitest';
import { Trampoline, done, loop } from './definitions';
import { runTrampoline } from './functions';

const COUNT = 1e4;
let MAX_RECURSION = 64;

type Trampoline2<a> = { value: a } | (() => Trampoline2<a>);
const runTrampoline2 = <a>(trampoline: Trampoline2<a>): a => {
  let result = trampoline;
  while (typeof result === 'function') result = result();
  return result.value;
};
const regular = (n: number, depth: number): Trampoline2<number> => {
  if (depth > MAX_RECURSION) return () => regular(n, 0);
  if (n > 0) return regular(n - 1, depth + 1);
  return { value: n };
};

const tagged = (n: number, depth: number): Trampoline<number> => {
  if (depth > MAX_RECURSION) return loop(() => tagged(n, 0));
  if (n > 0) return tagged(n - 1, depth + 1);
  return done(n);
};

const tagged_no_direct_calls = (n: number): Trampoline<number> => {
  if (n > 0) return loop(() => tagged_no_direct_calls(n - 1));
  return done(n);
};

describe('method', () => {
  bench('regular', () => {
    assert.equal(runTrampoline2(regular(COUNT, 0)), 0);
  });

  bench('tagged', () => {
    assert.equal(runTrampoline(tagged(COUNT, 0)), 0);
  });

  bench('tagged, no direct calls', () => {
    assert.equal(runTrampoline(tagged_no_direct_calls(COUNT)), 0);
  });
});

describe('Recursion', () => {
  let oldMax = MAX_RECURSION;
  beforeAll(() => {
    oldMax = MAX_RECURSION;
  });
  afterAll(() => {
    MAX_RECURSION = oldMax;
  });

  for (let i = 4; i <= 8; i++) {
    MAX_RECURSION = 2 << (i - 1);
    bench(`${MAX_RECURSION}`, () => {
      assert.equal(runTrampoline(tagged(COUNT, 0)), 0);
    });
  }
});
