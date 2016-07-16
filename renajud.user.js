// ==UserScript==
// @name        Renajud
// @namespace   http://nadameu.com.br/renajud
// @include     https://renajud.denatran.serpro.gov.br/renajud/restrito/restricoes-insercao.jsf
// @version     11
// @grant       GM_addStyle
// @grant       GM_xmlhttpRequest
// @grant       unsafeWindow
// ==/UserScript==

function main() {

	'use strict';

	function async(gen) {
		function getNext(value = null) {
			yielded = it.next(value);
			if (! yielded.done) {
				yielded.value.then(function(result) {
					getNext(result);
				}, function(err) {
					it.throw(err);
				});
			}
		}
		var it = gen(), yielded;
		getNext();
	}

	GUI.addOnNumprocChangeListener(function(numproc) {
		async(function*() {
			try {

				GUI.Logger.clear();
				GUI.areaImpressao.limpar();
				yield Pagina.limpar();

				GUI.Logger.write('Obtendo dados do processo...');
				var documentos = yield ServicoWSDL.obterDocumentosReus(numproc);
				GUI.Logger.write('..................... ok.\n');

				var qtdVeiculos = 0;
				for (let indiceDocumento = 0, len = documentos.length, ultimo = len - 1, documento; indiceDocumento < len; ++indiceDocumento) {
					documento = documentos[indiceDocumento];

					GUI.Logger.write('Obtendo veículos do réu ' + documento + '.'.repeat(14 - documento.length) + '...');
					let qtdVeiculosAnterior = qtdVeiculos;
					qtdVeiculos = yield Pagina.obterVeiculosDocumento(documento);
					let qtdVeiculosReu = qtdVeiculos - qtdVeiculosAnterior;
					GUI.Logger.write('.'.repeat(3 - qtdVeiculosReu.toString().length) + '(' + qtdVeiculosReu + ')... ok.\n');

					if (qtdVeiculosReu === 0) {
						GUI.Logger.write('Imprimindo tela de réu sem veículos...');
						Pagina.imprimirSemVeiculos();
						GUI.Logger.write('........... ok.\n');
						if (indiceDocumento < ultimo) {
							yield Pagina.limparPesquisa();
						}
					}
				}

				if (qtdVeiculos > 0) {

					yield Pagina.limparPesquisa();

					for (var i = 0; i < qtdVeiculos; ++i) {

						let placa = Pagina.obterPlacaVeiculo(i);
						GUI.Logger.write('Obtendo detalhes do veículo ' + placa.substr(0, 3) + '-' + placa.substr(3) + '...');

						let detalhes = yield Pagina.abrirDetalhesVeiculo(i);
						detalhes.style.pageBreakBefore = 'always';
						GUI.areaImpressao.adicionar(detalhes);
						Pagina.fecharDetalhesVeiculo(i);

						if (Pagina.veiculoPossuiRestricoes(i)) {
							let detalhesRestricoes = yield Pagina.abrirRestricoesVeiculo(i);
							let restricoes = [...detalhesRestricoes.lista.childNodes].map(li => li.textContent.trim());
							GUI.definirRestricoesVeiculo(i, restricoes);
							GUI.areaImpressao.adicionar(document.createElement('br'));
							GUI.areaImpressao.adicionar(detalhesRestricoes.painel);
							if (detalhesRestricoes.renajud) {
								GUI.areaImpressao.adicionar(document.createElement('br'));
								[...detalhesRestricoes.renajud.childNodes].forEach(GUI.areaImpressao.adicionar);
							}
							Pagina.fecharRestricoesVeiculo(i);
						}
						GUI.Logger.write('.......... ok.\n');

					}
					Pagina.imprimir();
				}

			} catch (err) {
				console.error(err);
				window.alert(err.message);
				GUI.Logger.clear();
				Pagina.limpar();
			}
		});
	});
}

