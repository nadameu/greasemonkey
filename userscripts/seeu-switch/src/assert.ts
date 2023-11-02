export class AssertionError extends Error {
  name = 'AssertionError';
  constructor(message: string) {
    super(message);
  }
}

export function assert(
  condition: boolean,
  message: string | { (): Error }
): asserts condition {
  if (condition) return;
  if (typeof message === 'string') throw new AssertionError(message);
  throw message();
}
