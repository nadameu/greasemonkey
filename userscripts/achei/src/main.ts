import { makeCriarLinks } from './makeCriarLinks';
import { getNodeInfo } from './getNodeInfo';
import { getFormulario } from './getFormulario';
import { getDominio } from './getDominio';

export async function main({ doc, log }: { doc: Document; log: typeof console.log }) {
  const dominio = getDominio(doc);
  if (!dominio) throw new Error('Não foi possível verificar o domínio.');
  const formulario = getFormulario(doc);
  if (!formulario) throw new Error('Não foi possível obter o formulário.');
  const criarLinks = makeCriarLinks(doc, dominio);
  const nodeInfo = getNodeInfo(formulario);
  for (const nodeSigla of nodeInfo) {
    criarLinks(nodeSigla);
  }
  const qtd = nodeInfo.length;
  const s = qtd > 1 ? 's' : '';
  log(`${qtd} link${s} criado${s}`);
}
