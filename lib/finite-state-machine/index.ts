type Transitions<State extends { status: string }, Action extends { type: string }> = {
  [S in State['status']]: {
    [A in Action['type']]?: {
      (action: Extract<Action, { type: A }>, state: Extract<State, { status: S }>): State;
    };
  };
};

export interface FiniteStateMachine<
  State extends { status: string },
  Action extends { type: string }
> {
  dispatch(action: Action): void;
  getState(): State;
  subscribe(subscriber: { (state: State): void }): { unsubscribe(): void };
}

export function createFiniteStateMachine<
  State extends { status: string },
  Action extends { type: string }
>(
  initialState: State,
  transitions: Transitions<State, Action>,
  onInvalidTransition: (state: State, action: Action) => State
): FiniteStateMachine<State, Action> {
  let state: State = initialState;
  let subscribers: Array<{ (state: State): void }> = [];
  return { getState, dispatch, subscribe };
  function getState() {
    return state;
  }
  function dispatch(action: Action) {
    const transition = transitions[state.status as State['status']][action.type as Action['type']];
    if (transition) {
      state = transition(action as any, state as any);
    } else {
      state = onInvalidTransition(state, action);
    }
    for (const subscriber of subscribers) {
      subscriber(state);
    }
  }
  function subscribe(subscriber: { (state: State): void }): { unsubscribe(): void } {
    subscribers.push(subscriber);
    subscriber(state);
    return {
      unsubscribe() {
        subscribers = subscribers.filter(s => s !== subscriber);
      },
    };
  }
}
