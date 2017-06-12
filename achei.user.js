// ==UserScript==
// @name        Achei
// @namespace   http://nadameu.com.br/achei
// @description Link para informações da Intra na página do Achei!
// @include     http://centralrh.trf4.gov.br/achei/pesquisar.php?acao=pesquisar*
// @include     http://serh.trf4.jus.br/achei/pesquisar.php?acao=pesquisar*
// @version     5
// @grant       none
// ==/UserScript==

Array.prototype.chain = function(f) {
	return Array.concat(...this.map(f));
};
Array.prototype.traverse = function(T, f) {
	return this.reduce(
		(acc, x) =>
			liftA2(arr => y => arr.concat(y), acc, f(x)),
		T.of([])
	);
};

function Monad() {
	throw new TypeError('Not to be called directly');
}
Monad.prototype = {
	ap(a) { return a.chain(f => this.map(f)); },
	chain() { throw new TypeError('Not implemented'); },
	map(f) { return this.chain(x => (this.of || this.constructor.of || console.error(this))(f(x))); }
};
Monad.extend = (constructor, prototype = {}, static = {}) => {
	Object.assign(constructor,
		{
			prototype: Object.assign(Object.create(Monad.prototype),
				{ constructor },
				prototype
			),
			of() { throw new TypeError('Not implemented'); }
		},
		static
	);
};
Monad.extendSum = (main, constructor, prototype) => {
	Object.assign(constructor,
		{
			prototype: Object.assign(Object.create(main.prototype),
				{
					constructor,
					of: main.of
				},
				prototype
			)
		}
	);
};

function IO(f) {
	if (! (this instanceof IO)) return new IO(f);
	this.performUnsafeIO = f;
}
Monad.extend(IO,
	{ chain(f) {
		return IO(() =>
			f(this.performUnsafeIO()).performUnsafeIO());
	} },
	{ of: x => IO(() => x) }
);

function Identity(x) {
	if (! (this instanceof Identity)) return new Identity(x);
	this.x = x;
}
Monad.extend(Identity,
	{
		chain(f) { return f(this.x); },
		fold(f) { return f(this.x); },
		traverse(T, f) { return T.of(this.x).chain(f); }
	},
	{ of: Identity }
);

function Maybe() {
	throw new TypeError('Not to be called directly');
}
function Just(x) {
	if (! (this instanceof Just)) return new Just(x);
	this.x = x;
}
function Nothing() {
	if (! (this instanceof Nothing)) return new Nothing();
}
Monad.extend(Maybe, {}, { Just, Nothing, of: Just });
Monad.extendSum(Maybe, Just,
	{
		chain(f) { return f(this.x); },
		fold(f) { return f(this.x); }
	}
);
Monad.extendSum(Maybe, Nothing, {
	chain() { return this; }
});

function Task(fork) {
	if (! (this instanceof Task)) return new Task(fork);
	this.fork = fork;
}
Monad.extend(Task, {
	chain(f) { return Task((rej, res) => this.fork(rej, x => f(x).fork(rej, res))); }
}, {
	of: x => Task((rej, res) => res(x)),
	rejected: e => Task(rej => rej(e))
});

const id = i => i;
const liftA2 = (f, a, b) => b.ap(a.map(f));
const fromNullable = x => x == null ? Nothing() : Just(x);
const tryCatchIO = io => Task((rej, res) => {
	try {
		return res(io.performUnsafeIO());
	} catch (e) {
		return rej(e);
	}
});

const taskify = gen => {
	const translate = x => {
		switch (x.constructor.name) {
			case 'Array': return x.traverse(Task, id);
			case 'IO': return tryCatchIO(x);
			case 'Identity': return Task.of(x.fold(id));
			case 'Just': return Task.of(x.fold(id));
			case 'Nothing': return Task.rejected('Maybe failed');
			case 'Task': return x;
			default: return Task.rejected(['Could not convert:', x]);
		}
	};

	return Task((rej, res) => {
		const g = gen();
		const step = x => {
			const yielded = g.next(x);
			if (yielded.done) return res(yielded.value);
			return translate(yielded.value).fork(rej, step);
		};
		return step();
	});
};

const main = function *() {
	const form = yield yield obterFormulario();

	const urlSigla = yield Maybe.of(form)
		.chain(localFormulario)
		.chain(dominioLocal)
		.map(urlDominioSigla);

	const nodes = Identity.of(form)
		.fold(nodesNextFormulario)
		.filter(contemSigla);

	const adicionarLinkFactory = node =>
		IO.of(node)
			.map(siglaNode)
			.map(urlSigla)
			.chain(linkUrl)
			.chain(envolverEmColchetes);

	const adicionarLink = node => adicionarLinkFactory(node).map(inserirApos(node));

	const transformed = yield nodes.traverse(IO, adicionarLink);

	return `${transformed.length} link(s) adicionado(s).`;
};

const obterFormulario = () =>
	IO(() =>
		fromNullable(document.querySelector('form[name="formulario"]'))
	);
const localFormulario = form =>
	fromNullable(form.local)
	.chain(local => fromNullable(local.value));
const dominioLocal = local =>
	Maybe.of(Number(local))
		.map(i => i - 1)
		.map(i => ['trf4', 'jfrs', 'jfsc', 'jfpr'][i])
		.chain(fromNullable)
		.map(s => `${s}.jus.br`);
const nodesNextFormulario = form => {
	const Any = x => ({
		x,
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
const urlDominioSigla = dominio => sigla =>
	liftA2(
		sigla => dominio => `https://intra.trf4.jus.br/membros/${sigla}${dominio}`,
		Identity.of(sigla).map(s => s.toLowerCase()),
		Identity.of(dominio).map(d => d.replace(/\./g, '-'))
	).fold(id);
const siglaNode = node =>
	Identity.of(node.textContent)
		.fold(siglaTexto);
const linkUrl = url =>
	IO(() =>
		Identity.of(document.createElement('a'))
			.fold(l => Object.assign(l, {
				href: url,
				target: '_blank',
				textContent: 'Abrir na Intra'
			}))
	);
const envolverEmColchetes = link =>
	IO(() =>
		[
			createText(' [ '),
			link,
			createText(' ]')
		].reduce((acc, x) => {
			acc.appendChild(x);
			return acc;
		}, document.createDocumentFragment())
	);
const createText = text => document.createTextNode(text);
const inserirApos = antigo => novo => antigo.parentElement.insertBefore(novo, antigo.nextSibling);

taskify(main).fork(
	e => console.error(e),
	x => console.log(x)
);
