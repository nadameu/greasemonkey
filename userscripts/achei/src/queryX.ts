const FIRST = XPathResult.FIRST_ORDERED_NODE_TYPE;
export function queryX<T extends Node>(
  selector: string,
  context: Node
): T | null {
  const node = context.ownerDocument!.evaluate(selector, context, null, FIRST);
  return node.singleNodeValue as T | null;
}
