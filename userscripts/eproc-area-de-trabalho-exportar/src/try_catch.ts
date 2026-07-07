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
  fn: (...args: Args) => void | Promise<void>
) {
  return (...args: Args) => {
    try {
      const result = fn(...args);
      if (typeof result === 'object' && result !== null && 'then' in result) {
        Promise.resolve(result).catch(print_error);
      }
    } catch (err) {
      print_error(err);
    }
  };
}

function print_error(err: unknown) {
  console.group(`<${GM_info.script.name}>`);
  console.error(err);
  if (err instanceof CustomError) {
    console.debug(err.payload);
  } else if (err instanceof Error && err.cause) {
    console.debug(err.cause);
  }

  console.groupEnd();
}

export function try_catch(fn: () => void): void {
  return lift_throwable(fn)();
}
