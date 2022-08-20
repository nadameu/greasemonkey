import { describe, expect, test, vitest } from 'vitest';
import { createResolvable } from '.';

describe('basic functionality', () => {
  test('resolve', async () => {
    const [promise, resolvable] = createResolvable<number>();
    resolvable.resolve(42);
    await expect(promise).resolves.toEqual(42);
  });

  test('reject', async () => {
    const [promise, resolvable] = createResolvable<number>();
    resolvable.reject('Error');
    await expect(promise).rejects.toEqual('Error');
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

    await expect(promise).resolves.toEqual(42);

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

    await expect(promise).rejects.toEqual('Error');

    expect(f).not.toHaveBeenCalled();
    expect(g).toHaveBeenCalledOnce();
    expect(g).toHaveBeenCalledWith('Error');
  });
});
