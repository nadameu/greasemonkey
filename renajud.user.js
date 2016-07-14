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
			var qtdVeiculosJaVistos = 0;
			return documentos.reduce(function(promise, documento) {
				return promise
				.then(Pagina.obterVeiculosDocumento.bind(null, documento))
				.then(function(qtdVeiculos) {
					if (qtdVeiculos > qtdVeiculosJaVistos) {
					} else {
						return Pagina.imprimirSemVeiculos();
					}
					return Promise.resolve(qtdVeiculos);
				});
			}, Promise.resolve());
		})
		.then(function(qtdVeiculos) {
			console.log(qtdVeiculos);
			var arrVeiculos = new Array(qtdVeiculos);
			for (var i = 0; i < qtdVeiculos; ++i) { arrVeiculos[i] = i; }
			return arrVeiculos.reduce(function(promise, i) {
				return promise.then(Pagina.obterDetalhesVeiculo.bind(null, i));
			}, Promise.resolve());
		})
		.catch(err => console.error(err));
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
	painel.insertAdjacentHTML('beforebegin', '<div id="alteracoesGreasemonkey"><select></select> <input placeholder="Número do processo" autofocus/><div></div></div>');
	var alteracoesGreasemonkey = document.getElementById('alteracoesGreasemonkey');

	document.body.insertAdjacentHTML('beforeend', '<div id="impressaoGreasemonkey"></div>');

	var estadoElement = document.querySelector('#alteracoesGreasemonkey select');
	var estadoSalvo = localStorage.getItem('estado');
	estadoElement.insertAdjacentHTML('afterbegin', ['PR', 'RS', 'SC'].map(estado => '<option' + (estado === estadoSalvo ? ' selected' : '') + '>' + estado + '</option>').join(''));
	estadoElement.addEventListener('change', function(e) {
		estadoSalvo = e.target.value;
		localStorage.setItem('estado', estadoSalvo);
	}, false);

	var listeners = [];
	var numprocElement = document.querySelector('#alteracoesGreasemonkey input');
	numprocElement.addEventListener('change', function(evt) {
		var numproc = GUI.numproc.replace(/\D+/g, '');
		GUI.numproc = numproc;
		listeners.map(fn => fn(numproc));
	}, false);

	var GUI = {
		addOnNumprocChangeListener(fn) {
			listeners.push(fn);
		},
		get estado() { return estadoElement.value; },
		get numproc() { return numprocElement.value; },
		set numproc(val) { numprocElement.value = val; },
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

define('ServicoWSDL', ['GUI'], function(GUI) {
	'use strict';

	var dadosSalvos = new Map();

	function analisarRespostaNumeroProcesso(xhr) {
		console.debug('analisarRespostaNumeroProcesso(xhr)', xhr);
		var promise = new Promise(function(resolve, reject) {
			var parser = new DOMParser();
			var xml = parser.parseFromString(xhr.responseText, 'application/xml');
			if (xml.lastChild.nodeName === 'parsererror') {
				throw new Error('Erro ao tentar obter os dados do processo.');
			}
			var ret = xml.getElementsByTagName('return')[0].textContent;
			var processo = parser.parseFromString(ret, 'application/xml');
			if (processo.lastChild.nodeName === 'parsererror') {
				throw new Error('Erro ao tentar obter os dados do processo.');
			}
			var erros = [...processo.getElementsByTagName('Erro')].map(err => err.textContent);
			if (erros.length) {
				reject(new Error(erros.join('\n')));
			} else {
				var docs = [...processo.querySelectorAll('Partes Parte CPF_CGC')]
				.filter(doc => doc.parentNode.querySelectorAll('Reu').length > 0)
				.map(doc => doc.textContent);
				dadosSalvos.set(GUI.numproc, docs);
				resolve(docs);
			}
		});
		return promise;
	}

	var ServicoWSDL = {
		obterDocumentosReus(numproc) {
			if (dadosSalvos.has(numproc)) {
				return Promise.resolve(dadosSalvos.get(numproc));
			}
			var promise = new Promise(function(resolve, reject) {
				var estado = GUI.estado;
				var options = {
					method: 'POST',
					url: 'http://www.trf4.jus.br/trf4/processos/acompanhamento/ws_consulta_processual.php',
					data: [
						'<?xml version="1.0" encoding="UTF-8"?>',
						'<SOAP-ENV:Envelope xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ns1="urn:consulta_processual" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:SOAP-ENC="http://schemas.xmlsoap.org/soap/encoding/" SOAP-ENV:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">',
						'<SOAP-ENV:Body>',
						'<ns1:ws_consulta_processo>',
						'<num_proc xsi:type="xsd:string">' + numproc + '</num_proc>',
						'<uf xsi:type="xsd:string">' + estado + '</uf>',
						'<todas_fases xsi:type="xsd:string">N</todas_fases>',
						'<todas_partes xsi:type="xsd:string">S</todas_partes>',
						'<todos_valores>N</todos_valores>',
						'</ns1:ws_consulta_processo>',
						'</SOAP-ENV:Body>',
						'</SOAP-ENV:Envelope>'
					].join(''),
					onload: function(xhr) {
						if (xhr.status >= 200 && xhr.status < 300) {
							resolve(xhr);
						} else {
							reject(new Error('Erro ao tentar obter os dados do processo.'));
						}
					},
					onerror: function(xhr) { reject(new Error('Erro ao tentar obter os dados do processo.')); }
				};
				GM_xmlhttpRequest(options);
			});
			return promise.then(analisarRespostaNumeroProcesso);
			console.log(numproc);
		},
	};
	return ServicoWSDL;
});

define('Pagina', ['EventDispatcher'], function(EventDispatcher) {
	'use strict';

	function privilegedCode() {
		$(window.document).ajaxComplete(function(ev, xhr, options) {
			var extension = $('extension', xhr.responseXML).text();
			if (extension !== '') {
				extension = JSON.parse(extension);
			} else {
				extension = null;
			}
			window.postMessage(JSON.stringify({
				type: 'ajaxComplete',
				source: options.source,
				extension: extension
			}), [location.protocol, document.domain].join('//'));
		});
	}

	var script = document.createElement('script');
	script.innerHTML = '(' + privilegedCode.toSource() + ')();';
	document.getElementsByTagName('head')[0].appendChild(script);

	var listeners = [];
	var origin = [location.protocol, document.domain].join('//');
  window.addEventListener('message', function(evt) {
    if (evt.origin !== origin) {
      return;
    }
    var msg = JSON.parse(evt.data);
    if (msg.type === 'ajaxComplete') {
      console.debug('Mensagem recebida', msg);
			listeners.map(listener => listener(msg));
    } else {
      console.debug('Tipo desconhecido', msg.type);
    }
  });

	var Pagina = {
		addOnDataLoadedListener(fn) {
			listeners.push(fn);
		},
		imprimir() {},
		imprimirSemVeiculos() {},
		limpar() {},
		limparPesquisa() {},
		obterVeiculosDocumento(documento) {
			var promise = new Promise(function(resolve, reject) {
				var idBotaoPesquisar = 'form-incluir-restricao:botao-pesquisar';
				var botaoPesquisar = document.getElementById(idBotaoPesquisar);
				var campoDocumento = document.getElementById('form-incluir-restricao:campo-cpf-cnpj');
				EventDispatcher.expectOnce(idBotaoPesquisar, ext => resolve(ext.totalRecords));
        campoDocumento.value = documento;
        botaoPesquisar.click();
      });
      return promise;
		},
		obterDetalhesVeiculo(ord) {}
	};
	return Pagina;
});

define('EventDispatcher', [], function() {
	'use strict';

	var expect = new Map();
	var expectOnce = new Map();

	function getOrCreate(obj, source) {
		if (! obj.has(source)) {
			obj.set(source, []);
		}
		return obj.get(source);
	}

	var EventDispatcher = {
		dispatch(evt) {
			getOrCreate(expect, evt.source).map(fn => fn(evt.extension));
			getOrCreate(expectOnce, evt.source).map(fn => fn(evt.extension));
			expectOnce.delete(evt.source);
		},
		expect(source, fn) {
			getOrCreate(expect, source).push(fn);
		},
		expectOnce(source, fn) {
			getOrCreate(expectOnce, source).push(fn);
		}
	};
	return EventDispatcher;
});

require(['main'], function(main) {
	'use strict';
});
