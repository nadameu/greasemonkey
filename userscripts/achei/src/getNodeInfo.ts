import { NodeSigla } from './NodeSigla';
import { getNodeSigla } from './getNodeSigla';
import { flattenTabela } from './flattenTabela';
import { siblings } from './siblings';

export function getNodeInfo(formulario: HTMLFormElement) {
  const nodeInfo: NodeSigla[] = [];
  for (const sibling of siblings(formulario))
    for (const node of flattenTabela(sibling)) {
      const nodeSigla = getNodeSigla(node);
      if (nodeSigla) nodeInfo.push(nodeSigla);
    }
  return nodeInfo;
}
