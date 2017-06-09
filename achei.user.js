// ==UserScript==
// @name        Achei
// @namespace   http://nadameu.com.br/achei
// @description Link para informações da Intra na página do Achei!
// @include     http://centralrh.trf4.gov.br/achei/pesquisar.php?acao=pesquisar*
// @include     http://serh.trf4.jus.br/achei/pesquisar.php?acao=pesquisar*
// @version     3
// @grant       none
// ==/UserScript==

Function.prototype.map = function(f) { return (...args) => f(this(...args)); };

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
	map(f) { return this.chain(x => Just(f(x))); }
});
const Nothing = () => ({
	'@@type': 'Nothing',
	ap: () => Nothing(),
	chain: () => Nothing(),
	map: () => Nothing()
});
const Task = fork => ({
	'@@type': 'Task',
	fork,
	ap(a) { return a.chain(f => this.map(f)); },
	chain: f => Task((rej, res) => fork(rej, x => f(x).fork(rej, res))),
	map(f) { return this.chain(x => Task.of(f(x))); }
});
Task.of = x => Task((rej, res) => res(x));
Task.rejected = e => Task(rej => rej(e));

const append = postfix => text => text + postfix;
const call = (method, ...args) => obj => obj[method].apply(obj, args);
const compose = (...fs) => fs.reduceRight((a, b) => a.map(b));
const decrement = x => x - 1;
const map = f => F => F.map(f);
const mcompose = (...fs) => mpipe(...fs.reverse());
const mpipe = (f1, ...fs) => (...args) => fs.reduce((x, f) => x.chain(f), f1(...args));
const path = steps => obj => steps.reduce((cur, n) => cur == null ? cur : cur[n], obj);
const prop = p => path([p]);
const fromNullable = x => x == null ? Nothing() : Just(x);

const main = () => {
	function *logic() {
		const doc = yield IO.of(document);
		const form = yield formularioDocumento(doc);
		const nodes = nodesNextFormulario(form).filter(contemSigla);
		const dominio = yield dominioFormulario(form);
		for (const node of nodes) {
			const url = urlNode(node)(dominio);
			const link = linkUrl(url)(doc);
			const frag = envolverEmColchetes(link)(doc);
			apensarFragmento(frag)(node);
		}
		return nodes;
	}

	function translator(x) {
		switch (x['@@type']) {
			case 'IO':
				return Task.of(x.performUnsafeIO());

			case 'Just':
				return Task.of(x.x);

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
				const result = g.next(value);
				return result.done ?
            Pure(result.value) :
            Free.liftF(result.value).chain(step);
			};
			return step();
		});
	}

	run(logic).foldMap(translator, Task).fork(
		e => console.error(e),
		x => console.log(x)
	);
};

const formularioDocumento = compose(fromNullable, call('querySelector', 'form[name="formulario"]'));
const localFormulario = compose(fromNullable, path(['local', 'value']));
const dominioLocal = compose(map(append('.jus.br')), fromNullable, n => prop(n)(['trf4', 'jfrs', 'jfsc', 'jfpr']), decrement, Number);
const dominioFormulario = mcompose(dominioLocal, localFormulario);
const nodesNextFormulario = form => {
	let allNodes = compose(Array.from, path(['parentNode', 'childNodes']))(form);
	let formIndex = allNodes.indexOf(form);
	let nextNodes = allNodes.filter((x, i) => i > formIndex);
	const tables = nextNodes.filter(x => 'tagName' in x && x.tagName.toLowerCase() === 'table');
	if (tables.length > 0) {
		return tables.chain(compose(x => x.getOrElse([]), map(Array.from), fromNullable, prop('childNodes'), call('querySelector', 'td:nth-child(2)')));
	}
	return nextNodes;
};
const { isSigla, siglaTexto } = (() => {
	const re = /^\s*Sigla:\s*(\w*)\s*$/;
	return {
		isSigla: x => re.test(x),
		siglaTexto: compose(prop(1), x => x.match(re))
	};
})();
const contemSigla = compose(isSigla, prop('textContent'));
const urlSigla = sigla => dominio => `https://intra.trf4.jus.br/membros/${sigla.toLowerCase()}${dominio.replace(/\./g, '-')}`;
const urlNode = compose(urlSigla, siglaTexto, prop('textContent'));
const linkUrl = url => doc => Object.assign(doc.createElement('a'), { href: url, target: '_blank', textContent: 'Abrir na Intra' });
const envolverEmColchetes = link => doc => {
	const frag = doc.createDocumentFragment();
	frag.appendChild(doc.createTextNode(' [ '));
	frag.appendChild(link);
	frag.appendChild(doc.createTextNode(' ]'));
	return frag;
};
const apensarFragmento = frag => node => node.parentElement.insertBefore(frag, node.nextSibling);

main();
