interface Resolvable<T> {
  readonly resolve: (_: T) => void;
  readonly reject: (_: any) => void;
}

function guard(f: Function | undefined): asserts f is Function {
  if (!f) throw new Error('Not initialized.');
}

export function createResolvable<T>(): readonly [Promise<T>, Resolvable<T>] {
  let resolve: Resolvable<T>['resolve'] | undefined;
  let reject: Resolvable<T>['reject'] | undefined;
  const promise = new Promise((f: (_: T) => void, g: (_: any) => void) => {
    resolve = f;
    reject = g;
  });
  return [
    promise,
    {
      resolve(value: T) {
        guard(resolve);
        resolve(value);
      },
      reject(reason: any) {
        guard(reject);
        reject(reason);
      },
    },
  ];
}
