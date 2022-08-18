export function expectUnreachable(value: never): never {
  throw new Error('Unexpected.');
}
