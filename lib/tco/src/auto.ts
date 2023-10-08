import { Trampoline, loop, run } from './trampoline';

export const auto = <T extends unknown[], U>(f: (...args: T) => U): { (...args: T): U } => {
  let running = false;
  function rec(...args: T): Trampoline<U> {
    // TODO: return early only after a number of iterations
    if (running) return loop(() => f(...args));
    running = true;
    let result = run(f(...args));
    running = false;
    return result;
  }
  return rec as { (...args: T): U };
};
