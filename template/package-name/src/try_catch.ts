import { GM_info } from '$';

export class CustomError<T = {}> extends Error {
  constructor(
    message?: string,
    public payload = {} as T
  ) {
    super(message);
  }
}
CustomError.prototype.name = 'CustomError';

export function lift_throwable<Args extends unknown[]>(
  fn: (...args: Args) => void
) {
  return (...args: Args) => {
    try {
      fn(...args);
    } catch (err) {
      console.group(`<${GM_info.script.name}>`);
      console.error(err);
      if (err instanceof CustomError) {
        console.debug(err.payload);
      }
      console.groupEnd();
    }
  };
}

export function try_catch(fn: () => void): void {
  return lift_throwable(fn)();
}
