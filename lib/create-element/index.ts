export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: Partial<HTMLElementTagNameMap[K]> | null = null,
  ...children: Array<HTMLElement | string>
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tag);
  for (const [key, value] of Object.entries(props ?? {})) {
    (element as any)[key] = value;
  }
  element.append(...children);
  return element;
}
export { h as createElement };
