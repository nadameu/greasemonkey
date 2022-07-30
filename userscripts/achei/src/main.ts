import { makeCriarLinks } from './makeCriarLinks';
import { getNodeInfo } from './getNodeInfo';
import { getFormulario } from './getFormulario';
import { getDominio } from './getDominio';
import { validate } from './validate';

export async function main({ doc, log }: { doc: Document; log: typeof console.log }) {
  const [dominio, formulario] = await validate([getDominio(doc), getFormulario(doc)]);
  const criarLinks = makeCriarLinks(doc, dominio);
  const nodeInfo = getNodeInfo(formulario);
  for (const nodeSigla of nodeInfo) {
    criarLinks(nodeSigla);
  }
  const qtd = nodeInfo.length;
  const s = qtd > 1 ? 's' : '';
  log(`${qtd} link${s} criado${s}`);
}
