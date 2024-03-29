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