var AjaxListener = (function() {
	'use strict';

	var callbacks = new Set();
	var resolves = new Set();

	function getOrCreate(collection, id) {
		if (! collection.has(id)) {
			collection.set(id, []);
		}
		return collection.get(id);
	}

	function addItem(collection, id, item) {
		getOrCreate(collection, id).push(item);
	}

	var addCallback = addItem.bind(null, callbacks);
	var getCallbacks = getOrCreate.bind(null, callbacks);

	var addResolve = addItem.bind(null, resolves);
	function getResolves(source) {
		var resolves = getOrCreate(resolves, source);
		resolves.delete(source);
		return resolves;
	}

	function privilegedCode() {

		jQuery.fx.off = true;

		const origin = [location.protocol, document.domain].join('//');

		function sendObject(obj) {
			window.postMessage(JSON.stringify(obj), origin);
		}

		$(window.document).ajaxComplete(function(evt, xhr, options) {
			var extension = $('extension', xhr.responseXML).text();
			if (extension !== '') {
				extension = JSON.parse(extension);
			} else {
				extension = null;
			}
			var eventDetails = {
				type: 'ajaxComplete',
				source: options.source,
				extension: extension
			};
			sendObject(eventDetails);
		});
	}

	var script = document.createElement('script');
	script.innerHTML = '(' + privilegedCode.toSource() + ')();';
	document.getElementsByTagName('head')[0].appendChild(script);

	const origin = [location.protocol, document.domain].join('//');
	window.addEventListener('message', function(evt) {
		if (evt.origin !== origin) {
			return;
		}
		try {
			var eventDetails = JSON.parse(evt.data);
			if (eventDetails.type === 'ajaxComplete') {
				getResolves(eventDetails.source).forEach(resolve => resolve(eventDetails.extension));
				getCallbacks(eventDetails.source).forEach(callback => callback(eventDetails.extension));
			} else {
				throw new Error('Tipo desconhecido: ' + eventDetails.type);
			}
		} catch(err) {
			console.error(err);
		}
	}, false);

	return {
		listen(source, fn) {
			console.debug('AjaxListener.listen(source)', source, fn);
			addCallback(source, fn);
		},
		listenOnce(source) {
			console.debug('AjaxListener.listenOnce(source)', source);
			var hijackedResolve;
			var promise = new Promise(function(resolve, reject) {
				hijackedResolve = resolve;
			});
			addResolve(source, hijackedResolve);
			return promise;
		}
	};
})();

