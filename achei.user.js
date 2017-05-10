// ==UserScript==
// @name        Achei
// @namespace   http://nadameu.com.br/achei
// @description Link para informações da Intra na página do Achei!
// @include     http://centralrh.trf4.gov.br/achei/pesquisar.php?acao=pesquisar*
// @version     1
// @grant       none
// ==/UserScript==

// FuturePromise :: (a -> b) -> Promise (a -> b)
function FuturePromise(fn) {
	let run;
	const promise = new Promise(resolve => run = () => resolve(fn()));
	promise.run = run;
	return promise;
}

// Promise#map :: (a -> b) -> Promise b
Promise.prototype.map = Promise.prototype.then;
// Promise#ap :: a -> Promise b
Promise.prototype.ap = function(x) {
	return this.then(f => f(x));
};

// curry :: (((b, c, d, ...) -> a), b, c, d, ...) -> (e, f, g, ...) -> a
const curry = function(fn, ...args) {
	return function(...extraArgs) {
		const argsSoFar = args.concat(extraArgs);
		if (argsSoFar.length < fn.length) return curry(fn, ...argsSoFar);
		return fn(...argsSoFar);
	};
};
// pluck :: String -> Object -> a
const pluck = curry((attr, obj) => obj[attr]);
// pipe2 :: (a -> b), (b -> c) -> (a -> c)
const pipe2 = (f, g) => (...args) => g(f(...args));
// pipe :: (a -> b), (b -> ...), ..., (... -> c) -> (a -> c)
const pipe = (...funcoes) => funcoes.reduce(pipe2);
// compose :: (... -> c), ..., (b -> ...), (a -> b) -> (a -> c)
const compose = (...funcoes) => funcoes.reduceRight(pipe2);
// map :: (a -> b) -> f a -> f b
const map = curry((fn, obj) => obj.map(fn));
// apply :: f (a -> b) -> a -> f b
const apply = curry((m, obj) => m.ap(obj));
// chain :: (a -> f b) -> f a -> f b
const chain = curry((fn, obj) => obj.chain(fn));
// reduce :: (a -> b) -> b -> f a -> b
const reduce = curry((fn, acc, obj) => obj.reduce(fn, acc));
// trace :: String -> a -> _, a
const trace = curry((texto, x) => {
	console.log(texto, x);
	return x;
});

// inserirApos :: Node, Node -> Node
const inserirApos = (antigo, novo) => {
	antigo.parentElement.insertBefore(novo, antigo.nextSibling);
	return novo;
};

// elementosSeguintes :: Node -> [Node]
const elementosSeguintes = first => {
	const arr = [];
	for (let next = first.nextSibling; next; next = next.nextSibling) {
		arr.push(next);
	}
	return arr;
};

const reSigla = /^Sigla: (.*)$/;
// textoEhSigla :: String -> Boolean
const textoEhSigla = texto => reSigla.test(texto);
// siglaDeTexto :: String -> String
const siglaDeTexto = texto => texto.match(reSigla)[1];

// getText :: Node -> String
const getText = pluck('textContent');

// elementoEhSigla :: Node -> Boolean
const elementoEhSigla = compose(textoEhSigla, getText);
// siglaDeElemento :: Node -> String
const siglaDeElemento = compose(siglaDeTexto, getText);
// dominioSiglaParaUrl :: String -> String -> String
const dominioSiglaParaUrl = curry((dominio, sigla) => `https://intra.trf4.jus.br/membros/${sigla.toLowerCase()}${dominio.replace(/\./g, '-')}`);

// filtrarElementos :: [Node] -> [Node]
const filtrarElementos = elementos => elementos.filter(elementoEhSigla);

// criarLinkIntra :: String -> HTMLAnchorElement
const criarLinkIntra = url => Object.assign(document.createElement('a'), {
	target: '_blank',
	href: url,
	textContent: 'Acessar na Intra'
});

// valorParaDominio :: String -> String
const valorParaDominio = valor => {
	const dominios = {
		'1': 'trf4.jus.br',
		'2': 'jfrs.jus.br',
		'3': 'jfsc.jus.br',
		'4': 'jfpr.jus.br'
	};
	return dominios[valor];
};

// formulario :: FuturePromise HTMLFormElement
const formulario = new FuturePromise(() => document.querySelector('form[name="formulario"]'));
// dominio :: Promise String
const dominio = formulario.then(pipe(pluck('local'), pluck('value'), valorParaDominio));

// siglaParaUrl :: Promise String -> Promise String
const siglaParaUrl = dominio.map(dominioSiglaParaUrl);

// criarLinkElemento :: String -> Promise HTMLAnchorElement
const criarLinkElemento = compose(map(criarLinkIntra), apply(siglaParaUrl), siglaDeElemento);

// criarElementosAdicionais :: Node -> Promise [Node]
const criarElementosAdicionais = elemento => criarLinkElemento(elemento).map(link => [
	document.createTextNode(' [ '),
	link,
	document.createTextNode(' ]')
]);

// adicionarLink :: Node -> Promise Node
const adicionarLink = elemento => criarElementosAdicionais(elemento).map(elementosAdicionais => {
	return elementosAdicionais.reduce(inserirApos, elemento);
});

// adicionarLinks :: [Node] -> [Promise Node]
const adicionarLinks = map(adicionarLink);

// app :: Promise HTMLFormElement -> [Promise Node]
const app = compose(adicionarLinks, filtrarElementos, elementosSeguintes);

formulario.map(app);
formulario.run();
