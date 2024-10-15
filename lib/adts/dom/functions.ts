import { M, Maybe } from '../maybe';
import { S, Seq } from '../seq';

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
const ITER = XPathResult.ORDERED_NODE_ITERATOR_TYPE;
export const xqueryAll = <T extends Node>(
  expression: string
): ((contextNode: Node) => T[]) =>
  S.fromGen(function* (contextNode: Node) {
    const result = document.evaluate(expression, contextNode, null, ITER);
    for (
      let node = result.iterateNext();
      node !== null;
      node = result.iterateNext()
    ) {
      yield node as T;
    }
  });
