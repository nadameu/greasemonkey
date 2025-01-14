import type { Handler } from '@nadameu/handler';

export interface Store<T> {
  get(): T;
  set(newState: T): void;
  subscribe(listener: Handler<T>): Subscription;
}

export interface Subscription {
  unsubscribe(): void;
}

export function create_store<T>(initialState: T): Store<T> {
  let state = initialState;
  const listeners = new Set<Handler<T>>();
  return {
    get() {
      return state;
    },
    set(newState: T) {
      state = newState;
      for (const listener of listeners) {
        listener(state);
      }
    },
    subscribe(listener: Handler<T>) {
      listeners.add(listener);
      listener(state);
      return {
        unsubscribe() {
          listeners.delete(listener);
        },
      };
    },
  };
}
