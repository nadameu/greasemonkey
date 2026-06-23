import { err, ok, Result } from './01_implementations';
import { iterate } from './02_tools';

const ITERATOR = XPathResult.ORDERED_NODE_ITERATOR_TYPE;
export const queryAllX =
  <T extends Node>(selector: string) =>
  (context: Node): Result<T[], string> => {
    if (context.ownerDocument === null) {
      return err('O contexto não está inserido em um documento.');
    } else {
      return ok(
        fromXPathResult<T>(
          context.ownerDocument.evaluate(selector, context, null, ITERATOR)
        )
      );
    }
  };

const fromXPathResult = iterate(
  <T extends Node>(iter: XPathResult): [T, XPathResult] | null => {
    const node = iter.iterateNext();
    if (node === null) return null;
    return [node as T, iter];
  }
);
