import { Handler } from '@nadameu/handler';

interface Store<S, A extends { type: string }> {
  dispatch(action: A): void;
  getState(): S;
  subscribe(f: Handler<S>): Subscription;
}
interface Subscription {
  unsubscribe(): void;
}

export function createStore<S, A extends { type: string }>(
  fn: () => Iterator<S, never, A>
): Store<S, A> {
  const it = fn();
  const listeners = new Set<Handler<S>>();

  return {
    dispatch(action: A): void {
      const result = it.next(action);
      listeners.forEach(l => l(result.value));
    },
    getState(): S {
      return it.next().value;
    },
    subscribe(f: Handler<S>): { unsubscribe(): void } {
      listeners.add(f);
      f(it.next().value);
      return {
        unsubscribe() {
          listeners.delete(f);
        },
      };
    },
  };
}
