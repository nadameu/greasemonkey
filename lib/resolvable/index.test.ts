import { describe, expect, test, vitest } from 'vitest';
import { createResolvable } from '.';

interface Ok<T> {
  isOk: true;
  value: T;
}

interface Err {
  isOk: false;
  reason: any;
}

type Result<T> = Ok<T> | Err;

function Ok<T>(value: T): Result<T> {
  return { isOk: true, value };
}
function Err<T = never>(reason: any): Result<T> {
  return { isOk: false, reason };
}

function toResult<T>(promise: Promise<T>): Promise<Result<T>> {
  return promise.then(Ok, Err);
}
describe('basic functionality', () => {
  test('resolve', async () => {
    const [promise, resolvable] = createResolvable<number>();
    resolvable.resolve(42);
    expect(await toResult(promise)).toEqual(Ok(42));
  });

  test('reject', async () => {
    const [promise, resolvable] = createResolvable<number>();
    resolvable.reject('Error');
    expect(await toResult(promise)).toEqual(Err('Error'));
  });
});

describe('multiple resolutions or rejections', () => {
  test('resolves only once', async () => {
    const [promise, resolvable] = createResolvable<number>();

    const f = vitest.fn();
    const g = vitest.fn();
    promise.then(f, g);

    resolvable.resolve(42);
    resolvable.resolve(999);
    resolvable.reject('reason');

    expect(await toResult(promise)).toEqual(Ok(42));

    expect(f).toHaveBeenCalledOnce();
    expect(f).toHaveBeenCalledWith(42);
    expect(g).not.toHaveBeenCalled();
  });

  test('rejects only once', async () => {
    const [promise, resolvable] = createResolvable<number>();

    const f = vitest.fn();
    const g = vitest.fn();
    promise.then(f, g);

    resolvable.reject('Error');
    resolvable.reject('other reason');
    resolvable.resolve(999);

    expect(await toResult(promise)).toEqual(Err('Error'));

    expect(f).not.toHaveBeenCalled();
    expect(g).toHaveBeenCalledOnce();
    expect(g).toHaveBeenCalledWith('Error');
  });
});
