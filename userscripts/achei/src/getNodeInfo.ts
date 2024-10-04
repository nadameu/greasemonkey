import { NodeSigla } from './NodeSigla';
import { queryAllX } from './queryAllX';
import { siglaFromText } from './siglaFromText';

export function* getNodeInfo(
  formulario: HTMLFormElement
): Generator<NodeSigla> {
  for (const node of queryAllX<Text>(
    [
      'following-sibling::text()',
      'following-sibling::table//td[2]/text()',
    ].join('|'),
    formulario
  )) {
    const text = node.nodeValue;
    if (!text) continue;
    const sigla = siglaFromText(text);
    if (!sigla) continue;
    yield { node, sigla };
  }
}
