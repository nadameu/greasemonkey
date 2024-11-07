export type Trampoline<a> =
  | { done: true; value: a }
  | { done: false; loop: () => Trampoline<a> };
export const done = <a>(value: a): Trampoline<a> => ({ done: true, value });
export const loop = <a>(loop: () => Trampoline<a>): Trampoline<a> => ({
  done: false,
  loop,
});
