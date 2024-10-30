import { M, Maybe } from '../maybe';
import { Seq } from '../seq';

export const query =
  <T extends Element>(selector: string) =>
  (parentNode: ParentNode): Maybe<T> =>
    M.fromNullable<T>(parentNode.querySelector<T>(selector));
export const queryAll =
  <T extends Element>(selector: string) =>
  (parentNode: ParentNode): Seq<T> =>
    parentNode.querySelectorAll<T>(selector);
export const text = (node: Node) => M.fromNullable(node.textContent);
const FIRST = XPathResult.FIRST_ORDERED_NODE_TYPE;
export const xquery =
  <T extends Node>(expression: string) =>
  (contextNode: Node): Maybe<T> =>
    M.fromNullable(
      document.evaluate(expression, contextNode, null, FIRST)
        .singleNodeValue as T | null
    );
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
