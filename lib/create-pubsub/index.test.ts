import { expect, test, vitest } from 'vitest';
import { createPubSub } from '.';

test('publishes each event to every subscriber', () => {
  const pubSub = createPubSub<number>();
  const first = vitest.fn<(event: number) => void>();
  const second = vitest.fn<(event: number) => void>();
  pubSub.subscribe(first);
  pubSub.subscribe(second);

  pubSub.publish(1);
  pubSub.publish(2);

  expect(first.mock.calls).toEqual([[1], [2]]);
  expect(second.mock.calls).toEqual([[1], [2]]);
});

test('does not replay events published before subscribing', () => {
  const pubSub = createPubSub<number>();
  pubSub.publish(1);

  const listener = vitest.fn<(event: number) => void>();
  pubSub.subscribe(listener);
  expect(listener).not.toHaveBeenCalled();

  pubSub.publish(2);
  expect(listener.mock.calls).toEqual([[2]]);
});

test('unsubscribe stops future notifications without affecting other subscribers', () => {
  const pubSub = createPubSub<number>();
  const first = vitest.fn<(event: number) => void>();
  const second = vitest.fn<(event: number) => void>();
  const subscription = pubSub.subscribe(first);
  pubSub.subscribe(second);

  pubSub.publish(1);
  subscription.unsubscribe();
  subscription.unsubscribe();
  pubSub.publish(2);

  expect(first.mock.calls).toEqual([[1]]);
  expect(second.mock.calls).toEqual([[1], [2]]);
});
