export interface Action<Model, Extra> {
  (state: Model, dispatch: Dispatch<Model, Extra>, extra: Extra): Model;
}

export interface Dispatch<Model, Extra> {
  (action: Action<Model, Extra>): void;
}

export function createFromAsyncThunk<Model, Extra>(
  onLoading: Action<Model, Extra>,
  onError: (error: unknown) => Action<Model, Extra>
) {
  return (
      asyncThunk: (state: Model, extra: Extra) => Promise<Action<Model, Extra>>
    ): Action<Model, Extra> =>
    (state, dispatch, extra) => {
      const asyncAction = asyncThunk(state, extra);
      asyncAction.catch(onError).then(dispatch);
      return onLoading(state, dispatch, extra);
    };
}
