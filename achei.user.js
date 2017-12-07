// ==UserScript==
// @name        Achei
// @namespace   http://nadameu.com.br/achei
// @description Link para informações da Intra na página do Achei!
// @include     http://centralrh.trf4.gov.br/achei/pesquisar.php?acao=pesquisar*
// @include     http://serh.trf4.jus.br/achei/pesquisar.php?acao=pesquisar*
// @version     11
// @grant       none
// ==/UserScript==

const Sequence = {
	chain: f => function *(iterable) {
		for (let item of iterable) {
			yield *f(item);
		}
	},
	filter: p => Sequence.chain(item => p(item) ? [item] : []),
	map: f => Sequence.chain(item => [f(item)]),
	reduce: (reducer, acc) => iterable => {
		for (let item of iterable) {
			acc = reducer(acc, item);
		}
		return acc;
	}
};

const fromNullable = msg => obj => obj == null ?
	Promise.reject(msg) :
	Promise.resolve(obj)
;

const queryFormulario = doc => fromNullable('Formulário não encontrado!')(
	doc.querySelector('form[name="formulario"]')
);

const makeCreateFragment = doc => {
	const template = doc.createElement('template');
	template.innerHTML = ' [ <a href="" target="_blank">Abrir na Intra</a> ]';
	const link = template.content.querySelector('a');
	return url => {
		link.href = url;
		const fragment = doc.importNode(template.content, true);
		return fragment;
	};
};

const queryDominio = doc => fromNullable('Não foi selecionado local!')(
	doc.querySelector('[name="local"]:checked')
)
	.then(input => input.nextSibling)
	.then(fromNullable('Local selecionado não possui texto!'))
	.then(textNode => textNode.textContent)
	.then(text => text.trim())
	.then(text => text.toLowerCase());

const makeSiglaToUrl = dominio => sigla => [
	'https://intra.trf4.jus.br/membros/',
	sigla.toLowerCase(),
	dominio,
	'-jus-br'
].join('');

const nextSiblingsOf = function *(elt) {
	for (
		let sibling = elt.nextSibling;
		sibling !== null;
		sibling = sibling.nextSibling
	) {
		yield sibling;
	}
};

const queryTableChildNodes = function *(node) {
	if ('tagName' in node && /^table$/i.test(node.tagName)) {
		yield* node.querySelector('td:nth-child(2)').childNodes;
	} else {
		yield node;
	}
};

const withRegExp = re => {
	const matches = node => re.test(node.textContent);
	const extract = node => node.textContent.match(re)[1];
	return { matches, extract };
};

const {
	matches: matchesSigla,
	extract: extractSigla
} = withRegExp(/^Sigla:\s*(\S+)\s*$/);

const makeAppendFragment = (doc, dominio) => {
	const createFragment = makeCreateFragment(doc);
	const siglaToUrl = makeSiglaToUrl(dominio);
	return node => [
		extractSigla,
		siglaToUrl,
		createFragment,
		fragment => node.parentNode.insertBefore(fragment, node.nextSibling)
	].reduce((x, f) => f(x), node);
};

const main = doc => queryDominio(doc)
	.then(dominio => {
		const appendFragment = makeAppendFragment(doc, dominio);
		return queryFormulario(doc)
			.then(nextSiblingsOf)
			.then(Sequence.chain(queryTableChildNodes))
			.then(Sequence.filter(matchesSigla))
			.then(Sequence.map(node => appendFragment(node)))
			.then(xs => [...xs].length)
			.then(qtd => ({ qtd, plural: qtd > 1 ? 's' : '' }))
			.then(({ qtd, plural }) => `${qtd} link${plural} criado${plural}.`);
	});

main(document).then(
	x => { console.log('Resultado:', x); },
	e => { console.error('Erro:', e); }
);
