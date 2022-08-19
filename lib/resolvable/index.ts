import { Handler } from '@nadameu/handler';

interface Resolvable<T> {
  readonly resolve: (_: T) => void;
  readonly reject: (_: any) => void;
}

export function createResolvable<T>(): readonly [Promise<T>, Resolvable<T>] {
  const resolvable = function (resolve: Handler<T>, reject: Handler<any>) {
    resolvable.resolve = resolve;
    resolvable.reject = reject;
  } as {
    (resolve: Handler<T>, reject: Handler<any>): void;
    resolve: Handler<T>;
    reject: Handler<any>;
  };
  const promise = new Promise<T>(resolvable);
  return [promise, resolvable];
}
