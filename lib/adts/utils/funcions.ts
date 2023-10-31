export const assert = (condition: boolean, msg: string): asserts condition is true => {
  if (!condition) throw new Error(msg);
};
