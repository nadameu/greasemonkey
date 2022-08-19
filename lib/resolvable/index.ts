import { Handler } from '@nadameu/handler';

interface Resolvable<T> {
  readonly resolve: (_: T) => void;
  readonly reject: (_: any) => void;
}

export function createResolvable<T>(): readonly [Promise<T>, Resolvable<T>] {
  const resolvable = {} as {
    resolve: Handler<T>;
    reject: Handler<any>;
  };
  const promise = new Promise<T>((res, rej) => {
    resolvable.resolve = res;
    resolvable.reject = rej;
  });
  return [promise, resolvable];
}
