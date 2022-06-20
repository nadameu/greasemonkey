interface NodeSigla {
  node: Node;
  sigla: string;
}

function main(doc: Document) {
  const dominio = getDominio(doc);
  if (!dominio) throw new Error('Não foi possível verificar o domínio.');
  const formulario = getFormulario(doc);
  if (!formulario) throw new Error('Não foi possível obter o formulário.');
  const criarLinks = makeCriarLinks(doc, dominio);
  const nodeInfo = getNodeInfo(formulario);
  for (const nodeSigla of nodeInfo) {
    criarLinks(nodeSigla);
  }
  const qtd = nodeInfo.length;
  const s = qtd > 1 ? 's' : '';
  console.log(`${qtd} link${s} criado${s}`);
}

const dominios = {
  '1': 'trf4',
  '2': 'jfrs',
  '3': 'jfsc',
  '4': 'jfpr',
} as const;

const getDominio = (doc: Document) => {
  const value = doc.querySelector<HTMLInputElement>('input[name="local"]:checked')?.value;
  if (!value) return null;
  if (!(value in dominios)) return null;
  return dominios[value as keyof typeof dominios];
};

const getFormulario = (doc: Document) =>
  doc.querySelector<HTMLFormElement>('form[name="formulario"]');

const getNodeInfo = (formulario: HTMLFormElement) => {
  const nodeInfo: NodeSigla[] = [];
  for (const sibling of siblings(formulario))
    for (const node of flattenTabela(sibling)) {
      const nodeSigla = getNodeSigla(node);
      if (nodeSigla) nodeInfo.push(nodeSigla);
    }
  return nodeInfo;
};

function* siblings(node: Node) {
  for (let s = node.nextSibling; s; s = s.nextSibling) yield s;
}

function* flattenTabela(node: Node) {
  if (node instanceof HTMLTableElement)
    yield* node.querySelector('td:nth-child(2)')?.childNodes ?? [];
  yield node;
}

const getNodeSigla = (node: Node): NodeSigla | null => {
  const text = node.textContent;
  if (!text) return null;
  const sigla = siglaFromText(text);
  if (!sigla) return null;
  return { node, sigla };
};

const reSigla = /^\s*Sigla:\s*(\S+)\s*(\(antiga:\s*\S+\s*\))?\s*$/;

const siglaFromText = (text: string) => {
  const match = text.match(reSigla);
  if (!match) return null;
  if (match[2]) {
    // Possui sigla antiga e nova
    return match[1]!;
  } else {
    // Possui somente sigla nova
    return match[1]!.toLowerCase();
  }
};

function makeCriarLinks(doc: Document, dominio: string) {
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

main(document);
