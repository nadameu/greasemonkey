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
		GUI.Logger.clear();
		GUI.areaImpressao.innerHTML = '';
		Pagina.limpar()
		.then(function() {
			GUI.Logger.write('Obtendo dados do processo... ');
			return ServicoWSDL.obterDocumentosReus(numproc);
		})
		.then(function(documentos) {
			GUI.Logger.write('ok.\n');
			return Promise.resolve(documentos);
		})
		.then(function(documentos) {
			var qtdVeiculosJaVistos = 0;
			return documentos.reduce(function(promise, documento, indiceDocumento, documentos) {
				return promise
				.then(function() {
					GUI.Logger.write('Obtendo veículos do réu ' + documento + '... ');
					return Pagina.obterVeiculosDocumento(documento);
				})
				.then(function(qtdVeiculos) {
					var qtdVeiculosReu = qtdVeiculos - qtdVeiculosJaVistos;
					qtdVeiculosJaVistos = qtdVeiculos;
					GUI.Logger.write(qtdVeiculosReu + ' ' + (qtdVeiculosReu < 2 ? 'veículo' : 'veículos') + '.\n');
					if (qtdVeiculosReu > 0) {
						return Promise.resolve(qtdVeiculos);
					} else {
						GUI.Logger.write('Imprimindo tela de réu sem veículos... ');
						Pagina.imprimirSemVeiculos();
						GUI.Logger.write('ok.\n');
						if (indiceDocumento < documentos.length - 1) {
							return Pagina.limparPesquisa().then(function() {
								return Promise.resolve(qtdVeiculos);
							});
						} else {
							return Promise.resolve(qtdVeiculos);
						}
					}
				});
			}, Promise.resolve());
		})
		.then(function(qtdVeiculos) {
			console.info('Quantidade de veículos:', qtdVeiculos);
			var promise = Promise.resolve();
			if (qtdVeiculos > 0) {
				promise = promise.then(Pagina.limparPesquisa);
			}
			return promise.then(function() {
				var arrVeiculos = new Array(qtdVeiculos);
				for (var i = 0; i < qtdVeiculos; ++i) { arrVeiculos[i] = i; }
				return arrVeiculos.reduce(function(promise, i) {
					return promise
					.then(function() {
						GUI.Logger.write('Obtendo detalhes do veículo ' + (i + 1) + '... ');
						return Pagina.obterDetalhesVeiculo(i);
					})
					.then(function() {
						GUI.Logger.write('ok.\n');
						return Promise.resolve();
					});
				}, Promise.resolve());
			});
		})
		.then(function() {
			console.log(arguments);
		})
		.catch(function(err) {
			console.error(err);
			window.alert(err.message);
			GUI.Logger.clear();
			Pagina.limpar();
		});
	});
});

