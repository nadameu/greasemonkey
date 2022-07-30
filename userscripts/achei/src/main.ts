import { makeCriarLinks } from './makeCriarLinks';
import { getNodeInfo } from './getNodeInfo';
import { getFormulario } from './getFormulario';
import { getDominio } from './getDominio';
import { validate } from './validate';

export async function main({ doc, log }: { doc: Document; log: typeof console.log }) {
  const [criarLinks, nodeInfo] = await validate([
    getDominio(doc).then(dominio => makeCriarLinks(doc, dominio)),
    getFormulario(doc).then(getNodeInfo),
  ]);
  nodeInfo.forEach(criarLinks);
  const qtd = nodeInfo.length;
  const s = qtd > 1 ? 's' : '';
  log(`${qtd} link${s} criado${s}`);
}
