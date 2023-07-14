export function queryOne<T extends HTMLElement>(
  selector: string,
  context: ParentNode = document
): Promise<T> {
  const elements = context.querySelectorAll<T>(selector);
  if (elements.length < 1)
    return Promise.reject(new Error(`Elemento não encontrado: \`${selector}\`.`));
  if (elements.length > 1)
    return Promise.reject(new Error(`Mais de um elemento encontrado: \`${selector}\`.`));
  return Promise.resolve(elements[0] as T);
}
