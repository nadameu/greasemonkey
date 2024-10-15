import { assert, isNotNull } from '@nadameu/predicates';
import { Dominio } from './getDominio';
import { NodeSigla } from './NodeSigla';

export function makeCriarLinks(doc: typeof document, dominio: Dominio) {
  const template = doc.createElement('template');
  template.innerHTML = ' [ <a href="" target="_blank">Abrir na Intra</a> ]';
  const content = template.content;
  const link = content.querySelector('a');
  assert(isNotNull(link));
  return ({ node, sigla }: NodeSigla) => {
    assert(isNotNull(node.parentNode));
    link.href = `https://intra.trf4.jus.br/membros/${sigla}${dominio}-jus-br`;
    const fragment = doc.importNode(content, true);
    node.parentNode.insertBefore(fragment, node.nextSibling);
  };
}
