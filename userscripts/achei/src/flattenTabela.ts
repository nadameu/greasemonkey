export function flattenTabela(node: Node): Node[] {
  const nodes = [node];
  if (node instanceof HTMLTableElement)
    return Array.from<Node>(node.querySelector('td:nth-child(2)')?.childNodes ?? []).concat(nodes);
  return nodes;
}
