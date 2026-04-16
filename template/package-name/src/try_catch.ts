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

export function try_catch(fn: () => void): void {
  try {
    fn();
  } catch (err) {
    console.group(`<${GM_info.script.name}>`);
    console.error(err);
    if (err instanceof CustomError) {
      console.debug(err.payload);
    }
    console.groupEnd();
  }
}
