import { getDominio } from './getDominio';
import { getFormulario } from './getFormulario';
import { getNodeInfo } from './getNodeInfo';
import { makeCriarLinks } from './makeCriarLinks';

export function main({ doc, log }: { doc: Document; log: typeof console.log }) {
  const formulario = getFormulario(doc);
  const nodeInfo = Array.from(getNodeInfo(formulario));
  const qtd = nodeInfo.length;
  if (qtd > 0) {
    const dominio = getDominio(doc);
    const criarLinks = makeCriarLinks(doc, dominio);
    nodeInfo.forEach(criarLinks);
  }
  const s = qtd > 1 ? 's' : '';
  log(`${qtd} link${s} criado${s}`);
}
