// ==UserScript==
// @name        CARPP
// @namespace   http://nadameu.com.br/carpp
// @description Controle de Andamento e Regularidade de Prazos Processuais
// @include     /^https:\/\/eproc\.(jf(pr|rs|sc)|trf4)\.jus\.br\/eproc(V2|2trf4)\/controlador\.php\?acao=([^&]+)&acao_origem=principal&/
// @version     1
// @grant       none
// ==/UserScript==

/* globals indexedDB window */

const DOMAIN = `${window.top.location.protocol}//${window.top.document.domain}`;

const Armazem = (function() {

	const listeners = new Map();

	/**
	 * @param {string} store Nome do objectStore
	 * @returns {Set} Observadores deste objectStore
	 */
	function obterListeners(store) {
		if (!listeners.has(store)) {
			listeners.set(store, new Set());
		}
		return listeners.get(store);
	}

	const Armazem = {
		abrir() {
			const VERSION = 1;
			const req = indexedDB.open('carpp', VERSION);
			req.addEventListener('upgradeneeded', ({ target: { result: db } }) => Armazem.criar(db));
			return new Promise((resolve, reject) => {
				req.addEventListener('success', ({ target: { result: db } }) => resolve(db));
				req.addEventListener('error', evt => reject(evt));
			});
		},
		criar(db) {
			const pessoas = db.createObjectStore('pessoas', { keyPath: 'sigla' });
			pessoas.createIndex('nome', 'nome');

			const setores = db.createObjectStore('setores', { keyPath: 'id', autoIncrement: true });
			setores.createIndex('parent', 'parent');
		},
		disparar(store, dados) {
			obterListeners(store).forEach(listener => listener(dados));
		},
		observar(store, listener) {
			obterListeners(store).add(listener);
		},
		obter(store) {
			return Armazem.abrir().then(db => {
				return new Promise((resolve) => {
					const t = db.transaction([store]);
					const os = t.objectStore(store);
					const map = new Map();
					os.getAll().addEventListener('success', ({ target: { result: objs } }) => {
						objs.forEach(obj => {
							let key = obj[os.keyPath];
							map.set(key, obj);
						});
						Armazem.disparar(store, map);
						resolve(map);
					});
				});
			});
		},
		salvar(store, obj) {
			return Armazem.abrir().then(db => {
				const t = db.transaction([store]);
				const os = t.objectStore(store);
				const map = new Map();
				map.set(obj[os.keyPath], obj);
				return Armazem.salvarTudo(store, map, false);
			});
		},
		salvarTudo(store, newObjs, apagarExistentes = true) {
			return Armazem.abrir().then(db => {
				const t = db.transaction([store], 'readwrite');
				const os = t.objectStore(store);
				return new Promise((resolve) => {
					os.getAll().addEventListener('success', ({ target: { result: oldObjs } }) => {
						oldObjs.forEach(oldObj => {
							let key = oldObj[os.keyPath];
							if (newObjs.has(key)) {
								let newObj = newObjs.get(key);
								let changed = false,
									changedObj = oldObj;
								for (let prop in newObj) {
									if (newObj.hasOwnProperty(prop) && newObj[prop] !== oldObj[prop]) {
										changedObj[prop] = newObj[prop];
										changed = true;
									}
								}
								if (changed) {
									console.info('CHANGED', changedObj);
									os.put(changedObj);
								}
								// Manter na coleção apenas os que ainda não foram salvos
								newObjs.delete(key);
							} else if (apagarExistentes) {
								console.info('DELETED', oldObj);
								os.delete(key);
							}
						});
						newObjs.forEach(newObj => {
							let key = os.keyPath;
							if (newObj[key] === null) {
								delete newObj[key];
							}
							console.info('NEW', newObj);
							os.add(newObj);
						});
					});
					t.addEventListener('complete', () => {
						Armazem.obter(store);
						resolve();
					});
					t.addEventListener('abort', evt => console.error('NEW', 'aborted', evt));
				});
			});
		}
	};

	return Armazem;
})();