var GUI = (function() {
	'use strict';

	var style = document.createElement('style');
	style.innerHTML = [
		'@media print { div#alteracoesGreasemonkey, .noprint { display: none; } }',
		'@media screen { div#impressaoGreasemonkey, .noscreen { display: none; } }',
		'div#alteracoesGreasemonkey div { font-family: monospace; }',
		'div#impressaoGreasemonkey table { page-break-inside: avoid; }'
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
		get estado() { return estadoElement.value; },
		get numproc() { return numprocElement.value; },
		set numproc(val) { numprocElement.value = val; },
		addOnNumprocChangeListener(fn) {
			console.debug('GUI.addOnNumprocChangeListener(fn)', fn);
			listeners.push(fn);
		},
		definirRestricoesVeiculo(ord, restricoes) {
			console.debug('GUI.definirRestricoeVeiculo(ord, restricoes)', ord, restricoes);
			var celulaRestricao = Pagina.obterCelulaRestricaoVeiculo(ord);
			celulaRestricao.innerHTML = '<div class="noscreen">' + celulaRestricao.innerHTML + '</div>\n';
			celulaRestricao.insertAdjacentHTML('beforeend', restricoes.map(texto => '<div class="noprint">' + texto + '</div>').join('\n'));
		},
		areaImpressao: {
			adicionar(elemento) {
				console.debug('GUI.areaImpressao.adicionar(elemento)', elemento);
				impressaoGreasemonkey.appendChild(elemento);
			},
			limpar() {
				console.debug('GUI.areaImpressao.limpar()');
				impressaoGreasemonkey.innerHTML = '';
			}
		},
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
})();

var Pagina = (function() {
	'use strict';

	var Pagina = {
		abrirDetalhesVeiculo(ord) {
			console.debug('Pagina.abrirDetalhesVeiculo(ord)', ord);
			var prefixo = Pagina.obterPrefixoVeiculo(ord);
			var idAbrirDetalhes = prefixo + ':j_idt75', abrirDetalhes = document.getElementById(idAbrirDetalhes);
			var promise = AjaxListener.listenOnce(idAbrirDetalhes).then(function() {
				return document.getElementById(prefixo + ':panel-group-dados-veiculo');
			});
			abrirDetalhes.click();
			return promise;
		},
		abrirRestricoesVeiculo(ord) {
			console.debug('Pagina.abrirDetalhesVeiculo(ord)', ord);
			var prefixo = Pagina.obterPrefixoVeiculo(ord);
			var idAbrirRestricoes = prefixo + ':link-detalhes-veiculo-restricoes', abrirRestricoes = document.getElementById(idAbrirRestricoes);
			var promise = AjaxListener.listenOnce(idAbrirRestricoes).then(function() {
				var painelRestricoes = document.getElementById(prefixo + ':j_idt231');
				var listaRestricoes = document.getElementById(prefixo + ':j_idt237_list');
				var painelRestricoesRenajud = document.getElementById(prefixo + ':j_idt239');
				return {
					painel: painelRestricoes,
					lista: listaRestricoes,
					renajud: painelRestricoesRenajud
				};
			});
			abrirRestricoes.click();
			return promise;
		},
		fecharDetalhesVeiculo(ord) {
			console.debug('Pagina.fecharDetalhesVeiculo(ord)', ord);
			var prefixo = Pagina.obterPrefixoVeiculo(ord);
			var fecharDetalhes = document.getElementById(prefixo + ':j_idt187');
			fecharDetalhes.click();
		},
		fecharRestricoesVeiculo(ord) {
			console.debug('Pagina.fecharRestricoesVeiculo(ord)', ord);
			var prefixo = Pagina.obterPrefixoVeiculo(ord);
			var fecharRestricoes = document.getElementById(prefixo + ':j_idt440');
			fecharRestricoes.click();
		},
		imprimir() {
			console.debug('Pagina.imprimir()');
			window.print();
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
			var promise = Promise.resolve();
			var idBotaoLimpar = 'form-incluir-restricao:j_idt443';
			var botaoLimpar = document.getElementById(idBotaoLimpar);
			if (botaoLimpar !== null) {
				promise = AjaxListener.listenOnce(idBotaoLimpar);
				botaoLimpar.click();
			}
			promise = promise.then(Pagina.limparPesquisa);
			return promise;
		},
		limparPesquisa() {
			console.debug('Pagina.limparPesquisa()');
			var idBotaoLimparPesquisa = 'form-incluir-restricao:j_idt55';
			var botaoLimparPesquisa = document.getElementById(idBotaoLimparPesquisa);
			var promise = AjaxListener.listenOnce(idBotaoLimparPesquisa);
			botaoLimparPesquisa.click();
			return promise;
		},
		obterCelulaRestricaoVeiculo(ord) {
			console.debug('Pagina.obterCelulaRestricaoVeiculo(ord)', ord);
			var linha = Pagina.obterLinhaVeiculo(ord);
			return linha.cells[7];
		},
		obterLinhaVeiculo(ord) {
			console.debug('Pagina.obterLinhaVeiculo(ord)', ord);
			var tBody = document.getElementById('form-incluir-restricao:lista-veiculo_data');
			return tBody.rows[ord];
		},
		obterPlacaVeiculo(ord) {
			console.debug('Pagina.obterPlacaVeiculo(ord)', ord);
			var linha = Pagina.obterLinhaVeiculo(ord);
			var celulaPlaca = linha.cells[1];
			return celulaPlaca.textContent;
		},
		obterPrefixoVeiculo(ord) {
			console.debug('Pagina.obterPrefixoVeiculo(ord)', ord);
			return 'form-incluir-restricao:lista-veiculo:' + ord;
		},
		obterVeiculosDocumento(documento) {
			console.debug('Pagina.obterVeiculosDocumento(documento)', documento);
			var idBotaoPesquisar = 'form-incluir-restricao:botao-pesquisar';
			var botaoPesquisar = document.getElementById(idBotaoPesquisar);
			var campoDocumento = document.getElementById('form-incluir-restricao:campo-cpf-cnpj');
			var promise = AjaxListener.listenOnce(idBotaoPesquisar).then(function(ext) {
				if (ext === null) {
					return 0;
				} else {
					return ext.totalRecords;
				}
			});
			campoDocumento.value = documento;
			botaoPesquisar.click();
			return promise;
		},
		veiculoPossuiRestricoes(ord) {
			console.debug('Pagina.veiculoPossuiRestricoes(ord)', ord);
			var celulaRestricoes = Pagina.obterCelulaRestricaoVeiculo(ord);
			return celulaRestricoes.textContent === 'Sim';
		}
	};
	return Pagina;
})();

var ServicoWSDL = (function() {
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
			var id = estado + numproc;
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
		},
	};
	return ServicoWSDL;
})();

main();
