import { flattenTabela } from './flattenTabela';
import { getNodeSigla } from './getNodeSigla';
import { siblings } from './siblings';

export function getNodeInfo(formulario: HTMLFormElement) {
  return Array.from(siblings(formulario))
    .flatMap(flattenTabela)
    .map(getNodeSigla)
    .filter(<T>(x: T | null): x is T => x !== null);
}
