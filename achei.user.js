// ==UserScript==
// @name        Achei
// @namespace   http://nadameu.com.br/achei
// @description Link para informações da Intra na página do Achei!
// @include     http://centralrh.trf4.gov.br/achei/pesquisar.php?acao=pesquisar*
// @include     http://serh.trf4.jus.br/achei/pesquisar.php?acao=pesquisar*
// @require     https://github.com/nadameu/greasemonkey/raw/List-v1.0.0/lib/List.js
// @require     https://github.com/nadameu/greasemonkey/raw/Task-v1.0.1/lib/Task.js
// @version     9
// @grant       none
// ==/UserScript==

/* global List, Task */

'use strict';

console.time('total');
console.time('setup');

Function.prototype.compose = function(f) { return x => f(this(x)); };
Function.prototype.composeK = function(f) { return x => this(x).chain(f); };
Function.id = x => x;

const doc = Task.of(document);

const docToForm = Function
	.id(doc => doc.querySelector('form[name="formulario"]'))
	.compose(form => form == null ?
		Task.rejected('Formulário não encontrado') :
		Task.of(form)
	);

const form = doc.chain(docToForm);

const formToLocal = Function
	.id(form => form.local || {})
	.compose(elt => elt.value)
	.compose(local => local == null ?
		Task.rejected('Local não disponível') :
		Task.of(local)
	);

const localToDominio = Function
	.id(Number)
	.compose(l => l - 1)
	.compose(l => ['trf4', 'jfrs', 'jfsc', 'jfpr'][l])
	.compose(dominio => dominio == null ?
		Task.rejected('Local desconhecido') :
		Task.of(dominio)
	);

const dominioToUrlSigla = Function
	.id(d => `${d}-jus-br`)
	.compose(dominio => Task
		.of(sigla => sigla.toLowerCase())
		.map(f => x => `https://intra.trf4.jus.br/membros/${f(x)}${dominio}`)
	);

const formToUrlSigla = Function
	.id(formToLocal)
	.composeK(localToDominio)
	.composeK(dominioToUrlSigla);

const urlSigla = form
	.chain(formToUrlSigla);

const createFragment = doc
	.map(doc => doc.createElement('template'))
	.map(templ => (templ.innerHTML = ` [ <a href="" target="_blank">Abrir na Intra</a> ]`, templ))
	.chain(templ => doc
		.map(doc => () => doc.importNode(templ.content, true))
		.map(create => url => {
			const frag = create();
			frag.querySelector('a').href = url;
			return frag;
		})
	);

const siglaToFragment = urlSigla
	.ap(createFragment
		.map(create => urlSigla => url =>
			create(urlSigla(url))
		)
	);

const re = /^Sigla:\s*(.+)$/;

const nodeToMaybeSigla = Function
	.id(node => node.textContent)
	.compose(text => text.trim())
	.compose(text => text.match(re))
	.compose(match => match === null ? [] : [match[1]]);

const nodeSiglaToTask = (node, sigla) =>
	Task.of(sigla)
		.ap(siglaToFragment)
		.map(frag => node.parentNode.insertBefore(frag, node.nextSibling))
		.map(() => 1);

const siblings = elt => List.chainRec(
	(next, done, value) => {
		const node = value.nextSibling;
		return node === null ? done(null) : next(node);
	},
	elt
);

const formToNodes = Function
	.id(siblings)
	.composeK(node => {
		if (/^table$/i.test(node.tagName)) {
			return node.querySelector('td:nth-child(2)').childNodes;
		}
		return [node];
	});

const nodeToMaybeTask = node => {
	const maybeSigla = nodeToMaybeSigla(node);
	const maybeTask = maybeSigla.map(sigla => nodeSiglaToTask(node, sigla));
	return maybeTask;
};

const formToTask = Function
	.id(formToNodes)
	.composeK(nodeToMaybeTask)
	.compose(Task.all);

const main = form
	.chain(formToTask)
	.map(results => results.length)
	.map(qtd => {
		const s = qtd > 1 ? 's' : '';
		return `${qtd} link${s} criado${s}.`;
	});

console.timeEnd('setup');
console.time('main');
main.fork(
	e => {
		console.error('Erro:', e);
		console.timeEnd('main');
		console.timeEnd('total');
	},
	x => {
		console.log('Resultado:', x);
		console.timeEnd('main');
		console.timeEnd('total');
	}
);
