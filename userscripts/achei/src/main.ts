import { askConsole, askDocument, combineParsers } from './02_tools';
import { parseDominio } from './parseDominio';
import { parseNodeSiglas } from './parseNodeSiglas';

export const program = () =>
  combineParsers([
    parseNodeSiglas,
    parseDominio,
    askDocument.toParser(),
    askConsole.toParser(),
  ]).map(([nodeSiglas, dominio, doc, { log }]) => {
    const template = doc.createElement('template');
    const link = Object.assign(doc.createElement('a'), {
      href: '',
      target: '_blank',
      textContent: 'Abrir na Intra',
    });
    template.content.append(' [ ', link, ' ]');
    for (const { node, sigla } of nodeSiglas) {
      link.href = `https://intra.trf4.jus.br/membros/${sigla}${dominio}-jus-br`;
      const fragment = doc.importNode(template.content, true);
      node.parentNode.insertBefore(fragment, node.nextSibling);
    }
    const linksCriados = nodeSiglas.length;
    const s = linksCriados > 1 ? 's' : '';
    log(`${linksCriados} link${s} criado${s}.`);
  });
