import { err, ok, Result } from '../Result';

export function queryUnique<T extends Element>(selector: string) {
  return (context: ParentNode): Result<T, NotUnique> => {
    const elts = context.querySelectorAll<T>(selector);
    if (elts.length === 1) return ok(elts[0]!);
    return err(new NotUnique(context, selector));
  };
}

export class NotUnique extends Error {
  readonly name = 'NotUnique';
  readonly cause: { context: ParentNode; selector: string };
  constructor(context: ParentNode, selector: string) {
    super();
    this.cause = { context, selector };
  }
}

declare const NodeWithParentSymbol: unique symbol;
type NodeWithParent<T extends Node = Node> = T & {
  [NodeWithParentSymbol]: NodeWithParent;
  parentNode: ParentNode;
};
export function parseNodeWithParent<T extends Node>(
  node: T
): Result<NodeWithParent<T>, OrphanNode> {
  return node.parentNode !== null
    ? ok(node as NodeWithParent<T>)
    : err(new OrphanNode(node));
}

export class OrphanNode extends Error {
  readonly name = 'OrphanNode';
  readonly cause: Node;
  constructor(node: Node) {
    super();
    this.cause = node;
  }
}
