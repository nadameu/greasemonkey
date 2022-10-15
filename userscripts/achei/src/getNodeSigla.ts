import { Maybe } from './Maybe';
import { NodeSigla } from './NodeSigla';
import { siglaFromText } from './siglaFromText';

export const getNodeSigla = (node: Node): NodeSigla | null =>
  Maybe.from(node.textContent)
    .chain(siglaFromText)
    .map(sigla => NodeSigla(node, sigla))
    .valueOr(null);
