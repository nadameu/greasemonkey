import { Handler } from '@nadameu/handler';
import { createPubSub } from '@nadameu/create-pubsub';

export interface Store<S, A> {
  dispatch(action: A): void;
  getState(): S;
  subscribe(f: Handler<S>): Subscription;
}
export interface Subscription {
  unsubscribe(): void;
}

export function createStore<S, A>(
  getInitialState: () => S,
  reducer: (state: S, action: A) => S
): Store<S, A> {
  const pubsub = createPubSub<S>();
  let state = getInitialState();
  return {
    dispatch(action: A) {
      state = reducer(state, action);
      pubsub.publish(state);
    },
    getState() {
      return state;
    },
    subscribe(listener: Handler<S>): Subscription {
      const subscription = pubsub.subscribe(listener);
      listener(state);
      return subscription;
    },
  };
}
