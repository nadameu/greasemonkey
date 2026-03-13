import { GM_info } from '$';
import { CustomError } from './CustomError';

export function try_catch(fn: () => void) {
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
