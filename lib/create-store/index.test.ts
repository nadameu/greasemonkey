import {
  afterEach,
  beforeEach,
  describe,
  expect,
  Mock,
  test,
  vitest,
} from 'vitest';
import { createStore, Store, Subscription } from '.';

function createCallChecker<T>(fn: Mock<[T], void>) {
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
  let wasCalledWith: (called: State[]) => void;
  let sub: Subscription;
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
      wasCalledWith = createCallChecker(fn);
    }
    sub = store.subscribe(fn);
  });
  afterEach(() => {
    sub.unsubscribe();
    vitest.resetAllMocks();
  });

  test('resolve once', () => {
    store.dispatch({ status: 'fulfilled', value: 42 });

    wasCalledWith([{ status: 'pending' }, { status: 'fulfilled', value: 42 }]);
  });

  test('reject once', () => {
    store.dispatch({ status: 'rejected', reason: 'error' });

    wasCalledWith([
      { status: 'pending' },
      { status: 'rejected', reason: 'error' },
    ]);
  });

  test('reject then resolve', () => {
    store.dispatch({ status: 'rejected', reason: 'error' });
    store.dispatch({ status: 'fulfilled', value: 42 });

    wasCalledWith([
      { status: 'pending' },
      { status: 'rejected', reason: 'error' },
      { status: 'rejected', reason: 'error' },
    ]);
  });

  test('resolve then reject', () => {
    store.dispatch({ status: 'fulfilled', value: 42 });
    store.dispatch({ status: 'rejected', reason: 'error' });

    wasCalledWith([
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
  const wasCalledWith = createCallChecker(fn);
  const sub = store.subscribe(fn);
  store.dispatch('inc');
  store.dispatch('inc');
  store.dispatch('inc');
  store.dispatch('dec');
  sub.unsubscribe();
  store.dispatch('dec');
  store.dispatch('inc');
  wasCalledWith([0, 1, 2, 3, 2]);
});

test('getState', () => {
  const store = createStore(
    () => 0,
    (state, action: number) => state + action
  );
  expect(store.getState()).toEqual(0);
  store.dispatch(+1);
  expect(store.getState()).toEqual(1);
  store.dispatch(-3);
  expect(store.getState()).toEqual(-2);
});