function Botao(texto) {
	const botao = document.createElement('button');
	botao.textContent = texto;
	return botao;
}

const Eproc = {
	obterPessoas() {
		const pessoas = new Map();
		const url = Eproc.obterMenu('usuario_listar_todos');

		function obterPagina(doc, pagina = 0) {
			const consultarElement = doc.getElementById('btnConsultar');
			const formElement = consultarElement.form;
			const url = formElement.action;
			const method = formElement.method;
			const data = new FormData(formElement);
			data.append('hdnInfraPaginaAtual', pagina.toString());
			return Eproc.xhr(url, method, data);
		}

		function analisarPagina(doc) {
			const tabela = doc.querySelector(
				'table[summary="Tabela de Usuários Ativos do Órgão"]'
			);
			const linhas = Array.from(tabela.rows).filter(linha => {
				return linha.classList.contains('infraTrClara') || linha.classList.contains('infraTrEscura');
			});
			linhas.forEach(linha => {
				let nome = linha.cells[0].textContent;
				let sigla = linha.cells[1].textContent;
				if (!pessoas.has(sigla)) {
					pessoas.set(sigla, new Pessoa({ sigla, nome }));
				}
			});
			if (doc.getElementById('lnkInfraProximaPaginaSuperior')) {
				const paginaAtualElement = doc.getElementById('hdnInfraPaginaAtual');
				const paginaAtual = Number(paginaAtualElement.value);
				return obterPagina(doc, paginaAtual + 1).then(analisarPagina);
			}
		}

		return Eproc.xhr(url)
			.then(obterPagina)
			.then(analisarPagina)
			.then(() => {
				Armazem.salvarTudo('pessoas', pessoas);
			});
	},
	obterMenu(acao) {
		const menuElement = document.querySelector('#main-menu');
		const re = new RegExp(`^\\?acao=${acao}&hash`);
		const links = Array.from(menuElement.querySelectorAll('a[href]')).filter(link => re.test(link.search));
		if (links.length === 1) {
			return links[0].href;
		}
		throw new Error(`Link não encontrado: ${acao}`);
	},
	xhr(url, method = 'GET', data = null) {
		return new Promise((resolve, reject) => {
			const xhr = new XMLHttpRequest();
			xhr.open(method, url);
			xhr.responseType = 'document';
			xhr.addEventListener('load', evt => resolve(evt.target.response), false);
			xhr.addEventListener('error', reject, false);
			xhr.send(data);
		});
	}
};

const Pessoa = (function() {
	class Pessoa {

		constructor(newProperties = {}) {
			for (let prop in Pessoa.prototype) {
				if (newProperties.hasOwnProperty(prop)) {
					this[prop] = newProperties[prop];
				}
			}
		}

		get exibirComo() {
			return this.apelido || this.nome;
		}

		static sort(a, b) {
			const descricaoA = a.exibirComo.toLowerCase();
			const descricaoB = b.exibirComo.toLowerCase();
			if (descricaoA < descricaoB) return -1;
			if (descricaoA > descricaoB) return +1;
			if (a.sigla < b.sigla) return -1;
			if (a.sigla > b.sigla) return +1;
			return 0;
		}

	}
	Pessoa.prototype.apelido = '';
	Pessoa.prototype.ativa = false;
	Pessoa.prototype.nome = null;
	Pessoa.prototype.sigla = null;
	Pessoa.prototype.setor = null;

	return Pessoa;
})();

const Setor = (function() {
	class Setor {

		constructor(newProperties = {}) {
			this.id = newProperties.id || null;
			for (let prop in Setor.prototype) {
				if (newProperties.hasOwnProperty(prop)) {
					this[prop] = newProperties[prop];
				}
			}
		}

		static sort(a, b) {
			if (a.id !== null && b.id === null) return -1;
			if (a.id === null && b.id !== null) return +1;
			if (a.nome < b.nome) return -1;
			if (a.nome > b.nome) return +1;
			return 0;
		}

	}
	Setor.prototype.nome = '';
	Setor.prototype.parent = null;

	return Setor;
})();

