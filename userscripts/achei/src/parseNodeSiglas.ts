import { Maybe } from './01_implementations';
import type { NodeWithParent } from './02_tools';
import * as tools from './02_tools';

export interface NodeSigla {
  node: NodeWithParent<Text>;
  sigla: Sigla;
}

const parseFormulario = tools.askDocument
  .chain(tools.queryUnique<HTMLFormElement>('form[name="formulario"]'))
  .chain(tools.parseNodeWithDocument);

const selectors = /* #__PURE__ */ ['', 'table//td[2]/'].map(
  path => `following-sibling::${path}text()`
);
const selector = /* #__PURE__ */ selectors.join('|');

export const parseNodeSiglas = parseFormulario.map(formulario =>
  tools
    .queryAllX<Text>(selector)(formulario)
    .values()
    .flatMap(text => tools.parseNodeWithParent(text).chain(parseNodeSigla))
    .toArray()
);

const parseNodeSigla = (node: NodeWithParent<Text>): Maybe<NodeSigla> =>
  tools
    .maybe(node.nodeValue)
    .chain(parseSigla)
    .map(sigla => ({ node, sigla }));

const reSigla = /^\s*Sigla:\s*(\S+)\s*(\(antiga:\s*\S+\s*\))?\s*$/;

declare const SiglaSymbol: unique symbol;
export type Sigla = string & { [SiglaSymbol]: Sigla };

export const parseSigla = (text: string): Maybe<Sigla> =>
  tools
    .maybe(text.match(reSigla))
    .chain(
      tools.maybeBool(<T>(xs: ArrayLike<T>): xs is [T, T, T] => xs.length === 3)
    )
    .map(match => {
      if (match[2]) {
        // Possui sigla antiga e nova
        return match[1] as Sigla;
      } else {
        // Possui somente sigla nova
        return match[1].toLowerCase() as Sigla;
      }
    });
