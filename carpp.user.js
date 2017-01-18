// ==UserScript==
// @name        CARPP
// @namespace   http://nadameu.com.br/carpp
// @description Controle de Andamento e Regularidade de Prazos Processuais
// @include     /^https:\/\/eproc\.(jf(pr|rs|sc)|trf4)\.jus\.br\/eproc(V2|2trf4)\/controlador\.php\?acao=([^&]+)&acao_origem=principal&/
// @version     1
// @grant       none
// ==/UserScript==

const DOMAIN = `${window.top.location.protocol}//${window.top.document.domain}`;

const Armazem = {
	_listeners: new Map(),
	abrir() {
		const req = indexedDB.open('carpp', 1);
		req.addEventListener('upgradeneeded', evt => Armazem.criar(evt.target.result));
		return new Promise((resolve, reject) => {
			req.addEventListener('success', evt => resolve(evt.target.result));
			req.addEventListener('error', evt => console.error(evt));
		});
	},
	criar(db) {
		const pessoas = db.createObjectStore('pessoas', {keyPath: 'sigla'});
		pessoas.createIndex('nome', 'nome');
	},
	disparar(store, dados) {
		if (! Armazem._listeners.has(store)) {
			Armazem._listeners.set(store, new Set());
		}
		Armazem._listeners.get(store).forEach(listener => {
			listener(dados);
		});
	},
	observar(store, listener) {
		if (! Armazem._listeners.has(store)) {
			Armazem._listeners.set(store, new Set());
		}
		Armazem._listeners.get(store).add(listener);
	},
	obter(store) {
		return Armazem.abrir().then(db => {
			const t = db.transaction([store]);
			const os = t.objectStore(store);
			const req = os.openCursor();
			const map = new Map();
			return new Promise((resolve, reject) => {
				req.addEventListener('success', evt => {
					const cursor = evt.target.result;
					if (cursor) {
						map.set(cursor.key, cursor.value);
						cursor.continue();
					} else {
						Armazem.disparar(store, map);
						resolve(map);
					}
				});
			});
		});
	},
	salvar(store, objs) {
		console.log(store, objs);
		return Armazem.abrir().then(db => {
			const t = db.transaction([store], 'readwrite');
			const os = t.objectStore(store);
			return new Promise((resolve, reject) => {
				os.getAll().addEventListener('success', ({target:{result:oldObjs}}) => {
					oldObjs.forEach(oldObj => {
						let id = oldObj[os.keyPath];
						if (objs.has(id)) {
							let obj = objs.get(id);
							let changed = false;
							for (let prop in obj) {
								if (obj[prop] !== oldObj[prop]) changed = true;
							}
							if (changed) {
								console.info('CHANGED', oldObj);
								os.put(obj);
							}
							objs.delete(id);
						} else {
							console.info('DELETED', oldObj);
							os.delete(id);
						}
					});
					objs.forEach(obj => {
						console.info('NEW', obj);
						os.add(obj);
					});
				});
				t.addEventListener('complete', _ => {
					Armazem.obter(store);
					resolve();
				});
			});
		});
	}
};

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
			const tabela = doc.querySelector('table[summary="Tabela de Usuários Ativos do Órgão"]');
			const linhas = Array.from(tabela.rows).filter(linha => linha.classList.contains('infraTrClara') || linha.classList.contains('infraTrEscura'));
			linhas.forEach(linha => {
				let nome = linha.cells[0].textContent;
				let sigla = linha.cells[1].textContent;
				if (! pessoas.has(sigla)) {
					pessoas.set(sigla, {sigla, nome});
				}
			});
			if (doc.getElementById('lnkInfraProximaPaginaSuperior')) {
				const paginaAtualElement = doc.getElementById('hdnInfraPaginaAtual');
				var paginaAtual = Number(paginaAtualElement.value);
				return obterPagina(doc, ++paginaAtual).then(analisarPagina);
			}
		}

		return Eproc.xhr(url).then(obterPagina).then(analisarPagina).then(_ => {
			Armazem.salvar('pessoas', pessoas);
		});
	},
	obterMenu(acao) {
		const menuElement = document.querySelector('#main-menu');
		const re = new RegExp(`^\\?acao=${acao}&hash`);
		const links = Array.from(menuElement.querySelectorAll('a[href]')).filter(link => re.test(link.search));
		if (links.length === 1) {
			return links[0].href;
		} else {
			throw new Error(`Link não encontrado: ${acao}`);
		}
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
	abrirIframe('CARPP', [
		'html, body { margin: 0; padding: 0; }',
		'body { font-family: Arial, sans-serif; font-size: 14px; background: #e0f2f1; }',
		'.cabecalho { background: #009688; box-shadow: 0 4px 8px rgba(0,0,0,0.3); }',
		'.cabecalho__titulo { margin: 0; padding: 8px; font-size: 24px; color: #fff; }',
		'.cabecalho__subtitulo { margin: 0; padding: 0 8px 8px; font-size: 16px; color: rgba(255,255,255,0.7); }',
		'.pessoas { margin: 16px; min-height: 300px; max-width: 600px; border-radius: 2px; background: white; box-shadow: 0 4px 8px rgba(0,0,0,0.3); }',
		'.pessoas__titulo { margin: 0; padding: 8px; font-size: 20px; color: #fff; background: #00796b; }',
		'.pessoas__atualizar { border: none; color: white; font-weight: bold; text-decoration: none; float: right; margin: 8px; background: #d50000; padding: 8px; border-radius: 2px; box-shadow: 0 2px 4px rgba(0,0,0,0.3); }',
		'.pessoas__atualizar:disabled { background: #eee; color: rgba(0,0,0,0.38); }',
		'.pessoas__container { clear: right; margin: 8px; }',
		'.pessoa, .pessoa-cabecalho { display: flex; padding: 2px 0; border-bottom: 1px solid #ccc; }',
		'.pessoa-cabecalho { font-weight: bold; }',
		'.pessoa__nome { flex: 3; margin-right: 1ex; }',
		'.pessoa__sigla { flex: 1; margin-left: 1ex; }',
	].join('\n'), [
		'<header class="cabecalho">',
		'<h1 class="cabecalho__titulo">CARPP</h1>',
		'<h2 class="cabecalho__subtitulo">Controle de Andamento e Regularidade de Prazos Processuais</h2>',
		'</header>',
		'<div class="pessoas">',
		'<h3 class="pessoas__titulo">Pessoas</h3>',
		'<button class="pessoas__atualizar" disabled>Atualizar</button>',
		'<div class="pessoas__container">',
		'<div class="pessoa-cabecalho"><div class="pessoa__nome">Nome</div><div class="pessoa__sigla">Sigla</div></div>',
		'<div class="pessoa"><div class="pessoa__nome"></div><div class="pessoa__sigla"></div></div>',
		'</div>',
		'</div>'
	].join('')).then((win) => {
		const doc = win.document;
		const pessoasElement = doc.querySelector('.pessoas');
		const pessoasAtualizarElement = doc.querySelector('.pessoas__atualizar');
		const pessoasContainer = doc.querySelector('.pessoas__container');
		const pessoaTemplate = doc.querySelector('.pessoa').cloneNode(true);
		pessoasAtualizarElement.addEventListener('click', evt => {
			evt.preventDefault();
			evt.target.disabled = true;
			Eproc.obterPessoas().then(_ => evt.target.disabled = false);
		}, false);
		Armazem.observar('pessoas', function(pessoas) {
			Array.from(pessoasContainer.querySelectorAll('.pessoa')).forEach(pessoa => pessoasContainer.removeChild(pessoa));
			let pessoasOrdenadas = [...pessoas.values()].sort((a, b) => {
				if (a.nome < b.nome) return -1;
				if (a.nome > b.nome) return +1;
				if (a.sigla < b.sigla) return -1;
				if (a.sigla > b.sigla) return +1;
				return 0;
			});
			pessoasOrdenadas.forEach(pessoa => {
				let pessoaElement = pessoaTemplate.cloneNode(true);
				let pessoaNomeElement = pessoaElement.querySelector('.pessoa__nome');
				let pessoaSiglaElement = pessoaElement.querySelector('.pessoa__sigla');
				pessoaNomeElement.textContent = pessoa.nome;
				pessoaSiglaElement.textContent = pessoa.sigla;
				pessoasContainer.appendChild(pessoaElement);
			});
		});
		Armazem.obter('pessoas').then(_ => pessoasAtualizarElement.disabled = false);
	});
}

