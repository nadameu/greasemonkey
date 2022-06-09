import * as Q from '@nadameu/query';

interface NodeSigla {
  node: Node;
  sigla: string;
}

interface Types<a> {
  Array: Array<a>;
}

function main(doc: Document) {
  const result = Q.lift2(
    getDominio(doc),
    getFormulario(doc).map(getNodeInfo),
    (dominio, nodeInfo) => {
      criarLinks(doc, dominio, nodeInfo);
      const qtd = nodeInfo.length;
      const s = qtd > 1 ? 's' : '';
      console.log(`${qtd} link${s} criado${s}`);
    }
  );
  if (result.tag === 'Fail') {
    console.error(result.history.join('.'));
  }
}

const dominios = {
  '1': 'trf4',
  '2': 'jfrs',
  '3': 'jfsc',
  '4': 'jfpr',
} as const;

const getDominio = (doc: Document) =>
  Q.of(doc)
    .query<HTMLInputElement>('input[name="local"]:checked')
    .one()
    .map(x => x.value)
    .safeMap(x => (((k): k is keyof typeof dominios => k in dominios)(x) ? dominios[x] : null));

const getFormulario = (doc: Document) =>
  Q.of(doc).query<HTMLFormElement>('form[name="formulario"]').one();

const getNodeInfo = (formulario: HTMLFormElement): NodeSigla[] =>
  Array.from(parseFormulario(formulario));

function parseFormulario(formulario: HTMLFormElement) {
  return siblings(formulario).chain(flattenTabela).chain(getNodeSigla);
}

function siblings(node: Node) {
  return Q.unfold(node.nextSibling, s => (s === null ? null : [s, s.nextSibling]));
}

function flattenTabela(node: Node): Q.Query<Node> {
  const qn = Q.of(node);
  if (node instanceof HTMLTableElement)
    return Q.concat(
      Q.of(node)
        .query('td:nth-child(2)')
        .one()
        .mapIterable(celula => celula.childNodes),
      qn
    );
  return qn;
}

const getNodeSigla = (node: Node) =>
  Q.of(node)
    .safeMap(x => x.textContent)
    .chain(siglaFromText)
    .map(sigla => ({ node, sigla }));

const reSigla = /^\s*Sigla:\s*(\S+)\s*(\(antiga:\s*\S+\s*\))?\s*$/;

const siglaFromText = (text: string) =>
  Q.of(text)
    .safeMap(x => x.match(reSigla))
    .map(match => {
      if (match[2]) {
        // Possui sigla antiga e nova
        return match[1]!;
      } else {
        // Possui somente sigla nova
        return match[1]!.toLowerCase();
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

main(document);
