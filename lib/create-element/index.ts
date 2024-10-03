export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: Partial<
    Omit<HTMLElementTagNameMap[K], 'classList' | 'dataset' | 'style'> & {
      classList?: Array<string | null> | Record<string, boolean>;
      dataset?: Record<string, string>;
      style?: Partial<CSSStyleDeclaration>;
    }
  > | null = null,
  ...children: Array<Node | string>
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tag);
  for (const [key, value] of Object.entries<any>(props ?? {})) {
    if (key === 'style' || key === 'dataset') {
      for (const [k, v] of Object.entries(value)) {
        (element as any)[key][k] = v;
      }
    } else if (key === 'classList') {
      let classes: string[];
      if (Array.isArray(value)) {
        classes = value.filter((x): x is string => x !== null);
      } else {
        classes = Object.entries(value).flatMap(([k, v]) => {
          if (!v) return [];
          return [k];
        });
      }
      for (const className of classes) {
        element.classList.add(className);
      }
    } else {
      (element as any)[key] = value;
    }
  }
  element.append(...children);
  return element;
}
export { h as createElement };
