import { beforeEach, describe, expect, Mock, MockedFunction, test, vitest } from 'vitest';
import { createStore, Store } from '.';

function createVerify<T>(fn: Mock<[T], void>) {
  return (called: T[]) => {
    expect(fn).toHaveBeenCalledTimes(called.length);
    called.forEach((c, i) => {
      expect(fn).toHaveBeenNthCalledWith(i + 1, c);
    });
  };
}

describe('create', () => {
  type State = PromiseSettledResult<number> | { status: 'pending' };
  type Action = PromiseSettledResult<number>;

  let store: Store<State, PromiseSettledResult<number>>;
  let fn: Mock<[State], void>;
  let verify: (called: State[]) => void;
  beforeEach(() => {
    store = createStore<State, Action>(
      () => ({ status: 'pending' }),
      (state, action) => {
        if (state.status !== 'pending') return state;
        return action;
      }
    );
    if (!fn) {
      fn = vitest.fn();
      verify = createVerify(fn);
    }
    vitest.resetAllMocks();
  });

  test('resolve once', () => {
    const sub = store.subscribe(fn);
    store.dispatch({ status: 'fulfilled', value: 42 });

    verify([{ status: 'pending' }, { status: 'fulfilled', value: 42 }]);

    sub.unsubscribe();
  });

  test('reject once', () => {
    const sub = store.subscribe(fn);
    store.dispatch({ status: 'rejected', reason: 'error' });

    verify([{ status: 'pending' }, { status: 'rejected', reason: 'error' }]);
  });

  test('reject then resolve', () => {
    const sub = store.subscribe(fn);
    store.dispatch({ status: 'rejected', reason: 'error' });
    store.dispatch({ status: 'fulfilled', value: 42 });

    verify([
      { status: 'pending' },
      { status: 'rejected', reason: 'error' },
      { status: 'rejected', reason: 'error' },
    ]);
  });

  test('resolve then reject', () => {
    const sub = store.subscribe(fn);
    store.dispatch({ status: 'fulfilled', value: 42 });
    store.dispatch({ status: 'rejected', reason: 'error' });

    verify([
      { status: 'pending' },
      { status: 'fulfilled', value: 42 },
      { status: 'fulfilled', value: 42 },
    ]);
  });
});

test('unsubscribe', () => {
  type State = number;
  type Action = 'inc' | 'dec';
  const store = createStore<State, Action>(
    () => 0,
    (state, action) => {
      if (action === 'inc') return state + 1;
      if (action === 'dec') return state - 1;
      return state;
    }
  );
  const fn = vitest.fn<[State], void>();
  const verify = createVerify(fn);
  const sub = store.subscribe(fn);
  store.dispatch('inc');
  store.dispatch('inc');
  store.dispatch('inc');
  store.dispatch('dec');
  sub.unsubscribe();
  store.dispatch('dec');
  store.dispatch('inc');
  verify([0, 1, 2, 3, 2]);
});
