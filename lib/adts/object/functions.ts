export const prop =
  <T, K extends keyof T>(prop: K) =>
  (obj: T): T[K] =>
    obj[prop];
