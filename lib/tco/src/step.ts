export type Step<a> =
  | { done: false; step(): Step<a> }
  | { done: true; value: a };
export const loop = <a>(step: () => Step<a>): Step<a> => ({
  done: false,
  step,
});
export const done = <a>(value: a): Step<a> => ({ done: true, value });
export const run = <a>(step: Step<a>): a => {
  let result = step;
  while (!result.done) result = result.step();
  return result.value;
};
