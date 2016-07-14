// ==UserScript==
// @name        Renajud
// @namespace   http://nadameu.com.br/renajud
// @include     https://renajud.denatran.serpro.gov.br/renajud/restrito/restricoes-insercao.jsf
// @version     11
// @grant       GM_addStyle
// @grant       GM_xmlhttpRequest
// @grant       unsafeWindow
// ==/UserScript==

var { define, require } = (function() {
	'use strict';

	var modules = {}, values = {};

	function define(name, reqs, fn) {
		modules[name] = {
			requires: reqs,
			setup: fn
		};
	}

	function require(reqs, fn) {
		var deps = reqs.map(function(req) {
			return getModule(req);
		});
		return fn.apply(null, deps);
	}

	function getModule(name) {
		if (! (name in values)) {
			var module = modules[name], requires = module.requires, setup = module.setup;
			values[name] = require(requires, setup);
		}
		return values[name];
	}

	return { define: define, require: require };
})();

define('main', ['GUI', 'Pagina', 'EventDispatcher', 'ServicoWSDL'], function(GUI, Pagina, EventDispatcher, ServicoWSDL) {
	'use strict';

	Pagina.addOnDataLoadedListener(EventDispatcher.dispatch);
	GUI.addOnNumprocChangeListener(function(numproc) {
		ServicoWSDL.obterDocumentosReus(numproc)
		.then(function(documentos) {
			return documentos.reduce(function(promise, documento) {
				return promise.then(Pagina.obterVeiculosDocumento.bind(null, documento));
			}, Promise.resolve());
		})
		.then(function(qtdVeiculos) {
			var arrVeiculos = new Array(qtdVeiculos);
			for (var i = 0; i < qtdVeiculos; ++i) { arrVeiculos[i] = i; }
			return arrVeiculos.reduce(function(promise, i) {
				return promise.then(Pagina.obterDetalhesVeiculo.bind(null, i));
			}, Promise.resolve());
		});
	});
});

define('GUI', [], function() {
	'use strict';

	var style = document.createElement('style');
	style.innerHTML = [
		'@media print { div#alteracoesGreasemonkey { display: none; } }',
		'@media screen { div#impressaoGreasemonkey { display: none; } }'
	].join('\n');
	document.getElementsByTagName('head')[0].appendChild(style);

	var painel = document.getElementById('panel-inserir-restricao');
	painel.insertAdjacentHTML('beforebegin', '<div id="alteracoesGreasemonkey"><select></select> <input placeholder="NÃºmero do processo" autofocus/><div></div></div>');
	var alteracoesGreasemonkey = document.getElementById('alteracoesGreasemonkey');

	document.body.insertAdjacentHTML('beforeend', '<div id="impressaoGreasemonkey"></div>');

	var estadoElement = document.querySelector('#alteracoesGreasemonkey select');
	var estadoSalvo = localStorage.getItem('estado');
	estadoElement.insertAdjacentHTML('afterbegin', ['PR', 'RS', 'SC'].map(estado => '<option' + (estado === estadoSalvo ? ' selected' : '') + '>' + estado + '</option>').join(''));
	estadoElement.addEventListener('change', function(e) {
		estadoSalvo = e.target.value;
		localStorage.setItem('estado', estadoSalvo);
	}, false);

	var numprocElement = document.querySelector('#alteracoesGreasemonkey input');

	var GUI = {
		addOnNumprocChangeListener(fn) {
			numprocElement.addEventListener('change', fn, false);
		},
		get estado() { return estadoElement.value; },
		get numproc() { return numprocElement.value; },
		hide() {
			alteracoesGreasemonkey.style.display = 'none';
		},
		show() {
			alteracoesGreasemonkey.style.display = '';
		},
		Logger: {
			clear() {},
			write() {}
		}
	};
	return GUI;
});

define('ServicoWSDL', [], function() {
	'use strict';

	var ServicoWSDL = {
		obterDocumentosReus(numproc) {},
	};
	return ServicoWSDL;
});

define('Pagina', [], function() {
	'use strict';

	var Pagina = {
		addOnDataLoadedListener(fn) {},
		imprimir() {},
		imprimirSemVeiculos() {},
		limpar() {},
		limparPesquisa() {},
		obterVeiculosDocumento(documento) {},
		obterDetalhesVeiculo(ord) {}
	};
	return Pagina;
});

define('EventDispatcher', [], function() {
	'use strict';

	var EventDispatcher = {
		dispatch(evt) {},
		expect() {},
		expectOnce() {}
	};
	return EventDispatcher;
});

require(['main'], function(main) {
	'use strict';
});
