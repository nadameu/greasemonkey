export async function query_first<T extends HTMLElement>(
  selector: string,
  parentNode: ParentNode = document
) {
  const element = parentNode.querySelector<T>(selector);

  if (element === null) {
    throw new Error(`Não foi possível obter elemento: \`${selector}\`.`);
  }

  return element;
}
