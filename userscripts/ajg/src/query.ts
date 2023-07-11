import { ElementoNaoEncontradoError } from './ElementoNaoEncontradoError';
export async function query<T extends Element>(
  selector: string,
  context: ParentNode = document
): Promise<T> {
  const elt = context.querySelector<T>(selector);
  if (!elt) throw new ElementoNaoEncontradoError(selector, context);
  return elt;
}
