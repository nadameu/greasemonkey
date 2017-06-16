// ==UserScript==
// @name        Achei
// @namespace   http://nadameu.com.br/achei
// @description Link para informações da Intra na página do Achei!
// @include     http://centralrh.trf4.gov.br/achei/pesquisar.php?acao=pesquisar*
// @include     http://serh.trf4.jus.br/achei/pesquisar.php?acao=pesquisar*
// @version     6
// @grant       none
// ==/UserScript==

const Task = (() => {
	function Task(fork) {
		if (! (this instanceof Task)) return new Task(fork);
		this.fork = fork;
	}
	Task.prototype = {
		constructor: Task,
		ap(a) {
			return Task.all([a, this]).map(([f, x]) => f(x));
		},
		chain(f) {
			return Task((rej, res) => this.fork(rej, x => f(x).fork(rej, res)));
		},
		map(f) {
			return Task((rej, res) => this.fork(rej, x => res(f(x))));
		}
	};
	Task.all = ts => Task((rej, res) => {
		const state = new Array(ts.length);
		const go = i => x => {
			state[i] = x;
			if (Array.from(state.keys()).every(i => i in state)) res(state);
		};
		ts.forEach((t, i) => t.fork(rej, go(i)));
	});
	Task.of = x => Task((rej, res) => res(x));
	Task.rejected = e => Task(rej => rej(e));

	return Task;
})();

const main = function() {
	const form = Task.of(document)
		.map(doc => doc.querySelector('form[name="formulario"]'))
		.chain(fromNullable('Formulário não encontrado'));

	const urlSigla = form
		.map(f => f.local || {})
		.map(l => l.value)
		.chain(fromNullable('Não foi possível obter o local'))
		.map(Number)
		.map(i => i - 1)
		.map(i => ['trf4', 'jfrs', 'jfsc', 'jfpr'][i])
		.chain(fromNullable('Não foi possível estabelecer o domínio'))
		.map(s => `${s}.jus.br`)
		.map(urlDominioSigla);

	const nodes = form
		.map(nodesNextFormulario)
		.map(nodes => nodes
			.filter(contemSigla)
			.map(node => Task.of(node)
				.map(siglaNode)
				.ap(urlSigla)
				.map(linkUrl)
				.map(envolverEmColchetes)
				.map(inserirApos(node))
				.map(() => node)
			)
		)
		.chain(Task.all);

	nodes.fork(
		err => console.error(err),
		nodes => console.log(`${nodes.length} link(s) adicionado(s).`)
	);
};

const fromNullable = errorMsg => x =>
	x == null ?
		Task.rejected(new Error(errorMsg)) :
		Task.of(x);

const nodesNextFormulario = form => {
	const nodes = siblings(form).reduce(({ found, list }, node) => ({
		found: found || node === form,
		list: found ? list.concat(node) : list
	}), { found: false, list: [] }).list;
	const tables = nodes.filter(isTable);

	return tables.length === 0 ?
		nodes :
		Array.concat(...tables.map(childNodes));
};

const siblings = element => Array.from(element.parentNode.childNodes);
const isTable = x => 'tagName' in x && (/^table$/i).test(x.tagName);
const childNodes = table =>
	Array.from(table.querySelector('td:nth-child(2)').childNodes);

const { isSigla, siglaTexto } = (() => {
	const re = /^\s*Sigla:\s*(\w*)\s*$/;
	return {
		isSigla: x => re.test(x),
		siglaTexto: x => x.match(re)[1]
	};
})();

const contemSigla = node => isSigla(node.textContent);
const urlDominioSigla = dominio => sigla =>
	[
		'https://intra.trf4.jus.br/membros/',
		sigla.toLowerCase(),
		dominio.replace(/\./g, '-')
	].join('');

const siglaNode = node => siglaTexto(node.textContent);
const linkUrl = url =>
	Object.assign(document.createElement('a'), {
		href: url,
		target: '_blank',
		textContent: 'Abrir na Intra'
	});

const envolverEmColchetes = link =>
	[
		createText(' [ '),
		link,
		createText(' ]')
	].reduce((acc, x) => {
		acc.appendChild(x);
		return acc;
	}, document.createDocumentFragment());

const createText = text => document.createTextNode(text);
const inserirApos = antigo => novo =>
	antigo.parentElement.insertBefore(novo, antigo.nextSibling);

main();
