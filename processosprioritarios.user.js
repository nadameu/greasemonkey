// ==UserScript==
// @name Processos prioritários
// @namespace   http://nadameu.com.br/processos-prioritarios
// @include     /^https:\/\/eproc\.(jf(pr|rs|sc)|trf4)\.jus\.br/eproc(V2|2trf4)/controlador\.php\?acao\=usuario_tipo_monitoramento_localizador_listar\&/
// @include     /^https:\/\/eproc\.(jf(pr|rs|sc)|trf4)\.jus\.br/eproc(V2|2trf4)/controlador\.php\?acao\=localizador_processos_lista\&/
// @include     /^https:\/\/eproc\.(jf(pr|rs|sc)|trf4)\.jus\.br/eproc(V2|2trf4)/controlador\.php\?acao\=localizador_orgao_listar\&/
// @include     /^https:\/\/eproc\.(jf(pr|rs|sc)|trf4)\.jus\.br/eproc(V2|2trf4)/controlador\.php\?acao\=relatorio_geral_listar\&/
// @include     /^https:\/\/eproc\.(jf(pr|rs|sc)|trf4)\.jus\.br/eproc(V2|2trf4)/controlador\.php\?acao\=[^&]+\&acao_origem=principal\&/
// @version 16
// @grant none
// ==/UserScript==

/* jshint esversion: 6, -W069 */

const CompetenciasCorregedoria = {
	JUIZADO: 1,
	CIVEL: 2,
	CRIMINAL: 3,
	EXECUCAO_FISCAL: 4
};

const Situacoes = {
	'MOVIMENTO': 3,
	'MOVIMENTO-AGUARDA DESPACHO': 2,
	'MOVIMENTO-AGUARDA SENTENÇA': 4,
	'INICIAL': 1,
	'INDEFINIDA': 5
};

