export const query =
  <T extends Element>(selector: string) =>
  (parentNode: ParentNode) =>
    <T>parentNode.querySelector<T>(selector);
export const queryAll =
  <T extends Element>(selector: string) =>
  (parentNode: ParentNode): NodeListOf<T> =>
    parentNode.querySelectorAll<T>(selector);
export const text = (node: Node) => node.textContent;
const FIRST = XPathResult.FIRST_ORDERED_NODE_TYPE;
export const xquery =
  <T extends Node>(expression: string) =>
  (contextNode: Node): T | null =>
    document.evaluate(expression, contextNode, null, FIRST)
      .singleNodeValue as T | null;
const SNAP = XPathResult.ORDERED_NODE_SNAPSHOT_TYPE;
export const xqueryAll =
  <T extends Node>(expression: string) =>
  (contextNode: Node): T[] => {
    const array: T[] = [];
    const result = document.evaluate(expression, contextNode, null, SNAP);
    for (let i = 0, len = result.snapshotLength; i < len; i++) {
      array.push(result.snapshotItem(i) as T);
    }
    return array;
  };
