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

const reSigla = /^\s*Sigla:\s*(\S+)\s*(\(antiga:\s*\S+\s*\))?\s*$/;

main(document).catch(e => {
  console.error(e);
});

async function main(doc: HTMLDocument) {
  const dominio = await getDominio(doc);
  const formulario = await getFormulario(doc);
  const nodeInfo = await getNodeInfo(formulario);
  criarLinks(doc, dominio, nodeInfo);
  const qtd = nodeInfo.length;
  const s = qtd > 1 ? 's' : '';
  console.log(`${qtd} link${s} criado${s}`);
}

async function getFormulario(doc: HTMLDocument): Promise<HTMLFormElement> {
  const formulario = doc.querySelector<HTMLFormElement>('form[name="formulario"]');
  if (formulario == null) throw new Error('Formulário não encontrado.');
  return formulario;
}

async function getDominio(doc: HTMLDocument): Promise<string> {
  const dominio = doc
    .querySelector('[name="local"]:checked')
    ?.nextSibling?.textContent?.trim()
    .toLowerCase();
  if (dominio == null) throw new Error('Domínio não encontrado.');
  return dominio;
}

async function getNodeInfo(formulario: HTMLFormElement): Promise<NodeSigla[]> {
  const info = Array.from(
    (function* () {
      for (const sibling of siblings(formulario))
        for (const node of flattenTabela(sibling)) yield* getNodeSigla(node);
    })()
  );
  if (info.length === 0) throw new Error('Nenhuma sigla encontrada.');
  return info;
}

function* siblings(node: Node) {
  for (let current = node.nextSibling; current !== null; current = current.nextSibling)
    yield current;
}

function flattenTabela(node: Node): Iterable<Node> {
  if (node instanceof HTMLTableElement) {
    const celula = node.querySelector('td:nth-child(2)');
    if (!celula) throw new Error('Célula não encontrada.');
    return celula.childNodes;
  }
  return [node];
}

function getNodeSigla(node: Node): [NodeSigla] | [] {
  const text = node.textContent;
  if (!text) return [];
  const match = text.match(reSigla);
  if (!match) return [];
  const sigla = siglaFromMatch(match);
  return sigla == null ? [] : [{ node, sigla }];
}

function siglaFromMatch(match: RegExpMatchArray): string {
  if (!match[2]) {
    // Possui somente sigla antiga
    return match[1].toLowerCase();
  } else {
    // Possui sigla antiga e nova
    return match[1];
  }
}

function criarLinks(doc: HTMLDocument, dominio: string, nodeInfo: NodeSigla[]) {
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