define('GUI', [], function() {
	'use strict';

	var style = document.createElement('style');
	style.innerHTML = [
		'@media print { div#alteracoesGreasemonkey, .noprint { display: none; } }',
		'@media screen { div#impressaoGreasemonkey, .noscreen { display: none; } }'
	].join('\n');
	document.getElementsByTagName('head')[0].appendChild(style);

	var painel = document.getElementById('panel-inserir-restricao');
	painel.insertAdjacentHTML('beforebegin', '<div id="alteracoesGreasemonkey"><select></select> <input placeholder="Número do processo" autofocus/><div></div></div>');
	var alteracoesGreasemonkey = document.getElementById('alteracoesGreasemonkey');

	document.body.insertAdjacentHTML('beforeend', '<div id="impressaoGreasemonkey"></div>');
	var impressaoGreasemonkey = document.getElementById('impressaoGreasemonkey');

	var estadoElement = alteracoesGreasemonkey.querySelector('select');
	var estadoSalvo = localStorage.getItem('estado');
	estadoElement.insertAdjacentHTML('afterbegin', ['PR', 'RS', 'SC'].map(estado => '<option' + (estado === estadoSalvo ? ' selected' : '') + '>' + estado + '</option>').join(''));
	estadoElement.addEventListener('change', function(e) {
		estadoSalvo = e.target.value;
		localStorage.setItem('estado', estadoSalvo);
	}, false);

	var listeners = [];
	var numprocElement = alteracoesGreasemonkey.querySelector('input');
	numprocElement.addEventListener('change', function(evt) {
		var numproc = GUI.numproc.replace(/\D+/g, '');
		GUI.numproc = numproc;
		listeners.forEach(fn => fn(numproc));
	}, false);

	var logElement = alteracoesGreasemonkey.querySelector('div');

	var GUI = {
		addOnNumprocChangeListener(fn) {
			console.debug('GUI.addOnNumprocChangeListener(fn)', fn);
			listeners.push(fn);
		},
		get estado() { return estadoElement.value; },
		get numproc() { return numprocElement.value; },
		set numproc(val) { numprocElement.value = val; },
		get areaImpressao() { return impressaoGreasemonkey; },
		hide() {
			console.debug('GUI.hide()');
			alteracoesGreasemonkey.style.display = 'none';
		},
		show() {
			console.debug('GUI.show()');
			alteracoesGreasemonkey.style.display = '';
		},
		Logger: {
			clear() {
				console.debug('GUI.Logger.clear()');
				logElement.innerHTML = '';
			},
			write(text) {
				console.debug('GUI.Logger.write(text)', text);
				logElement.innerHTML += text.replace(/\n/g, '<br/>');
			}
		}
	};
	return GUI;
});

define('ServicoWSDL', ['GUI'], function(GUI) {
	'use strict';

	var dadosSalvos = new Map();

	function analisarRespostaNumeroProcesso(xhr) {
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
				dadosSalvos.set(GUI.estado + GUI.numproc, docs);
				resolve(docs);
			}
		});
		return promise;
	}

	var ServicoWSDL = {
		obterDocumentosReus(numproc) {
			console.debug('ServicoWSDL.obterDocumentosReus(numproc)', numproc);
			var estado = GUI.estado;
			var id = estado + numproc
			if (dadosSalvos.has(id)) {
				return Promise.resolve(dadosSalvos.get(id));
			}
			var promise = new Promise(function(resolve, reject) {
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
			console.info(numproc);
		},
	};
	return ServicoWSDL;
});