const PessoasDecorator = (function() {

	const elements = new WeakMap();

	function getElement(doc) {
		if (!elements.has(this)) {
			const template = doc.querySelector('#pessoa-template').content;
			const elt = doc.importNode(template, true).firstElementChild;
			elt.querySelector('.pessoa__ativa').checked = this.ativa;
			elt.querySelector('.pessoa__nome').textContent = this.exibirComo;
			elt.querySelector('.pessoa__sigla').textContent = this.sigla;
			elt.associatedObject = this;
			elements.set(this, elt);
		}
		let element = elements.get(this);
		return element;
	}

	const PessoasDecorator = {
		decoratePessoa(pessoa, doc = document) {
			Object.defineProperty(pessoa, 'getElement', {
				value: getElement.bind(pessoa, doc)
			});
			return pessoa;
		}
	};
	return PessoasDecorator;
})();

const SetoresDecorator = (function() {

	const pessoaElements = new WeakMap();
	const setorElements = new WeakMap();

	function getPessoaElement(doc) {
		if (!pessoaElements.has(this)) {
			const template = doc.querySelector('#integrante-template').content;
			const elt = doc.importNode(template, true).firstElementChild;
			elt.querySelector('.integrante__nome').textContent = this.exibirComo;
			elt.associatedObject = this;
			pessoaElements.set(this, elt);
		}
		let element = pessoaElements.get(this);
		return element;
	}

	function getSetorElement(doc) {
		if (!setorElements.has(this)) {
			const template = doc.querySelector('#setor-template').content;
			const elt = doc.importNode(template, true).firstElementChild;
			if (this.id !== null) {
				elt.id = `setor-${this.id}`;
			}
			elt.querySelector('.setor__nome').textContent = this.nome;
			elt.subsetores = elt.querySelector('.setor__subsetores');
			elt.novo = elt.querySelector('.setor__novo');
			elt.integrantes = elt.querySelector('.setor__integrantes');
			elt.associatedObject = this;
			setorElements.set(this, elt);
		}
		let element = setorElements.get(this);
		return element;
	}

	const SetoresDecorator = {
		decoratePessoa(pessoa, doc = document) {
			Object.defineProperty(pessoa, 'getElement', {
				value: getPessoaElement.bind(pessoa, doc)
			});
			return pessoa;
		},
		decorateSetor(setor, doc = document) {
			Object.defineProperty(setor, 'getElement', {
				value: getSetorElement.bind(setor, doc)
			});
			return setor;
		}
	};
	return SetoresDecorator;
})();

function main() {
	const barraLocalizacao = document.querySelector('#divInfraBarraLocalizacao');
	if (barraLocalizacao.textContent.trim() === 'Painel do Diretor de Secretaria') {
		const botao = new Botao('Gerenciar');
		botao.addEventListener('click', abrirIframeGerenciar, false);
		const areaTelaD = document.querySelector('#divInfraAreaTelaD');
		areaTelaD.insertBefore(botao, areaTelaD.firstChild);
	}
}

