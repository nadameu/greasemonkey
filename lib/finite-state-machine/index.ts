import { createStore } from '@nadameu/create-store';

type Transitions<
  State extends { status: string },
  Action extends { type: string },
> = {
  [S in State['status']]: {
    [A in Action['type']]?: {
      (
        action: Extract<Action, { type: A }>,
        state: Extract<State, { status: S }>
      ): State;
    };
  };
};

export interface FiniteStateMachine<
  State extends { status: string },
  Action extends { type: string },
> {
  dispatch(action: Action): void;
  getState(): State;
  subscribe(subscriber: { (state: State): void }): { unsubscribe(): void };
}

export function createFiniteStateMachine<
  State extends { status: string },
  Action extends { type: string },
>(
  initialState: State,
  transitions: Transitions<State, Action>,
  onInvalidTransition: (state: State, action: Action) => State
): FiniteStateMachine<State, Action> {
  return createStore<State, Action>(
    () => initialState,
    (state, action) =>
      transitions[state.status as State['status']][
        action.type as Action['type']
      ]?.(
        action as Extract<Action, { type: Action['type'] }>,
        state as Extract<State, { status: State['status'] }>
      ) ?? onInvalidTransition(state, action)
  );
}