var GUI = (function() {
	var instance = null,
		construindo = false,
		button = null,
		tabela = null,
		progresso = null,
		saida = null;
	var invalidSymbols = /[&<>"]/g;
	var replacementSymbols = {
		'&': 'amp',
		'<': 'lt',
		'>': 'gt',
		'"': 'quot'
	};

	function safeHTML(strings, ...vars) {
		return vars.reduce((result, variable, i) => result + variable.replace(invalidSymbols, (sym) => '&' + replacementSymbols[sym] + ';') + strings[i + 1], strings[0]);
	}

	function GUI() {
		if (!construindo) {
			throw new Error('Classe deve ser instanciada usando o método .getInstance().');
		}
		var estilos = document.createElement('style');
		estilos.innerHTML = [
			'tr.infraTrEscura { background-color: #f0f0f0; }',
			'.gmProcessos { display: inline-block; margin: 0 0.25ex; padding: 0 0.5ex; font-weight: bold; min-width: 3.5ex; line-height: 1.5em; border: 2px solid transparent; border-radius: 1ex; text-align: center; color: black; }',
			'.gmProcessos.gmPrioridade0 { background-color: #ff8a8a; }',
			'.gmProcessos.gmPrioridade1 { background-color: #f84; }',
			'.gmProcessos.gmPrioridade2 { background-color: #ff8; }',
			'.gmProcessos.gmPrioridade3 { background-color: #8aff8a; }',
			'.gmProcessos.gmVazio { opacity: 0.25; background-color: inherit; color: #888; }',
			'.gmDetalhes td:first-child { padding-left: 0; }',
			'.gmNaoMostrarClasses .gmDetalheClasse { display: none; }',
			'.gmNaoMostrarDiasParaFim .gmDiasParaFim { display: none; }',
			'.gmLocalizadorExtra { display: inline-block; float: right; background: #eee; border: 1px solid #aaa; color: #333; padding: 2px; margin: 0 3px 0 0; border-radius: 3px; font-size: 0.9em; }',
			'.gmBaloes { float: right; }',
			'.gmBotoesLocalizador { margin-right: 3ex; }',
			'.gmAtualizar { font-size: 1em; background: #ccc; padding: 4px; border-radius: 4px; margin-right: 1ex; }',
			'.gmFiltrar { font-size: 1em; background: #ccc; padding: 4px; border-radius: 4px; margin-right: 1ex; }',
			'.gmDetalhesAberto { border-color: black; }',
			'.gmDetalhes meter { width: 10ex; }',
			'.gmDetalhes meter.gmExcesso { width: 20ex; }',
			'.gmLembreteProcesso { width: 2ex; height: 2ex; margin: 0 1ex; border-width: 0; }',
			'.gmLembreteProcessoVazio { opacity: 0; pointer-events: none; }',
			'.gmPorcentagem { display: inline-block; width: 6ex; text-align: right; }'
		].join('\n');
		document.querySelector('head').appendChild(estilos);
		tabela = document.getElementById('divInfraAreaTabela').querySelector('table');
	}
	GUI.prototype = {
		constructor: GUI,
		atualizarVisualizacao(localizador, filtrado = false) {
			var linha = localizador.linha;
			const DIAS_A_FRENTE = 3;
			var avisos = [
				'Processos com prazo excedido em dobro',
				'Processos com prazo vencido',
				`Processos com prazo a vencer nos próximos ${DIAS_A_FRENTE} dias`,
				'Processos no prazo'
			];
			const MILISSEGUNDOS_EM_UM_DIA = 864e5;
			const agora = new Date();
			const aVencer = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate() + DIAS_A_FRENTE, 23, 59, 59, 999);
			const atrasoAVencer = (agora.getTime() - aVencer.getTime()) / MILISSEGUNDOS_EM_UM_DIA;
			var prioridades = [
				localizador.processos.filter(processo => processo.atrasoPorcentagem >= 1),
				localizador.processos.filter(processo => processo.atraso >= 0 && processo.atrasoPorcentagem < 1),
				localizador.processos.filter(processo => processo.atraso < 0 && processo.atraso >= atrasoAVencer),
				localizador.processos.filter(processo => processo.atraso < atrasoAVencer)
			];
			var baloes = prioridades.map(function(processos, indicePrioridade) {
				return '<span id="gmLocalizador' + localizador.id + 'Prioridade' + indicePrioridade + '" class="gmProcessos gmPrioridade' + indicePrioridade + (processos.length > 0 ? '' : ' gmVazio') + '" onmouseover="infraTooltipMostrar(&quot;' + avisos[indicePrioridade] + '&quot;);" onmouseout="infraTooltipOcultar();">' + processos.length + '</span>';
			});
			var conteudo = [];
			if (!(localizador.sigla || localizador.nome)) {
				conteudo.push(localizador.siglaNome);
			} else if (localizador.sigla) {
				conteudo.push(localizador.sigla);
				if (localizador.nome !== localizador.sigla) {
					conteudo.push(' (' + localizador.nome + ')');
				}
			} else {
				conteudo.push(localizador.nome);
			}
			if (localizador.lembrete) {
				conteudo.push(' ');
				conteudo.push('<img class="infraImgNormal" src="../../../infra_css/imagens/balao.gif" style="width:0.9em; height:0.9em; opacity:1; border-width:0;" onmouseover="' + safeHTML `return infraTooltipMostrar('${localizador.lembrete}','',400);` + '" onmouseout="return infraTooltipOcultar();"/>');
			}
			conteudo.push('<div class="gmBaloes">');
			conteudo.push(baloes.join(''));
			conteudo.push('</div>');
			linha.cells[0].innerHTML = conteudo.join('');
			if (localizador.quantidadeProcessosNaoFiltrados > 0) {
				var container = document.createElement('span');
				container.className = 'gmBotoesLocalizador';
				if (!filtrado) {
					var filtrar = document.createElement('a');
					filtrar.setAttribute('onmouseover', 'infraTooltipMostrar("Excluir processos com prazos em aberto.");');
					filtrar.setAttribute('onmouseout', 'infraTooltipOcultar();');
					filtrar.setAttribute('onclick', 'infraTooltipOcultar();');
					filtrar.className = 'gmFiltrar';
					filtrar.textContent = 'Filtrar';
					filtrar.addEventListener('click', function(evt) {
						evt.preventDefault();
						evt.stopPropagation();
						var gui = GUI.getInstance();
						gui.avisoCarregando.exibir('Filtrando processos com prazo em aberto...');
						gui.avisoCarregando.atualizar(0, localizador.quantidadeProcessos);
						localizador.excluirPrazosAbertos().then(function() {
							gui.avisoCarregando.ocultar();
							gui.atualizarVisualizacao(localizador, true);
						});
					}, false);
					container.appendChild(filtrar);
				}
				var atualizar = document.createElement('a');
				atualizar.className = 'gmAtualizar';
				atualizar.textContent = 'Atualizar';
				atualizar.addEventListener('click', function(evt) {
					evt.preventDefault();
					evt.stopPropagation();
					var gui = GUI.getInstance();
					gui.avisoCarregando.exibir('Atualizando...');
					gui.avisoCarregando.atualizar(0, localizador.quantidadeProcessosNaoFiltrados);
					localizador.obterProcessos().then(function() {
						gui.avisoCarregando.ocultar();
						gui.atualizarVisualizacao(localizador);
					});
				}, false);
				container.appendChild(atualizar);
				var divExistente = linha.cells[0].querySelector('div');
				divExistente.insertBefore(container, divExistente.firstChild);
			}
			prioridades.forEach(function(processos, indicePrioridade) {
				var balao = document.getElementById('gmLocalizador' + localizador.id + 'Prioridade' + indicePrioridade);
				balao.addEventListener('click', function(evt) {
					evt.preventDefault();
					evt.stopPropagation();
					[...document.getElementsByClassName('gmDetalhes')].forEach(function(linhaAntiga) {
						linha.parentElement.removeChild(linhaAntiga);
					});
					if (balao.classList.contains('gmDetalhesAberto')) {
						balao.classList.remove('gmDetalhesAberto');
						return;
					}
					[...document.getElementsByClassName('gmDetalhesAberto')].forEach(function(balaoAberto) {
						balaoAberto.classList.remove('gmDetalhesAberto');
					});
					balao.classList.add('gmDetalhesAberto');
					processos.sort((a, b) => {
						if (a.atrasoPorcentagem < b.atrasoPorcentagem) return +1;
						if (a.atrasoPorcentagem > b.atrasoPorcentagem) return -1;
						return 0;
					});
					processos.forEach(function(processo, indiceProcesso) {
						var linhaNova = linha.parentElement.insertRow(linha.rowIndex + 1 + indiceProcesso);
						var atraso = Math.round(processo.atraso);
						linhaNova.className = 'infraTrClara gmDetalhes';
						const DIGITOS_CLASSE = 6,
							DIGITOS_COMPETENCIA = 2;
						linhaNova.dataset.classe = ('0'.repeat(DIGITOS_CLASSE) + processo.numClasse).substr(-DIGITOS_CLASSE);
						linhaNova.dataset.competencia = ('0'.repeat(DIGITOS_COMPETENCIA) + processo.numCompetencia).substr(-DIGITOS_COMPETENCIA);
						var textoData;
						switch (processo.campoDataConsiderada) {
							case 'dataSituacao':
								switch (processo.situacao) {
									case 'MOVIMENTO-AGUARDA DESPACHO':
										textoData = 'Data da conclusão para despacho';
										break;

									case 'MOVIMENTO-AGUARDA SENTENÇA':
										textoData = 'Data da conclusão para sentença';
										break;

									default:
										textoData = 'Data de alteração da situação';
										break;
								}
								break;

							case 'dataUltimoEvento':
								textoData = 'Data do último evento';
								break;

							default:
								throw new Error('Campo "data considerada" desconhecido.');
						}
						const MAXIMO_PRIORIDADE_MENOR_OU_IGUAL_A_UM = 2,
							MAXIMO_PRIORIDADE_DOIS_OU_MAIOR = 1,
							DIAS_BAIXO = 3,
							IDEAL = 0.5;
						var esperado = processo.prazoCorregedoria;
						var minimo = 0;
						var maximo = esperado * indicePrioridade > 1 ? MAXIMO_PRIORIDADE_DOIS_OU_MAIOR : MAXIMO_PRIORIDADE_MENOR_OU_IGUAL_A_UM;
						var baixo = esperado - DIAS_BAIXO;
						var alto = esperado;
						var ideal = esperado * IDEAL;
						var valor = esperado + atraso;
						const PCT = 100;
						var porcentagem = Math.round(PCT + processo.atrasoPorcentagem * PCT) + '%';
						var localizadoresExtra = processo.localizadores.filter(loc => loc.id !== localizador.id).map(loc => loc.sigla);
						linhaNova.innerHTML = [
							'<td>',
							safeHTML `<img class="gmLembreteProcesso${processo.lembretes.length === 0 ? ' gmLembreteProcessoVazio' : ''}" src="../../../infra_css/imagens/balao.gif" onmouseover="return infraTooltipMostrar('${processo.lembretes.map(lembrete => lembrete.replace(/\n/g, '<br>')).join('<hr style="border-width: 0 0 1px 0;">')}', 'Lembretes', 400);" onmouseout="return infraTooltipOcultar();">`, [
								`<a href="${processo.link}">${processo.numprocFormatado}</a>`,
								`<abbr title="${textoData}">${processo[processo.campoDataConsiderada].toLocaleString().substr(0, 10)}</abbr> + ${esperado.toString().replace(/\.5$/, '&half;')}${esperado >= 2 ? ' dias' : ' dia'} = ${processo.termoPrazoCorregedoria.toLocaleString().substr(0, 10)}`,
							].join(' | '),
							`<span class="gmDetalheClasse"> | ${processo.classe.toUpperCase()}</span>`,
							localizadoresExtra.length > 0 ? localizadoresExtra.map(loc => `<span class="gmLocalizadorExtra">${loc}</span>`).join(' ') : '',
							'</td>',
							'<td>',
							`<meter ${indicePrioridade < 2 ? ' class="gmExcesso"' : ''} min="${minimo}" max="${maximo}" low="${baixo}" high="${alto}" optimum="${ideal}" value="${valor}">${atraso}</meter>`,
							`<span class="gmPorcentagem">${porcentagem}</span><span class="gmDiasParaFim"> | ${processo.atraso >= 0 ? 'Prazo excedido há ' : ''}`,
							Math.abs(atraso),
							Math.abs(atraso) > 1 ? ' dias ' : ' dia ',
							processo.atraso < 0 ? 'até o fim do prazo' : '',
							processo.prioridade ? '</span> <span style="color: red;">(Prioridade)</span>' : '',
							'</td>'
						].join('');
					});
				}, false);
			});
		},
		avisoCarregando: {
			acrescentar(qtd) {
				if (!progresso || !saida) {
					throw new Error('Aviso ainda não foi exibido.');
				}
				var atual = progresso.value,
					total = progresso.max;
				this.atualizar(atual + qtd, total);
			},
			atualizar(atual, total) {
				if (!progresso || !saida) {
					this.exibir();
				}
				progresso.max = total;
				progresso.value = atual;
				saida.textContent = atual + ' / ' + total;
			},
			exibir(texto = 'Carregando dados dos processos...') {
				window.infraExibirAviso(false, ['<center>', `${texto}<br/>`, '<progress id="gmProgresso" value="0" max="1"></progress><br/>', '<output id="gmSaida"></output>', '</center>'].join(''));
				progresso = document.getElementById('gmProgresso');
				saida = document.getElementById('gmSaida');
			},
			ocultar() {
				window.infraOcultarAviso();
				progresso = null;
				saida = null;
			}
		},
		criarBotaoAcao() {
			var frag = document.createDocumentFragment();
			var area = document.getElementById('divInfraAreaTelaD');
			button = document.createElement('button');
			button.textContent = 'Analisar conteúdo dos localizadores';
			frag.appendChild(button);

			function criarCheckboxMostrar(id, mostrarPorPadrao, classeOcultar, texto) {
				var input = document.createElement('input');
				input.type = 'checkbox';

				function onMostrarChange() {
					if ((!mostrarPorPadrao) || localStorage.getItem(id) === 'N') {
						tabela.classList.add(classeOcultar);
					} else {
						tabela.classList.remove(classeOcultar);
					}
				}
				input.addEventListener('click', evt => {
					localStorage.setItem(id, input.checked ? 'S' : 'N');
					onMostrarChange();
				});
				input.checked = localStorage.getItem(id) !== 'N';
				onMostrarChange();
				var label = document.createElement('label');
				label.textContent = texto;
				label.insertBefore(input, label.firstChild);
				return label;
			}

			var labelClasses = criarCheckboxMostrar('mostrarClasses', true, 'gmNaoMostrarClasses', ' Mostrar classe dos processos');
			frag.appendChild(labelClasses);
			var labelDias = criarCheckboxMostrar('mostrarDiasParaFim', true, 'gmNaoMostrarDiasParaFim', ' Mostrar dias para o fim do prazo');
			frag.appendChild(labelDias);
			area.insertBefore(frag, area.firstChild);
			return button;
		},
		atualizarBotaoAcao() {
			if (button) {
				button.textContent = 'Atualizar';
			}
		},
		visitLocalizador(pvtVars) {
			return pvtVars;
		}
	};
	GUI.getInstance = function() {
		if (!instance) {
			construindo = true;
			instance = new GUI();
			construindo = false;
		}
		return instance;
	};
	return GUI;
})();
var LocalizadoresFactory = (function() {
	var obterFormularioRelatorioGeral = function() {
		var promiseRelatorioGeral = new Promise(function(resolve, reject) {
			var url = Array.from(document.querySelectorAll('#main-menu a[href]'))
				.filter(link => /^\?acao=relatorio_geral_listar&/.test(link.search))
				.map(link => link.href)[0];
			var xml = new XMLHttpRequest();
			xml.open('GET', url);
			xml.responseType = 'document';
			xml.onerror = reject;
			xml.onload = resolve;
			xml.send(null);
		}).then(function({ target: { response: doc } }) {
			console.log('Página relatório geral obtida', doc);
			const consultar = doc.getElementById('btnConsultar');
			const form = consultar.form;
			return form;
		});
		obterFormularioRelatorioGeral = () => promiseRelatorioGeral;
		return obterFormularioRelatorioGeral();
	};

	function trataHTML({ target: { response: doc } }) {
		var pagina = Number(doc.getElementById('hdnInfraPaginaAtual').value);
		var quantidadeProcessosCarregados = parseInt(doc.getElementById('hdnInfraNroItens').value);
		var gui = GUI.getInstance();
		gui.avisoCarregando.acrescentar(quantidadeProcessosCarregados);
		var linhas = [...doc.querySelectorAll('#divInfraAreaTabela > table > tbody > tr[class^="infraTr"]')];
		linhas.forEach(function(linha) {
			this.processos.push(ProcessoFactory.fromLinha(linha));
		}, this);
		var proxima = doc.getElementById('lnkInfraProximaPaginaSuperior');
		if (proxima) {
			console.info('Buscando próxima página', this.nome);
			return this.obterPagina(pagina + 1, doc);
		}
		return this;
	}

	function Localizador() {
		this.processos = [];
	}
	Localizador.prototype = {
		constructor: Localizador,
		id: null,
		lembrete: null,
		link: null,
		nome: null,
		processos: null,
		quantidadeProcessosNaoFiltrados: null,
		sigla: null,
		siglaNome: null,
		obterPagina(pagina, doc) {
			var self = this;
			return new Promise(function(resolve, reject) {
					var url, data;
					if (pagina === 0) {
						url = self.link.href;
						data = new FormData();
						var camposPost = ['optchkcClasse', 'optDataAutuacao', 'optchkcUltimoEvento', 'optNdiasSituacao', 'optJuizo', 'optPrioridadeAtendimento', 'chkStatusProcesso'];
						camposPost.forEach((campo) => data.set(campo, 'S'));
						data.set('paginacao', '100');
						data.set('hdnInfraPaginaAtual', pagina);
					} else {
						doc.getElementById('selLocalizador').value = self.id;
						var paginaAtual = doc.getElementById('hdnInfraPaginaAtual');
						paginaAtual.value = pagina;
						var form = paginaAtual.parentElement;
						while (form.tagName.toLowerCase() !== 'form') {
							form = form.parentElement;
						}
						url = form.action;
						data = new FormData(form);
					}
					var xml = new XMLHttpRequest();
					xml.open('POST', url);
					xml.responseType = 'document';
					xml.onerror = reject;
					xml.onload = resolve;
					xml.send(data);
				})
				.then(trataHTML.bind(this))
				.catch(console.error.bind(console));
		},
		obterPrazosPagina(pagina = 0) {
			const self = this;
			return obterFormularioRelatorioGeral().then(function(form) {
					const url = form.action;
					const method = form.method;
					const data = new FormData();
					data.set('paginacao', '100');
					data.set('selPrazo', 'A');
					data.set('selLocalizadorPrincipal', self.id);
					data.set('selLocalizadorPrincipalSelecionados', self.id);
					data.set('optchkcClasse', 'S');
					data.set('hdnInfraPaginaAtual', pagina);
					return new Promise(function(resolve, reject) {
						var xml = new XMLHttpRequest();
						xml.open(method, url);
						xml.responseType = 'document';
						xml.onerror = reject;
						xml.onload = resolve;
						xml.send(data);
					});
				})
				.then(function({ target: { response: doc } }) {
					const tabela = doc.getElementById('tabelaLocalizadores');
					const quantidadeProcessosCarregados = parseInt(doc.getElementById('hdnInfraNroItens').value);
					if (tabela) {
						console.log(pagina, self.sigla, tabela.querySelector('caption').textContent);
						const linhas = Array.from(tabela.querySelectorAll('tr[data-classe]'));
						const processosComPrazoAberto = new Set();
						linhas.forEach(linha => {
							const numproc = linha.cells[1].querySelector('a[href]').search.match(/&num_processo=(\d+)&/)[1];
							processosComPrazoAberto.add(numproc);
						});
						for (let i = self.processos.length - 1; i >= 0; i--) {
							if (processosComPrazoAberto.has(self.processos[i].numproc)) {
								self.processos.splice(i, 1);
							}
						}
					} else {
						console.log(pagina, self.sigla, quantidadeProcessosCarregados);
					}
					if (doc.getElementById('lnkProximaPaginaSuperior')) {
						const paginaAtual = parseInt(doc.getElementById('selInfraPaginacaoSuperior').value);
						const paginaNova = paginaAtual < 2 ? 2 : paginaAtual + 1;
						return self.obterPrazosPagina.call(self, paginaNova);
					}
					const gui = GUI.getInstance();
					gui.avisoCarregando.acrescentar(parseInt(self.link.textContent));
					return self;
				});
		},
		excluirPrazosAbertos() {
			const link = this.link;
			if (!link.href) {
				return Promise.resolve(this);
			}
			return this.obterPrazosPagina(0).then(function() {
				this.link.textContent = this.processos.length;
				return this;
			}.bind(this));
		},
		obterProcessos() {
			this.processos = [];
			var link = this.link;
			if (!link.href) {
				return Promise.resolve(this);
			}
			return this.obterPagina(0).then(function() {
				this.quantidadeProcessosNaoFiltrados = this.processos.length;
				this.link.textContent = this.processos.length;
				if (this.processos.length > 0) {
					var localizadorProcesso = this.processos[0].localizadores.filter((localizador) => localizador.id === this.id)[0];
					if (!this.sigla) {
						this.sigla = localizadorProcesso.sigla;
					}
					if (this.sigla && this.nome) {
						this.siglaNome = [this.sigla, this.nome].join(' - ');
					}
					var siglaComSeparador = this.sigla + ' - ';
					this.nome = this.siglaNome.substr(siglaComSeparador.length);
					this.lembrete = localizadorProcesso.lembrete;
				}
				return this;
			}.bind(this));
		},
		get quantidadeProcessos() {
			return Number(this.link.textContent);
		}
	};
	var LocalizadorFactory = {
		fromLinha(linha) {
			var localizador = new Localizador();
			localizador.linha = linha;
			var siglaNome = linha.cells[0].textContent.split(' - ');
			if (siglaNome.length === 2) {
				localizador.sigla = siglaNome[0];
				localizador.nome = siglaNome[1];
			}
			localizador.siglaNome = siglaNome.join(' - ');
			var link = localizador.link = linha.querySelector('a');
			localizador.quantidadeProcessosNaoFiltrados = parseInt(link.textContent);
			if (link.href) {
				var camposGet = parsePares(link.search.split(/^\?/)[1].split('&'));
				localizador.id = camposGet.selLocalizador;
			}
			return localizador;
		},
		fromLinhaPainel(linha) {
			var localizador = new Localizador();
			localizador.linha = linha;
			localizador.nome = linha.cells[0].textContent.match(/^Processos com Localizador\s+"(.*)"$/)[1];
			var link = localizador.link = linha.querySelector('a,u');
			localizador.quantidadeProcessosNaoFiltrados = parseInt(link.textContent);
			if (link && link.href) {
				var camposGet = parsePares(link.search.split(/^\?/)[1].split('&'));
				localizador.id = camposGet.selLocalizador;
			}
			return localizador;
		}
	};

	function paraCadaLocalizador(fn) {
		var cookiesAntigos = parseCookies(document.cookie);
		var promises = this.map(fn);
		return Promise.all(promises).then(function() {
			var cookiesNovos = parseCookies(document.cookie);
			var expira = new Date();
			expira.setFullYear(expira.getFullYear() + 1);
			for (let key in cookiesNovos) {
				if (typeof cookiesAntigos[key] !== 'undefined' && cookiesNovos[key] !== cookiesAntigos[key]) {
					document.cookie = encodeURIComponent(key) + '=' + encodeURIComponent(cookiesAntigos[key]) + '; expires=' + expira.toUTCString();
				}
			}
		});
	}

	function Localizadores() {}
	Localizadores.prototype = definirPropriedades(Object.create(Array.prototype), {
		constructor: Localizadores,
		tabela: null,
		obterProcessos() {
			return paraCadaLocalizador.call(this, localizador => localizador.obterProcessos());
		},
		get quantidadeProcessos() {
			return this.reduce((soma, localizador) => soma + localizador.quantidadeProcessos, 0);
		},
		get quantidadeProcessosNaoFiltrados() {
			return this.reduce((soma, localizador) => soma + localizador.quantidadeProcessosNaoFiltrados, 0);
		}
	});
	var LocalizadoresFactory = {
		fromTabela(tabela) {
			var localizadores = new Localizadores();
			localizadores.tabela = tabela;
			var linhas = [...tabela.querySelectorAll('tr[class^="infraTr"]')];
			linhas.forEach(function(linha) {
				localizadores.push(LocalizadorFactory.fromLinha(linha));
			});
			return localizadores;
		},
		fromTabelaPainel(tabela) {
			var localizadores = new Localizadores();
			localizadores.tabela = tabela;
			var linhas = [...tabela.querySelectorAll('tr[class^="infraTr"]')];
			linhas.forEach(function(linha) {
				localizadores.push(LocalizadorFactory.fromLinhaPainel(linha));
			});
			return localizadores;
		}
	};
	return LocalizadoresFactory;
})();
var ProcessoFactory = (function() {
	function LocalizadorProcesso() {}
	LocalizadorProcesso.prototype = {
		constructor: LocalizadorProcesso,
		id: null,
		lembrete: null,
		principal: null,
		sigla: null
	};
	var LocalizadorProcessoFactory = {
		fromInput(input) {
			var localizador = new LocalizadorProcesso();
			localizador.id = input.value;
			var elementoNome = input.nextSibling;
			localizador.principal = elementoNome.nodeName.toLowerCase() === 'u';
			localizador.sigla = elementoNome.textContent.trim();
			var linkLembrete = elementoNome.nextElementSibling;
			if (linkLembrete.attributes.hasOwnProperty('onmouseover')) {
				var onmouseover = linkLembrete.attributes.onmouseover.value;
				localizador.lembrete = onmouseover.match(/^return infraTooltipMostrar\('Obs: (.*) \/ ([^(]+)\(([^)]+)\)','',400\);$/)[1];
			}
			return localizador;
		}
	};

	function LocalizadoresProcesso() {}
	LocalizadoresProcesso.prototype = definirPropriedades(Object.create(Array.prototype), {
		constructor: LocalizadoresProcesso,
		principal: null
	});
	var LocalizadoresProcessoFactory = {
		fromCelula(celula) {
			var localizadores = new LocalizadoresProcesso();
			var inputs = [...celula.getElementsByTagName('input')];
			inputs.forEach(function(input) {
				var localizador = LocalizadorProcessoFactory.fromInput(input);
				if (localizador.principal) {
					localizadores.principal = localizador;
				}
				localizadores.push(localizador);
			});
			return localizadores;
		}
	};

	const MILISSEGUNDOS_EM_UM_DIA = 864e5;
	const COMPETENCIA_JUIZADO_MIN = 9,
		COMPETENCIA_JUIZADO_MAX = 20,
		COMPETENCIA_CRIMINAL_MIN = 21,
		COMPETENCIA_CRIMINAL_MAX = 30,
		COMPETENCIA_EF_MIN = 41,
		COMPETENCIA_EF_MAX = 43,
		CLASSE_EF = 99,
		CLASSE_CARTA_PRECATORIA = 60;

	function Processo() {
		this.dadosComplementares = new Set();
		this.lembretes = [];
		this.localizadores = [];
	}
	Processo.prototype = {
		constructor: Processo,
		classe: null,
		dadosComplementares: null,
		dataAutuacao: null,
		dataInclusaoLocalizador: null,
		dataSituacao: null,
		dataUltimoEvento: null,
		juizo: null,
		lembretes: null,
		link: null,
		localizadores: null,
		numClasse: null,
		numCompetencia: null,
		numproc: null,
		numprocFormatado: null,
		sigilo: null,
		situacao: null,
		ultimoEvento: null,
		get atraso() {
			var hoje = new Date();
			return (hoje.getTime() - this.termoPrazoCorregedoria.getTime()) / MILISSEGUNDOS_EM_UM_DIA;
		},
		get atrasoPorcentagem() {
			return this.atraso / this.prazoCorregedoria;
		},
		get competenciaCorregedoria() {
			if (this.numCompetencia >= COMPETENCIA_JUIZADO_MIN && this.numCompetencia <= COMPETENCIA_JUIZADO_MAX) {
				return CompetenciasCorregedoria.JUIZADO;
			} else if (this.numCompetencia >= COMPETENCIA_CRIMINAL_MIN && this.numCompetencia <= COMPETENCIA_CRIMINAL_MAX) {
				return CompetenciasCorregedoria.CRIMINAL;
			} else if ((this.numCompetencia >= COMPETENCIA_EF_MIN || this.numCompetencia <= COMPETENCIA_EF_MAX) && (this.numClasse === CLASSE_EF || this.numClasse === CLASSE_CARTA_PRECATORIA)) {
				return CompetenciasCorregedoria.EXECUCAO_FISCAL;
			}
			return CompetenciasCorregedoria.CIVEL;
		},
		get campoDataConsiderada() {
			var ret = 'dataSituacao';
			switch (this.situacao) {
				case 'MOVIMENTO-AGUARDA DESPACHO':
				case 'MOVIMENTO-AGUARDA SENTENÇA':
					ret = 'dataSituacao';
					break;

				case 'MOVIMENTO':
					ret = 'dataUltimoEvento';
					break;

				default:
					ret = 'dataSituacao';
					break;
			}
			return ret;
		},
		get prazoCorregedoria() {
			var situacao = Situacoes[this.situacao] || Situacoes['INDEFINIDA'];
			var dias = RegrasCorregedoria[this.competenciaCorregedoria][situacao];
			if (this.prioridade) dias /= 2;
			return dias;
		},
		get prioridade() {
			return this.dadosComplementares.has('Prioridade Atendimento') || this.dadosComplementares.has('Réu Preso');
			//return this.dadosComplementares.has('Prioridade Atendimento') || this.dadosComplementares.has('Réu Preso') || this.dadosComplementares.has('Doença Grave') || this.dadosComplementares.has('Idoso');
		},
		get termoPrazoCorregedoria() {
			var dataConsiderada = this[this.campoDataConsiderada];
			var dataTermo = new Date(dataConsiderada.getTime());
			dataTermo.setDate(dataTermo.getDate() + this.prazoCorregedoria);
			return dataTermo;
		}
	};
	var ProcessoFactory = {
		fromLinha(linha) {
			var processo = new Processo();
			processo.linha = linha;
			processo.numClasse = Number(linha.dataset.classe);
			processo.numCompetencia = Number(linha.dataset.competencia);
			var link = processo.link = linha.cells[1].querySelector('a');
			var numprocFormatado = processo.numprocFormatado = link.textContent;
			processo.numproc = numprocFormatado.replace(/[-.]/g, '');
			var links = linha.cells[1].getElementsByTagName('a');
			if (links.length === 2) {
				var onmouseover = [...links[1].attributes].filter((attr) => attr.name === 'onmouseover')[0].value;
				var [, codigoLembrete] = onmouseover.match(/^return infraTooltipMostrar\('([^']+)','Lembretes',400\);$/);
				var div = document.createElement('div');
				div.innerHTML = codigoLembrete;
				var linhas = [...div.childNodes[0].rows].reverse();
				processo.lembretes = linhas.map(linha => {
					let celula = linha.cells[2];
					celula.innerHTML = celula.innerHTML.replace(/<br.*?>/g, '\0\n');
					return celula.textContent;
				});
			}
			var textoSigilo = linha.cells[1].getElementsByTagName('br')[0].nextSibling.textContent;
			processo.sigilo = Number(textoSigilo.match(/Nível ([0-5])/)[1]);
			processo.situacao = linha.cells[2].textContent;
			processo.juizo = linha.cells[3].textContent;
			processo.dataAutuacao = parseDataHora(linha.cells[4].textContent);
			var diasNaSituacao = Number(linha.cells[5].textContent);
			var dataSituacao = new Date();
			dataSituacao.setDate(dataSituacao.getDate() - diasNaSituacao);
			processo.dataSituacao = dataSituacao;
			var labelsDadosComplementares = [...linha.cells[6].getElementsByTagName('label')];
			if (labelsDadosComplementares.length === 0) {
				processo.classe = linha.cells[6].textContent;
			} else {
				processo.classe = linha.cells[6].firstChild.textContent;
				labelsDadosComplementares.forEach((label) => processo.dadosComplementares.add(label.textContent));
			}
			processo.localizadores = LocalizadoresProcessoFactory.fromCelula(linha.cells[7]);
			var breakUltimoEvento = linha.cells[8].querySelector('br');
			processo.dataUltimoEvento = parseDataHora(breakUltimoEvento.previousSibling.textContent);
			processo.ultimoEvento = breakUltimoEvento.nextSibling.textContent;
			processo.dataInclusaoLocalizador = parseDataHora(linha.cells[9].textContent);
			var textoPrioridade = linha.cells[10].textContent;
			if (textoPrioridade === 'Sim') {
				processo.dadosComplementares.add('Prioridade Atendimento');
			}
			return processo;
		}
	};
	return ProcessoFactory;
})();
var RegrasCorregedoria = {
	[CompetenciasCorregedoria.JUIZADO]: {
		[Situacoes['INICIAL']]: 10,
		[Situacoes['MOVIMENTO-AGUARDA DESPACHO']]: 15,
		[Situacoes['MOVIMENTO']]: 10,
		[Situacoes['MOVIMENTO-AGUARDA SENTENÇA']]: 45,
		[Situacoes['INDEFINIDA']]: 30
	},
	[CompetenciasCorregedoria.CIVEL]: {
		[Situacoes['INICIAL']]: 10,
		[Situacoes['MOVIMENTO-AGUARDA DESPACHO']]: 20,
		[Situacoes['MOVIMENTO']]: 15,
		[Situacoes['MOVIMENTO-AGUARDA SENTENÇA']]: 60,
		[Situacoes['INDEFINIDA']]: 60
	},
	[CompetenciasCorregedoria.CRIMINAL]: {
		[Situacoes['INICIAL']]: 15,
		[Situacoes['MOVIMENTO-AGUARDA DESPACHO']]: 20,
		[Situacoes['MOVIMENTO']]: 15,
		[Situacoes['MOVIMENTO-AGUARDA SENTENÇA']]: 60,
		[Situacoes['INDEFINIDA']]: 30
	},
	[CompetenciasCorregedoria.EXECUCAO_FISCAL]: {
		[Situacoes['INICIAL']]: 10,
		[Situacoes['MOVIMENTO-AGUARDA DESPACHO']]: 60,
		[Situacoes['MOVIMENTO']]: 25,
		[Situacoes['MOVIMENTO-AGUARDA SENTENÇA']]: 60,
		[Situacoes['INDEFINIDA']]: 120
	}
};

