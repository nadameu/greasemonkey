export function* flattenTabela(node: Node) {
  if (node instanceof HTMLTableElement)
    yield* node.querySelector('td:nth-child(2)')?.childNodes ?? [];
  yield node;
}