function abrirIframeGerenciar() {
	abrirIframe('CARPP', `
html, body { margin: 0; padding: 0; }
body { font-family: Arial, sans-serif; font-size: 14px; background: #e0f2f1; }
.cabecalho { background: #009688; box-shadow: 0 4px 8px rgba(0,0,0,0.3); }
.cabecalho__titulo { margin: 0; padding: 8px; font-size: 24px; color: #fff; }
.cabecalho__subtitulo { margin: 0; padding: 0 8px 8px; font-size: 16px; color: rgba(255,255,255,0.7); }
.painel { float: left; margin: 16px; width: 30%; min-width: 400px; min-height: 300px; max-width: 600px; border-radius: 2px; background: white; box-shadow: 0 4px 8px rgba(0,0,0,0.3); }
.titulo { margin: 0; padding: 8px; font-size: 20px; color: #fff; background: #00796b; }
.botao { border: none; font-weight: bold; text-decoration: none; padding: 8px; border-radius: 2px; background: transparent; color: #d50000; }
.botao:hover { box-shadow: 0 2px 4px rgba(0,0,0,0.3); }
.botao-acao { background: #d50000; color: white; }
.pessoas__atualizar { float: right; margin: 8px; }
.pessoas__atualizar:disabled { background: #eee; color: rgba(0,0,0,0.38); }
.pessoas__instrucoes { margin: 8px; text-align: justify; }
.pessoas__container { clear: right; margin: 8px; }
.pessoa, .pessoa-cabecalho { display: flex; padding: 2px 0; border-bottom: 1px solid #ccc; }
.pessoa-cabecalho { font-weight: bold; }
.pessoa-desativada { color: #aaa; }
.pessoa__ativa { flex: 1; margin-right: 1ex; }
.pessoa__nome { flex: 9; margin-right: 1ex; }
.pessoa__sigla { flex: 3; margin-left: 1ex; }
.setores { }
.setores__container { }
.setor { margin: 8px; min-width: 64px; border: 2px solid #aaa; border-radius: 8px; }
.setor-inexistente { border: none; }
.setor__cabecalho { display: flex; }
.setor__nome { flex: 1; margin: 8px; display: flex; align-items: center; }
.setor__novo { margin: 8px; }
.setor__integrantes { display: flex; flex-flow: row wrap; }
.integrante { margin: 2px; height: 32px; border-radius: 16px; background: rgba(0, 0, 0, 0.12); color: rgba(0, 0, 0, 0.87); }
.integrante__primeira_letra { }
.integrante__nome {}
`, `
<header class="cabecalho">
<h1 class="cabecalho__titulo">CARPP</h1>
<h2 class="cabecalho__subtitulo">Controle de Andamento e Regularidade de Prazos Processuais</h2>
</header>
<div class="pessoas painel">
<h3 class="pessoas__titulo titulo">Pessoas</h3>
<button class="pessoas__atualizar botao botao-acao" disabled>Atualizar</button>
<div class="pessoas__instrucoes">Marque as pessoas que trabalham na sua unidade.<br><br>Clique sobre os nomes para definir um apelido ou um nome mais curto para exibição.</div>
<div class="pessoas__container">
<div class="pessoa-cabecalho"><div class="pessoa__ativa"></div><div class="pessoa__nome">Nome</div><div class="pessoa__sigla">Sigla</div></div>
<template id="pessoa-template"><div class="pessoa"><input type="checkbox" class="pessoa__ativa"><div class="pessoa__nome"></div><div class="pessoa__sigla"></div></div></template>
</div>
</div>
<div class="setores painel">
<h3 class="setores__titulo titulo">Setores</h3>
<div class="setores__container">
<template id="setor-template">
<div class="setor">
<header class="setor__cabecalho">
<h4 class="setor__nome"></h4>
<button class="setor__novo botao">Novo setor</button>
</header>
<div class="setor__subsetores">
</div>
<div class="setor__integrantes"></div>
</div>
</template>
<template id="integrante-template"><div class="integrante"><div class="integrante__primeira_letra">?</div><div class="integrante__nome"></div></div></template>
</div>
</div>
`).then((win) => {
		const doc = win.document;

		function lidarComEventoEspecifico(evt, nomeClasse, nomeClasseParent, callback) {
			if (!evt.target.classList.contains(nomeClasse)) return;
			let parent = evt.target.parentNode;
			while (parent && !parent.classList.contains(nomeClasseParent)) parent = parent.parentNode;
			if (!parent) return;
			const obj = parent.associatedObject;
			callback(obj);
		}
		/* Painel "Pessoas" */
		const pessoasAtualizarElement = doc.querySelector('.pessoas__atualizar');
		const pessoasContainer = doc.querySelector('.pessoas__container');
		pessoasAtualizarElement.addEventListener('click', evt => {
			evt.preventDefault();
			evt.target.disabled = true;
			Eproc.obterPessoas();
		}, false);
		Armazem.observar('pessoas', function(dadosPessoas) {
			Array.from(pessoasContainer.querySelectorAll('.pessoa')).forEach(pessoa => pessoasContainer.removeChild(pessoa));
			let pessoasOrdenadas = Array.from(dadosPessoas.values())
				.map(dadosPessoa => PessoasDecorator.decoratePessoa(new Pessoa(dadosPessoa), doc))
				.sort(Pessoa.sort);
			pessoasOrdenadas.forEach(pessoa => pessoasContainer.appendChild(pessoa.getElement()));
			pessoasAtualizarElement.disabled = false;
		});
		pessoasContainer.addEventListener('click', (evt) => {

			lidarComEventoEspecifico(evt, 'pessoa__ativa', 'pessoa', pessoa => {
				const ativa = evt.target.checked;
				evt.preventDefault();
				evt.target.disabled = true;
				pessoa.getElement().classList.add('pessoa-desativada');
				pessoa.ativa = ativa;
				// pessoa.setor = Math.floor(Math.random() * 10) + 1;
				Armazem.salvar('pessoas', pessoa);
			});

			lidarComEventoEspecifico(evt, 'pessoa__nome', 'pessoa', pessoa => {
				if (pessoa.getElement().classList.contains('pessoa-desativada')) return;
				const resposta = prompt(`Altere o nome da pessoa para exibição.\n(Deixe em branco para usar o nome original)\n\n${pessoa.nome}`, pessoa.apelido);
				if (resposta !== null) {
					pessoa.apelido = resposta;
					Armazem.salvar('pessoas', pessoa);
				}
			});
		});
		Armazem.obter('pessoas');

		/* Painel "Setores" */
		let setores = [];
		let integrantes = [];

		const setoresContainer = doc.querySelector('.setores__container');

		function atualizarPainelSetores(alterado, parent = null) {
			let parentId = null,
				container = setoresContainer;
			if (parent !== null) {
				parentId = parent.id;
				container = parent.getElement().subsetores;
			}
			const setoresDesteNivel = setores.filter(setor => setor.parent === parentId).sort(Setor.sort);
			setoresDesteNivel.forEach(setor => {
				container.appendChild(setor.getElement());
				if (alterado === 'setores') {
					setor.getElement().novo.addEventListener('click', evt => {
						const nome = prompt('Nome do novo setor?');
						Armazem.salvar('setores', new Setor({ nome, parent: setor.id }));
					});
				}
				let integrantesContainer = setor.getElement().integrantes;
				integrantes.filter(pessoa => pessoa.setor === setor.id).forEach(pessoa => {
					integrantesContainer.appendChild(pessoa.getElement());
				});
				if (setor.id !== null) {
					atualizarPainelSetores(alterado, setor);
				}
			});
		}

		Armazem.observar('setores', dadosSetores => {
			Array.from(setoresContainer.querySelectorAll('.setor')).forEach(setor => setor.parentNode.removeChild(setor));
			setores = Array.from(dadosSetores.values()).concat({}).map(dadosSetor => SetoresDecorator.decorateSetor(new Setor(dadosSetor), doc));
			let ultimo = setores[setores.length - 1];
			ultimo.getElement().classList.add('setor-inexistente');
			atualizarPainelSetores('setores');
		});
		Armazem.obter('setores');
		Armazem.observar('pessoas', dadosPessoas => {
			Array.from(setoresContainer.querySelectorAll('.integrante')).forEach(pessoa => pessoa.parentNode.removeChild(pessoa));
			integrantes = Array.from(dadosPessoas.values())
				.map(dadosPessoa => SetoresDecorator.decoratePessoa(new Pessoa(dadosPessoa), doc))
				.filter(pessoa => pessoa.ativa)
				.sort(Pessoa.sort);
			atualizarPainelSetores('pessoas');
		});

	});
}