// FIXME Alterações específicas para SCLAG02
RegrasCorregedoria[[CompetenciasCorregedoria.JUIZADO]][Situacoes['MOVIMENTO-AGUARDA DESPACHO']] = 30;
RegrasCorregedoria[[CompetenciasCorregedoria.JUIZADO]][Situacoes['MOVIMENTO']] = 30;

function adicionarBotaoComVinculo(localizadores) {
	var gui = GUI.getInstance();
	var botao = gui.criarBotaoAcao();
	botao.addEventListener('click', function() {
		gui.avisoCarregando.atualizar(0, localizadores.quantidadeProcessosNaoFiltrados);
		localizadores.obterProcessos().then(function() {
			gui.avisoCarregando.ocultar();
			gui.atualizarBotaoAcao();
			localizadores.forEach(function(localizador) {
				gui.atualizarVisualizacao(localizador);
			});
		});
	}, false);
}
if (/\?acao=usuario_tipo_monitoramento_localizador_listar\&/.test(location.search)) {
	let tabela = document.getElementById('divInfraAreaTabela').querySelector('table');
	let localizadores = LocalizadoresFactory.fromTabela(tabela);
	adicionarBotaoComVinculo(localizadores);
} else if (/\?acao=localizador_processos_lista\&/.test(location.search)) {
	// do nothing
} else if (/\&acao_origem=principal\&/.test(location.search)) {
	let tabela = document.getElementById('fldLocalizadores').querySelector('table');
	let localizadores = LocalizadoresFactory.fromTabelaPainel(tabela);
	adicionarBotaoComVinculo(localizadores);
}

function definirPropriedades(target, ...sources) {
	sources.forEach(source => {
		Object.defineProperties(target, Object.getOwnPropertyNames(source).reduce((descriptors, key) => {
			descriptors[key] = Object.getOwnPropertyDescriptor(source, key);
			return descriptors;
		}, {}));
	});
	return target;
}

function parseCookies(texto) {
	var pares = texto.split(/\s*;\s*/);
	return parsePares(pares);
}

function parseDataHora(texto) {
	let [d, m, y, h, i, s] = texto.split(/\W/g);
	return new Date(y, m - 1, d, h, i, s);
}

function parsePares(pares) {
	var obj = {};
	pares.forEach(function(par) {
		var partes = par.split('=');
		var nome = decodeURIComponent(partes.splice(0, 1));
		var valor = decodeURIComponent(partes.join('='));
		obj[nome] = valor;
	});
	return obj;
}
