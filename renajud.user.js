// ==UserScript==
// @name        Renajud
// @author      nadameu
// @description Facilita a utilização do sistema RENAJUD por usuários da Justiça Federal da 4ª Região.
// @icon        https://github.com/nadameu/greasemonkey/raw/master/car.png
// @namespace   http://nadameu.com.br/renajud
// @homepage    http://www.nadameu.com.br/
// @supportURL  https://github.com/nadameu/greasemonkey/issues
// @include     https://renajud.denatran.serpro.gov.br/renajud/restrito/restricoes-insercao.jsf
// @include     https://renajud.denatran.serpro.gov.br/renajud/restrito/restricoes-retirar.jsf
// @connect     www.trf4.jus.br
// @version     20
// @grant       GM_addStyle
// @grant       GM_xmlhttpRequest
// @grant       unsafeWindow
// ==/UserScript==

/* eslint-env jquery,greasemonkey */
/* eslint no-console: off, complexity: off, max-depth: off, max-nested-callbacks: off */

function inserir() {

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
		async(function *() {
			try {

				GUI.Logger.clear();
				GUI.areaImpressao.limpar();
				yield Pagina.limpar();

				GUI.Logger.write('Obtendo dados do processo...');
				var documentos = yield ServicoWSDL.obterDocumentosReus(numproc);
				GUI.Logger.write('..................... ok.\n');

				var qtdVeiculos = 0;
				let len = documentos.length, ultimo = len - 1, documento;
				for (let indiceDocumento = 0; indiceDocumento < len; ++indiceDocumento) {
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

					var paginaAtual = 1;

					for (var i = 0; i < qtdVeiculos; ++i) {

						if (i > 99 && i % 100 === 0) {
							GUI.Logger.write('Imprimindo detalhes dos veículos...');
							Pagina.imprimir();
							GUI.Logger.write('.............. ok.\n');
							GUI.Logger.write('Selecione os veículos a restringir.\n');
							window.alert('Há mais de ' + (paginaAtual * 100) + ' veículos.\n\nAo carregar a página ' + (paginaAtual + 1) + ', os dados serão atualizados.\n\n');
							yield Pagina.aguardarProximaPaginaListagem(++paginaAtual);
							GUI.areaImpressao.limpar();
						}

						let placa = Pagina.obterPlacaVeiculo(i);
						GUI.Logger.write('Obtendo detalhes do veículo ' + placa.substr(0, 3) + '-' + placa.substr(3) + '...');

						let detalhes = yield Pagina.abrirDetalhesVeiculo(i);
						detalhes.style.pageBreakBefore = 'always';
						GUI.areaImpressao.adicionar(detalhes);
						Pagina.fecharDetalhesVeiculo(i);

						if (Pagina.veiculoPossuiRestricoes(i)) {
							let detalhesRestricoes = yield Pagina.abrirRestricoesVeiculo(i);
							GUI.definirRestricoesVeiculo(i, detalhesRestricoes.lista);
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
					GUI.Logger.write('Imprimindo detalhes dos veículos...');
					Pagina.imprimir();
					GUI.Logger.write('.............. ok.\n');
					GUI.Logger.write('Terminado. Selecione os veículos a restringir.\n');
				} else {
					GUI.Logger.write('Terminado. Nenhum veículo encontrado.\n');
				}
			} catch (err) {
				console.error(err);
				window.alert(err.message);
				GUI.Logger.clear();
				Pagina.limpar();
			}
		});
	});

	function preencherSelectOneMenu(idCampo, valor) {
		console.debug('preencherSelectOneMenu(idCampo, valor)', idCampo, valor);
		var idSelect = idCampo + '_input', idPainel = idCampo + '_panel';
		var select = document.getElementById(idSelect);
		var opcao = select.querySelectorAll('option[value="' + valor + '"]');
		if (opcao.length === 0) {
			throw new Error('Opção não encontrada (campo "' + idCampo + '"):', valor);
		}
		var texto = opcao[0].innerHTML;
		var menu = document.getElementById(idCampo).getElementsByClassName('ui-selectonemenu-trigger');
		opcao = [...document.getElementById(idPainel).getElementsByTagName('li')].filter(li => li.dataset.label === texto);
		if (menu.length === 0) {
			throw new Error('Campo não encontrado: "' + idCampo + '"', select, texto, menu, opcao);
		}
		menu[0].click();
		opcao[0].click();
	}

	function preencherTudo() {
		console.debug('preencherTudo()');
		if (Pagina.obterMunicipio() !== PreferenciasUsuario.municipio) {
			preencherSelectOneMenu('form-incluir-restricao:campo-municipio', PreferenciasUsuario.municipio);
		} else if (Pagina.obterMunicipio() !== '' && Pagina.obterOrgao() !== PreferenciasUsuario.orgao) {
			try {
				preencherSelectOneMenu('form-incluir-restricao:campo-orgao', PreferenciasUsuario.orgao);
			} catch (err) {
				PreferenciasUsuario.orgao = '';
			}
		} else if (Pagina.obterOrgao() !== '' && Pagina.obterMagistrado() !== PreferenciasUsuario.magistrado && PreferenciasUsuario.preencherMagistrado) {
			preencherSelectOneMenu('form-incluir-restricao:campo-magistrado', PreferenciasUsuario.magistrado);
		} else if (Pagina.obterMagistrado() !== '') {
			document.getElementById('form-incluir-restricao:campo-numero-processo').value = GUI.numproc;
		} else {
			console.info('Tudo preenchido.');
		}
	}

	var form = document.getElementById('form-incluir-restricao');
	var firstDiv = form.getElementsByTagName('div')[0], id = firstDiv.id;
	AjaxListener.listen(id, function(ext) {
		if (ext.currentStep === 'inclui-restricao') {
			GUI.hide();
			GUI.areaImpressao.limpar();
			document.getElementById('form-incluir-restricao:campo-magistrado_input').childNodes[0].value = '';
			GUI.criarOpcaoPreencherMagistrado();
			AjaxListener.listen('form-incluir-restricao:campo-municipio', function() {
				PreferenciasUsuario.municipio = Pagina.obterMunicipio();
				preencherTudo();
			});
			AjaxListener.listen('form-incluir-restricao:campo-orgao', function() {
				PreferenciasUsuario.orgao = Pagina.obterOrgao();
				preencherTudo();
			});
			Pagina.addOnMagistradoChangeListener(function(valor) {
				PreferenciasUsuario.magistrado = valor;
				preencherTudo();
			});
			preencherTudo();
		} else if (ext.currentStep === 'pesquisa-veiculo') {
			GUI.show();
		} else if (ext.currentStep === 'confirma-restricao') {
			// Não faz nada
		}
	});
}

