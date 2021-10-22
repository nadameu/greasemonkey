// ==UserScript==
// @name        Achei
// @namespace   http://nadameu.com.br/achei
// @description Link para informações da Intra na página do Achei!
// @include     http://centralrh.trf4.gov.br/achei/pesquisar.php?acao=pesquisar
// @include     http://centralrh.trf4.gov.br/achei/pesquisar.php?acao=pesquisar&*
// @include     https://centralrh.trf4.gov.br/achei/pesquisar.php?acao=pesquisar
// @include     https://centralrh.trf4.gov.br/achei/pesquisar.php?acao=pesquisar&*
// @include     http://serh.trf4.jus.br/achei/pesquisar.php?acao=pesquisar
// @include     http://serh.trf4.jus.br/achei/pesquisar.php?acao=pesquisar&*
// @include     https://serh.trf4.jus.br/achei/pesquisar.php?acao=pesquisar
// @include     https://serh.trf4.jus.br/achei/pesquisar.php?acao=pesquisar&*
// @require     https://raw.githubusercontent.com/nadameu/greasemonkey/Maybe-v1.0.0/lib/Maybe.js
// @version     15.0.0
// @grant       none
// ==/UserScript==

interface State {
  dominio: string;
  nodeInfo: NodeSigla[];
}

interface NodeSigla {
  node: Node;
  sigla: string;
}

type Maybe<a> = import('./lib/Maybe').Maybe<a>;

async function main(doc: Document) {
  const [dominio, nodeInfo] = await maybe.all(getDominio(doc), getFormulario(doc).map(getNodeInfo));
  criarLinks(doc, dominio, nodeInfo);
  const qtd = nodeInfo.length;
  const s = qtd > 1 ? 's' : '';
  console.log(`${qtd} link${s} criado${s}`);
}

const getDominio = (doc: Document): Maybe<string> =>
  maybe
    .Just(doc)
    .safeMap(x => x.querySelector('[name="local"]:checked'))
    .safeMap(x => x.nextSibling)
    .safeMap(x => x.textContent)
    .map(x => x.trim());

const getFormulario = (doc: Document): Maybe<HTMLFormElement> =>
  maybe.Just(doc).safeMap(x => x.querySelector<HTMLFormElement>('form[name="formulario"]'));

const getNodeInfo = (formulario: HTMLFormElement): NodeSigla[] =>
  Array.from(parseFormulario(formulario));

function* parseFormulario(formulario: HTMLFormElement) {
  for (const sibling of siblings(formulario))
    for (const node of flattenTabela(sibling)) yield* getNodeSigla(node);
}

function* siblings(node: Node) {
  for (let s = node.nextSibling; s !== null; s = s.nextSibling) yield s;
}

function* flattenTabela(node: Node) {
  if (node instanceof HTMLTableElement) {
    const celula = node.querySelector('td:nth-child(2)');
    if (!celula) throw new Error('Célula não encontrada.');
    yield* celula.childNodes;
  }
  yield node;
}

const getNodeSigla = (node: Node): Maybe<NodeSigla> =>
  maybe
    .Just(node)
    .safeMap(x => x.textContent)
    .chain(siglaFromText)
    .map(sigla => ({ node, sigla }));

const reSigla = /^\s*Sigla:\s*(\S+)\s*(\(antiga:\s*\S+\s*\))?\s*$/;

const siglaFromText = (text: string): Maybe<string> =>
  maybe
    .Just(text)
    .safeMap(x => x.match(reSigla))
    .map(match => {
      if (match[2]) {
        // Possui sigla antiga e nova
        return match[1];
      } else {
        // Possui somente sigla nova
        return match[1].toLowerCase();
      }
    });

function criarLinks(doc: Document, dominio: string, nodeInfo: NodeSigla[]) {
  const template = doc.createElement('template');
  template.innerHTML = ' [ <a href="" target="_blank">Abrir na Intra</a> ]';
  const content = template.content;
  const link = content.querySelector('a')!;
  for (const { node, sigla } of nodeInfo) {
    link.href = `https://intra.trf4.jus.br/membros/${sigla}${dominio}-jus-br`;
    const fragment = doc.importNode(content, true);
    node.parentNode!.insertBefore(fragment, node.nextSibling);
  }
}

main(document).catch(e => {
  console.error(e);
});
