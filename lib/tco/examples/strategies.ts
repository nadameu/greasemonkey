import { List } from './List';
import * as async_ from './async';
import * as auto from './auto';
import * as cont from './cont';
import * as iterative from './iterative';
import * as promises from './promises';
import * as recursion from './recursion';
import * as recursively from './recursively';
import * as step from './step';
import * as tailCall from './tail-call';
import * as trampoline from './trampoline';
import * as trampolineMonad from './trampoline-monad';

export interface StrategyFunctions {
  count(x: number): number | Promise<number>;
  fac(x: number): number | Promise<number>;
  fib(x: number): number | Promise<number>;
  collatz(x: number): number | Promise<number>;
  sum(xs: List<number>): number | Promise<number>;
}

export enum Limitation {
  /** Long recursions overflow the stack */
  Stack = 1,
  /** Very long recursions consume all heap space */
  Heap = 2,
  /** Very long recursions are extremely slow */
  Performance = 3,
  None = 4,
}

export interface Strategy {
  name: string;
  limitation: Limitation;
  needsCaching: boolean;
  fns: StrategyFunctions;
}

function Strategy(
  name: string,
  fns: StrategyFunctions,
  {
    limitation = Limitation.None,
    needsCaching = false,
  }: {
    limitation?: Limitation;
    needsCaching?: boolean;
  } = {}
): Strategy {
  return { name, limitation, needsCaching, fns };
}

export const strategies = [
  Strategy('iterative', iterative),
  Strategy('simple recursion', recursion, {
    limitation: Limitation.Stack,
    needsCaching: true,
  }),
  Strategy('tail-call recursion', tailCall, { limitation: Limitation.Stack }),
  Strategy('auto-trampoline', auto, { limitation: Limitation.Performance }),
  Strategy('step', step, { limitation: Limitation.Performance }),
  Strategy('trampoline', trampoline, { limitation: Limitation.Performance }),
  Strategy('recursively', recursively, {
    limitation: Limitation.Heap,
    needsCaching: true,
  }),
  Strategy('cont', cont, { limitation: Limitation.Heap, needsCaching: true }),
  Strategy('trampoline-monad', trampolineMonad, {
    limitation: Limitation.Heap,
    needsCaching: true,
  }),
  Strategy('promises', promises, { limitation: Limitation.Stack }),
  Strategy('async', async_, { limitation: Limitation.Stack }),
];