function retirar() {}

var PreferenciasUsuario = (function() {
	'use strict';

	function padrao(nome, valor) {
		let valorSalvo = localStorage.getItem(nome);
		if (valorSalvo === null) {
			valorSalvo = valor;
		}
		return valorSalvo;
	}

	function salvar(nome, valor) {
		localStorage.setItem(nome, valor);
	}

	var PreferenciasUsuario = {
		get estado() {
			return padrao('estado', 'PR');
		},
		set estado(valor) {
			salvar('estado', valor);
		},
		get magistrado() {
			return padrao('magistrado', '');
		},
		set magistrado(valor) {
			salvar('magistrado', valor);
		},
		get orgao() {
			return padrao('orgao', '');
		},
		set orgao(valor) {
			salvar('orgao', valor);
		},
		get preencherMagistrado() {
			let valorSalvo = localStorage.getItem('preencher-magistrado');
			if (valorSalvo === null || valorSalvo === 'N') {
				valorSalvo = false;
			} else {
				valorSalvo = true;
			}
			return valorSalvo;
		},
		set preencherMagistrado(valor) {
			salvar('preencher-magistrado', valor ? 'S' : 'N');
		},
		get municipio() {
			return padrao('municipio', '');
		},
		set municipio(valor) {
			salvar('municipio', valor);
		}
	};
	return PreferenciasUsuario;
})();

