import { Handler } from '@nadameu/handler';

interface Store<S, A> {
  dispatch(action: A): void;
  getState(): S;
  subscribe(f: Handler<S>): Subscription;
}
interface Subscription {
  unsubscribe(): void;
}

export function createStore<S, A>(
  getInitialState: () => S,
  reducer: (state: S, action: A) => S
): Store<S, A> {
  const listeners = new Set<Handler<S>>();
  let state = getInitialState();
  return { dispatch, getState, subscribe };
  function dispatch(action: A) {
    state = reducer(state, action);
    for (const l of listeners) l(state);
  }
  function getState() {
    return state;
  }
  function subscribe(listener: Handler<S>): { unsubscribe(): void } {
    listeners.add(listener);
    listener(state);
    return { unsubscribe };
    function unsubscribe() {
      listeners.delete(listener);
    }
  }
}
