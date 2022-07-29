import { NodeSigla } from './NodeSigla';

export function makeCriarLinks(doc: Document, dominio: string) {
  const template = doc.createElement('template');
  template.innerHTML = ' [ <a href="" target="_blank">Abrir na Intra</a> ]';
  const content = template.content;
  const link = content.querySelector('a')!;
  return ({ node, sigla }: NodeSigla) => {
    link.href = `https://intra.trf4.jus.br/membros/${sigla}${dominio}-jus-br`;
    const fragment = doc.importNode(content, true);
    node.parentNode!.insertBefore(fragment, node.nextSibling);
  };
}
