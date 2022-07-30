import { flattenTabela } from './flattenTabela';
import { getNodeSigla } from './getNodeSigla';
import { NodeSigla } from './NodeSigla';
import { siblings } from './siblings';

export function getNodeInfo(formulario: HTMLFormElement) {
  return Array.from(siblings(formulario))
    .flatMap(flattenTabela)
    .map(getNodeSigla)
    .filter((x): x is NodeSigla => x !== null);
}
