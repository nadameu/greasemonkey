import { getNodeInfo } from './getNodeInfo';
import { makeCriarLinks } from './makeCriarLinks';
import { throwError } from './throwError';
import { Maybe } from './Maybe';

const dominios = {
  '1': 'trf4',
  '2': 'jfrs',
  '3': 'jfsc',
  '4': 'jfpr',
} as const;

export const main = ({ doc, log }: { doc: Document; log: typeof console.log }) => {
  const dominio = Maybe.from(doc.querySelector<HTMLInputElement>('input[name="local"]:checked'))
    .map(x => x.value)
    .where((x): x is keyof typeof dominios => x in dominios)
    .map(x => dominios[x])
    .valueOrElse(() => throwError('Não foi possível verificar o domínio.'));
  const formulario =
    doc.querySelector<HTMLFormElement>('form[name="formulario"]') ??
    throwError('Não foi possível obter o formulário.');

  const criarLinks = makeCriarLinks(doc, dominio);
  const nodeInfo = getNodeInfo(formulario);
  nodeInfo.forEach(criarLinks);
  const qtd = nodeInfo.length;
  const s = qtd > 1 ? 's' : '';
  log(`${qtd} link${s} criado${s}`);
};
