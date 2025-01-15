import { GM_info } from '$';

export function log_error(error: unknown): void {
  console.group(GM_info.script.name);
  console.error(error);
  console.groupEnd();
}