var AjaxListener = (function() {
	'use strict';

	var callbacks = new Map();
	var resolves = new Map();

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
		var sourceResolves = getOrCreate(resolves, source);
		resolves.delete(source);
		return sourceResolves;
	}

	function privilegedCode() {

		jQuery.fx.off = true;

		const origin = [location.protocol, document.domain].join('//');

		function sendObject(obj) {
			window.postMessage(JSON.stringify(obj), origin);
		}

		$(window.document).ajaxComplete(function(evt, xhr, options) {
			var extension = $('extension', xhr.responseXML).text();
			if (extension === '') {
				extension = null;
			} else {
				extension = JSON.parse(extension);
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
	script.innerHTML = '(' + privilegedCode.toString() + ')();';
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
				console.debug('ajaxComplete()', eventDetails);
			} else {
				throw new Error('Tipo desconhecido: ' + eventDetails.type);
			}
		} catch (err) {
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
			var promise = new Promise(function(resolve) {
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
	painel.insertAdjacentHTML('beforebegin', '<div id="alteracoesGreasemonkey"><select></select> <input placeholder="Número do processo" size="25" maxlength="25" autofocus/><div></div></div>');
	var alteracoesGreasemonkey = document.getElementById('alteracoesGreasemonkey');

	document.body.insertAdjacentHTML('beforeend', '<div id="impressaoGreasemonkey"></div>');
	var impressaoGreasemonkey = document.getElementById('impressaoGreasemonkey');

	var estadoElement = alteracoesGreasemonkey.querySelector('select');
	var estadoSalvo = PreferenciasUsuario.estado;
	estadoElement.insertAdjacentHTML('afterbegin', ['PR', 'RS', 'SC'].map(estado => '<option' + (estado === estadoSalvo ? ' selected' : '') + '>' + estado + '</option>').join(''));
	estadoElement.addEventListener('change', function(e) {
		estadoSalvo = e.target.value;
		PreferenciasUsuario.estado = estadoSalvo;
	}, false);

	var listeners = [];
	var numprocElement = alteracoesGreasemonkey.querySelector('input');
	numprocElement.addEventListener('change', function() {
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
		criarOpcaoPreencherMagistrado() {
			console.debug('GUI.criarOpcaoPreencherMagistrado()');
			var menu = document.getElementById('form-incluir-restricao:campo-magistrado');
			var celula = menu.parentNode;
			while (celula && celula.tagName.toUpperCase() !== 'TD') {
				celula = celula.parentNode;
			}
			celula.insertAdjacentHTML('afterend', '<td><label><input type="checkbox" id="preencher-magistrado-automaticamente"/> Usar este valor como padrão para todos os processos</label></td>');
			var checkbox = document.getElementById('preencher-magistrado-automaticamente');
			checkbox.checked = PreferenciasUsuario.preencherMagistrado;
			checkbox.addEventListener('change', function(evt) {
				PreferenciasUsuario.preencherMagistrado = evt.target.checked;
			}, false);
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
		restaurarTabelaVeiculos(fragmento) {
			console.debug('GUI.restaurarTabelaVeiculos(fragmento)', fragmento);
			var tBody = document.getElementById('form-incluir-restricao:lista-veiculo_data');
			tBody.insertBefore(fragmento, tBody.firstChild);
		},
		salvarTabelaVeiculos() {
			console.debug('GUI.salvarTabelaVeiculos()');
			var fragmento = document.createDocumentFragment();
			var linhas = [...document.getElementById('form-incluir-restricao:lista-veiculo_data').rows];
			linhas.forEach(linha => fragmento.appendChild(linha));
			return fragmento;
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

	function addSelectOneMenuListner(prefixo, fn) {
		var painelOpcoes = document.getElementById(prefixo + '_panel');
		var select = document.getElementById(prefixo + '_input');
		painelOpcoes.addEventListener('click', function(evt) {
			var elementoClicado = evt.target;
			if (elementoClicado.tagName.toUpperCase() === 'LI' && elementoClicado.dataset.hasOwnProperty('label')) {
				return fn(select.value);
			}
		}, false);
	}

	var Pagina = {
		abrirDetalhesVeiculo(ord) {
			console.debug('Pagina.abrirDetalhesVeiculo(ord)', ord);
			var prefixo = Pagina.obterPrefixoVeiculo(ord);
			var idDivDetalhes = prefixo + ':detalhe-veiculo', divDetalhes = document.getElementById(idDivDetalhes);
			var abrirDetalhes = divDetalhes.previousElementSibling, idAbrirDetalhes = abrirDetalhes.id;
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
				var idDialogo = prefixo + ':dlg-detalhes-veiculo-restricoes', dialogo = document.getElementById(idDialogo);
				var fieldsets = dialogo.getElementsByTagName('fieldset');
				var painelRestricoes = fieldsets[1];
				var listaRestricoes = painelRestricoes.getElementsByTagName('ul');
				if (listaRestricoes.length > 0) {
					listaRestricoes = [...listaRestricoes[0].childNodes].map(li => li.textContent.trim());
				} else {
					listaRestricoes = [];
				}
				var painelRestricoesRenajud = fieldsets[2];
				return {
					painel: painelRestricoes,
					lista: listaRestricoes,
					renajud: painelRestricoesRenajud
				};
			});
			abrirRestricoes.click();
			return promise;
		},
		addOnMagistradoChangeListener(fn) {
			addSelectOneMenuListner('form-incluir-restricao:campo-magistrado', fn);
		},
		addOnMunicipioChangeListener(fn) {
			addSelectOneMenuListner('form-incluir-restricao:campo-municipio', fn);
		},
		addOnOrgaoChangeListener(fn) {
			addSelectOneMenuListner('form-incluir-restricao:campo-orgao', fn);
		},
		aguardarProximaPaginaListagem(pagina) {
			console.debug('Pagina.aguardarProximaPaginaListagem(pagina)', pagina);
			var promise = new Promise(function(resolve, reject) {
				var onPaginaCarregada = function() {
					console.info('pagina carregada');
					var botoesPagina = [...document.getElementsByClassName('ui-paginator-page')].filter(botao => botao.classList.contains('ui-state-active'));
					if (botoesPagina.length === 2 && Number(botoesPagina[0].textContent) === pagina) {
						resolve();
					} else if (botoesPagina.length === 2) {
						AjaxListener.listenOnce('form-incluir-restricao:lista-veiculo').then(onPaginaCarregada);
					} else {
						reject();
					}
				};
				AjaxListener.listenOnce('form-incluir-restricao:lista-veiculo').then(onPaginaCarregada);
			});
			return promise;
		},
		fecharDetalhesVeiculo(ord) {
			console.debug('Pagina.fecharDetalhesVeiculo(ord)', ord);
			var prefixo = Pagina.obterPrefixoVeiculo(ord);
			var idDivDetalhes = prefixo + ':detalhe-veiculo', divDetalhes = document.getElementById(idDivDetalhes);
			var fecharDetalhes = divDetalhes.getElementsByTagName('button')[1];
			fecharDetalhes.click();
		},
		fecharRestricoesVeiculo(ord) {
			console.debug('Pagina.fecharRestricoesVeiculo(ord)', ord);
			var prefixo = Pagina.obterPrefixoVeiculo(ord);
			var idDivDetalhesRestricoes = prefixo + ':dlg-detalhes-veiculo-restricoes', divDetalhesRestricoes = document.getElementById(idDivDetalhesRestricoes);
			var fecharRestricoes = divDetalhesRestricoes.getElementsByTagName('button')[1];
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
			var form = document.getElementById('form-incluir-restricao:panel-lista-veiculo');
			var botoes = [...form.getElementsByTagName('button')].filter(botao => botao.textContent.trim() === 'Limpar lista');
			if (botoes.length === 1) {
				var botaoLimpar = botoes[0], idBotaoLimpar = botaoLimpar.id;
				promise = AjaxListener.listenOnce(idBotaoLimpar);
				botaoLimpar.click();
			}
			promise = promise.then(Pagina.limparPesquisa);
			return promise;
		},
		limparPesquisa() {
			console.debug('Pagina.limparPesquisa()');
			var idBotaoPesquisar = 'form-incluir-restricao:botao-pesquisar', botaoPesquisar = document.getElementById(idBotaoPesquisar);
			var botaoLimparPesquisa = botaoPesquisar.nextElementSibling, idBotaoLimparPesquisa = botaoLimparPesquisa.id;
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
			return tBody.rows[ord % 100];
		},
		obterMagistrado() {
			return document.getElementById('form-incluir-restricao:campo-magistrado_input').value;
		},
		obterMunicipio() {
			return document.getElementById('form-incluir-restricao:campo-municipio_input').value;
		},
		obterOrgao() {
			return document.getElementById('form-incluir-restricao:campo-orgao_input').value;
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
				.filter(doc => doc.parentNode.querySelectorAll('Réu').length > 0)
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
					onerror: function() { reject(new Error('Erro ao tentar obter os dados do processo.')); }
				};
				GM_xmlhttpRequest(options);
			});
			return promise.then(analisarRespostaNumeroProcesso);
		}
	};
	return ServicoWSDL;
})();

var loc = location.href;
if (loc === 'https://renajud.denatran.serpro.gov.br/renajud/restrito/restricoes-insercao.jsf') {
	inserir();
} else if (loc === 'https://renajud.denatran.serpro.gov.br/renajud/restrito/restricoes-retirar.jsf') {
	retirar();
}
