const sym = Symbol();
export type Trampoline<a> = a | { [sym]: true; (): Trampoline<a> };
export const loop = <a>(f: () => Trampoline<a>): Trampoline<a> => {
  (f as any)[sym] = true;
  return f as Trampoline<a>;
};
export const run = <a>(trampoline: Trampoline<a>): a => {
  let result = trampoline;
  while (typeof result === 'function' && sym in result) result = result();
  return result;
};
