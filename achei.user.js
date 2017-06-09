// ==UserScript==
// @name        Achei
// @namespace   http://nadameu.com.br/achei
// @description Link para informações da Intra na página do Achei!
// @include     http://centralrh.trf4.gov.br/achei/pesquisar.php?acao=pesquisar*
// @include     http://serh.trf4.jus.br/achei/pesquisar.php?acao=pesquisar*
// @version     4
// @grant       none
// ==/UserScript==

Array.prototype.chain = function(f) { return Array.concat(...this.map(f)); };
Function.prototype.chain = function(f) { return (...args) => f(this(...args))(...args); };

const Impure = (x, f) => ({
	'@@type': 'Impure',
	ap: a => Impure(x, y => f(y).ap(a)),
	chain: g => Impure(x, y => f(y).chain(g)),
	foldMap: (i, T) =>
		x === '*' ?
			f().foldMap(i, T) :
			i(x).chain(result => f(result).foldMap(i, T)),
	map: g => Impure(x, y => f(y).map(g))
});
const Pure = x => ({
	'@@type': 'Pure',
	ap: a => a.map(f => f(x)),
	chain: f => f(x),
	foldMap: (i, T) => T.of(x),
	map: f => Pure(f(x))
});
const Free = {
	Pure,
	Impure,
	liftF: f => Impure(f, Pure)
};
const Identity = x => ({
	'@@type': 'Identity',
	x,
	ap: a => a.map(f => f(x)),
	chain: f => f(x),
	fold: f => f(x),
	map: f => Identity(f(x)),
	traverse: (T, f) => T.of(x).chain(f)
});
Identity.of = Identity;
const IO = performUnsafeIO => ({
	'@@type': 'IO',
	performUnsafeIO,
	ap(a) { return a.chain(f => this.map(f)); },
	chain: f => IO(() => f(performUnsafeIO()).performUnsafeIO()),
	map(f) { return this.chain(x => IO.of(f(x))); }
});
IO.of = x => IO(() => x);
const Just = x => ({
	'@@type': 'Just',
	x,
	ap(a) { return a.chain(f => this.map(f)); },
	chain: f => f(x),
	fold: f => f(x),
	map(f) { return this.chain(x => Just(f(x))); }
});
const Nothing = () => ({
	'@@type': 'Nothing',
	ap: () => Nothing(),
	chain: () => Nothing(),
	map: () => Nothing()
});
const Maybe = { Just, Nothing, of: Just };
const Task = fork => ({
	'@@type': 'Task',
	fork,
	ap(a) { return a.chain(f => this.map(f)); },
	chain: f => Task((rej, res) => fork(rej, x => f(x).fork(rej, res))),
	map(f) { return this.chain(x => Task.of(f(x))); }
});
Task.of = x => Task((rej, res) => res(x));
Task.rejected = e => Task(rej => rej(e));

const id = i => i;
const liftA2 = (f, a, b) => b.ap(a.map(f));
const fromNullable = x => x == null ? Nothing() : Just(x);

const main = () => {
	function *logic() {
		const doc = yield IO.of(document);
		const form = yield Identity.of(doc)
			.fold(formularioDocumento);
		const dominio = yield Identity.of(form)
			.chain(localFormulario)
			.fold(dominioLocal);
		const nodes = Identity.of(form)
			.fold(nodesNextFormulario)
			.filter(contemSigla);
		for (let node of nodes) {
			const frag = linkUrl(urlNode(node)(dominio)).chain(envolverEmColchetes)(doc);
			apensarFragmento(frag)(node);
		}
		return nodes;
	}

	function translator(x) {
		console.log('x', x);
		switch (x['@@type']) {
			case 'IO':
				return Task.of(x.performUnsafeIO());

			case 'Identity':
				return Task.of(x.fold(id));

			case 'Just':
				return Task.of(x.fold(id));

			case 'Nothing':
				return Task.rejected('Maybe failed');

			default:
				return Task.rejected(x);
		}
	}

	function run(gen) {
		return Free.Impure('*', () => {
			const g = gen();
			const step = value => {
				const { done, value: next } = g.next(value);
				return done ? Pure(next) : Free.liftF(next).chain(step);
			};
			return step();
		});
	}

	run(logic).foldMap(translator, Task).fork(
		e => console.error(e),
		x => console.log(x)
	);
};

const formularioDocumento = doc =>
	Identity.of(doc.querySelector('form[name="formulario"]'))
		.traverse(Maybe, fromNullable);
const localFormulario = form =>
	fromNullable(form.local)
	.chain(local => fromNullable(local.value));
const dominioLocal = local =>
	Identity.of(Number(local))
		.map(i => i - 1)
		.map(i => ['trf4', 'jfrs', 'jfsc', 'jfpr'][i])
		.traverse(Maybe, fromNullable)
		.map(s => `${s}.jus.br`);
const nodesNextFormulario = form => {
	const Any = x => ({
		x,
		fold: f => f(x),
		concat: ({ x: y }) => Any(x || y)
	});
	Any.empty = () => Any(false);
	const AfterFound = (found, list) => ({
		found,
		list,
		concat: ({ found: f2, list: l2 }) => AfterFound(found.concat(f2), found.x ? list.concat(l2) : list)
	});
	AfterFound.empty = () => AfterFound(Any.empty(), []);

	const afterFound = form => reducer => (acc, x) => reducer(acc, AfterFound(Any(x === form), [x]));
	const initial = AfterFound.empty();
	const reducer = (acc, x) => acc.concat(x);
	const nodes = siblings(form).reduce(afterFound(form)(reducer), initial).list;
	const tables = nodes.filter(isTable);
	return tables.length === 0 ?
		nodes :
		tables.reduce((acc, x) => reducer(acc,
			Array.from(x.querySelectorAll('td:nth-child(2)'))
				.chain(c => [...c.childNodes])
		), []);
};
const siblings = element => Array.from(element.parentNode.childNodes);
const isTable = x => 'tagName' in x && (/^table$/i).test(x.tagName);
const { isSigla, siglaTexto } = (() => {
	const re = /^\s*Sigla:\s*(\w*)\s*$/;
	return {
		isSigla: x => re.test(x),
		siglaTexto: x => x.match(re)[1]
	};
})();
const contemSigla = node => isSigla(node.textContent);
const urlSigla = sigla => dominio =>
	liftA2(
		sigla => dominio => `https://intra.trf4.jus.br/membros/${sigla}${dominio}`,
		Identity.of(sigla).map(s => s.toLowerCase()),
		Identity.of(dominio).map(d => d.replace(/\./g, '-'))
	).fold(id);
const urlNode = node =>
	Identity.of(node.textContent)
	.map(siglaTexto)
	.fold(urlSigla);
const linkUrl = url => doc =>
	Identity.of(doc.createElement('a'))
		.fold(l => Object.assign(l, {
			href: url,
			target: '_blank',
			textContent: 'Abrir na Intra'
		}));
const envolverEmColchetes = link => doc => {
	const frag = doc.createDocumentFragment();
	frag.appendChild(doc.createTextNode(' [ '));
	frag.appendChild(link);
	frag.appendChild(doc.createTextNode(' ]'));
	return frag;
};
const apensarFragmento = frag => node => node.parentElement.insertBefore(frag, node.nextSibling);

main();
