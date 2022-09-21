import { beforeEach, expect, test, vitest } from 'vitest';
import { createFiniteStateMachine, FiniteStateMachine } from '.';

type State =
  | { status: 'PENDING' }
  | { status: 'RESOLVED'; value: number }
  | { status: 'REJECTED'; error: Error }
  | { status: 'TRANSITION_ERROR'; previousState: State; action: Action };
type Action = { type: 'LOADED'; value: number } | { type: 'ERROR'; error: Error };
let fsm: FiniteStateMachine<State, Action>;

beforeEach(() => {
  fsm = createFiniteStateMachine<State, Action>(
    { status: 'PENDING' },
    {
      PENDING: {
        ERROR({ error }) {
          return { status: 'REJECTED', error };
        },
        LOADED({ value }) {
          return { status: 'RESOLVED', value };
        },
      },
      RESOLVED: {},
      REJECTED: {},
      TRANSITION_ERROR: {},
    },
    (state, action) => ({ status: 'TRANSITION_ERROR', previousState: state, action })
  );
});

test('Initial state', () => {
  expect(fsm.getState()).toEqual({ status: 'PENDING' });
});

test('Transition', () => {
  fsm.dispatch({ type: 'LOADED', value: 42 });
  expect(fsm.getState()).toEqual({ status: 'RESOLVED', value: 42 });
});

test('Regular error', () => {
  fsm.dispatch({ type: 'ERROR', error: new Error('Hello') });
  expect(fsm.getState()).toEqual({ status: 'REJECTED', error: new Error('Hello') });
});

test('Transition error', () => {
  const action0: Action = { type: 'LOADED', value: 42 };
  fsm.dispatch(action0);
  const expected0: State = { status: 'RESOLVED', value: 42 };
  expect(fsm.getState()).toEqual(expected0);

  const action1: Action = { type: 'LOADED', value: 43 };
  fsm.dispatch(action1);
  const expected1: State = {
    status: 'TRANSITION_ERROR',
    previousState: expected0,
    action: action1,
  };
  expect(fsm.getState()).toEqual(expected1);
});

test('subscribe', () => {
  const fn = vitest.fn();
  const subscription = fsm.subscribe(fn);
  expect(fn).toHaveBeenCalledWith({ status: 'PENDING' });

  const action: Action = { type: 'LOADED', value: 42 };
  fsm.dispatch(action);
  const expected: State = { status: 'RESOLVED', value: 42 };
  expect(fn).toHaveBeenCalledWith(expected);

  fn.mockReset();
  subscription.unsubscribe();

  fsm.dispatch(action);
  expect(fn).not.toHaveBeenCalled();
});
