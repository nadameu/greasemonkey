import { askDocument } from './02_tools';
import { NodeSigla } from './NodeSigla';
import { Dominio } from './parseDominio';

export const makeCriarLink = (dominio: Dominio) =>
  askDocument
    .mapReader(doc => doc.createElement('template'))
    .chainReader(template => {
      const link = Object.assign(document.createElement('a'), {
        href: '',
        target: '_blank',
        textContent: 'Abrir na Intra',
      });
      template.append(' [ ', link, ' ]');
      return askDocument.mapReader(doc => ({ node, sigla }: NodeSigla) => {
        link.href = `https://intra.trf4.jus.br/membros/${sigla}${dominio}-jus-br`;
        const fragment = doc.importNode(template.content, true);
        node.parentNode.insertBefore(fragment, node.nextSibling);
      });
    });
