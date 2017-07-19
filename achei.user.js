// ==UserScript==
// @name        Achei
// @namespace   http://nadameu.com.br/achei
// @description Link para informações da Intra na página do Achei!
// @include     http://centralrh.trf4.gov.br/achei/pesquisar.php?acao=pesquisar*
// @include     http://serh.trf4.jus.br/achei/pesquisar.php?acao=pesquisar*
// @version     8
// @grant       none
// ==/UserScript==

Promise.prototype.ap = function(a) {
	return Promise.all([this, a]).then(([x, f]) => f(x));
};
Promise.prototype.tap = function(f) {
	return this.then(x => { f(x); return x; });
};

const doc = Promise.resolve(document);

const createFragment = doc
	.then(doc => doc.createElement('template'))
	.tap(templ => templ.innerHTML = ` [ <a href="" target="_blank">Abrir na Intra</a> ]`)
	.then(templ => url => doc
		.then(doc => doc.importNode(templ.content, true))
		.tap(frag => frag.querySelector('a').href = url)
	);

const form = doc
	.then(doc => doc.querySelector('form[name="formulario"]'))
	.then(form => form == null ?
		Promise.reject('Formulário não encontrado') :
		Promise.resolve(form)
	);

const urlSigla = form
	.then(form => form.local || {})
	.then(elt => elt.value)
	.then(local => local == null ?
		Promise.reject('Local não disponível') :
		Promise.resolve(local)
	)
	.then(Number)
	.then(l => l - 1)
	.then(l => ['trf4', 'jfrs', 'jfsc', 'jfpr'][l])
	.then(dominio => dominio == null ?
		Promise.reject('Local desconhecido') :
		Promise.resolve(dominio)
	)
	.then(d => `${d}-jus-br`)
	.then(dominio => sigla => Promise.resolve(sigla)
		.then(sigla => sigla.toLowerCase())
		.then(sigla => `https://intra.trf4.jus.br/membros/${sigla}${dominio}`)
	);

const main = form
	.then(function *(form) {
		let next = form.nextSibling;
		while (next !== null) {
			yield next;
			next = next.nextSibling;
		}
		return next;
	})
	.then(function *(nodes) {
		for (let node of nodes) {
			if (/^table$/i.test(node.tagName)) {
				yield *node.querySelector('td:nth-child(2)').childNodes;
			}
			yield node;
		}
	})
	.then(function *(nodes) {
		for (let node of nodes) {
			const [maybeSigla] = [node]
				.map(node => node.textContent)
				.map(text => text.trim())
				.map(text => text.match(/^Sigla:\s*(.+)$/) || [])
				.map(match => match.slice(1));

			maybeSigla.forEach(sigla =>
				Promise.resolve(sigla)
					.ap(urlSigla)
					.ap(createFragment)
					.then(frag => node.parentNode.insertBefore(frag, node.nextSibling))
					.then(() => 1)
			);

			if (maybeSigla.length > 0) yield 1;
		}
	})
	.then(([...results]) => results.length)
	.then(qtd => {
		const s = qtd > 1 ? 's' : '';
		return `${qtd} link${s} criado${s}.`;
	});

console.time('main');
main.then(
	x => {
		console.log('Resultado:', x);
		console.timeEnd('main');
	},
	e => {
		console.error('Erro:', e);
		console.timeEnd('main');
	}
);
