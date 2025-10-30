import { atom, compute, effect } from './index';
import { expect, test, vitest } from 'vitest';

test('atom', () => {
  const value = atom(2);
  expect(value.get()).toBe(2);
  value.set(3);
  expect(value.get()).toBe(3);
  value.update(x => x * 14);
  expect(value.get()).toBe(42);
});

test('effect', () => {
  const value = atom(3);
  const f = vitest.fn();
  effect(() => {
    f(value.get());
  });
  expect(f.mock.calls).toEqual([[3]]);
  f.mockReset();
  value.set(4);
  expect(f.mock.calls).toEqual([[4]]);
});

test('compute', () => {
  const value = atom(14);
  const computed = compute(() => value.get() * 3);
  expect(computed.get()).toBe(42);
  value.set(23);
  expect(computed.get()).toBe(69);
});

test('nested', () => {
  const a = atom(3);
  const b = atom(4);
  const c = compute(() => a.get() * b.get());
  const d = atom(7);
  const e = compute(() => d.get() * 2 + c.get());
  expect(e.get()).toBe(26);
  a.set(2);
  expect(e.get()).toBe(22);
  b.set(5);
  expect(e.get()).toBe(24);
  d.set(1);
  expect(e.get()).toBe(12);
});

test('complex', () => {
  const first_name = atom('William');
  const last_name = atom('Shakespeare');
  const show_last_name = atom(true);
  const name = compute(() => {
    if (show_last_name.get()) {
      return first_name.get() + ' ' + last_name.get();
    } else {
      return first_name.get();
    }
  });
  const f = vitest.fn();
  effect(() => {
    f(name.get());
  });
  expect(f.mock.calls).toEqual([['William Shakespeare']]);
  f.mockReset();
  show_last_name.set(false);
  expect(f.mock.calls).toEqual([['William']]);
  f.mockReset();
  last_name.set('Wallace');
  expect(f.mock.calls).toEqual([]);
  f.mockReset();
  show_last_name.set(true);
  expect(f.mock.calls).toEqual([['William Wallace']]);
});
