import { Trampoline, loop, run } from './trampoline';

export const auto = <T extends unknown[], U>(
  f: (...args: T) => U,
  maxRecursion = 2048
): { (...args: T): U } => {
  let running = 0;
  function rec(...args: T): Trampoline<U> {
    if (running > 0) {
      if (running < maxRecursion) {
        running++;
        return f(...args);
      } else {
        running = 1;
        return loop(() => f(...args));
      }
    }
    running = 1;
    let result = run(f(...args));
    running = 0;
    return result;
  }
  return rec as { (...args: T): U };
};
