import { expect, test } from 'vitest';
import { createDispatcher } from '.';

function createExampleDispatcher() {
  const d = createDispatcher<number>();
  for (let i = 0; i < 5; i++) d.dispatch(i);
  d.end();
  return d;
}
async function* createExampleGenerator() {
  for (let i = 0; i < 5; i++) yield await Promise.resolve(i);
}

test.each([
  ['dispatcher', createExampleDispatcher()],
  ['async generator', createExampleGenerator()],
])('dispatch, next, return - %s', async (_, d) => {
  const it = d[Symbol.asyncIterator]();
  const p = it.next();
  const q = it.next();
  const r = it.return(-1);
  const s = it.next();

  await expect(p).resolves.toEqual({ done: false, value: 0 });
  await expect(q).resolves.toEqual({ done: false, value: 1 });
  await expect(r).resolves.toEqual({ done: true, value: -1 });
  await expect(s).resolves.toEqual({ done: true, value: undefined });
});

test.each([
  ['dispatcher', createExampleDispatcher()],
  ['async generator', createExampleGenerator()],
])('dispatch, next, throw - %s', async (_, d) => {
  const it = d[Symbol.asyncIterator]();
  const p = it.next();
  const q = it.next();
  const r = it.throw('Error');
  const s = it.next();

  await expect(p).resolves.toEqual({ done: false, value: 0 });
  await expect(q).resolves.toEqual({ done: false, value: 1 });
  await expect(r).rejects.toEqual('Error');
  await expect(s).resolves.toEqual({ done: true, value: undefined });
});

test('next, return, dispatch', async () => {
  const d = createDispatcher<number>();

  const it = d[Symbol.asyncIterator]();
  const p = it.next();
  const q = it.next();
  const r = it.return(-1);
  const s = it.next();

  d.dispatch(0);
  d.dispatch(1);
  d.dispatch(2);

  await expect(p).resolves.toEqual({ done: false, value: 0 });
  await expect(q).resolves.toEqual({ done: false, value: 1 });
  await expect(r).resolves.toEqual({ done: true, value: -1 });
  await expect(s).resolves.toEqual({ done: true, value: undefined });
});

test('next, throw, dispatch', async () => {
  const d = createDispatcher<number>();

  const it = d[Symbol.asyncIterator]();
  const p = it.next();
  const q = it.next();
  const r = it.throw('Error');
  const s = it.next();

  d.dispatch(0);
  d.dispatch(1);
  d.dispatch(2);

  await expect(p).resolves.toEqual({ done: false, value: 0 });
  await expect(q).resolves.toEqual({ done: false, value: 1 });
  await expect(r).rejects.toEqual('Error');
  await expect(s).resolves.toEqual({ done: true, value: undefined });
});

test.each([
  ['dispatch', createExampleDispatcher()],
  ['async generator', createExampleGenerator()],
])('iterate twice - %s', async (_, d) => {
  const it = d[Symbol.asyncIterator]();
  const p = it.next();
  const q = it.return(4);
  const r = it.next();

  await expect(p).resolves.toEqual({ done: false, value: 0 });
  await expect(q).resolves.toEqual({ done: true, value: 4 });
  await expect(r).resolves.toEqual({ done: true, value: undefined });

  const it2 = d[Symbol.asyncIterator]();
  const u = it2.next();
  const v = it2.throw('Error');
  const w = it2.next();

  await expect(u).resolves.toEqual({ done: true, value: undefined });
  await expect(v).rejects.toEqual('Error');
  await expect(w).resolves.toEqual({ done: true, value: undefined });
});

test.each([
  ['dispatch', createExampleDispatcher()],
  ['async generator', createExampleGenerator()],
])('for await (break) - %s', async (_, d) => {
  let actual: number[] = [];
  let err = '';
  let fin = '';
  try {
    for await (const x of d) {
      actual.push(x);
      if (actual.length === 3) break;
    }
  } catch (e) {
    err = e as string;
  } finally {
    fin = 'cleaned up';
  }

  expect(actual).toEqual([0, 1, 2]);
  expect(err).toEqual('');
  expect(fin).toEqual('cleaned up');
});

test.each([
  ['dispatch', createExampleDispatcher()],
  ['async generator', createExampleGenerator()],
])('for await (throw) - %s', async (_, d) => {
  let actual: number[] = [];
  let err = '';
  let fin = '';
  try {
    for await (const x of d) {
      actual.push(x);
      if (actual.length === 3) throw 'Error';
    }
  } catch (e) {
    err = e as string;
  } finally {
    fin = 'cleaned up';
  }

  expect(actual).toEqual([0, 1, 2]);
  expect(err).toEqual('Error');
  expect(fin).toEqual('cleaned up');
});

test.each([
  ['dispatch', createExampleDispatcher()],
  ['async generator', createExampleGenerator()],
])('for await (exhaust) - %s', async (_, d) => {
  const actual: number[] = [];
  for await (const x of d) {
    actual.push(x);
  }

  expect(actual).toEqual([0, 1, 2, 3, 4]);
});

test.each([
  ['dispatcher', createExampleDispatcher()],
  ['async generator', createExampleGenerator()],
])('exhaust (next) - %s', async (_, d) => {
  const it = d[Symbol.asyncIterator]();
  for (let i = 0; i < 5; i++) {
    await expect(it.next()).resolves.toEqual({ done: false, value: i });
  }
  await expect(it.next()).resolves.toEqual({ done: true, value: undefined });
  await expect(it.next()).resolves.toEqual({ done: true, value: undefined });
  await expect(it.next()).resolves.toEqual({ done: true, value: undefined });
});
