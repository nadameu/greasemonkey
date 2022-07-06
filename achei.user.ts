// ==UserScript==
// @name        Achei
// @namespace   http://nadameu.com.br/achei
// @description Link para informações da Intra na página do Achei!
// @include     http://centralrh.trf4.gov.br/achei/pesquisar.php?acao=pesquisar*
// @include     http://serh.trf4.jus.br/achei/pesquisar.php?acao=pesquisar*
// @version     14.0.1
// @grant       none
// ==/UserScript==

const reSigla = /^Sigla:\s*(\S+)\s*$/;

const safe = <a, b>(f: (_: a) => b) => (x: a | null | undefined): b | null | undefined =>
	x == null ? (x as null | undefined) : f(x);

const fromNullable = <T>(x: T | null | undefined, msg: string): Promise<T> =>
	x == null ? Promise.reject(new Error(msg)) : Promise.resolve(x);

const query = <T extends Element>(selector: string, msg: string): Promise<T> =>
	fromNullable<T>(document.querySelector<T>(selector), msg);

const getFormulario = () =>
	query<HTMLFormElement>('form[name="formulario"]', 'Formulário não encontrado!');
const getDominio = () =>
	query('[name="local"]:checked', 'Não foi selecionado local!')
		.then(safe(x => x.nextSibling))
		.then(safe(txt => txt.textContent))
		.then(safe(txt => txt.trim().toLowerCase()))
		.then(x => fromNullable(x, 'Local selecionado não possui texto!'));

let makeCreateSnippet: (url: string) => DocumentFragment;
{
	const template = document.createElement('template');
	template.innerHTML = ' [ <a href="" target="_blank">Abrir na Intra</a> ]';
	const { content } = template;
	const link = content.querySelector('a') as HTMLAnchorElement;
	makeCreateSnippet = url => {
		link.href = url;
		return document.importNode(content, true);
	};
}

const makeInsertSnippet = (dominio: string) => {
	const createSnippet = (sigla: string) =>
		makeCreateSnippet(`https://intra.trf4.jus.br/membros/${sigla}${dominio}-jus-br`);
	return (node: Node): boolean => {
		const txt = (node.textContent || '').trim();
		if (txt === '') return false;
		const [sigla] = (reSigla.exec(txt) as [string, ...string[]] | null) || [null];
		if (sigla === null) return false;
		node.parentNode!.insertBefore(createSnippet(sigla.toLowerCase()), node.nextSibling);
		return true;
	};
};

const nextSiblings = function* (node: Node) {
	let current = node.nextSibling;
	while (current !== null) {
		yield current;
		current = current.nextSibling;
	}
};

const reduzirTabelas = (node: Node) => {
	if (node instanceof Element && node.matches('table')) {
		const celula = node.querySelector('td:nth-child(2)');
		if (celula) {
			return Array.from(celula.childNodes);
		}
	}
	return [node];
};

const main = () =>
	Promise.all([getDominio(), getFormulario()]).then(([dominio, formulario]) => {
		const insertSnippet = makeInsertSnippet(dominio);
		const qtd = Array.from(nextSiblings(formulario))
			.reduce((acc: Node[], x) => acc.concat(reduzirTabelas(x)), [])
			.reduce((acc, x) => (insertSnippet(x) ? acc + 1 : acc), 0);
		const s = qtd > 1 ? 's' : '';
		return `${qtd} link${s} criado${s}.`;
	});

// eslint-disable-next-line no-console
main().then(
	x => console.log('Resultado:', x),
	e => console.error('Erro:', e),
);

export {};
