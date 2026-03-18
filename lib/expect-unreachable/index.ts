export function expectUnreachable(_value: never): never {
  throw new Error('Unexpected.');
}
