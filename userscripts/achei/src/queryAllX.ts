import { assert, isNotNull } from '@nadameu/predicates';

const ITERATOR = XPathResult.ORDERED_NODE_ITERATOR_TYPE;
export function* queryAllX<T extends Node>(
  selector: string,
  context: Node
): Generator<T> {
  assert(isNotNull(context.ownerDocument));
  const iter = context.ownerDocument.evaluate(
    selector,
    context,
    null,
    ITERATOR
  );
  for (let node = iter.iterateNext(); node; node = iter.iterateNext()) {
    yield node as T;
  }
}
