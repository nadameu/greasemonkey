import { bench, describe } from 'vitest';
import { generate } from '../examples/List';
import * as auto from '../examples/auto';
import * as cont from '../examples/cont';
import * as iterative from '../examples/iterative';
import * as recursively from '../examples/recursively';
import * as step from '../examples/step';
import * as trampoline from '../examples/trampoline';

describe.each([800e3])('Sum over a list with %i numbers', SIZE => {
  const list = generate(SIZE);
  bench('iterative', () => {
    iterative.sum(list);
  });
  bench('step', () => {
    step.sum(list);
  });
  bench('auto-trampoline', () => {
    auto.sum(list);
  });
  bench('trampoline', () => {
    trampoline.sum(list);
  });
  bench('cont', () => {
    cont.sum(list);
  });
  bench('recursively', () => {
    recursively.sum(list);
  });
});
