import { Handler } from '@nadameu/handler';

export interface PubSub<T> {
  publish(event: T): void;
  subscribe(f: Handler<T>): Subscription;
}
export interface Subscription {
  unsubscribe(): void;
}

export function createPubSub<T>(): PubSub<T> {
  const listeners = new Set<Handler<T>>();
  return {
    publish(event: T) {
      for (const l of listeners) l(event);
    },
    subscribe(listener: Handler<T>): Subscription {
      listeners.add(listener);
      return {
        unsubscribe() {
          listeners.delete(listener);
        },
      };
    },
  };
}
