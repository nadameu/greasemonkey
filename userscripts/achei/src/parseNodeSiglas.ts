import { Maybe } from './01_implementations';
import {
  maybe,
  NodeWithParent,
  parseNodeWithParent,
  queryAllX,
} from './02_tools';
import { NodeSigla } from './NodeSigla';
import { parseFormulario } from './parseFormulario';
import { parseSigla } from './parseSigla';

const selectors = /* #__PURE__ */ ['', 'table//td[2]/'].map(
  path => `following-sibling::${path}text()`
);
const selector = /* #__PURE__ */ selectors.join('|');

export const parseNodeSiglas = parseFormulario.map(formulario =>
  queryAllX<Text>(selector)(formulario)
    .values()
    .flatMap(text => parseNodeWithParent(text).chain(parseNodeSigla))
    .toArray()
);

const parseNodeSigla = (node: NodeWithParent<Text>): Maybe<NodeSigla> =>
  maybe(node.nodeValue)
    .chain(parseSigla)
    .map(sigla => ({ node, sigla }));