function abrirIframe(title, style = '', body = '') {
	return new Promise((resolve) => {
		const id = gerarIdAleatorio();
		const blob = new Blob([`
<!doctype html>
<html>
	<head>
		<meta charset="utf-8"/>
		<title>${title}</title>
		<style>${style}</style>
	</head>
	<body>
		${body}
		<script>window.top.postMessage('${id}', '${DOMAIN}');</script>
	</body>
</html>
`], { type: 'text/html' });
		const url = URL.createObjectURL(blob);
		window.addEventListener('message', function handler(evt) {
			if (evt.origin === DOMAIN && evt.data === id) {
				window.removeEventListener('message', handler, false);
				resolve(evt.source);
			}
		}, false);
		sobreporIframe(url, id);
	});
}

function gerarIdAleatorio() {
	const randomString = ((1 + Math.random()) * 0x1000000 | 0).toString(16).substring(1);
	return `id-${randomString}`;
}

function sobreporIframe(url, id) {
	var fundo = document.getElementById('carppFundo');
	if (!fundo) {
		const estilos = document.createElement('style');
		estilos.textContent = `
#carppFundo { position: fixed; top: 0; left: 0; bottom: 0; right: 0; background: rgba(0,0,0,0.5); z-index: 2000; transition: opacity 150ms; }
#carppIframe { position: absolute; top: 10%; left: 10%; width: 80%; height: 80%; border: none; border-radius: 2px; box-shadow: 0 2px 4px rgba(0,0,0,0.3); background: white; }
#carppFechar { position: absolute; top: 10%; margin-top: -32px; left: 90%; width: 32px; height: 32px; font-size: 32px; line-height: 32px; border: none; border-radius: 16px; background: #d50000; color: white; font-weight: bold; box-shadow: 0 4px 8px rgba(0,0,0,0.3); }
`;
		document.querySelector('head').appendChild(estilos);
		fundo = document.createElement('div');
		fundo.id = 'carppFundo';
		fundo.style.display = 'none';
		document.body.appendChild(fundo);
	}
	fundo.innerHTML = `<iframe id="carppIframe" name="${id}" src="${url}"></iframe><button id="carppFechar">&times;</button>`;
	fundo.style.opacity = '0';
	fundo.style.display = '';
	fundo.getBoundingClientRect();
	fundo.style.opacity = '';
	const iframe = document.getElementById('carppIframe');
	iframe.style.transform = 'translateX(-120%) translateY(-120%) scaleX(0) scaleY(0)';
	iframe.style.transformOrigin = 'top left';
	iframe.getBoundingClientRect();
	iframe.style.transition = 'transform 300ms ease-out';
	iframe.style.transform = '';
	const fecharElement = document.getElementById('carppFechar');
	fecharElement.style.opacity = '0';
	fecharElement.getBoundingClientRect();
	fecharElement.style.transition = 'opacity 150ms';
	runOnce(iframe, 'transitionend', () => fecharElement.style.opacity = '');
	fecharElement.addEventListener('click', function() {
		fundo.style.opacity = '0';
		runOnce(fundo, 'transitionend', () => fundo.style.display = 'none');
		iframe.style.transition = 'transform 150ms ease-in';
		iframe.style.transform = 'translateX(120%) translateY(-120%) scaleX(0) scaleY(0)';
		runOnce(iframe, 'transitionend', () => fundo.innerHTML = '');
	}, false);
}

function runOnce(element, type, listener, capture = false) {
	element.addEventListener(type, function handler() {
		element.removeEventListener(type, handler, capture);
		return listener.apply(this, arguments);
	}, capture);
}

const invalidSymbols = /[&<>"]/g;
const replacementSymbols = {
	'&': 'amp',
	'<': 'lt',
	'>': 'gt',
	'"': 'quot'
};

function safeHTML(strings, ...vars) {
	return vars.reduce((result, variable, i) => result + variable.replace(invalidSymbols, (sym) => `&${replacementSymbols[sym]};`) + strings[i + 1], strings[0]);
}

function estender(dest, orig) {
	Object.getOwnPropertyNames(orig).forEach(prop => Object.defineProperty(
		dest,
		prop,
		Object.getOwnPropertyDescriptor(orig, prop)
	));
	return dest;
}

main();
