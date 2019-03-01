// ==UserScript==
// @name        Achei
// @namespace   http://nadameu.com.br/achei
// @description Link para informações da Intra na página do Achei!
// @include     http://centralrh.trf4.gov.br/achei/pesquisar.php?acao=pesquisar*
// @include     http://serh.trf4.jus.br/achei/pesquisar.php?acao=pesquisar*
// @version     14.0.0
// @grant       none
// ==/UserScript==

const reSigla = /^Sigla:\s*(\S+)\s*$/;

const fromNullable = <T>(x: T | null | undefined, msg: string): Promise<T> =>
	x == null ? Promise.reject(new Error(msg)) : Promise.resolve(x);

const query = <T extends Element>(selector: string, msg: string): Promise<T> =>
	fromNullable<T>(document.querySelector<T>(selector), msg);

const formularioPromise = query<HTMLFormElement>(
	'form[name="formulario"]',
	'Formulário não encontrado!',
);

const dominioPromise = Promise.resolve().then(async () => {
	const input = await query('[name="local"]:checked', 'Não foi selecionado local!');
	const node = await fromNullable(input.nextSibling, 'Local selecionado não possui texto!');
	const txt = await fromNullable(node.textContent, 'Local selecionado não possui texto!');
	return txt.trim().toLowerCase();
});

const createSnippet = (() => {
	const template = document.createElement('template');
	template.innerHTML = ' [ <a href="" target="_blank">Abrir na Intra</a> ]';
	const { content } = template;
	const link = content.querySelector('a') as HTMLAnchorElement;
	return (url: string) => {
		link.href = url;
		return document.importNode(content, true);
	};
})();

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const makeReduzirNodes = (dominio: string) => async (soma: Promise<number>, node: Node) => {
	const txt = await fromNullable(node.textContent, '');
	const matches = reSigla.exec(txt);
	if (matches) {
		const fragment = createSnippet(
			`https://intra.trf4.jus.br/membros/${matches[1].toLowerCase()}${dominio}-jus-br`,
		);
		(node.parentNode as Node).insertBefore(fragment, node.nextSibling);
		return (await soma) + 1;
	}
	return soma;
};

const unfold = <T, U>(f: (_: T) => [U, T] | null, x: T): U[] => {
	const result: U[] = [];
	let current = f(x);
	while (current !== null) {
		result.push(current[0]);
		current = f(current[1]);
	}
	return result;
};

const nextSiblings = (node: Node): Node[] =>
	unfold(currentNode => {
		const next = currentNode.nextSibling;
		if (next === null) return null;
		return [next, next];
	}, node);

const reduzirTabelas = (nodes: Node[]): Node[] =>
	nodes.reduce<Node[]>((acc, node) => {
		if (node instanceof Element && node.matches('table')) {
			const celula = node.querySelector('td:nth-child(2)');
			if (celula) {
				return acc.concat(Array.from(celula.childNodes));
			}
		}
		acc.push(node);
		return acc;
	}, []);

// @ts-ignore
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const main = async () => {
	const dominio = await dominioPromise;
	const formulario = await formularioPromise;
	const qtd = await reduzirTabelas(nextSiblings(formulario)).reduce(
		makeReduzirNodes(dominio),
		Promise.resolve(0),
	);
	const s = qtd > 1 ? 's' : '';
	return `${qtd} link${s} criado${s}.`;
};

// eslint-disable-next-line no-console
main().then(x => console.log('Resultado:', x), e => console.error('Erro:', e));