define('Pagina', ['EventDispatcher', 'GUI'], function(EventDispatcher, GUI) {
	'use strict';

	function privilegedCode() {
		jQuery.fx.off = true;

		var origin = [location.protocol, document.domain].join('//');
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
			}), origin);
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
			listeners.forEach(listener => listener(msg));
    } else if (msg.type === 'hideBlocker') {
			// Ignorar, enviado pelo script
		} else {
      console.error('Tipo desconhecido', msg.type);
    }
  }, false);

	var Pagina = {
		addOnDataLoadedListener(fn) {
			console.debug('Pagina.addOnDataLoadedListener(fn)', fn);
			listeners.push(fn);
		},
		imprimir() {
			console.debug('Pagina.imprimir()');
			console.info('window.print()');
		},
		imprimirSemVeiculos() {
			console.debug('Pagina.imprimirSemVeiculos()');
			var veiculos = document.getElementById('form-incluir-restricao:panel-lista-veiculo');
			veiculos.style.display = 'none';
			Pagina.imprimir();
			veiculos.style.display = '';
		},
		limpar() {
			console.debug('Pagina.limpar()');
			var promise = new Promise(function(resolve, reject) {
				var idBotaoLimpar = 'form-incluir-restricao:j_idt443';
				var botaoLimpar = document.getElementById(idBotaoLimpar);
				if (botaoLimpar === null) {
					resolve();
				} else {
					EventDispatcher.expectOnce(idBotaoLimpar, function() {
						resolve();
					});
					botaoLimpar.click();
				}
      });
      return promise.then(Pagina.limparPesquisa);
		},
		limparPesquisa() {
			console.debug('Pagina.limparPesquisa()');
			var promise = new Promise(function(resolve, reject) {
				var idBotaoLimparPesquisa = 'form-incluir-restricao:j_idt55';
				var botaoLimparPesquisa = document.getElementById(idBotaoLimparPesquisa);
				EventDispatcher.expectOnce(idBotaoLimparPesquisa, function() {
					resolve();
				});
				botaoLimparPesquisa.click();
      });
      return promise;
		},
		obterVeiculosDocumento(documento) {
			console.debug('Pagina.obterVeiculosDocumento(documento)', documento);
			var promise = new Promise(function(resolve, reject) {
				var idBotaoPesquisar = 'form-incluir-restricao:botao-pesquisar';
				var botaoPesquisar = document.getElementById(idBotaoPesquisar);
				var campoDocumento = document.getElementById('form-incluir-restricao:campo-cpf-cnpj');
				EventDispatcher.expectOnce(idBotaoPesquisar, function(ext) {
					if (ext === null) {
						resolve(0);
					} else {
						resolve(ext.totalRecords);
					}
				});
        campoDocumento.value = documento;
        botaoPesquisar.click();
      });
      return promise;
		},
		obterDetalhesVeiculo(ord) {
			console.debug('Pagina.obterDetalhesVeiculo(ord)', ord);
			var idTBody = 'form-incluir-restricao:lista-veiculo_data', tBody = document.getElementById(idTBody);
			var linha = tBody.rows[ord];
			var celulaRestricoes = linha.cells[7];
			var prefixo = 'form-incluir-restricao:lista-veiculo:' + ord;
			var idAbrirDetalhes = prefixo + ':j_idt75', abrirDetalhes = document.getElementById(idAbrirDetalhes);
			var idAbrirRestricoes = prefixo + ':link-detalhes-veiculo-restricoes', abrirRestricoes = document.getElementById(idAbrirRestricoes);
			var promise = new Promise(function(resolve, reject) {
				EventDispatcher.expectOnce(idAbrirDetalhes, resolve);
				abrirDetalhes.click();
			})
			.then(function() {
				var idDetalhes = prefixo + ':panel-group-dados-veiculo', detalhes = document.getElementById(idDetalhes);
				detalhes.style.pageBreakBefore = 'always';
				GUI.areaImpressao.appendChild(detalhes);
				var idFecharDetalhes = prefixo + ':j_idt187', fecharDetalhes = document.getElementById(idFecharDetalhes);
				fecharDetalhes.click();
				if (celulaRestricoes.textContent === 'Não') {
					return Promise.resolve();
				} else {
					return new Promise(function(resolve, reject) {
						EventDispatcher.expectOnce(idAbrirRestricoes, resolve);
						abrirRestricoes.click();
					}).then(function() {
						var idPainelRestricoes = prefixo + ':j_idt231', painelRestricoes = document.getElementById(idPainelRestricoes);
						var idListaRestricoes = prefixo + ':j_idt237_list', listaRestricoes = document.getElementById(idListaRestricoes);
						var idPainelRestricoesRenajud = prefixo + ':panel-mostrar-detalhes', painelRestricoesRenajud = document.getElementById(idPainelRestricoesRenajud);
						var idFecharRestricoes = prefixo + ':j_idt440', fecharRestricoes = document.getElementById(idFecharRestricoes);
						fecharRestricoes.click();
						return Promise.resolve();
					});
				}
			});
			return promise;
		}
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
			console.debug('EventDispatcher.dispatch(evt)', evt);
			getOrCreate(expect, evt.source).forEach(fn => fn(evt.extension));
			getOrCreate(expectOnce, evt.source).forEach(fn => fn(evt.extension));
			expectOnce.delete(evt.source);
		},
		expect(source, fn) {
			console.debug('EventDispatcher.expect(source, fn)', source, fn);
			getOrCreate(expect, source).push(fn);
		},
		expectOnce(source, fn) {
			console.debug('EventDispatcher.expectOnce(source, fn)', source, fn);
			getOrCreate(expectOnce, source).push(fn);
		}
	};
	return EventDispatcher;
});

require(['main'], function(main) {
	'use strict';
});
