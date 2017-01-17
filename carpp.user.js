// ==UserScript==
// @name        CARPP
// @namespace   http://nadameu.com.br/carpp
// @description Controle de Andamento e Regularidade de Prazos Processuais
// @include     /^https:\/\/eproc\.(jf(pr|rs|sc)|trf4)\.jus\.br\/eproc(V2|2trf4)\/controlador\.php\?acao=([^&]+)&acao_origem=principal&/
// @version     1
// @grant       none
// ==/UserScript==

const DOMAIN = `${window.top.location.protocol}//${window.top.document.domain}`;

function Botao(texto) {
	const botao = document.createElement('button');
	botao.textContent = texto;
	return botao;
}

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
		'.usuarios { margin: 16px; min-height: 300px; max-width: 600px; border-radius: 2px; background: white; box-shadow: 0 4px 8px rgba(0,0,0,0.3); }',
		'.usuarios__titulo { margin: 0; padding: 8px; font-size: 20px; color: #fff; background: #00796b; }',
		'.usuarios__atualizar { border: none; color: white; font-weight: bold; text-decoration: none; float: right; margin: 8px; background: #d50000; padding: 8px; border-radius: 2px; box-shadow: 0 2px 4px rgba(0,0,0,0.3); }',
		'.usuarios__atualizar:disabled { background: #eee; color: rgba(0,0,0,0.38); }',
		'.usuarios__container { clear: right; margin: 8px; }',
		'.usuario { display: flex; border-bottom: 1px solid #ccc; }',
		'.usuario__nome { flex: 6; }',
		'.usuario__sigla { flex: 1; }',
		'.usuario__tipo { flex: 5; }'
	].join('\n'), [
		'<header class="cabecalho">',
		'<h1 class="cabecalho__titulo">CARPP</h1>',
		'<h2 class="cabecalho__subtitulo">Controle de Andamento e Regularidade de Prazos Processuais</h2>',
		'</header>',
		'<div class="usuarios">',
		'<h3 class="usuarios__titulo">Usuários</h3>',
		'<button class="usuarios__atualizar" disabled>Atualizar</button>',
		'<div class="usuarios__container">Carregando...',
		'<div class="usuario"><div class="usuario__nome">ADRIANA REGINA BARNI RITTER</div><div class="usuario__sigla">ARI</div><div class="usuario__tipo">MAGISTRADO</div></div>',
		'<div class="usuario"><div class="usuario__nome">AIRTON AGOSTINI</div><div class="usuario__sigla">AGI</div><div class="usuario__tipo">SERVIDOR DE SECRETARIA (VARA)</div></div>',
		'<div class="usuario"><div class="usuario__nome">ALEX PERES ROCHA</div><div class="usuario__sigla">ARP</div><div class="usuario__tipo">MAGISTRADO</div></div>',
		'</div>',
		'</div>'
	].join('')).then((win) => {
		const doc = win.document;
		const usuariosElement = doc.querySelector('.usuarios');
		const usuariosAtualizarElement = doc.querySelector('.usuarios__atualizar');
		usuariosAtualizarElement.addEventListener('click', evt => {
			evt.preventDefault();
		}, false);
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
			console.log(evt);
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
			'#carppFechar { position: absolute; top: 10%; margin-top: -16px; left: 90%; margin-left: -16px; width: 32px; height: 32px; font-size: 32px; line-height: 32px; border: none; border-radius: 16px; background: #d50000; color: white; font-weight: bold; box-shadow: 0 4px 8px rgba(0,0,0,0.3); }'
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
	requestAnimationFrame(_ => fundo.style.opacity = '');
	const iframe = fundo.querySelector('iframe');
	const fecharElement = document.getElementById('carppFechar');
	fecharElement.addEventListener('click', function(evt) {
		fundo.innerHTML = '';
		fundo.style.display = 'none';
	}, false);
}
/*
const CARPP = (function() {
	const CARPP = {
		gerenciar() {
			var blob = new Blob([
				'<!doctype html><html><head>',
				'<meta charset="utf-8"/>',
				'<title>CARPP</title>',
				'<style>',
				[
					'html, body { margin: 0; padding: 0; }',
					'body { background: white; }'
				].join('\n'),
				'</style>',
				'</head><body>',
				'<button class="fechar">X</button>',
				'<h1>CARPP</h2>',
				'<h2>Controle de Andamento e Regularidade de Prazos Processuais</h2>',
				'<ul>',
				'<li>Usuários</li>',
				'<li>Competências</li>',
				'</ul>',
				'<div class="usuarios"></div>',
				'<script>window.top.postMessage("gerenciar", `${window.top.location.protocol}//${window.top.document.domain}`);</script>',
				'</body></html>'
			], {type: 'text/html'});
			var url = URL.createObjectURL(blob);
			GUI.abrirIframe(url, 'gerenciar', function(win, doc) {
				const fecharElement = doc.querySelector('.fechar');
				fecharElement.addEventListener('click', function(evt) {
					GUI.fecharIframe();
				}, false);

				const usuariosElement = doc.querySelector('usuarios');
				Eproc.obterListaUsuarios()
					.then((usuarios) => {
					console.log('ok');
					alert(usuarios);
				}).catch(err => {

				});
			});
		}
	};
	return CARPP;
})();

const Eproc = (function() {
	const Eproc = {
		obterListaUsuarios() {
			return new Promise(function(resolve, reject) {
				const url = Eproc.obterMenu('usuario_listar_todos');
				const xhr = new XMLHttpRequest();
				xhr.open('GET', url);
				xhr.responseType = 'document';
				xhr.addEventListener('load', evt => resolve(evt.target.response), false);
				xhr.addEventListener('error', reject, false);
				xhr.send(null);
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
		}
	};
	return Eproc;
})();

const GUI = (function() {

	const style = document.createElement('style');
	style.innerHTML = [
		'#carppDivFundo { display: none; align-items: center; justify-content: center; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); }',
		'#carppIframe { width: 80%; height: 80%; }'
	].join('\n');
	document.querySelector('head').appendChild(style);

	const GUI = {
		abrirIframe(url, id, fn) {
			const iframe = GUI.obterIframe();
			iframe.name = id;
			iframe.src = url;
			window.addEventListener('message', function handler(evt) {
				if (evt.data === id) {
					window.removeEventListener('message', handler);
					const win = evt.source, doc = win.document;
					fn(win, doc);
				}
			}, false);
			GUI.exibirIframe();
		},
		adicionarBotaoGerenciar() {
			const areaTelaD = document.querySelector('#divInfraAreaTelaD');
			const botaoGerenciar = document.createElement('button');
			botaoGerenciar.textContent = 'Gerenciar';
			botaoGerenciar.addEventListener('click', evt => CARPP.gerenciar(), false);
			areaTelaD.insertBefore(botaoGerenciar, areaTelaD.firstChild);
		},
		criarDivFundo() {
			const divFundo = document.createElement('div');
			divFundo.id = 'carppDivFundo';
			document.body.appendChild(divFundo);
			return divFundo;
		},
		criarIframe() {
			const divFundo = GUI.obterDivFundo();
			iframe = document.createElement('iframe');
			iframe.id = 'carppIframe';
			divFundo.appendChild(iframe);
			return iframe;
		},
		exibirDivFundo() {
			const divFundo = GUI.obterDivFundo();
			divFundo.style.display = 'flex';
		},
		exibirIframe() {
			GUI.exibirDivFundo();
		},
		fecharIframe() {
			const iframe = GUI.obterIframe();
			iframe.src = '';
			GUI.ocultarIframe();
		},
		obterDivFundo() {
			const divFundo = GUI.criarDivFundo();
			GUI.obterDivFundo = () => divFundo;
			return GUI.obterDivFundo();
		},
		obterIframe() {
			const iframe = GUI.criarIframe();
			GUI.obterIframe = () => iframe;
			return GUI.obterIframe();
		},
		ocultarDivFundo() {
			const divFundo = GUI.obterDivFundo();
			divFundo.style.display = 'none';
		},
		ocultarIframe() {
			GUI.ocultarDivFundo();
		}
	};
	return GUI;
})();
*/
main();
