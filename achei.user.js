// ==UserScript==
// @name        Achei
// @namespace   http://nadameu.com.br/achei
// @description Link para informações da Intra na página do Achei!
// @include     http://centralrh.trf4.gov.br/achei/pesquisar.php?acao=pesquisar*
// @version     1
// @grant       none
// ==/UserScript==

const curry = function(fn, ...args) {
	if (args.length >= fn.length) return fn(...args);
	return curry.bind(null, fn, ...args);
};
const pluck = curry((attr, obj) => obj[attr]);
const _compose = (f, g) => (...args) => f(g(...args));
const compose = (...funcoes) => funcoes.reduce(_compose);

const inserirApos = (antigo, novo) => {
	antigo.parentElement.insertBefore(novo, antigo.nextSibling);
	return novo;
};

const elementosSeguintes = first => {
	const arr = [];
	for (let next = first.nextSibling; next; next = next.nextSibling) {
		arr.push(next);
	}
	return arr;
};

const reSigla = /^Sigla: (.*)$/;
const textoEhSigla = texto => reSigla.test(texto);
const siglaDeTexto = texto => texto.match(reSigla)[1];

const getText = pluck('textContent');
const elementoEhSigla = compose(textoEhSigla, getText);
const siglaDeElemento = compose(siglaDeTexto, getText);
const dominioSiglaParaUrl = curry((dominio, sigla) => `https://intra.trf4.jus.br/membros/${sigla.toLowerCase()}${dominio.replace(/\./g, '-')}`);

const filtrarElementos = elementos => elementos.filter(elementoEhSigla);

const criarLinkIntra = url => Object.assign(document.createElement('a'), {
	target: '_blank',
	href: url,
	textContent: 'Acessar na Intra'
});

const adicionarLinks = dominio => {
	const siglaParaUrl = dominioSiglaParaUrl(dominio);

	const criarLinkElemento = compose(criarLinkIntra, siglaParaUrl, siglaDeElemento);
	const criarElementosAdicionais = elemento => {
		return [
			document.createTextNode(' [ '),
			criarLinkElemento(elemento),
			document.createTextNode(' ]')
		];
	};
	const adicionarLink = elemento => criarElementosAdicionais(elemento).reduce(inserirApos, elemento);

	return elementos => elementos.map(adicionarLink);
};

const acaoFormulario = formulario => {
	const dominios = {
		'1': 'trf4.jus.br',
		'2': 'jfrs.jus.br',
		'3': 'jfsc.jus.br',
		'4': 'jfpr.jus.br'
	};
	const dominio = dominios[formulario.local.value];
	return compose(adicionarLinks(dominio), filtrarElementos, elementosSeguintes)(formulario);
};

const formulario = document.querySelector('form[name="formulario"]');

acaoFormulario(formulario);
