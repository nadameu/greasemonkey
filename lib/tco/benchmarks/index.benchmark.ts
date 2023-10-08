import { beforeAll, bench, describe } from 'vitest';
import * as recursion from '../examples/recursion';
import * as tailCall from '../examples/tail-call';
import * as iterative from '../examples/iterative';
import * as trampoline from '../examples/trampoline';
import * as auto from '../examples/auto';
import * as step from '../examples/step';
import * as cont from '../examples/cont';
import * as recursively from '../examples/recursively';
import * as promises from '../examples/promises';
import * as async_ from '../examples/async';
import { List, generate } from '../examples/List';

describe.each([
  ['Small # of iterations', 10_000],
  ['Large # of iterations', 800_000],
])('%s', (_, SIZE) => {
  const list = generate(SIZE);
  bench('iterative', () => {
    iterative.sum(list);
  });
  bench.skipIf(SIZE > 32768)('direct recursion', () => {
    recursion.sum(list);
  });
  bench.skipIf(SIZE > 32768)('tail-call', () => {
    tailCall.sum(list);
  });
  bench('step', () => {
    step.sum(list);
  });
  bench('trampoline', () => {
    trampoline.sum(list);
  });
  bench('auto-trampoline', () => {
    auto.sum(list);
  });
  bench('cont', () => {
    cont.sum(list);
  });
  bench.skipIf(SIZE > 32768)('promises', async () => {
    await promises.sum(list);
  });
  bench.skipIf(SIZE > 32768)('async', async () => {
    await async_.sum(list);
  });
  bench('recursively', () => {
    recursively.sum(list);
  });
});
