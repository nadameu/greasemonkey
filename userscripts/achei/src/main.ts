import { arrayHasAtLeastLength } from '@nadameu/predicates';
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
  let linksCriados = 0;
  if (resultado !== 0) {
    linksCriados = modificarPagina({ ...resultado, doc });
  }
  const s = linksCriados > 1 ? 's' : '';
  log(`${linksCriados} link${s} criado${s}`);
}

function parsePagina(doc: typeof document):
  | 0
  | {
      nodeSiglas: NonEmptyArray<NodeSigla>;
      dominio: Dominio;
    } {
  const formulario = getFormulario(doc);
  const nodeSiglas = Array.from(getNodeInfo(formulario));
  if (arrayHasAtLeastLength(1)(nodeSiglas)) {
    const dominio = getDominio(doc);
    return { nodeSiglas, dominio };
  }
  return 0;
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
  return nodeSiglas.length;
}

type NonEmptyArray<T> = T[] & Record<'0', T>;
