export function count(n: number): number {
  if (n <= 0) return 0;
  return count(n - 1) + 1;
}

type Trampoline<a> = a extends Function ? never : a | (() => Trampoline<a>);
function runTrampoline<a>(f: Trampoline<a>): a {
  let result = f;
  while (typeof result === 'function') result = result();
  return result as a;
}
export function trampolineCount(n: number): number {
  function rec(x: number, acc = 0): Trampoline<number> {
    if (x <= 0) return acc;
    return () => rec(x - 1, acc + 1);
  }
  return runTrampoline(rec(n));
}

type Step<a> = Loop<a> | Done<a>;
interface Loop<a> {
  done: false;
  step(): Step<a>;
}
interface Done<a> {
  done: true;
  value: a;
}
function runStep<a>(f: Step<a>): a {
  let result = f;
  while (!result.done) result = result.step();
  return result.value;
}
export function stepCount(n: number): number {
  function rec(x: number, acc = 0): Step<number> {
    if (x <= 0) return { done: true, value: acc };
    return { done: false, step: () => rec(x - 1, acc + 1) };
  }
  return runStep(rec(n));
}

type RecurResult<b> = RecurLoop<b> | RecurDone<b>;
interface RecurLoop<b> {
  done: false;
  input: any;
  mapping: (b: b) => b;
}
interface RecurDone<b> {
  done: true;
  value: b;
}
export interface Recur<a, b> {
  done(b: b): RecurResult<b>;
  loop(a: a, f?: (b: b) => b): RecurResult<b>;
}
export function Recur<a, b>(f: (a: a) => RecurResult<b>): (a: a) => b {
  return a => {
    let result = f(a);
    type Waiting = [mapping: (b: b) => b, prev: Waiting] | null;
    let waiting: Waiting = null;
    let mapping: (b: b) => b;
    while (true) {
      while (!result.done) {
        waiting = [result.mapping, waiting];
        result = f(result.input);
      }
      let value = result.value;
      while (waiting) {
        [mapping, waiting] = waiting;
        value = mapping(value);
      }
      return value;
    }
  };
}
Recur.done = function MyDone<b>(value: b): RecurResult<b> {
  return { done: true, value };
};
Recur.loop = function MyLoop<a, b>(input: a, mapping: (b: b) => b = x => x): RecurResult<b> {
  return { done: false, input, mapping };
};

export const recursiveCount = Recur<number, number>(x => {
  if (x <= 0) return Recur.done(0);
  return Recur.loop(x - 1, r => r + 1);
});
