import { Maybe } from './Maybe';

const isInstanceOf =
  <T extends object>(C: { new (...args: any[]): T }) =>
  (obj: object): obj is T =>
    obj instanceof C;

export const flattenTabela = (node: Node): Node[] =>
  Maybe.of(node)
    .where(/* @__INLINE__ */ isInstanceOf(HTMLTableElement))
    .safeMap(x => x.querySelector('td:nth-child(2)'))
    .map(x => x.childNodes as Iterable<Node>)
    .map(xs => Array.from(xs))
    .valueOr([])
    .concat([node]);
