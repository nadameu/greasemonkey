import { NodeSigla } from './NodeSigla';
import { siglaFromText } from './siglaFromText';

export function getNodeSigla(node: Node): NodeSigla | null {
  const text = node.textContent;
  if (!text) return null;
  const sigla = siglaFromText(text);
  if (!sigla) return null;
  return { node, sigla };
}
