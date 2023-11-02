import { getDominio } from './getDominio';
import { getFormulario } from './getFormulario';
import { getNodeInfo } from './getNodeInfo';
import { makeCriarLinks } from './makeCriarLinks';

export async function main({
  doc,
  log,
}: {
  doc: Document;
  log: typeof console.log;
}) {
  const dominio = await getDominio(doc);
  const criarLinks = makeCriarLinks(doc, dominio);
  const formulario = await getFormulario(doc);
  const nodeInfo = getNodeInfo(formulario);
  nodeInfo.forEach(criarLinks);
  const qtd = nodeInfo.length;
  const s = qtd > 1 ? 's' : '';
  log(`${qtd} link${s} criado${s}`);
}
