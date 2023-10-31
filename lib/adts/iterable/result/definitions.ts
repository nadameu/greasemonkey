export const Done = <r>(value: r): IteratorReturnResult<r> => ({ done: true, value });
export const isDone = <a, r>(fa: IteratorResult<a, r>): fa is IteratorReturnResult<r> =>
  fa.done === true;
export const Yield = <a>(value: a): IteratorYieldResult<a> => ({ done: false, value });
export const isYield = <a, r>(fa: IteratorResult<a, r>): fa is IteratorYieldResult<a> =>
  fa.done !== true;
