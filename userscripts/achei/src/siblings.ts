export function* siblings(node: Node) {
  for (let s = node.nextSibling; s; s = s.nextSibling) yield s;
}
