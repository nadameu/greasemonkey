import { Dominio, getDominio } from './getDominio';
import { getFormulario } from './getFormulario';
import { getNodeInfo } from './getNodeInfo';
import { makeCriarLinks } from './makeCriarLinks';
import { NodeSigla } from './NodeSigla';

export function main({
  doc,
  log,
}: {
  doc: typeof document;
  log: typeof console.log;
}) {
  const resultado = parsePagina(doc);
  const { linksCriados } = (() => {
    if (resultado === 0) return { linksCriados: 0 };
    return modificarPagina({ ...resultado, doc });
  })();
  const s = linksCriados > 1 ? 's' : '';
  log(`${linksCriados} link${s} criado${s}.`);
}

function parsePagina(doc: typeof document):
  | 0
  | {
      nodeSiglas: NonEmptyArray<NodeSigla>;
      dominio: Dominio;
    } {
  const formulario = getFormulario(doc);
  const nodeSiglas = Array.from(getNodeInfo(formulario));
  if (!isNonEmptyArray(nodeSiglas)) return 0;
  const dominio = getDominio(doc);
  return { nodeSiglas, dominio };
}

function modificarPagina({
  doc,
  nodeSiglas,
  dominio,
}: {
  doc: typeof document;
  nodeSiglas: NonEmptyArray<NodeSigla>;
  dominio: Dominio;
}) {
  const criarLink = makeCriarLinks(doc, dominio);
  for (const nodeSigla of nodeSiglas) {
    criarLink(nodeSigla);
  }
  return { linksCriados: nodeSiglas.length };
}

type NonEmptyArray<T> = [T, ...T[]];
function isNonEmptyArray<T>(array: T[]): array is NonEmptyArray<T> {
  return array.length > 0;
}
