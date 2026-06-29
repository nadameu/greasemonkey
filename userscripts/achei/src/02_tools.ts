import {
  err,
  just,
  Maybe,
  nothing,
  ok,
  reader,
  Reader,
  Result,
} from './01_implementations';
import { ConsoleContext, DocumentContext } from './03_contexts';

export const TaggedError = <Tag extends string>(tag: Tag) =>
  class<Cause = never> extends Error {
    _tag = tag;
    name = tag;
    constructor(...args: [Cause] extends [never] ? [] : [cause: Cause]) {
      super();
      if (args.length === 1) this.cause = args[0]!;
    }
  };

export class ElementNotFound extends TaggedError('ElementNotFound')<{
  selector: string;
  context: ParentNode;
}> {}

export class ElementNotUnique extends TaggedError('ElementNotUnique')<{
  selector: string;
  context: ParentNode;
}> {}

export class NodeNotFound extends TaggedError('NodeNotFound')<{
  selector: string;
  context: NodeWithDocument;
}> {}

export class NodeNotUnique extends TaggedError('NodeNotUnique')<{
  selector: string;
  context: NodeWithDocument;
}> {}

export const maybeBool: {
  <a, b extends a>(pred: (x: a) => x is b): { (_: a): Maybe<b> };
  <a>(pred: (_: a) => boolean): { (_: a): Maybe<a> };
} =
  <a>(pred: (_: a) => boolean) =>
  (a: a): Maybe<a> =>
    pred(a) ? just(a) : nothing();

export const maybe = /* #__PURE__ */ maybeBool(
  <T>(value: T | null | undefined): value is NonNullable<T> => value != null
);

export const eitherBool =
  <a, b extends a, e = Exclude<a, b>>(
    pred: (x: a) => x is b,
    mapErr: (_: Exclude<a, b>) => e = (x: Exclude<a, b>) => x as e
  ) =>
  (x: a): Result<b, e> =>
    pred(x) ? ok(x) : err(mapErr(x as Exclude<a, b>));

export const asks = <a, b>(f: (_: a) => b): Reader<a, b> => reader(f);

export const askContext = <T extends {}>(key: keyof T) =>
  asks((env: T) => env[key]);

export const askDocument =
  /* #__PURE__ */ askContext<DocumentContext>('document');

export const askConsole = /* #__PURE__ */ askContext<ConsoleContext>('console');

export const iterate =
  <s, a>(f: (s: s) => [a, s] | null) =>
  (s: s): a[] => {
    const values: a[] = [];
    let value: a;
    let result = f(s);
    while (result) {
      [value, s] = result;
      values.push(value);
      result = f(s);
    }
    return values;
  };

export const queryFirst =
  <T extends Element>(selector: string) =>
  (context: ParentNode): Result<T, ElementNotFound> => {
    const elements = context.querySelectorAll<T>(selector);
    return ((xs: ArrayLike<T>): xs is [T, ...T[]] => xs.length > 0)(elements)
      ? ok(elements[0])
      : err(new ElementNotFound({ selector, context }));
  };

export const queryAll =
  <T extends Element>(selector: string) =>
  (context: ParentNode): T[] => [...context.querySelectorAll<T>(selector)];

export const queryUnique =
  <T extends Element>(selector: string) =>
  (context: ParentNode): Result<T, ElementNotFound | ElementNotUnique> => {
    const elements = context.querySelectorAll<T>(selector);
    switch (elements.length) {
      case 0:
        return err(new ElementNotFound({ selector, context }));
      case 1:
        return ok((elements as ArrayLike<T> as [T])[0]);
      default:
        return err(new ElementNotUnique({ selector, context }));
    }
  };

export class OrphanNode extends TaggedError('OrphanNode')<Node> {}

declare const NodeWithDocumentSymbol: unique symbol;
export type NodeWithDocument<T extends Node = Node> = T & {
  [NodeWithDocumentSymbol]: NodeWithDocument;
  ownerDocument: Document;
};
export const parseNodeWithDocument = eitherBool(
  <T extends Node>(node: T): node is NodeWithDocument<T> =>
    node.ownerDocument !== null,
  node => new OrphanNode(node)
);

declare const NodeWithParentSymbol: unique symbol;
export type NodeWithParent<T extends Node = Node> = T & {
  [NodeWithParentSymbol]: NodeWithParent;
  parentNode: ParentNode;
};
export const parseNodeWithParent = eitherBool(
  <T extends Node>(node: T): node is NodeWithParent<T> =>
    node.parentNode !== null,
  node => new OrphanNode(node)
);

export const queryFirstX =
  <T extends Node>(selector: string) =>
  (context: NodeWithDocument): Result<T, NodeNotFound> => {
    const nodes = queryAllX<T>(selector)(context);
    return ((xs: ArrayLike<T>): xs is [T, ...T[]] => xs.length > 0)(nodes)
      ? ok(nodes[0])
      : err(new NodeNotFound({ selector, context }));
  };

const ITERATOR = XPathResult.ORDERED_NODE_ITERATOR_TYPE;
export const queryAllX =
  <T extends Node>(selector: string) =>
  (context: NodeWithDocument) =>
    fromXPathResult<T>(
      context.ownerDocument.evaluate(selector, context, null, ITERATOR)
    );

export const queryUniqueX =
  <T extends Node>(selector: string) =>
  (context: NodeWithDocument): Result<T, NodeNotFound | NodeNotUnique> => {
    const nodes = queryAllX<T>(selector)(context);
    switch (nodes.length) {
      case 0:
        return err(new NodeNotFound({ selector, context }));
      case 1:
        return ok((nodes as ArrayLike<T> as [T])[0]);
      default:
        return err(new NodeNotUnique({ selector, context }));
    }
  };

const fromXPathResult = iterate(<T extends Node>(iter: XPathResult) => {
  const node = iter.iterateNext();
  return node ? [node as T, iter] : null;
});
