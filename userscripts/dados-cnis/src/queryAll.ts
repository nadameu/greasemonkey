export function queryAll<T extends HTMLElement>(
  selector: string,
  context: ParentNode = document
): Array<T> {
  return Array.from(context.querySelectorAll<T>(selector));
}
