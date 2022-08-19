import { expect, test, vitest } from 'vitest';
import { createDispatcher } from '.';

test('dispatch before iteration', async () => {
  const d = createDispatcher<number>();

  d.dispatch(0);
  d.dispatch(1);
  d.dispatch(2);

  const it = d[Symbol.asyncIterator]();
  const p = it.next();
  const q = it.next();
  const r = it.next();

  expect(await p).toEqual({ done: false, value: 0 });
  expect(await q).toEqual({ done: false, value: 1 });
  expect(await r).toEqual({ done: false, value: 2 });
});

test('dispatch after iteration', async () => {
  const d = createDispatcher<number>();

  const it = d[Symbol.asyncIterator]();
  const p = it.next();
  const q = it.next();
  const r = it.next();

  d.dispatch(0);
  d.dispatch(1);
  d.dispatch(2);

  expect(await p).toEqual({ done: false, value: 0 });
  expect(await q).toEqual({ done: false, value: 1 });
  expect(await r).toEqual({ done: false, value: 2 });
});

test('iterate twice', async () => {
  const d = createDispatcher<number>();

  const it = d[Symbol.asyncIterator]();
  const p = it.next();
  const q = it.next();
  const r = it.next();

  d.dispatch(0);
  d.dispatch(1);
  d.dispatch(2);

  expect(await p).toEqual({ done: false, value: 0 });
  expect(await q).toEqual({ done: false, value: 1 });
  expect(await r).toEqual({ done: false, value: 2 });

  const it2 = d[Symbol.asyncIterator]();
  const u = it2.next();
  const v = it2.next();
  const w = it2.next();

  expect(await u).toEqual({ done: false, value: 0 });
  expect(await v).toEqual({ done: false, value: 1 });
  expect(await w).toEqual({ done: false, value: 2 });
});
