export function query_first<T extends HTMLElement>(
  selector: string,
  parentNode: ParentNode = document
) {
  let element: T | null | undefined = undefined;
  return {
    then<U, U2>(f: (_: T) => U, g: (_: Error) => U2): U | U2 {
      if (element === undefined)
        element = parentNode.querySelector<T>(selector);
      if (element === null)
        return g(
          new Error(`Não foi possível obter elemento: \`${selector}\`.`)
        );
      return f(element);
    },
  };
}
