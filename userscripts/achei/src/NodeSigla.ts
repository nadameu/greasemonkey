export interface NodeSigla {
  node: Node;
  sigla: string;
}
export const NodeSigla = (node: Node, sigla: string): NodeSigla => ({ node, sigla });