function abrirIframe(title, style = '', body = '') {
	return new Promise((resolve, reject) => {
		const id = gerarIdAleatorio();
		const blob = new Blob([
			'<!doctype html><html><head>',
			'<meta charset="utf-8"/>',
			`<title>${title}</title>`,
			'<style>',
			style,
			'</style>',
			'</head><body>',
			body,
			`<script>window.top.postMessage('${id}', '${DOMAIN}');</script>`,
			'</body></html>'
		], {type: 'text/html'});
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
	return 'id-' + ((1+Math.random()) * 0x1000000 | 0).toString(16).substring(1);
}

function sobreporIframe(url, id) {
	var fundo = document.getElementById('carppFundo');
	if (! fundo) {
		const estilos = document.createElement('style');
		estilos.textContent = [
			'#carppFundo { position: fixed; top: 0; left: 0; bottom: 0; right: 0; background: rgba(0,0,0,0.5); z-index: 2000; transition: opacity 150ms; }',
			'#carppIframe { position: absolute; top: 10%; left: 10%; width: 80%; height: 80%; border: none; border-radius: 2px; box-shadow: 0 2px 4px rgba(0,0,0,0.3); background: white; }',
			'#carppFechar { position: absolute; top: 10%; margin-top: -32px; left: 90%; width: 32px; height: 32px; font-size: 32px; line-height: 32px; border: none; border-radius: 16px; background: #d50000; color: white; font-weight: bold; box-shadow: 0 4px 8px rgba(0,0,0,0.3); }'
		].join('\n');
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
	iframe.style.transform = `translateX(-120%) translateY(-120%) scaleX(0) scaleY(0)`;
	iframe.style.transformOrigin = 'top left';
	iframe.getBoundingClientRect();
	iframe.style.transition = 'transform 300ms ease-out';
	iframe.style.transform = '';
	const fecharElement = document.getElementById('carppFechar');
	fecharElement.style.opacity = '0';
	fecharElement.getBoundingClientRect();
	fecharElement.style.transition = 'opacity 150ms';
	runOnce(iframe, 'transitionend', _ => fecharElement.style.opacity = '');
	fecharElement.addEventListener('click', function(evt) {
		fundo.style.opacity = '0';
		runOnce(fundo, 'transitionend', _ => fundo.style.display = 'none');
		iframe.style.transition = 'transform 150ms ease-in';
		iframe.style.transform = 'translateX(120%) translateY(-120%) scaleX(0) scaleY(0)';
		runOnce(iframe, 'transitionend', _ => fundo.innerHTML = '');
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
	return vars.reduce((result, variable, i) => result + variable.replace(invalidSymbols, (sym) => '&' + replacementSymbols[sym] + ';') + strings[i + 1], strings[0]);
}

main();
