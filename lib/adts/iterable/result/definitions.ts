export const IteratorYieldResult = <a>(value: a): IteratorYieldResult<a> => ({
  done: false,
  value,
});
export const isIteratorYieldResult = <a, b>(
  result: IteratorResult<a, b>
): result is IteratorYieldResult<a> => !result.done;
export const IteratorReturnResult = <b>(value: b): IteratorReturnResult<b> => ({
  done: true,
  value,
});
export const isIteratorReturnResult = <a, b>(
  result: IteratorResult<a, b>
): result is IteratorReturnResult<b> => result.done === true;
