// ==UserScript==
// @name        Precatórios/RPVs
// @description Auxilia a conferência de RPVs e precatórios.
// @namespace   http://nadameu.com.br/precatorios-rpv
// @include     /^https:\/\/eproc\.(trf4|jf(pr|rs|sc))\.jus\.br\/eproc(2trf4|V2)\/controlador\.php\?acao=processo_selecionar\&/
// @include     /^https:\/\/eproc\.(trf4|jf(pr|rs|sc))\.jus\.br\/eproc(2trf4|V2)\/controlador\.php\?acao=processo_precatorio_rpv\&/
// @include     /^https:\/\/eproc\.(trf4|jf(pr|rs|sc))\.jus\.br\/eproc(2trf4|V2)\/controlador\.php\?acao=oficio_requisitorio_visualizar\&/
// @include     /^http:\/\/sap\.trf4\.gov\.br\/requisicao\/jf\/visualizar_requisicao_jf\.php\?num_requis=\d+$/
// @include     /^http:\/\/sap\.trf4\.gov\.br\/requisicao\/jf\/frm_requisicao_jf\.php\?num_requis=\d+$/
// @include     /^http:\/\/sap\.trf4\.gov\.br\/requisicao\/jf\/preparar_intimacao_jf\.php$/
// @version     17
// @grant       GM_xmlhttpRequest
// ==/UserScript==

const SALARIO_MINIMO = 937;

const Acoes = {
	ABRIR_DOCUMENTO: 'abrirDocumento',
	ABRIR_REQUISICAO: 'abrirRequisicao',
	BUSCAR_DADOS: 'buscarDados',
	EDITAR_REQUISICAO_ANTIGA: 'editarRequisicaoAntiga',
	EDITAR_REQUISICAO: 'editarRequisicao',
	ORDEM_CONFIRMADA: 'ordemConfirmada',
	PREPARAR_INTIMACAO_ANTIGA: 'prepararIntimacaoAntiga',
	REQUISICAO_ANTIGA_PREPARADA: 'requisicaoAntigaPreparada',
	RESPOSTA_DADOS: 'respostaDados',
	RESPOSTA_JANELA_ABERTA: 'respostaJanelaAberta',
	VERIFICAR_JANELA: 'verificarJanela'
};

class Analisador {
	constructor() {
		this.conversores = {};
	}

	aplicarConversores(obj) {
		for (let nome in this.conversores) {
			if (! obj.hasOwnProperty(nome)) continue;
			let conversor = this.conversores[nome];
			obj[nome] = conversor.analisar(obj[nome]);
		}
	}

	definirConversores(conversores) {
		this.conversores = conversores;
	}

	analisar(algo) {
		return this.analisarInto(algo, {});
	}
}
Analisador.prototype.prefixo = null;

class AnalisadorCelulas extends Analisador {
	constructor(...nomes) {
		super();
		this.nomes = nomes;
	}

	analisarInto(linha, obj) {
		if (this.prefixo) {
			linha.classList.add(`${this.prefixo}__linha`);
		}
		const changed = {};
		this.nomes.forEach((nome, indice) => {
			if (! nome) return;
			const celula = linha.cells[indice];
			let valor = celula.textContent.trim();
			changed[nome] = valor;
			if (this.prefixo) {
				celula.classList.add(`${this.prefixo}__${nome}`);
			}
		});
		this.aplicarConversores(changed);
		Object.assign(obj, changed);
		return changed;
	}
}

class AnalisadorLinhasTabela extends Analisador {
	constructor(...padroes) {
		super();
		this.padroes = padroes;
	}

	analisarInto(tabela, obj) {
		if (this.prefixo) {
			tabela.classList.add(`${this.prefixo}__tabela`);
		}
		const changed = {};
		const linhas = Array.from(tabela.rows);
		linhas.forEach(linha => {
			const texto = linha.cells[0].innerHTML.trim();
			this.padroes.forEach(padrao => {
				const match = padrao.matchInto(texto, changed);
				if (this.prefixo && match) {
					for (let nome in match) {
						linha.classList.add(`${this.prefixo}__${nome}`);
					}
				}
			});
		});
		this.aplicarConversores(changed);
		Object.assign(obj, changed);
		return changed;
	}
}

class AnalisadorMultiplo extends Analisador {
	constructor(...padroes) {
		super();
		this.padroes = padroes;
	}

	analisarInto(texto, obj) {
		const changed = {};
		let houveCorrespondencia = false;
		this.padroes.forEach(padrao => {
			const match = padrao.matchInto(texto, changed);
			if (match) {
				houveCorrespondencia = true;
			}
		});
		if (houveCorrespondencia) {
			this.aplicarConversores(changed);
			Object.assign(obj, changed);
			return changed;
		}
		return null;
	}
}

class BotaoAcao {
	static criar(texto, handler) {
		const botao = document.createElement('button');
		botao.className = 'infraButton';
		botao.textContent = texto;
		botao.addEventListener('click', handler);
		return botao;
	}
}

class Conversor {
	static analisar() {
		throw new Error('Propriedade não implementada: converter()!');
	}
}

class ConversorAno extends Conversor {
	static analisar(texto) {
		let [y] = texto.match(/^(\d\d\d\d)$/).slice(1);
		return new Date(Utils.parseDecimalInt(y), 0, 1);
	}

	static converter(valor) {
		return valor.getFullYear();
	}
}

class ConversorBool extends Conversor {
	static analisar(texto) {
		return texto === '' ? undefined : texto === 'Sim';
	}

	static converter(valor) {
		return valor ? 'Sim' : 'Não';
	}
}

class ConversorData extends Conversor {
	static analisar(texto) {
		let [d, m, y] = texto.match(/^(\d\d)\/(\d\d)\/(\d\d\d\d)$/).slice(1);
		return new Date(Utils.parseDecimalInt(y), Utils.parseDecimalInt(m) - 1, Utils.parseDecimalInt(d));
	}

	static converter(valor) {
		return valor.toLocaleDateString();
	}
}

class ConversorDataHora extends Conversor {
	static analisar(texto) {
		let [d, m, y, h, i, s] = texto.match(/^(\d\d)\/(\d\d)\/(\d\d\d\d) (\d\d):(\d\d):(\d\d)$/).slice(1);
		return new Date(Utils.parseDecimalInt(y), Utils.parseDecimalInt(m) - 1, Utils.parseDecimalInt(d), Utils.parseDecimalInt(h), Utils.parseDecimalInt(i), Utils.parseDecimalInt(s));
	}

	static converter(valor) {
		return valor.toLocaleString();
	}
}

class ConversorInt extends Conversor {
	static analisar(texto) {
		return Utils.parseDecimalInt('0' + texto);
	}

	static converter(valor) {
		return valor.toString();
	}
}

class ConversorMesAno extends Conversor {
	static analisar(texto) {
		let [m, y] = texto.match(/^(\d\d)\/(\d\d\d\d)$/).slice(1);
		return new Date(Utils.parseDecimalInt(y), Utils.parseDecimalInt(m) - 1, 1);
	}

	static converter(valor) {
		let m = valor.getMonth() + 1;
		if (m < 10) {
			m = '0' + m;
		}
		let y = valor.getFullYear();
		return `${m}/${y}`;
	}
}

class ConversorMoeda extends Conversor {
	static analisar(texto) {
		return parseFloat(texto.replace(/\./g, '').replace(/,/, '.'));
	}

	static converter(valor) {
		let valorArredondado = Utils.round(valor, 2);
		let reais = Math.floor(valorArredondado).toLocaleString();
		let centavos = Math.round(valorArredondado * 100 % 100).toString();
		if (centavos.length < 2) centavos = `0${centavos}`;
		return `${reais},${centavos}`;
	}
}

class ConversorPorcentagem extends Conversor {
	static converter(valor) {
		return Number(valor).toLocaleString('pt-BR', {
			style: 'percent',
			maximumFractionDigits: 6
		});
	}
}

class ConversorValores extends Conversor {
	static analisar(texto) {
		let [total, principal, juros] = texto.match(/^([\d.,]+)\s+\(([\d.,]+) \+ ([\d.,]+)\)$/).slice(1);
		return {
			principal: ConversorMoeda.analisar(principal),
			juros: ConversorMoeda.analisar(juros),
			total: ConversorMoeda.analisar(total)
		};
	}
}

class Padrao {
	constructor(re, ...props) {
		this.regularExpression = re;
		this.properties = props;
	}

	match(texto) {
		const obj = {};
		this.matchInto(texto, obj);
		return obj;
	}

	matchInto(texto, obj) {
		const changed = {};
		const match = texto.match(this.regularExpression);
		if (match) {
			const valores = match.slice(1);
			this.properties.forEach((nome, indice) => {
				let valor = valores[indice];
				changed[nome] = valor;
			});
			Object.assign(obj, changed);
			return changed;
		}
		return null;
	}
}

class Pagina {

	static get paginas() {
		if (! this._paginas) {
			this._paginas = new WeakMap();
		}
		return this._paginas;
	}

	constructor(doc) {
		this.doc = doc;
	}

	static analisar(doc) {

		if (this.paginas.has(doc)) {
			return this.paginas.get(doc);
		}

		let classe = null;

		if (doc.domain === 'sap.trf4.gov.br') {
			if (doc.location.pathname === '/requisicao/jf/visualizar_requisicao_jf.php') {
				classe = PaginaRequisicaoAntiga;
			} else if (doc.location.pathname === '/requisicao/jf/frm_requisicao_jf.php') {
				classe = PaginaRequisicaoAntigaEditar;
			} else if (doc.location.pathname === '/requisicao/jf/preparar_intimacao_jf.php') {
				classe = PaginaRequisicaoAntigaPreparada;
			}
		} else if (doc.domain.match(/^eproc\.(trf4|jf(pr|rs|sc))\.jus\.br$/)) {
			if (doc.location.search.match(/^\?acao=processo_selecionar&/)) {
				classe = PaginaProcesso;
			} else if (doc.location.search.match(/^\?acao=processo_precatorio_rpv&/)) {
				classe = PaginaListar;
			} else if (doc.location.search.match(/^\?acao=oficio_requisitorio_visualizar&/)) {
				classe = PaginaRequisicao;
			}
		}

		const pagina = new classe(doc);
		this.paginas.set(doc, pagina);
		return pagina;
	}

	validarElemento(selector, condicao, classeTrue = 'gm-resposta--correta', classeFalse = 'gm-resposta--incorreta', classeUndefined = 'gm-resposta--indefinida') {
		const elemento = this.doc.querySelector(selector);
		elemento.classList.add('gm-resposta');
		if (condicao === true) {
			elemento.classList.add(classeTrue);
		} else if (condicao === false) {
			elemento.classList.add(classeFalse);
		} else if (typeof condicao === 'undefined') {
			elemento.classList.add(classeUndefined);
		}
	}
}
Pagina._paginas = null;
Pagina.prototype.doc = null;

class PaginaListar extends Pagina {
	get requisicoes() {
		const linhas = Array.from(this.doc.querySelectorAll('#divInfraAreaTabela > table tr[class^="infraTr"]'));
		return linhas.map(linha => {
			const requisicao = new Requisicao();
			requisicao.linha = linha;
			requisicao.numero = Utils.parseDecimalInt(linha.cells[0].textContent.trim());
			requisicao.status = linha.cells[1].textContent.trim();
			const links = Array.from(linha.cells[2].querySelectorAll('a[href]'));
			links.filter(link => link.href.match(/&numRequis=\d+$/)).forEach(link => {
				requisicao.tipo = 'antiga';
				requisicao.urlConsultarAntiga = link.href;
			});
			links.filter(link => link.href.match(/&numRequis=\d+&strAcao=editar$/)).forEach(link => {
				requisicao.tipo = 'antiga';
				requisicao.urlEditarAntiga = link.href;
			});
			links.filter(link => link.href.match(/\?acao=oficio_requisitorio_visualizar&/)).forEach(link => {
				requisicao.tipo = 'nova';
				requisicao.urlConsultar = link.href;
			});
			links.filter(link => link.href.match(/\?acao=oficio_requisitorio_requisicoes_editar&/)).forEach(link => {
				requisicao.tipo = 'nova';
				requisicao.urlEditar = link.href;
			});
			return requisicao;
		});
	}

	adicionarAlteracoes() {
		const win = this.doc.defaultView;
		const opener = win.opener;
		this.testarJanelaProcessoAberta(opener).then(() => {
			this.requisicoes.forEach(requisicao => {
				const botao = BotaoAcao.criar('Verificar dados', evt => {
					evt.preventDefault();
					evt.stopPropagation();
					this.solicitarAberturaRequisicao(opener, requisicao);
				});
				requisicao.linha.cells[2].appendChild(this.doc.createTextNode(' '));
				requisicao.linha.cells[2].appendChild(botao);
			});
		});
	}

	solicitarAberturaRequisicao(janela, requisicao) {
		const data = {
			acao: Acoes.ABRIR_REQUISICAO,
			requisicao: requisicao
		};
		janela.postMessage(JSON.stringify(data), this.doc.location.origin);
	}

	testarJanelaProcessoAberta() {
		const win = this.doc.defaultView;
		const opener = win.opener;
		if (opener && opener !== win) {
			const self = this;
			const promise = new Promise(resolve => {
				win.addEventListener('message', function handler(evt) {
					win.removeEventListener('message', handler);
					if (evt.origin === self.doc.location.origin) {
						const data = JSON.parse(evt.data);
						if (data.acao === Acoes.RESPOSTA_JANELA_ABERTA) {
							resolve();
						}
					}
				});
			});
			const data = {
				acao: Acoes.VERIFICAR_JANELA
			};
			opener.postMessage(JSON.stringify(data), this.doc.location.origin);
			return promise;
		}
		return Promise.reject();

	}
}

class PaginaProcesso extends Pagina {

	get assuntos() {
		const tabela = this.doc.querySelector('table[summary="Assuntos"]');
		return Array.from(tabela.rows)
			.filter((linha, i) => i > 0)
			.map(linha => linha.cells[0])
			.map(celula => celula.textContent);
	}

	get autores() {
		const links = Array.from(this.doc.querySelectorAll('a[data-parte="AUTOR"]'));
		const autores = links.map(link => {
			const nome = link.textContent;
			let celula = link;
			while (celula && celula.tagName.toLowerCase() !== 'td') {
				celula = celula.parentElement;
			}
			const cpfCnpj = celula.querySelector('span[id^="spnCpfParteAutor"]').textContent.replace(/\D/g, '');
			const oabAdvogados = Array.from(celula.querySelectorAll('a')).filter(oab => oab.hasAttribute('onmouseover') && oab.getAttribute('onmouseover').match(/ADVOGADO/));
			const advogados = oabAdvogados.map(oab => oab.previousElementSibling.textContent);
			return {
				nome,
				cpfCnpj,
				advogados
			};
		});
		return autores;
	}

	get autuacao() {
		const texto = this.doc.getElementById('txtAutuacao').textContent;
		return ConversorDataHora.analisar(texto);
	}

	get calculos() {
		return this.destacarDocumentosPorTipo('CALC');
	}

	get contratos() {
		const contratos = this.destacarDocumentosPorTipo('CONHON');
		if (contratos.length > 0) return contratos;
		const outros = this.destacarDocumentosPorMemo(/contrato|honor/i);
		const procuracoes = this.destacarDocumentosPorTipo('PROC');
		return Array.concat(outros, procuracoes);
	}

	get fecharAposPreparar() {
		if (! this._fecharAposPreparar) {
			this._fecharAposPreparar = new Set();
		}
		return this._fecharAposPreparar;
	}

	get honorarios() {
		let honorarios = this.destacarDocumentosPorTipo('SOLPGTOHON');
		honorarios = honorarios.concat(this.destacarDocumentosPorTipo('PGTOPERITO'));
		return honorarios;
	}

	get informacoesAdicionais() {
		return this.doc.getElementById('fldInformacoesAdicionais');
	}

	get justicaGratuita() {
		const elemento = this.doc.getElementById('lnkJusticaGratuita');
		if (elemento) return elemento.textContent;
		return '???';
	}

	get linkListar() {
		return this.informacoesAdicionais.querySelector('a[href^="controlador.php?acao=processo_precatorio_rpv&"]');
	}

	get magistrado() {
		return this.doc.getElementById('txtMagistrado').textContent;
	}

	get numproc() {
		return this.numprocf.replace(/\D/g, '');
	}

	get numprocf() {
		return this.doc.getElementById('txtNumProcesso').textContent;
	}

	get requisicoesAPreparar() {
		if (! this._requisicoesAPreparar) {
			this._requisicoesAPreparar = new Set();
		}
		return this._requisicoesAPreparar;
	}

	get reus() {
		return Array
			.from(this.doc.querySelectorAll('[id^="spnNomeParteReu"]'))
			.map(elt => elt.textContent);
	}

	get sentencas() {
		return this.destacarDocumentosPorEvento(/(^(Julgamento|Sentença))|Voto/);
	}

	get tabelaEventos() {
		return this.doc.getElementById('tblEventos');
	}

	get transito() {
		const reDecisoesTerminativas = /(^(Julgamento|Sentença))|Voto|Recurso Extraordinário Inadmitido|Pedido de Uniformização para a Turma Nacional - Inadmitido/;
		const reDecurso = /CIÊNCIA, COM RENÚNCIA AO PRAZO|Decurso de Prazo/;
		const reTransito = /Trânsito em Julgado/;
		const reTransitoComData = /Data: (\d\d\/\d\d\/\d\d\d\d)/;

		const dadosTransito = {};

		const linhasEventos = Array.from(this.tabelaEventos.tBodies).reduce((arr, tbody) => arr.concat(Array.from(tbody.rows)), []);
		const eventosTransito = linhasEventos.filter(linha => linha.cells[3].textContent.match(reTransito));
		const eventosTransitoComData = eventosTransito.filter(linha => linha.cells[3].textContent.match(reTransitoComData));

		if (eventosTransitoComData.length > 0) {
			const eventoTransitoComData = eventosTransitoComData[0];
			eventoTransitoComData.classList.add('gmEventoDestacado');
			const [data] = eventoTransitoComData.cells[3].textContent.match(reTransitoComData).slice(1);
			dadosTransito.data = ConversorData.analisar(data);
		} else if (eventosTransito.length > 0) {
			const eventoTransito = eventosTransito[0];
			eventoTransito.classList.add('gmEventoDestacado');
			const dataEvento = ConversorDataHora.analisar(eventoTransito.cells[2].textContent);
			dadosTransito.dataEvento = dataEvento;
		}

		if (! dadosTransito.data) {
			const eventosDecisoesTerminativas = linhasEventos.filter(linha => linha.cells[3].textContent.match(reDecisoesTerminativas));
			if (eventosDecisoesTerminativas.length > 0) {
				const eventoDecisaoTerminativa = eventosDecisoesTerminativas[0];
				const numeroEventoDecisaoTerminativa = Utils.parseDecimalInt(eventoDecisaoTerminativa.cells[1].textContent);
				const reReferenteDecisao = new RegExp('^Intimação Eletrônica - Expedida/Certificada - Julgamento|Refer\\. ao Evento: ' + numeroEventoDecisaoTerminativa.toString() + '(\\D|$)');
				const eventosIntimacao = linhasEventos.filter(linha => {
					if (Utils.parseDecimalInt(linha.cells[1].textContent) <= numeroEventoDecisaoTerminativa) return false;
					if (! linha.cells[3].textContent.match(reReferenteDecisao)) return false;
					const parte = linha.cells[3].querySelector('.infraEventoPrazoParte');
					if (! parte) return false;
					return parte.dataset.parte.match(/^(AUTOR|REU|MPF)$/) !== null;
				});
				if (eventosIntimacao.length > 0) {
					const reTooltip = /^return infraTooltipMostrar\('([^']+)','Informações do Evento',1000\);$/;
					const informacoesFechamentoIntimacoes = eventosIntimacao.map(evento => {
						const lupa = evento.cells[1].querySelector('a[onmouseover]');
						if (! lupa) return null;
						const comando = lupa.getAttribute('onmouseover');
						const [tooltip] = comando.match(reTooltip).slice(1);
						const div = this.doc.createElement('div');
						div.innerHTML = tooltip;
						let textos = Array.from(div.querySelectorAll('font')).map(texto => texto.textContent.trim());
						let indice = 0;
						let textoAtual = textos[indice];
						while (textoAtual && textoAtual.match(/^Fechamento do Prazo:$/) === null) {
							textoAtual = textos[++indice];
						}
						if (! textoAtual) return null;
						const informacaoDataHora = ConversorDataHora.analisar(textos[indice + 1]);
						const informacaoEvento = textos[indice + 2];
						const [numeroEvento, descricaoEvento] = informacaoEvento.match(/^(\d+) - (.+)$/).slice(1);
						return {
							numero: Utils.parseDecimalInt(numeroEvento),
							data: informacaoDataHora,
							descricao: descricaoEvento
						};
					}).filter(informacao => informacao !== null);
					if (informacoesFechamentoIntimacoes.length > 0) {
						const fechamentoMaisRecente = informacoesFechamentoIntimacoes.reduce((anterior, atual) => anterior.numero > atual.numero ? anterior : atual);
						const [eventoFechamentoMaisRecente] = linhasEventos.filter(linha => Utils.parseDecimalInt(linha.cells[1].textContent) === fechamentoMaisRecente.numero);
						eventoFechamentoMaisRecente.classList.add('gmEventoDestacado');
						if (fechamentoMaisRecente.descricao.match(reDecurso)) {
							dadosTransito.dataDecurso = fechamentoMaisRecente.data;
						} else {
							dadosTransito.dataFechamento = fechamentoMaisRecente.data;
						}
					}
				}
			}
		}

		return dadosTransito;
	}

	constructor(doc) {
		super(doc);
		this.janelasDependentes = new Map();
		this.urlEditarRequisicoes = new Map();
	}

	abrirDocumento(evento, documento) {
		const celula = this.doc.getElementById(`tdEvento${evento}Doc${documento}`);
		if (celula) {
			const link = celula.querySelector('.infraLinkDocumento');
			if (link) link.click();
		}
	}

	abrirJanela(url, nome, abrirEmJanela = false) {
		if (this.janelasDependentes.has(nome)) {
			this.fecharJanela(nome);
		}
		let features = '';
		if (abrirEmJanela) {
			features = 'menubar,toolbar,location,personalbar,status,scrollbars';
		}
		const win = window.open(url, nome, features);
		this.janelasDependentes.set(nome, win);
	}

	abrirJanelaEditarRequisicao(url, numero, abrirEmJanela = false) {
		this.abrirJanela(url, `editar-requisicao${numero}`, abrirEmJanela);
	}

	abrirJanelaListar(abrirEmJanela = false) {
		this.abrirJanela(this.linkListar.href, `listarRequisicoes${this.numproc}`, abrirEmJanela);
	}

	abrirJanelaRequisicao(url, numero, abrirEmJanela = false) {
		this.abrirJanela(url, `requisicao${numero}`, abrirEmJanela);
	}

	adicionarAlteracoes() {
		const win = this.doc.defaultView;
		win.addEventListener('pagehide', () => {
			this.fecharJanelasDependentes();
		});
		win.addEventListener('message', this.onMensagemRecebida.bind(this));
		this.adicionarBotao();
		this.linkListar.addEventListener('click', this.onLinkListarClicado.bind(this));
		const style = this.doc.createElement('style');
		style.innerHTML = Utils.css({
			".gmEventoDestacado > td": {
				"background": "#f8eddb",
				"border": "0px solid #c0c0c0",
				"border-width": "1px 0"
			},
			".gmTextoDestacado": {
				"color": "red",
				"font-size": "1.2em"
			}
		});
		this.doc.querySelector('head').appendChild(style);
	}

	adicionarBotao() {
		const textoBotao = 'Conferir ofício requisitório';
		const botao = BotaoAcao.criar(textoBotao, evt => {
			evt.preventDefault();
			evt.stopPropagation();
			botao.textContent = 'Aguarde, carregando...';
			XHR.buscarDocumento(this.linkListar).then(doc => {
				const paginaListar = new PaginaListar(doc);
				const requisicoesAntigas = paginaListar.requisicoes.filter(requisicao => requisicao.tipo === 'antiga' && requisicao.status === 'Digitada');
				if (requisicoesAntigas.length === 1) {
					const all = requisicoesAntigas.map(requisicao => XHR.buscarDocumentoExterno(requisicao.urlConsultarAntiga).then(doc => {
						const paginaRedirecionamento = new PaginaRedirecionamento(doc);
						this.abrirJanelaRequisicao(paginaRedirecionamento.urlRedirecionamento, requisicao.numero);
					}));
					return Promise.all(all);
				}
				const requisicoes = paginaListar.requisicoes.filter(requisicao => requisicao.tipo === 'nova' && requisicao.status === 'Finalizada');
				if (requisicoes.length === 1) {
					const requisicao = requisicoes[0];
					this.urlEditarRequisicoes.set(requisicao.numero, requisicao.urlEditar);
					return void this.abrirJanelaRequisicao(requisicao.urlConsultar, requisicao.numero);
				}
				this.abrirJanelaListar();

			}).then(() => botao.textContent = textoBotao);
		});
		this.informacoesAdicionais.parentElement.insertBefore(botao, this.informacoesAdicionais.nextSibling);
		this.informacoesAdicionais.parentElement.insertBefore(this.doc.createElement('br'), botao);
		this.informacoesAdicionais.parentElement.insertBefore(this.doc.createElement('br'), botao.nextSibling);
		const ultimoEvento = Utils.parseDecimalInt(this.tabelaEventos.tBodies[0].rows[0].cells[1].textContent.trim());
		if (ultimoEvento > 100) {
			botao.insertAdjacentHTML('afterend', ` <div style="display: inline-block;"><span class="gmTextoDestacado">Processo possui mais de 100 eventos.</span> &mdash; <a href="#" onclick="event.preventDefault(); event.stopPropagation(); this.parentElement.style.display = 'none'; carregarTodasPaginas(); return false;">Carregar todos os eventos</a></div>`);
		}
	}

	destacarDocumentos(propriedade, regularExpression) {
		const linhasEventos = Array.from(this.tabelaEventos.tBodies).reduce((arr, tbody) => arr.concat(Array.from(tbody.rows)), []);
		const dadosEventos = [];
		linhasEventos.forEach(linha => {
			let linksDocumentos = [];
			if (propriedade === 'tipo') {
				linksDocumentos = Array.from(linha.querySelectorAll('.infraLinkDocumento')).filter(link => link.textContent.match(regularExpression));
			} else if (propriedade === 'evento') {
				if (linha.querySelector('td.infraEventoDescricao').textContent.trim().match(regularExpression)) {
					linksDocumentos = Array.from(linha.querySelectorAll('.infraLinkDocumento'));
				}
			} else if (propriedade === 'memo') {
				let memos = Array.from(linha.querySelectorAll('.infraTextoTooltip')).filter(memo => memo.textContent.match(regularExpression));
				linksDocumentos = memos.map(memo => {
					let celulaDocumento = memo.parentElement;
					while (celulaDocumento && celulaDocumento.tagName.toLowerCase() !== 'td') celulaDocumento = celulaDocumento.parentElement;
					return celulaDocumento.querySelector('.infraLinkDocumento');
				});
			}
			if (linksDocumentos.length > 0) {
				let dadosEvento = {
					evento: Utils.parseDecimalInt(linha.cells[1].textContent),
					data: ConversorDataHora.analisar(linha.cells[2].textContent),
					descricao: linha.cells[3].querySelector('label.infraEventoDescricao').textContent,
					documentos: []
				};
				linha.classList.add('gmEventoDestacado');
				linksDocumentos.forEach(link => {
					let [nome, tipo, ordem] = link.textContent.match(/^(.*?)(\d+)$/);
					dadosEvento.documentos.push({
						ordem: Utils.parseDecimalInt(ordem),
						nome: nome,
						tipo: tipo
					});
				});
				dadosEventos.push(dadosEvento);
			}
		});
		return dadosEventos;
	}

	destacarDocumentosPorEvento(regularExpression) {
		return this.destacarDocumentos('evento', regularExpression);
	}

	destacarDocumentosPorMemo(regularExpression) {
		return this.destacarDocumentos('memo', regularExpression);
	}

	destacarDocumentosPorTipo(...abreviacoes) {
		const regularExpression = new RegExp('^(' + abreviacoes.join('|') + ')\\d+$');
		return this.destacarDocumentos('tipo', regularExpression);
	}

	enviarDadosProcesso(janela, origem) {
		const data = {
			acao: Acoes.RESPOSTA_DADOS,
			dados: {
				assuntos: this.assuntos,
				autores: this.autores,
				autuacao: this.autuacao,
				calculos: this.calculos,
				contratos: this.contratos,
				honorarios: this.honorarios,
				justicaGratuita: this.justicaGratuita,
				magistrado: this.magistrado,
				reus: this.reus,
				sentencas: this.sentencas,
				transito: this.transito
			}
		};
		janela.postMessage(JSON.stringify(data), origem);
	}

	enviarRespostaJanelaAberta(janela, origem) {
		const data = {
			acao: Acoes.RESPOSTA_JANELA_ABERTA
		};
		this.enviarSolicitacao(janela, origem, data);
	}

	enviarSolicitacao(janela, origem, dados) {
		janela.postMessage(JSON.stringify(dados), origem);
	}

	enviarSolicitacaoPrepararIntimacao(janela, origem, requisicao) {
		const data = {
			acao: Acoes.PREPARAR_INTIMACAO_ANTIGA,
			requisicao: requisicao
		};
		this.enviarSolicitacao(janela, origem, data);
	}

	fecharJanela(nome) {
		const win = this.janelasDependentes.get(nome);
		this.fecharObjetoJanela(win);
		this.janelasDependentes.delete(nome);
	}

	fecharJanelasDependentes() {
		for (let nome of this.janelasDependentes.keys()) {
			this.fecharJanela(nome);
		}
	}

	fecharJanelaProcesso() {
		this.fecharJanelasDependentes();
		const win = this.doc.defaultView.wrappedJSObject;
		const abertos = win.documentosAbertos;
		if (abertos) {
			for (let id in abertos) {
				let janela = abertos[id];
				this.fecharObjetoJanela(janela);
			}
		}
		win.close();
	}

	fecharJanelaRequisicao(numero) {
		this.fecharJanela(`requisicao${numero}`);
	}

	fecharObjetoJanela(win) {
		try {
			if (win && ! win.closed) {
				win.close();
			}
		} catch (err) {
			// A aba já estava fechada
		}
	}

	onLinkListarClicado(evt) {
		evt.preventDefault();
		evt.stopPropagation();
		let abrirEmJanela = false;
		if (evt.shiftKey) {
			abrirEmJanela = true;
		}
		this.abrirJanelaListar(abrirEmJanela);
	}

	onMensagemRecebida(evt) {
		console.info('Mensagem recebida', evt);
		if (evt.origin === 'http://sap.trf4.gov.br' || evt.origin === this.doc.location.origin) {
			const data = JSON.parse(evt.data);
			if (evt.origin === 'http://sap.trf4.gov.br') {
				if (data.acao === Acoes.BUSCAR_DADOS) {
					this.enviarDadosProcesso(evt.source, evt.origin);
				} else if (data.acao === Acoes.ABRIR_DOCUMENTO) {
					this.abrirDocumento(data.evento, data.documento);
				} else if (data.acao === Acoes.EDITAR_REQUISICAO_ANTIGA) {
					this.abrirJanelaEditarRequisicao(data.urlEditarAntiga, data.requisicao);
				} else if (data.acao === Acoes.PREPARAR_INTIMACAO_ANTIGA) {
					this.requisicoesAPreparar.add(data.requisicao);
					if (data.fecharProcesso) {
						this.fecharAposPreparar.add(data.requisicao);
					}
					this.abrirJanelaEditarRequisicao(data.urlEditarAntiga, data.requisicao);
				} else if (data.acao === Acoes.VERIFICAR_JANELA) {
					if (this.requisicoesAPreparar.has(data.requisicao)) {
						this.enviarSolicitacaoPrepararIntimacao(evt.source, evt.origin, data.requisicao);
					}
				} else if (data.acao === Acoes.ORDEM_CONFIRMADA) {
					if (data.ordem === Acoes.PREPARAR_INTIMACAO_ANTIGA && this.requisicoesAPreparar.has(data.requisicao)) {
						this.requisicoesAPreparar.delete(data.requisicao);
					}
				} else if (data.acao === Acoes.REQUISICAO_ANTIGA_PREPARADA) {
					this.fecharJanelaRequisicao(data.requisicao);
					if (this.fecharAposPreparar.has(data.requisicao)) {
						this.fecharJanelaProcesso();
					}
				}
			} else if (evt.origin === this.doc.location.origin) {
				if (data.acao === Acoes.VERIFICAR_JANELA) {
					this.enviarRespostaJanelaAberta(evt.source, evt.origin);
				} else if (data.acao === Acoes.ABRIR_REQUISICAO) {
					console.log('Pediram-me para abrir uma requisicao', data.requisicao);
					if (data.requisicao.tipo === 'antiga') {
						this.abrirJanelaRequisicao(data.requisicao.urlConsultarAntiga, data.requisicao.numero);
					} else if (data.requisicao.tipo === 'nova') {
						this.abrirJanelaRequisicao(data.requisicao.urlConsultar, data.requisicao.numero);
					}
				} else if (data.acao === Acoes.EDITAR_REQUISICAO) {
					const numero = data.requisicao;
					this.fecharJanelaRequisicao(numero);
					const urlEditar = this.urlEditarRequisicoes.get(numero);
					this.abrirJanelaEditarRequisicao(urlEditar, numero);
				} else if (data.acao === Acoes.ABRIR_DOCUMENTO) {
					this.abrirDocumento(data.evento, data.documento);
				} else if (data.acao === Acoes.BUSCAR_DADOS) {
					this.enviarDadosProcesso(evt.source, evt.origin);
				}
			}
		}
	}
}
PaginaProcesso.prototype.janelasDependentes = null;

class PaginaRedirecionamento extends Pagina {
	get urlRedirecionamento() {
		const match = this.doc.documentElement.innerHTML.match(/window\.location = '([^']+)';/);
		if (match) {
			return match[1];
		}
		throw new Error('Não é uma página de redirecionamento.');

	}
}

class PaginaRequisicaoAntiga extends Pagina {
	get linkEditar() {
		return this.doc.querySelector('a[href^="frm_requisicao_jf.php?num_requis="]');
	}

	get requisicao() {
		if (! this._requisicao) {
			this._requisicao = this.analisarDadosRequisicao();
		}
		return this._requisicao;
	}

	adicionarAlteracoes() {
		const style = this.doc.createElement('style');
		style.innerHTML = Utils.css({
			"table a": {
				"font-size": "1em"
			},
			".gm-requisicao__dados__tabela tr::before": {
				"content": "''",
				"font-size": "1.2em",
				"font-weight": "bold",
			},
			".gm-resposta": {},
			"p.gm-resposta": {
				"font-size": "1.2em",
				"margin": "1em 0 0",
			},
			".gm-resposta--correta": {
				"color": "hsl(120, 25%, 75%)",
			},
			".gm-resposta--incorreta": {
				"color": "hsl(0, 100%, 40%)",
				"text-shadow": "0 2px 2px hsl(0, 75%, 60%)",
			},
			".gm-resposta--indefinida": {
				"color": "hsl(30, 100%, 40%)",
				"text-shadow": "0 2px 3px hsl(30, 75%, 60%)",
			},
			".gm-requisicao__dados__tabela .gm-resposta--correta td": {
				"color": "hsl(0, 0%, 75%)",
			},
			".gm-requisicao__dados__tabela .gm-resposta--correta::before": {
				"content": "'✓'",
				"color": "hsl(120, 25%, 75%)",
			},
			".gm-requisicao__dados__tabela .gm-resposta--incorreta td": {
				"color": "hsl(0, 100%, 40%)",
			},
			".gm-requisicao__dados__tabela .gm-resposta--incorreta::before": {
				"content": "'✗'",
				"color": "hsl(0, 100%, 40%)",
				"text-shadow": "none",
			},
			".gm-requisicao__dados__tabela .gm-resposta--indefinida td": {
				"color": "hsl(30, 100%, 40%)",
			},
			".gm-requisicao__dados__tabela .gm-resposta--indefinida::before": {
				"content": "'?'",
				"color": "hsl(30, 100%, 40%)",
				"text-shadow": "none",
			},
			"p.gm-dados-adicionais": {
				"margin-top": "0",
				"margin-left": "2ex",
			},
			".gm-botoes": {
				"margin": "4em 0",
				"display": "flex",
				"justify-content": "space-around",
			}
		});
		this.doc.querySelector('head').appendChild(style);
		const win = this.doc.defaultView;
		win.addEventListener('message', this.onMensagemRecebida.bind(this));
		this.linkEditar.addEventListener('click', this.onLinkEditarClicado.bind(this));
		this.enviarSolicitacaoDados(win.opener);
	}

	adicionarAreaDocumentosProcesso() {
		const areaDados = this.doc.getElementById('divInfraAreaDadosDinamica');
		areaDados.insertAdjacentHTML('beforeend', '<div class="gm-documentos"></div>');
	}

	adicionarBotoesPreparar() {
		const botaoPrepararVoltar = BotaoAcao.criar('Preparar para intimação e manter aberta', this.onBotaoPrepararVoltarClicado.bind(this));
		const botaoPrepararFechar = BotaoAcao.criar('Preparar para intimação e fechar', this.onBotaoPrepararFecharClicado.bind(this));

		const areaDados = this.doc.getElementById('divInfraAreaDadosDinamica');
		areaDados.insertAdjacentHTML('beforeend', '<div class="gm-botoes"></div>');
		const areaBotoes = this.doc.querySelector('.gm-botoes');
		areaBotoes.appendChild(botaoPrepararVoltar);
		areaBotoes.appendChild(botaoPrepararFechar);
	}

	analisarDadosProcesso(dadosProcesso) {
		console.log('Dados do processo:', dadosProcesso);
		this.validarDadosProcesso(dadosProcesso);
		this.exibirDocumentosProcesso(dadosProcesso);
	}

	analisarDadosRequisicao() {
		const analisador = new AnalisadorLinhasTabela(
			new Padrao(/^Status:&nbsp;(.*?)\s+- (\d\d\/\d\d\/\d\d\d\d \d\d:\d\d:\d\d)$/, 'status', 'dataHora'),
			new Padrao(/^Magistrado:&nbsp;(.*)$/, 'magistrado'),
			new Padrao(/^Total Requisitado \(R\$\):&nbsp;(.*)$/, 'valorTotalRequisitado'),
			new Padrao(/^Espécie da Requisição:&nbsp;(.*?)\s*$/, 'especie'),
			new Padrao(/^Natureza:&nbsp;(\d+)\s+- (.*)\s*$/, 'codigoAssunto', 'assunto'),
			new Padrao(/^Natureza Tributária\(ATUALIZADA PELA SELIC\):&nbsp;(.*)$/, 'naturezaTributaria'),
			new Padrao(/^Natureza do Crédito:&nbsp;(\d+)\. (.*?)\s*$/, 'codigoNatureza', 'natureza'),
			new Padrao(/^Data do trânsito em julgado da sentença ou acórdão:&nbsp;(\d\d\/\d\d\/\d\d\d\d)$/, 'dataTransito'),
			new Padrao(/^Data do trânsito em julgado do processo de conhecimento:&nbsp;(\d\d\/\d\d\/\d\d\d\d)$/, 'dataTransito')
		);
		analisador.definirConversores({
			dataHora: ConversorDataHora,
			valorTotalRequisitado: ConversorMoeda,
			naturezaTributaria: ConversorBool,
			dataTransito: ConversorData
		});
		analisador.prefixo = 'gm-requisicao__dados';

		const requisicao = new Requisicao();

		const linkEditar = this.doc.querySelector('a[href^="frm_requisicao_jf.php?num_requis="]');
		requisicao.numero = Utils.parseDecimalInt(linkEditar.textContent.trim());
		requisicao.urlEditarAntiga = linkEditar.href;

		const areaDados = this.doc.getElementById('divInfraAreaDadosDinamica');
		const tabela = areaDados.querySelector('form > table');
		analisador.analisarInto(tabela, requisicao);

		let elementoAtual = tabela.nextElementSibling;
		let modo = null;
		while (elementoAtual) {
			switch (elementoAtual.tagName.toLowerCase()) {
				case 'span':
					modo = elementoAtual.textContent.trim();
					break;

				case 'table':
					if (modo === 'Beneficiários') {
						requisicao.beneficiarios = this.analisarTabelaBeneficiarios(elementoAtual, requisicao.isPrecatorio);
					} else if (modo === 'Honorários') {
						requisicao.honorarios = this.analisarTabelaHonorarios(elementoAtual, requisicao.isPrecatorio);
					} else {
						console.error('Tabela não analisada!', elementoAtual);
						throw new Error('Tabela não analisada!');
					}
					break;
			}
			elementoAtual = elementoAtual.nextElementSibling;
		}

		return requisicao;
	}

	analisarTabelaBeneficiarios(tabela, precatorio = false) {
		tabela.classList.add('gm-requisicao__beneficiarios__tabela');

		let analisadorBeneficiario = new AnalisadorCelulas('ordinal', 'nome', 'expressaRenuncia', 'bloqueado', 'cpfCnpj', 'dataBase', 'honorariosDestacados', 'valorTotal', 'valorAtualizado');
		if (precatorio) {
			analisadorBeneficiario = new AnalisadorCelulas('ordinal', 'nome', 'bloqueado', 'cpfCnpj', 'dataBase', 'honorariosDestacados', 'valorTotal', 'valorAtualizado');
		}
		analisadorBeneficiario.definirConversores({
			ordinal: ConversorInt,
			expressaRenuncia: ConversorBool,
			bloqueado: ConversorBool,
			dataBase: ConversorMesAno,
			honorariosDestacados: ConversorBool,
			valorTotal: ConversorValores,
			valorAtualizado: ConversorValores
		});

		let analisadorCorrente = new AnalisadorMultiplo(
			new Padrao(/^Exercício Corrente\s+-\s+Num. Meses:\s+(\d+)\s+Valor:\s+([\d,.]+)\s+Atualizado:\s+([\d,.]+)\s+Ano:\s+(\d{4})$/, 'meses', 'valorTotal', 'valorAtualizado', 'ano')
		);
		if (precatorio) {
			analisadorCorrente = new AnalisadorMultiplo(
				new Padrao(/^Exercício Corrente\s+-\s+Num. Meses:\s+(\d+)\s+Valor:\s+([\d,.]+)\s+Atualizado:\s+([\d,.]+)\s+Ano:\s+(\d{4})$/, 'meses', 'valorTotal', 'valorAtualizado', 'ano')
			);
			analisadorCorrente.analisar = function(texto) {
				if (texto.match(/Exercício Corrente/))
					throw new Error('Definir padrão para exercício corrente em precatórios');
			};
		}
		analisadorCorrente.definirConversores({
			meses: ConversorInt,
			valorTotal: ConversorMoeda,
			valorAtualizado: ConversorMoeda,
			ano: ConversorAno
		});
		let analisadorAnterior = new AnalisadorMultiplo(
			new Padrao(/^Exercício Anterior\s+-\s+Num. Meses:\s+(\d+)\s+Valor:\s+([\d,.]+)\s+Atualizado:\s+([\d,.]+)$/, 'meses', 'valorTotal', 'valorAtualizado')
		);
		if (precatorio) {
			analisadorAnterior = new AnalisadorMultiplo(
				new Padrao(/^Exercício Anterior\s+-\s+Num. Meses:\s+(\d+)$/, 'meses')
			);
		}
		analisadorAnterior.definirConversores({
			meses: ConversorInt,
			valorTotal: ConversorMoeda,
			valorAtualizado: ConversorMoeda
		});
		function analisarLinhaIRPF(linha) {
			const dadosIRPF = {};
			const linhasIRPF = linha.cells[1].innerHTML.replace(/&nbsp;/g, ' ').trim().split('<br>');
			linhasIRPF.forEach(linhaIRPF => {
				const dadosCorrente = analisadorCorrente.analisar(linhaIRPF);
				if (dadosCorrente) {
					dadosIRPF.corrente = dadosCorrente;
				}
				const dadosAnterior = analisadorAnterior.analisar(linhaIRPF);
				if (dadosAnterior) {
					dadosIRPF.anterior = dadosAnterior;
				}
			});
			return dadosIRPF;
		}

		const analisadorPSS = new AnalisadorMultiplo(
			new Padrao(/^Incidência de PSS - Servidor:\s+(.*?)\s+Data Base:\s+(\d\d\/\d\d\d\d)\s+Valor:\s+([\d,.]+)\s+Valor Atualizado:\s+([\d,.]+)$/, 'servidor', 'dataBase', 'valorTotal', 'valorAtualizado')
		);
		analisadorPSS.definirConversores({
			dataBase: ConversorMesAno,
			valorTotal: ConversorMoeda,
			valorAtualizado: ConversorMoeda
		});
		function analisarLinhaPSS(linha) {
			const texto = linha.cells[1].innerHTML.replace(/&nbsp;/g, ' ').trim();
			return analisadorPSS.analisar(texto);
		}

		const analisadorPrecatorio = new AnalisadorMultiplo(
			new Padrao(/^Data nasc\.:\s+(\d\d\/\d\d\/\d\d\d\d)\s+Portador doença grave:\s+(Sim|Não)\s+Débito com a Fazenda:\s+(Sim|Não)$/, 'dataNascimento', 'doencaGrave', 'debitoComFazenda')
		);
		analisadorPrecatorio.definirConversores({
			dataNascimento: ConversorData,
			doencaGrave: ConversorBool,
			debitoComFazenda: ConversorBool
		});
		function analisarLinhaPrecatorio(linha) {
			const texto = linha.cells[1].innerHTML.replace(/&nbsp;/g, ' ').trim();
			return analisadorPrecatorio.analisar(texto);
		}

		const beneficiarios = [];
		let ultimoBeneficiario = null;
		for (let i = 1, len = tabela.rows.length; i < len; i++) {
			let linha = tabela.rows[i];
			let ordinal = linha.cells[0].textContent.trim();
			if (ordinal !== '') {
				analisadorBeneficiario.prefixo = `gm-requisicao__beneficiario--${ordinal}`;
				let beneficiario = analisadorBeneficiario.analisar(linha);
				beneficiarios.push(beneficiario);
				ultimoBeneficiario = beneficiario;
			} else if (ultimoBeneficiario && linha.cells[1].textContent.match(/IRPF/)) {
				linha.cells[1].classList.add(`gm-requisicao__beneficiario--${ultimoBeneficiario.ordinal}__irpf`);
				ultimoBeneficiario.irpf = analisarLinhaIRPF(linha);
			} else if (ultimoBeneficiario && linha.cells[1].textContent.match(/^Incidência de PSS/)) {
				linha.cells[1].classList.add(`gm-requisicao__beneficiario--${ultimoBeneficiario.ordinal}__pss`);
				ultimoBeneficiario.pss = analisarLinhaPSS(linha);
			} else if (ultimoBeneficiario && linha.cells[1].textContent.match(/^SEM incidência de PSS/)) {
				linha.cells[1].classList.add(`gm-requisicao__beneficiario--${ultimoBeneficiario.ordinal}__pss`);
				ultimoBeneficiario.pss = {
					semIncidencia: true
				};
			} else if (ultimoBeneficiario && linha.cells[1].textContent.match(/^Data nasc\./)) {
				linha.cells[1].classList.add(`gm-requisicao__beneficiario--${ultimoBeneficiario.ordinal}__precatorio`);
				ultimoBeneficiario.precatorio = analisarLinhaPrecatorio(linha);
			} else {
				console.error('Linha não analisada', ultimoBeneficiario, linha);
				throw new Error('Linha não analisada');
			}
		}

		return beneficiarios;
	}

	analisarTabelaHonorarios(tabela, precatorio = false) {
		tabela.classList.add('gm-requisicao__honorarios__tabela');

		let analisadorHonorario = new AnalisadorCelulas('ordinal', 'tipo', 'nome', 'oab', 'expressaRenuncia', 'cpfCnpj', 'bloqueado', 'dataBase', 'valorTotal', 'valorAtualizado');
		if (precatorio) {
			analisadorHonorario = new AnalisadorCelulas('ordinal', 'tipo', 'nome', 'oab', 'cpfCnpj', 'bloqueado', 'dataBase', 'valorTotal', 'valorAtualizado');
		}
		analisadorHonorario.definirConversores({
			ordinal: ConversorInt,
			expressaRenuncia: ConversorBool,
			bloqueado: ConversorBool,
			dataBase: ConversorMesAno,
			valorTotal: ConversorValores,
			valorAtualizado: ConversorValores
		});

		const padraoBeneficiario = new Padrao(/^Beneficiário:\s+(.*?)\s+CPF\/CNPJ:\s+(\d{11}|\d{14})$/, 'beneficiario', 'cpfCnpj');
		function analisarLinhaBeneficiario(linha) {
			let dadosBeneficiario = {};
			const linhasBeneficiario = linha.cells[1].innerHTML.replace(/&nbsp;/g, ' ').trim().split('<br>');
			linhasBeneficiario.forEach(linhaIRPF => {
				const dados = padraoBeneficiario.match(linhaIRPF);
				if (dados) {
					dadosBeneficiario = dados;
				}
			});
			return dadosBeneficiario;
		}

		const analisadorPrecatorio = new AnalisadorMultiplo(
			new Padrao(/^Data nasc\.:\s+(\d\d\/\d\d\/\d\d\d\d)\s+Portador doença grave:\s+(Sim|Não)\s+Débito com a Fazenda:\s+(Sim|Não)$/, 'dataNascimento', 'doencaGrave', 'debitoComFazenda')
		);
		analisadorPrecatorio.definirConversores({
			dataNascimento: ConversorData,
			doencaGrave: ConversorBool,
			debitoComFazenda: ConversorBool
		});
		function analisarLinhaPrecatorio(linha) {
			const texto = linha.cells[1].innerHTML.replace(/&nbsp;/g, ' ').trim();
			return analisadorPrecatorio.analisar(texto);
		}

		const honorarios = [];
		let ultimoHonorario = null;
		for (let i = 1, len = tabela.rows.length; i < len; i++) {
			let linha = tabela.rows[i];
			let ordinal = linha.cells[0].textContent.trim();
			if (ordinal !== '') {
				analisadorHonorario.prefixo = `gm-requisicao__honorario--${ordinal}`;
				let honorario = analisadorHonorario.analisar(linha);
				honorarios.push(honorario);
				ultimoHonorario = honorario;
			} else if (ultimoHonorario && linha.cells[1].textContent.match(/Beneficiário:/)) {
				linha.cells[1].classList.add(`gm-requisicao__honorario--${ultimoHonorario.ordinal}__beneficiario`);
				ultimoHonorario.beneficiario = analisarLinhaBeneficiario(linha);
			} else if (ultimoHonorario && linha.cells[1].textContent.match(/^Data nasc\./)) {
				linha.cells[1].classList.add(`gm-requisicao__honorario--${ultimoHonorario.ordinal}__precatorio`);
				ultimoHonorario.precatorio = analisarLinhaPrecatorio(linha);
			} else {
				console.error('Linha não analisada', ultimoHonorario, linha);
				throw new Error('Linha não analisada');
			}
		}
		return honorarios;
	}

	enviarSolicitacao(janela, data) {
		const possiveisDestinos = ['trf4', 'jfpr', 'jfrs', 'jfsc'];
		possiveisDestinos.forEach(destino => {
			const url = `https://eproc.${destino}.jus.br`;
			janela.postMessage(JSON.stringify(data), url);
		});
	}

	enviarSolicitacaoAberturaDocumento(janela, evento, documento) {
		const data = {
			acao: Acoes.ABRIR_DOCUMENTO,
			evento: evento,
			documento: documento
		};
		return this.enviarSolicitacao(janela, data);
	}

	enviarSolicitacaoDados(janela) {
		const data = {
			acao: Acoes.BUSCAR_DADOS
		};
		return this.enviarSolicitacao(janela, data);
	}

	enviarSolicitacaoPrepararIntimacao(janela, fecharAposPreparar) {
		const data = {
			acao: Acoes.PREPARAR_INTIMACAO_ANTIGA,
			requisicao: this.requisicao.numero,
			urlEditarAntiga: this.requisicao.urlEditarAntiga,
			fecharProcesso: fecharAposPreparar
		};
		return this.enviarSolicitacao(janela, data);
	}

	enviarSolicitacaoEditarRequisicao(janela) {
		const data = {
			acao: Acoes.EDITAR_REQUISICAO_ANTIGA,
			requisicao: this.requisicao.numero,
			urlEditarAntiga: this.requisicao.urlEditarAntiga
		};
		return this.enviarSolicitacao(janela, data);
	}

	exibirValoresCalculados() {
		const requisicao = this.requisicao;
		const areaDados = this.doc.getElementById('divInfraAreaDadosDinamica');
		this.exibirTitulo('Conferência dos cálculos', areaDados);

		requisicao.beneficiarios.forEach(beneficiario => {
			const nome = beneficiario.nome;
			let principal = beneficiario.valorTotal.principal,
				juros = beneficiario.valorTotal.juros,
				total = beneficiario.valorTotal.total;
			const honorarios = requisicao.honorarios
				.filter(honorario => honorario.tipo === 'Honorários Contratuais')
				.filter(honorario => honorario.beneficiario.cpfCnpj === beneficiario.cpfCnpj);
			honorarios.forEach(honorario => {
				principal += honorario.valorTotal.principal;
				juros += honorario.valorTotal.juros;
				total += honorario.valorTotal.total;
			});
			let porcentagemAdvogado = 1 - beneficiario.valorTotal.total / total;
			let porcentagemArredondada = Utils.round(porcentagemAdvogado * 100, 0);
			let calculoAdvogado = Utils.round(total * porcentagemArredondada / 100, 2);
			let pagoAdvogado = Utils.round(total - beneficiario.valorTotal.total, 2);
			let diferenca = pagoAdvogado - calculoAdvogado;
			if (Math.abs(diferenca) > 0.01) {
				porcentagemArredondada = porcentagemAdvogado * 100;
			}
			[principal, juros, total] = [principal, juros, total].map(valor => ConversorMoeda.converter(valor));
			areaDados.insertAdjacentHTML('beforeend', `<p class="gm-resposta">${nome} &mdash; <span class="gm-resposta--indefinida">${principal}</span> + <span class="gm-resposta--indefinida">${juros}</span> = <span class="gm-resposta--indefinida">${total}</span> em <span class="gm-resposta--indefinida">${ConversorMesAno.converter(beneficiario.dataBase)}</span></p>`);
			if (beneficiario.irpf) {
				if (beneficiario.irpf.anterior) {
					let meses = beneficiario.irpf.anterior.meses;
					let valor = beneficiario.irpf.anterior.valorTotal;
					if (porcentagemAdvogado > 0) {
						valor = valor / (1 - porcentagemAdvogado);
					}
					areaDados.insertAdjacentHTML('beforeend', `<p class="gm-resposta gm-dados-adicionais">IRPF &mdash; Exercício Anterior &mdash; <span class="gm-resposta--indefinida">${ConversorInt.converter(meses)} ${meses > 1 ? 'meses' : 'mês'}</span> &mdash; <span class="gm-resposta--indefinida">${ConversorMoeda.converter(valor)}</span></p>`);
				}
				if (beneficiario.irpf.corrente) {
					let meses = beneficiario.irpf.corrente.meses;
					let valor = beneficiario.irpf.corrente.valorTotal;
					if (porcentagemAdvogado > 0) {
						valor = valor / (1 - porcentagemAdvogado);
					}
					areaDados.insertAdjacentHTML('beforeend', `<p class="gm-resposta gm-dados-adicionais">IRPF &mdash; Exercício Corrente (<span class="gm-resposta--indefinida">${ConversorAno.converter(beneficiario.irpf.corrente.ano)}</span>) &mdash; <span class="gm-resposta--indefinida">${ConversorInt.converter(meses)} ${meses > 1 ? 'meses' : 'mês'}</span> &mdash; <span class="gm-resposta--indefinida">${ConversorMoeda.converter(valor)}</span></p>`);
				}
			}
			if (beneficiario.pss) {
				if (beneficiario.pss.semIncidencia) {
					areaDados.insertAdjacentHTML('beforeend', `<p class="gm-resposta gm-dados-adicionais"><span class="gm-resposta--indefinida">SEM</span> incidência de PSS</p>`);
				} else {
					areaDados.insertAdjacentHTML('beforeend', `<p class="gm-resposta gm-dados-adicionais"><span class="gm-resposta--indefinida">COM</span> incidência de PSS</p>`);
					if (beneficiario.irpf) {
						areaDados.insertAdjacentHTML('beforeend', `<p class="gm-resposta gm-dados-adicionais"><span class="gm-resposta--incorreta">Verificar se é caso de deduzir PSS da base de cálculo do IRPF</span></p>`);
					}
				}
			}
			if (porcentagemAdvogado > 0) {
				const advogados = honorarios.map(honorario => honorario.nome).join(', ');
				areaDados.insertAdjacentHTML('beforeend', `<p class="gm-resposta gm-dados-adicionais">Honorários Contratuais &mdash; ${advogados} &mdash; <span class="gm-resposta--indefinida">${ConversorPorcentagem.converter(porcentagemArredondada / 100)}</span></p>`);
			}
		});

		requisicao.honorarios.filter(honorario => honorario.tipo !== 'Honorários Contratuais').forEach(honorario => {
			areaDados.insertAdjacentHTML('beforeend', [
				`<p class="gm-resposta">${honorario.nome}</p>`,
				`<p class="gm-resposta gm-dados-adicionais"><span class="gm-resposta--indefinida">${honorario.tipo}</span> &mdash; <span class="gm-resposta--indefinida">${ConversorMoeda.converter(honorario.valorTotal.principal)}</span> + <span class="gm-resposta--indefinida">${ConversorMoeda.converter(honorario.valorTotal.juros)}</span> = <span class="gm-resposta--indefinida">${ConversorMoeda.converter(honorario.valorTotal.total)}</span> em <span class="gm-resposta--indefinida">${ConversorMesAno.converter(honorario.dataBase)}</span></p>`
			].join('\n'));
		});
	}

	exibirTitulo(texto, elemento) {
		elemento.insertAdjacentHTML('beforeend', `<br><br><span class="atencao">&nbsp;&nbsp;${texto}</span>`);
	}

	exibirDocumentosProcesso(dadosProcesso) {
		const areaDocumentos = this.doc.querySelector('.gm-documentos');
		this.exibirTitulo('Documentos do processo', areaDocumentos);
		let tabela = [
			`<table class="infraTable gm-tabela-eventos">`,
			`<thead>`,
			`<tr>`,
			`<th class="infraTh">Evento</th>`,
			`<th class="infraTh">Data</th>`,
			`<th class="infraTh">Descrição</th>`,
			`<th class="infraTh">Documentos</th>`,
			`</tr>`,
			`</thead>`,
			`<tbody>`
		].join('\n');
		let css = 0;
		const eventos = Array.concat(dadosProcesso.calculos, dadosProcesso.contratos, dadosProcesso.honorarios, dadosProcesso.sentencas)
			.sort((eventoA, eventoB) => eventoB.evento - eventoA.evento)
			.reduce((map, evento) => {
				if (map.has(evento.evento)) {
					evento.documentos.forEach(documento => {
						map.get(evento.evento).documentos.set(documento.ordem, documento);
					});
				} else {
					evento.documentos = new Map(evento.documentos.map(documento => [documento.ordem, documento]));
					map.set(evento.evento, evento);
				}
				return map;
			}, new Map());
		Array.from(eventos.values()).forEach(evento => {
			tabela += [
				`<tr class="${css++ % 2 === 0 ? 'infraTrClara' : 'infraTrEscura'}">`,
				`<td>${evento.evento}</td>`,
				`<td>${ConversorDataHora.converter(new Date(evento.data))}</td>`,
				`<td>${evento.descricao}</td>`,
				`<td><table><tbody>`,
			].join('\n');
			Array.from(evento.documentos.values()).slice().sort((a, b) => a.ordem - b.ordem).forEach(documento => {
				tabela += `<tr><td><a class="infraLinkDocumento" id="gm-documento-ev${evento.evento}-doc${documento.ordem}" data-evento="${evento.evento}" data-documento="${documento.ordem}" href="#">${documento.nome}</a></td></tr>`;
			});
			tabela += [
				`</tbody></table></td>`,
				`</tr>`
			].join('\n');
		});
		tabela += [
			`</tbody>`,
			`</table>`
		].join('\n');
		areaDocumentos.insertAdjacentHTML('beforeend', tabela);
		eventos.forEach(evento => {
			evento.documentos.forEach(documento => {
				const link = this.doc.getElementById(`gm-documento-ev${evento.evento}-doc${documento.ordem}`);
				link.addEventListener('click', this.onLinkDocumentoClicado.bind(this));
			});
		});
		this.exibirTitulo('Justiça Gratuita', areaDocumentos);
		areaDocumentos.insertAdjacentHTML('beforeend', `<p class="gm-resposta">${dadosProcesso.justicaGratuita}</p>`);
	}

	onBotaoPrepararClicado(evt, fecharAposPreparar = false) {
		evt.preventDefault();
		evt.stopPropagation();
		const opener = this.doc.defaultView.opener;
		this.enviarSolicitacaoPrepararIntimacao(opener, fecharAposPreparar);
	}

	onBotaoPrepararFecharClicado(evt) {
		this.onBotaoPrepararClicado.call(this, evt, true);
	}

	onBotaoPrepararVoltarClicado(evt) {
		this.onBotaoPrepararClicado.call(this, evt, false);
	}

	onLinkDocumentoClicado(evt) {
		evt.preventDefault();
		const elemento = evt.target;
		const evento = elemento.dataset.evento;
		const documento = elemento.dataset.documento;
		const win = this.doc.defaultView;
		this.enviarSolicitacaoAberturaDocumento(win.opener, evento, documento);
	}

	onLinkEditarClicado(evt) {
		evt.preventDefault();
		const win = this.doc.defaultView;
		this.enviarSolicitacaoEditarRequisicao(win.opener);
	}

	onMensagemRecebida(evt) {
		console.info('Mensagem recebida', evt);
		if (evt.origin.match(/^https:\/\/eproc\.(trf4|jf(pr|rs|sc))\.jus\.br$/)) {
			const data = JSON.parse(evt.data);
			if (data.acao === Acoes.RESPOSTA_DADOS) {
				console.log('Dados da requisicação:', this.requisicao);
				this.validarDadosRequisicao();
				this.exibirValoresCalculados();
				this.adicionarAreaDocumentosProcesso();
				this.adicionarBotoesPreparar();
				this.analisarDadosProcesso(data.dados);
			}
		}
	}

	validarDadosProcesso(dadosProcesso) {
		const requisicao = this.requisicao;

		// Conferir magistrado do processo
		this.validarElemento('.gm-requisicao__dados__magistrado', requisicao.magistrado === dadosProcesso.magistrado);

		// Conferir data de trânsito em julgado
		let dataTransito = ConversorData.converter(new Date(dadosProcesso.transito.data || 0));
		let dataEvento = ConversorData.converter(new Date(dadosProcesso.transito.dataEvento || 0));
		let dataDecurso = ConversorData.converter(new Date(dadosProcesso.transito.dataDecurso || 0));
		let dataFechamento = ConversorData.converter(new Date(dadosProcesso.transito.dataFechamento || 0));
		let dataTransitoRequisicao = ConversorData.converter(requisicao.dataTransito);
		let isTrue = dataTransito === dataTransitoRequisicao || dataDecurso === dataTransitoRequisicao;
		let isUndefined = dataEvento === dataTransitoRequisicao || dataFechamento === dataTransitoRequisicao;
		this.validarElemento('.gm-requisicao__dados__dataTransito', isTrue || isUndefined && undefined);

		// Conferir se beneficiário é autor da ação
		requisicao.beneficiarios.forEach(beneficiario => {
			const prefixo = `gm-requisicao__beneficiario--${beneficiario.ordinal}`;
			const autoresMesmoCPF = dadosProcesso.autores.filter(autor => autor.cpfCnpj === beneficiario.cpfCnpj);
			const autoresMesmoCPFeNome = autoresMesmoCPF.filter(autor => autor.nome.toUpperCase() === beneficiario.nome.toUpperCase());
			this.validarElemento(`.${prefixo}__cpfCnpj`, autoresMesmoCPF.length === 1);
			this.validarElemento(`.${prefixo}__nome`, autoresMesmoCPFeNome.length === 1);
		});

		// Conferir se advogados representam autores da ação
		const advogados = dadosProcesso.autores.reduce((set, autor) => {
			autor.advogados.forEach(advogado => set.add(advogado.toUpperCase()));
			return set;
		}, new Set());
		requisicao.honorarios.forEach(honorario => {
			const prefixo = `gm-requisicao__honorario--${honorario.ordinal}`;
			if (honorario.tipo === 'Honorários Contratuais') {
				const autor = dadosProcesso.autores.find(autor => autor.cpfCnpj === honorario.beneficiario.cpfCnpj);
				if (autor) {
					const advogadosAutorMesmoNome = autor.advogados.filter(advogado => advogado.toUpperCase() === honorario.nome.toUpperCase());
					this.validarElemento(`.${prefixo}__nome`, advogadosAutorMesmoNome.length === 1);
				} else {
					this.validarElemento(`.${prefixo}__nome`, false);
				}
			} else if (honorario.tipo === 'Honorários de Sucumbência') {
				this.validarElemento(`.${prefixo}__nome`, advogados.has(honorario.nome.toUpperCase()));
			} else {
				this.validarElemento(`.${prefixo}__tipo`, undefined);
			}
		});
	}

	validarDadosRequisicao() {
		const requisicao = this.requisicao;

		// Status da requisição deve ser "Digitada"
		this.validarElemento('.gm-requisicao__dados__status', requisicao.status === 'Digitada');

		// Destacar campos que requerem atenção
		this.validarElemento('.gm-requisicao__dados__especie', requisicao.valorTotalRequisitado < 60 * SALARIO_MINIMO || undefined);

		// Natureza tributária somente para processos com assunto de direito tributário
		const ehDireitoTributario = requisicao.codigoAssunto.match(/^03/) !== null;
		this.validarElemento('.gm-requisicao__dados__naturezaTributaria', requisicao.naturezaTributaria === ehDireitoTributario);

		// 11.NATUREZA ALIMENTÍCIA - Salários, vencimentos, proventos, pensões e suas complementações
		// 12.NATUREZA ALIMENTÍCIA - Benefícios previdenciários e indenizações por morte ou invalidez
		// 21.NATUREZA NÃO ALIMENTÍCIA
		// 31.DESAPROPRIAÇÕES - Único imóvel residencial do credor
		// 39.DESAPROPRIAÇÕES - Demais
		const ehPrevidenciario = requisicao.codigoAssunto.match(/^04/) !== null;
		const ehServidor = requisicao.codigoAssunto.match(/^011[012]/) !== null;
		const ehDesapropriacao = requisicao.codigoAssunto.match(/^0106/) !== null;
		let codigoNaturezaCorreto = undefined;
		switch (requisicao.codigoNatureza) {
			case '11':
				codigoNaturezaCorreto = ehServidor;
				break;

			case '12':
				codigoNaturezaCorreto = ehPrevidenciario;
				break;

			case '31':
			case '39':
				codigoNaturezaCorreto = ehDesapropriacao;
				break;
		}
		this.validarElemento('.gm-requisicao__dados__natureza', codigoNaturezaCorreto);

		// Conferir valor total requisitado
		let total = 0;

		requisicao.beneficiarios.forEach(beneficiario => {
			const prefixo = `gm-requisicao__beneficiario--${beneficiario.ordinal}`;
			total += beneficiario.valorTotal.total;

			// Destacar campos que requerem atenção
			if (! requisicao.isPrecatorio) {
				this.validarElemento(`.${prefixo}__expressaRenuncia`, undefined);
			}
			this.validarElemento(`.${prefixo}__bloqueado`, undefined);

			// Conferir se valor do IRPF corresponde à quantia que o beneficiário irá receber
			if (beneficiario.irpf) {
				if (requisicao.isPrecatorio) {
					this.validarElemento(`.${prefixo}__irpf`, undefined);
				} else {
					let irpf = 0;
					if (beneficiario.irpf.anterior) {
						irpf += beneficiario.irpf.anterior.valorTotal;
					}
					if (beneficiario.irpf.corrente) {
						irpf += beneficiario.irpf.corrente.valorTotal;
					}
					this.validarElemento(`.${prefixo}__irpf`, Utils.round(irpf, 2) === beneficiario.valorTotal.total);
				}
			}

			// Conferir se os honorários destacados estão na requisição
			let honorarios = requisicao.honorarios
				.filter(honorario => honorario.tipo === 'Honorários Contratuais')
				.filter(honorario => honorario.beneficiario.cpfCnpj === beneficiario.cpfCnpj);
			if (beneficiario.honorariosDestacados) {
				this.validarElemento(`.${prefixo}__honorariosDestacados`, honorarios.length >= 1);
			} else {
				this.validarElemento(`.${prefixo}__honorariosDestacados`, honorarios.length === 0);
			}
		});

		requisicao.honorarios.forEach(honorario => {
			const prefixo = `gm-requisicao__honorario--${honorario.ordinal}`;
			total += honorario.valorTotal.total;

			// Destacar campos que requerem atenção
			if (! requisicao.isPrecatorio) {
				this.validarElemento(`.${prefixo}__expressaRenuncia`, undefined);
			}
			this.validarElemento(`.${prefixo}__bloqueado`, undefined);

			if (honorario.tipo === 'Honorários Contratuais') {
				// Conferir se os dados do contratante estão corretos
				let beneficiarios = requisicao.beneficiarios
					.filter(beneficiario => beneficiario.cpfCnpj === honorario.beneficiario.cpfCnpj);
				this.validarElemento(`.${prefixo}__beneficiario`, beneficiarios.length === 1);

				if (beneficiarios.length === 1) {
					let beneficiario = beneficiarios[0];
					// Conferir se houve destaque de honorários
					this.validarElemento(`.${prefixo}__tipo`, beneficiario.honorariosDestacados);
					// Conferir se data-base dos honorários contratuais é a mesma do valor principal
					this.validarElemento(`.${prefixo}__dataBase`, beneficiario.dataBase.getTime() === honorario.dataBase.getTime());
					// Conferir se razão entre principal e juros dos honorários contratuais é a mesma do valor do beneficiário
					this.validarElemento(`.${prefixo}__valorTotal`, Math.abs(beneficiario.valorTotal.juros / beneficiario.valorTotal.principal - honorario.valorTotal.juros / honorario.valorTotal.principal) <= 0.0001);
					// Conferir se razão entre total e atualizado dos honorários contratuais é a mesma do valor do beneficiário
					this.validarElemento(`.${prefixo}__valorAtualizado`, Math.abs(beneficiario.valorAtualizado.total / beneficiario.valorTotal.total - honorario.valorAtualizado.total / honorario.valorTotal.total) < 0.0001);
				}
			} else if (honorario.tipo === 'Honorários de Sucumbência') {
				// Destacar tipo
				this.validarElemento(`.${prefixo}__tipo`, undefined);
			}
		});
		this.validarElemento('.gm-requisicao__dados__valorTotalRequisitado', requisicao.valorTotalRequisitado === Utils.round(total, 2));
	}
}

class PaginaRequisicao extends Pagina {

	get requisicao() {
		if (! this._requisicao) {
			this._requisicao = this.analisarDadosRequisicao();
		}
		return this._requisicao;
	}

	adicionarAlteracoes() {
		const style = this.doc.createElement('style');
		style.innerHTML = Utils.css({
			"table a": {
				"font-size": "1em"
			},
			".gm-requisicao__tabela tr::before": {
				"content": "''",
				"font-size": "1.2em",
				"font-weight": "bold",
			},
			".gm-resposta": {},
			"p.gm-resposta": {
				"font-size": "1.2em",
				"margin": "1em 0 0",
			},
			".gm-resposta--correta": {
				"color": "hsl(120, 25%, 75%)"
			},
			".gm-resposta--incorreta": {
				"color": "hsl(0, 100%, 40%)",
				"text-shadow": "0 2px 2px hsl(0, 75%, 60%)",
			},
			".gm-resposta--indefinida": {
				"color": "hsl(30, 100%, 40%)",
				"text-shadow": "0 2px 3px hsl(30, 75%, 60%)",
			},
			".gm-requisicao__tabela .gm-resposta--correta td, .gm-requisicao__tabela .gm-resposta--correta span": {
				"color": "hsl(240, 10%, 65%)",
			},
			".gm-requisicao__tabela .gm-resposta--correta::before": {
				"content": "'✓'",
				"color": "hsl(120, 25%, 65%)",
			},
			".gm-requisicao__tabela .gm-resposta--incorreta td, .gm-requisicao__tabela .gm-resposta--incorreta span": {
				"color": "hsl(0, 100%, 40%)",
			},
			".gm-requisicao__tabela .gm-resposta--incorreta::before": {
				"content": "'✗'",
				"color": "hsl(0, 100%, 40%)",
				"text-shadow": "none"
			},
			".gm-requisicao__tabela .gm-resposta--indefinida td, .gm-requisicao__tabela .gm-resposta--indefinida span": {
				"color": "hsl(30, 100%, 40%)",
			},
			".gm-requisicao__tabela .gm-resposta--indefinida::before": {
				"content": "'?'",
				"color": "hsl(30, 100%, 40%)",
				"text-shadow": "none",
			},
			"p.gm-dados-adicionais": {
				"margin-top": "0",
				"margin-left": "2ex",
			},
			".gm-botoes": {
				"margin": "4em 0",
				"display": "flex",
				"justify-content": "space-around",
			},
			"table.gm-tabela-eventos td": {
				"padding": "0 0.5ex"
			}
		});
		this.doc.querySelector('head').appendChild(style);
		const win = this.doc.defaultView;
		win.addEventListener('message', this.onMensagemRecebida.bind(this));
		// this.linkEditar.addEventListener('click', this.onLinkEditarClicado.bind(this));
		this.enviarSolicitacaoDados(win.opener);
	}

	adicionarAreaDocumentosProcesso() {
		const areaTabela = this.doc.getElementById('divInfraAreaTabela');
		areaTabela.insertAdjacentHTML('beforeend', '<div class="gm-documentos"></div>');
	}

	adicionarBotaoTelaIntimacao() {
		const botaoTelaIntimacao = BotaoAcao.criar('Ir para tela de intimação', this.onBotaoTelaIntimacaoClicado.bind(this));

		const areaTabela = this.doc.getElementById('divInfraAreaTabela');
		areaTabela.insertAdjacentHTML('beforeend', '<div class="gm-botoes"></div>');
		const areaBotoes = this.doc.querySelector('.gm-botoes');
		areaBotoes.appendChild(botaoTelaIntimacao);
	}

	analisarDadosProcesso(dadosProcesso) {
		console.log('Dados do processo:', dadosProcesso);
		this.validarDadosProcesso(dadosProcesso);
		this.exibirDocumentosProcesso(dadosProcesso);
	}

	analisarDadosRequisicao() {
		const analisador = new AnalisadorLinhasTabela(
			new Padrao(/^<span class="titBold">Status:<\/span> (.*?)$/, 'status'),
			new Padrao(/^<span class="titBold">Originário Jef:<\/span> (.*?)$/, 'originarioJEF'),
			new Padrao(/^<span class="titBold">Extra Orçamentária:<\/span> (.*?)$/, 'extraorcamentaria'),
			new Padrao(/^<span class="titBold">Processo Eletrônico:<\/span> (.*?)$/, 'processoEletronico'),
			new Padrao(/^<span class="titBold">Juízo:<\/span> (.*?)$/, 'juizo'),
			new Padrao(/^<span class="titBold">Ação de Execução:<\/span> (.*?)$/, 'acaoDeExecucao'),
			new Padrao(/^<span class="titBold">Ação Originária:<\/span> (.*?)$/, 'acaoOriginaria'),
			new Padrao(/^<span class="titBold">Total Requisitado \(R\$\):<\/span> (.*)$/, 'valorTotalRequisitado'),
			new Padrao(/^<span class="titBold">Requerido:<\/span> (.*)$/, 'requerido'),
			new Padrao(/^<span class="titBold">Advogado:<\/span> ?(.*)$/, 'advogado'),
			new Padrao(/^<span class="titBold">Assunto Judicial:<\/span> (\d+)\s+- (.*)\s*$/, 'codigoAssunto', 'assunto'),
			new Padrao(/^<span class="titBold">Data do ajuizamento do processo de conhecimento:<\/span> (\d\d\/\d\d\/\d\d\d\d)$/, 'dataAjuizamento'),
			new Padrao(/^<span class="titBold">Data do trânsito em julgado do processo de conhecimento:<\/span> (\d\d\/\d\d\/\d\d\d\d)$/, 'dataTransito'),
			new Padrao(/^<span class="titBold">Data do trânsito em julgado da sentença ou acórdão\(JEF\):<\/span> (\d\d\/\d\d\/\d\d\d\d)$/, 'dataTransito')
		);
		analisador.definirConversores({
			originarioJEF: ConversorBool,
			extraorcamentaria: ConversorBool,
			processoEletronico: ConversorBool,
			dataHora: ConversorDataHora,
			valorTotalRequisitado: ConversorMoeda,
			naturezaTributaria: ConversorBool,
			dataAjuizamento: ConversorData,
			dataTransito: ConversorData
		});
		analisador.prefixo = 'gm-requisicao__dados';

		const requisicao = new Requisicao();

		const titulo = this.doc.querySelector('.titReq').textContent.trim();
		const numero = titulo.match(/^Requisição Nº: (\d+)$/)[1];
		requisicao.numero = Utils.parseDecimalInt(numero);
		// requisicao.urlEditarAntiga = linkEditar.href;

		const tabela = this.doc.querySelector('#divInfraAreaTabela > table:nth-child(2)');
		tabela.classList.add('gm-requisicao__tabela');
		analisador.analisarInto(tabela, requisicao);

		let elementoAtual = tabela.nextElementSibling;
		let modo = null;
		let ordinal = 0;
		while (elementoAtual) {
			switch (elementoAtual.tagName.toLowerCase()) {
				case 'table':
					if (elementoAtual.textContent.trim() === 'Beneficiários') {
						modo = 'Beneficiários';
						ordinal = 0;
					} else if (elementoAtual.textContent.trim() === 'Honorários') {
						modo = 'Honorários';
						ordinal = 0;
					} else if (modo === 'Beneficiários') {
						requisicao.beneficiarios.push(this.analisarTabelaBeneficiarios(elementoAtual, ordinal++));
					} else if (modo === 'Honorários') {
						requisicao.honorarios.push(this.analisarTabelaHonorarios(elementoAtual, ordinal++));
					} else {
						console.error('Tabela não analisada!', elementoAtual);
						throw new Error('Tabela não analisada!');
					}
					break;
			}
			elementoAtual = elementoAtual.nextElementSibling;
		}

		return requisicao;
	}

	analisarTabela(tabela, prefixo) {
		tabela.classList.add('gm-requisicao__tabela');
		const analisador = new AnalisadorLinhasTabela(
			new Padrao(/^<span class="titBoldUnder">(.+) \(([\d./-]+)\)<\/span>$/, 'nome', 'cpfCnpj'),
			new Padrao(/^<span class="titBold">Espécie:<\/span> (.*)$/, 'especie'),
			new Padrao(/^<span class="titBold">Tipo Honorário<\/span> (.+)$/, 'tipoHonorario'),
			new Padrao(/^<span class="titBold">Data Base:<\/span> (\d\d\/\d\d\d\d)&nbsp;&nbsp;&nbsp;&nbsp;<span class="titBold">Valor Requisitado \(Principal Corrigido \+ Juros\):<\/span> ([\d.,]+ \([\d.,]+ \+ [\d.,]+\))$/, 'dataBase', 'valor'),
			new Padrao(/^<span class="titBold">Data Base:<\/span> (\d\d\/\d\d\d\d)&nbsp;&nbsp;&nbsp;&nbsp;<span class="titBold">Valor Requisitado \(Principal \+ Valor Selic\):<\/span> ([\d.,]+ \([\d.,]+ \+ [\d.,]+\))$/, 'dataBase', 'valor'),
			new Padrao(/^<span class="titBold">(VALOR (?:BLOQUEADO|LIBERADO))<\/span>$/, 'bloqueado'),
			new Padrao(/^<span class="titBold">Juros de Mora Fix.no Tít. Executivo:<\/span> (.*)$/, 'tipoJuros'),
			new Padrao(/^<span class="titBold">Tipo de Despesa:<\/span> (?:.*) \((\d+)\)$/, 'codigoTipoDespesa'),
			new Padrao(/^<span class="titBold">Doença Grave:<\/span> (Sim|Não|)$/, 'doencaGrave'),
			new Padrao(/^<span class="titBold">Renuncia Valor:<\/span> ?(Sim|Não|)$/, 'renunciaValor'),
			new Padrao(/^<span class="titBold">IRPF- RRA a deduzir:<\/span> (Sim|Não)$/, 'irpf'),
			new Padrao(/^<span class="titBold">Ano Exercicio Corrente:<\/span> (\d\d\d\d)&nbsp;&nbsp;&nbsp;&nbsp;<span class="titBold">Meses Exercicio Corrente:<\/span> (\d*)&nbsp;&nbsp;&nbsp;&nbsp;<span class="titBold">Valor Exercicio Corrente:<\/span> ([\d.,]+)$/, 'anoCorrente', 'mesesCorrente', 'valorCorrente'),
			new Padrao(/^<span class="titBold">Ano Exercicio Corrente:<\/span> &nbsp;&nbsp;&nbsp;&nbsp;<span class="titBold">Meses Exercicio Corrente:<\/span> (\d*)&nbsp;&nbsp;&nbsp;&nbsp;<span class="titBold">Valor Exercicio Corrente:<\/span> ([\d.,]+)$/, 'mesesCorrente', 'valorCorrente'),
			new Padrao(/^<span class="titBold">Meses Exercicio Anterior:<\/span> (\d*)&nbsp;&nbsp;&nbsp;&nbsp;<span class="titBold">Valor Exercicio Anterior:<\/span> ([\d.,]+)$/, 'mesesAnterior', 'valorAnterior'),
			new Padrao(/^<span class="titBold">Beneficiário:<\/span> (.+)$/, 'beneficiario'),
			new Padrao(/^<span class="titBold">Requisição de Natureza Tributária \(ATUALIZADA PELA SELIC\):<\/span> (Sim|Não)$/, 'naturezaTributaria')
		);
		analisador.definirConversores({
			dataBase: ConversorMesAno,
			valor: ConversorValores,
			bloqueado: class extends Conversor {
				static analisar(texto) { return texto === 'VALOR BLOQUEADO'; }
				static converter(valor) { return valor ? 'VALOR BLOQUEADO' : 'VALOR LIBERADO'; }
			},
			doencaGrave: ConversorBool,
			renunciaValor: ConversorBool,
			irpf: ConversorBool,
			anoCorrente: ConversorAno,
			mesesCorrente: ConversorInt,
			valorCorrente: ConversorMoeda,
			mesesAnterior: ConversorInt,
			valorAnterior: ConversorMoeda,
			naturezaTributaria: ConversorBool,
		});
		analisador.prefixo = prefixo;

		return analisador.analisar(tabela);
	}

	analisarTabelaBeneficiarios(tabela, ordinal) {
		tabela.classList.add('gm-requisicao__beneficiarios__tabela');
		return this.analisarTabela(tabela, `gm-requisicao__beneficiario--${ordinal}`);
	}

	analisarTabelaHonorarios(tabela, ordinal) {
		tabela.classList.add('gm-requisicao__honorarios__tabela');
		return this.analisarTabela(tabela, `gm-requisicao__honorario--${ordinal}`);
	}

	enviarSolicitacao(janela, data) {
		janela.postMessage(JSON.stringify(data), this.doc.location.origin);
	}

	enviarSolicitacaoAberturaDocumento(janela, evento, documento) {
		return PaginaRequisicaoAntiga.prototype.enviarSolicitacaoAberturaDocumento.call(this, janela, evento, documento);
	}

	enviarSolicitacaoDados(janela) {
		const data = {
			acao: Acoes.BUSCAR_DADOS
		};
		return this.enviarSolicitacao(janela, data);
	}

	enviarSolicitacaoEditarRequisicao(janela, requisicao) {
		const data = {
			acao: Acoes.EDITAR_REQUISICAO,
			requisicao
		};
		return this.enviarSolicitacao(janela, data);
	}

	exibirDocumentosProcesso(dadosProcesso) {
		return PaginaRequisicaoAntiga.prototype.exibirDocumentosProcesso.call(this, dadosProcesso);
	}

	exibirTitulo(texto, elemento) {
		elemento.insertAdjacentHTML('beforeend', `<br><br><table width="100%"><tbody><tr><td><span class="titSecao">${texto}</span></td></tr></tbody></table>`);
	}

	exibirValoresCalculados() {
		const requisicao = this.requisicao;
		const areaTabela = this.doc.getElementById('divInfraAreaTabela');
		this.exibirTitulo('Conferência dos cálculos', areaTabela);

		requisicao.beneficiarios.forEach((beneficiario, ordinal) => {
			const prefixo = `.gm-requisicao__beneficiario--${ordinal}`;
			this.validarElemento(`${prefixo}__valor`, true);
			const nome = beneficiario.nome;
			let principal = beneficiario.valor.principal,
				juros = beneficiario.valor.juros,
				total = beneficiario.valor.total;
			const honorarios = requisicao.honorarios
				.map((honorario, ordinal) => Object.assign({}, honorario, { ordinal }))
				.filter(honorario => honorario.tipoHonorario === 'Honorários Contratuais')
				.filter(honorario => honorario.beneficiario.toUpperCase() === beneficiario.nome.toUpperCase());
			honorarios.forEach(honorario => {
				const prefixo = `.gm-requisicao__honorario--${honorario.ordinal}`;
				this.validarElemento(`${prefixo}__tipoHonorario`, true);
				principal += honorario.valor.principal;
				juros += honorario.valor.juros;
				total += honorario.valor.total;
			});
			let porcentagemAdvogado = 1 - beneficiario.valor.total / total;
			let porcentagemArredondada = Utils.round(porcentagemAdvogado * 100, 0);
			let calculoAdvogado = Utils.round(total * porcentagemArredondada / 100, 2);
			let pagoAdvogado = Utils.round(total - beneficiario.valor.total, 2);
			let diferenca = pagoAdvogado - calculoAdvogado;
			if (Math.abs(diferenca) > 0.01) {
				porcentagemArredondada = porcentagemAdvogado * 100;
			}
			[principal, juros, total] = [principal, juros, total].map(valor => ConversorMoeda.converter(valor));
			areaTabela.insertAdjacentHTML('beforeend', `<p class="gm-resposta">${nome} &mdash; <span class="gm-resposta--indefinida">${principal}</span> + <span class="gm-resposta--indefinida">${juros}</span> = <span class="gm-resposta--indefinida">${total}</span> em <span class="gm-resposta--indefinida">${ConversorMesAno.converter(beneficiario.dataBase)}</span></p>`);
			if (beneficiario.irpf) {
				this.validarElemento(`${prefixo}__irpf`, true);
				let mesesAnterior = beneficiario.mesesAnterior;
				let valorAnterior = beneficiario.valorAnterior;
				if (porcentagemAdvogado > 0) {
					valorAnterior = valorAnterior / (1 - porcentagemAdvogado);
				}
				areaTabela.insertAdjacentHTML('beforeend', `<p class="gm-resposta gm-dados-adicionais">IRPF &mdash; Exercício Anterior &mdash; <span class="gm-resposta--indefinida">${ConversorInt.converter(mesesAnterior)} ${mesesAnterior > 1 ? 'meses' : 'mês'}</span> &mdash; <span class="gm-resposta--indefinida">${ConversorMoeda.converter(valorAnterior)}</span></p>`);
				// }
				// if (beneficiario.irpf.corrente) {
				let mesesCorrente = beneficiario.mesesCorrente;
				let valorCorrente = beneficiario.valorCorrente;
				if (porcentagemAdvogado > 0) {
					valorCorrente = valorCorrente / (1 - porcentagemAdvogado);
				}
				areaTabela.insertAdjacentHTML('beforeend', `<p class="gm-resposta gm-dados-adicionais">IRPF &mdash; Exercício Corrente (<span class="gm-resposta--indefinida">${beneficiario.anoCorrente ? ConversorAno.converter(beneficiario.anoCorrente) : ''}</span>) &mdash; <span class="gm-resposta--indefinida">${ConversorInt.converter(mesesCorrente)} ${mesesCorrente > 1 ? 'meses' : 'mês'}</span> &mdash; <span class="gm-resposta--indefinida">${ConversorMoeda.converter(valorCorrente)}</span></p>`);
				// }
			}
			if (beneficiario.pss) {
				if (beneficiario.pss.semIncidencia) {
					areaTabela.insertAdjacentHTML('beforeend', `<p class="gm-resposta gm-dados-adicionais"><span class="gm-resposta--indefinida">SEM</span> incidência de PSS</p>`);
				} else {
					areaTabela.insertAdjacentHTML('beforeend', `<p class="gm-resposta gm-dados-adicionais"><span class="gm-resposta--indefinida">COM</span> incidência de PSS</p>`);
					if (beneficiario.irpf) {
						areaTabela.insertAdjacentHTML('beforeend', `<p class="gm-resposta gm-dados-adicionais"><span class="gm-resposta--incorreta">Verificar se é caso de deduzir PSS da base de cálculo do IRPF</span></p>`);
					}
				}
			}
			if (porcentagemAdvogado > 0) {
				const advogados = honorarios.map(honorario => honorario.nome).join(', ');
				areaTabela.insertAdjacentHTML('beforeend', `<p class="gm-resposta gm-dados-adicionais">Honorários Contratuais &mdash; ${advogados} &mdash; <span class="gm-resposta--indefinida">${ConversorPorcentagem.converter(porcentagemArredondada / 100)}</span></p>`);
			}
		});

		requisicao.honorarios
			.map((honorario, ordinal) => Object.assign({}, honorario, { ordinal }))
			.filter(honorario => honorario.tipoHonorario !== 'Honorários Contratuais')
			.forEach(honorario => {
				const prefixo = `.gm-requisicao__honorario--${honorario.ordinal}`;
				this.validarElemento(`${prefixo}__nome`, true);
				this.validarElemento(`${prefixo}__tipoHonorario`, true);
				this.validarElemento(`${prefixo}__valor`, true);
				areaTabela.insertAdjacentHTML('beforeend', [
					`<p class="gm-resposta gm-resposta--indefinida">${honorario.nome}</p>`,
					`<p class="gm-resposta gm-dados-adicionais"><span class="gm-resposta--indefinida">${honorario.tipoHonorario}</span> &mdash; <span class="gm-resposta--indefinida">${ConversorMoeda.converter(honorario.valor.principal)}</span> + <span class="gm-resposta--indefinida">${ConversorMoeda.converter(honorario.valor.juros)}</span> = <span class="gm-resposta--indefinida">${ConversorMoeda.converter(honorario.valor.total)}</span> em <span class="gm-resposta--indefinida">${ConversorMesAno.converter(honorario.dataBase)}</span></p>`
				].join('\n'));
			});
	}

	onBotaoTelaIntimacaoClicado(evt) {
		evt.preventDefault();
		evt.stopPropagation();
		const opener = this.doc.defaultView.opener;
		this.enviarSolicitacaoEditarRequisicao(opener, this.requisicao.numero);
	}

	onLinkDocumentoClicado(evt) {
		return PaginaRequisicaoAntiga.prototype.onLinkDocumentoClicado.call(this, evt);
	}

	onMensagemRecebida(evt) {
		console.info('Mensagem recebida', evt);
		if (evt.origin === this.doc.location.origin) {
			const data = JSON.parse(evt.data);
			if (data.acao === Acoes.RESPOSTA_DADOS) {
				console.log('Dados da requisicação:', this.requisicao);
				this.validarDadosRequisicao();
				this.exibirValoresCalculados();
				this.adicionarAreaDocumentosProcesso();
				this.adicionarBotaoTelaIntimacao();
				this.analisarDadosProcesso(data.dados);
			}
		}
	}

	validarDadosProcesso(dadosProcesso) {
		const requisicao = this.requisicao;

		this.validarElemento('.gm-requisicao__dados__codigoAssunto', dadosProcesso.assuntos.indexOf(requisicao.codigoAssunto) > -1);
		const dataAutuacao = ConversorData.converter(new Date(dadosProcesso.autuacao));
		this.validarElemento('.gm-requisicao__dados__dataAjuizamento', dataAutuacao === ConversorData.converter(requisicao.dataAjuizamento) || undefined);

		// Conferir data de trânsito em julgado
		let dataTransito = ConversorData.converter(new Date(dadosProcesso.transito.data || 0));
		let dataEvento = ConversorData.converter(new Date(dadosProcesso.transito.dataEvento || 0));
		let dataDecurso = ConversorData.converter(new Date(dadosProcesso.transito.dataDecurso || 0));
		let dataFechamento = ConversorData.converter(new Date(dadosProcesso.transito.dataFechamento || 0));
		let dataTransitoRequisicao = ConversorData.converter(requisicao.dataTransito);
		let isTrue = dataTransito === dataTransitoRequisicao || dataDecurso === dataTransitoRequisicao;
		let isUndefined = dataEvento === dataTransitoRequisicao || dataFechamento === dataTransitoRequisicao;
		this.validarElemento('.gm-requisicao__dados__dataTransito', isTrue || isUndefined && undefined);

		// Conferir se requerido é réu na ação
		this.validarElemento(`.gm-requisicao__dados__requerido`, dadosProcesso.reus.indexOf(requisicao.requerido) > -1 && (dadosProcesso.reus.length === 1 || undefined));

		// Conferir se beneficiário é autor da ação
		requisicao.beneficiarios.forEach((beneficiario, ordinal) => {
			const prefixo = `gm-requisicao__beneficiario--${ordinal}`;
			const autoresMesmoCPF = dadosProcesso.autores.filter(autor => autor.cpfCnpj === beneficiario.cpfCnpj.replace(/[./-]/g, ''));
			// const autoresMesmoCPFeNome = autoresMesmoCPF.filter(autor => autor.nome.toUpperCase() === beneficiario.nome.toUpperCase());
			this.validarElemento(`.${prefixo}__cpfCnpj`, autoresMesmoCPF.length === 1);
			// this.validarElemento(`.${prefixo}__nome`, autoresMesmoCPFeNome.length === 1);
		});

		// Conferir se advogados representam autores da ação
		const advogados = dadosProcesso.autores.reduce((set, autor) => {
			autor.advogados.forEach(advogado => set.add(advogado.toUpperCase()));
			return set;
		}, new Set());
		requisicao.honorarios.forEach((honorario, ordinal) => {
			const prefixo = `gm-requisicao__honorario--${ordinal}`;
			if (honorario.tipoHonorario === 'Honorários Contratuais') {
				const autor = dadosProcesso.autores.find(autor => autor.nome.toUpperCase() === honorario.beneficiario);
				if (autor) {
					const advogadosAutorMesmoNome = autor.advogados.filter(advogado => advogado.toUpperCase() === honorario.nome.toUpperCase());
					this.validarElemento(`.${prefixo}__nome`, advogadosAutorMesmoNome.length === 1);
				} else {
					this.validarElemento(`.${prefixo}__nome`, false);
				}
			} else if (honorario.tipoHonorario === 'Honorários de Sucumbência') {
				this.validarElemento(`.${prefixo}__nome`, advogados.has(honorario.nome.toUpperCase()));
			}
		});
	}

	validarDadosRequisicao() {
		const requisicao = this.requisicao;

		// Status da requisição deve ser "Finalizada"
		this.validarElemento('.gm-requisicao__dados__status', requisicao.status === 'Finalizada');

		this.validarElemento('.gm-requisicao__dados__originarioJEF', true);
		this.validarElemento('.gm-requisicao__dados__extraorcamentaria', true);
		this.validarElemento('.gm-requisicao__dados__processoEletronico', true);
		this.validarElemento('.gm-requisicao__dados__juizo', true);
		this.validarElemento('.gm-requisicao__dados__acaoDeExecucao', true);
		this.validarElemento('.gm-requisicao__dados__acaoOriginaria', true);
		this.validarElemento('.gm-requisicao__dados__advogado', true);

		// 11.NATUREZA ALIMENTÍCIA - Salários, vencimentos, proventos, pensões e suas complementações
		// 12.NATUREZA ALIMENTÍCIA - Benefícios previdenciários e indenizações por morte ou invalidez
		// 21.NATUREZA NÃO ALIMENTÍCIA
		// 31.DESAPROPRIAÇÕES - Único imóvel residencial do credor
		// 39.DESAPROPRIAÇÕES - Demais
		const ehPrevidenciario = requisicao.codigoAssunto.match(/^04/) !== null;
		const ehServidor = requisicao.codigoAssunto.match(/^011[012]/) !== null;
		const ehDesapropriacao = requisicao.codigoAssunto.match(/^0106/) !== null;
		const ehTributario = requisicao.codigoAssunto.match(/^03/) !== null;
		let codigoNaturezaCorreto = undefined;

		const pagamentos = Array.concat(...['beneficiario', 'honorario'].map(tipo => {
			const colecao = `${tipo}s`;
			return requisicao[colecao].map((pagamento, ordinal) => {
				if (tipo === 'beneficiario') {
					pagamento.ordinaisContratuais = requisicao.honorarios
						.map((honorario, ordinal) => ({ ordinal, honorario }))
						.filter(({ honorario: { tipoHonorario } }) => tipoHonorario === 'Honorários Contratuais')
						.filter(({ honorario: { beneficiario: nomeBeneficiarioContratuais } }) => pagamento.nome.toUpperCase() === nomeBeneficiarioContratuais.toUpperCase())
						.map(({ ordinal }) => ordinal);
				} else if (tipo === 'honorario') {
					if (pagamento.tipoHonorario === 'Honorários Contratuais') {
						pagamento.maybeOrdinalBeneficiario = requisicao.beneficiarios
							.map((beneficiario, ordinal) => ({ ordinal, beneficiario }))
							.filter(({ beneficiario: { nome } }) => pagamento.beneficiario.toUpperCase() === nome.toUpperCase())
							.map(({ ordinal }) => ordinal);
					}
				}
				return {
					tipo,
					ordinal,
					pagamento,
					prefixo: `gm-requisicao__${tipo}--${ordinal}`
				};
			});
		}));

		const total = pagamentos.reduce((soma, { pagamento }) => soma + pagamento.valor.total, 0);
		this.validarElemento('.gm-requisicao__dados__valorTotalRequisitado', requisicao.valorTotalRequisitado === Utils.round(total, 2));

		const LIMITE = 60 * SALARIO_MINIMO;

		pagamentos.forEach(({ tipo, pagamento, prefixo }) => {

			// Destacar campos que requerem atenção
			this.validarElemento(
				`.${prefixo}__bloqueado`,
				tipo === 'honorario' && pagamento.tipoHonorario === 'Devolução à Seção Judiciária' ||
					undefined
			);
			if ('tipoJuros' in pagamento) {
				this.validarElemento(
					`.${prefixo}__tipoJuros`,
					ehPrevidenciario && pagamento.tipoJuros === 'Poupança' ||
						tipo === 'honorario' && pagamento.tipoHonorario === 'Devolução à Seção Judiciária' && pagamento.tipoJuros === 'Não fixados' ||
						undefined
				);
			}

			if ('naturezaTributaria' in pagamento) {
				this.validarElemento(`.${prefixo}__naturezaTributaria`, ehTributario === pagamento.naturezaTributaria);
			}

			switch (pagamento.codigoTipoDespesa) {
				case '11':
					codigoNaturezaCorreto = ehServidor;
					break;

				case '12':
					codigoNaturezaCorreto = ehPrevidenciario;
					break;

				case '31':
				case '39':
					codigoNaturezaCorreto = ehDesapropriacao;
					break;

				case '21':
					codigoNaturezaCorreto = ehTributario ||
						tipo === 'honorario' && pagamento.tipoHonorario === 'Devolução à Seção Judiciária' ||
						undefined;
					break;
			}
			this.validarElemento(`.${prefixo}__codigoTipoDespesa`, codigoNaturezaCorreto);

			if (pagamento.especie.match(/^RPV/) === null) {
				this.validarElemento(`.${prefixo}__doencaGrave`, undefined);
			}
			if (tipo === 'beneficiario') {
			// Conferir se valor do IRPF corresponde à quantia que o beneficiário irá receber
				if (pagamento.irpf) {
					let irpf = 0;
					if (pagamento.valorAnterior) {
						irpf += pagamento.valorAnterior;
					}
					if (pagamento.valorCorrente) {
						irpf += pagamento.valorCorrente;
					}
					const valorIRPFConfere = Utils.round(irpf, 2) === pagamento.valor.total;
					this.validarElemento(`.${prefixo}__valorCorrente`, valorIRPFConfere);
					this.validarElemento(`.${prefixo}__valorAnterior`, valorIRPFConfere);
				}

				const valorIncluindoContratuais = [pagamento.valor.total]
					.concat(
						...pagamento.ordinaisContratuais
							.map(ordinal => requisicao.honorarios[ordinal])
							.map(honorario => honorario.valor.total)
					)
					.reduce((soma, valor) => soma + valor, 0);
				const ultrapassaLimite = valorIncluindoContratuais / LIMITE > 0.99;

				if (pagamento.especie.match(/^RPV/) !== null) {
					this.validarElemento(`.${prefixo}__renunciaValor`, pagamento.renunciaValor === ultrapassaLimite);
					this.validarElemento(`.${prefixo}__especie`, ! ultrapassaLimite);
				} else {
					this.validarElemento(`.${prefixo}__especie`, ultrapassaLimite || undefined);
				}
			} else if (tipo === 'honorario') {
				if (pagamento.tipoHonorario === 'Honorários Contratuais') {
					// Conferir se os dados do contratante estão corretos
					this.validarElemento(`.${prefixo}__beneficiario`, pagamento.maybeOrdinalBeneficiario.length === 1);
					pagamento.maybeOrdinalBeneficiario
						.map(ord => requisicao.beneficiarios[ord])
						.forEach(beneficiario => {
							// Conferir se data-base dos honorários contratuais é a mesma do valor principal
							this.validarElemento(`.${prefixo}__dataBase`, beneficiario.dataBase.getTime() === pagamento.dataBase.getTime());
							// Conferir se razão entre principal e juros dos honorários contratuais é a mesma do valor do beneficiário
							this.validarElemento(`.${prefixo}__valor`, Math.abs(beneficiario.valor.juros / beneficiario.valor.principal - pagamento.valor.juros / pagamento.valor.principal) <= 0.0001);
						});

					const valorIncluindoBeneficiario = [pagamento.valor.total]
						.concat(
							...pagamento.maybeOrdinalBeneficiario
								.map(ord => requisicao.beneficiarios[ord])
								.map(beneficiario => beneficiario.valor.total)
						)
						.reduce((soma, valor) => soma + valor, 0);
					const ultrapassaLimite = valorIncluindoBeneficiario / LIMITE > 0.99;

					if (pagamento.especie.match(/^RPV/) !== null) {
						this.validarElemento(`.${prefixo}__renunciaValor`, pagamento.renunciaValor === ultrapassaLimite);
						this.validarElemento(`.${prefixo}__especie`, ! ultrapassaLimite);
					} else {
						this.validarElemento(`.${prefixo}__especie`, ultrapassaLimite || undefined);
					}
				} else {
					const ultrapassaLimite = pagamento.valor.total / LIMITE > 0.99;
					if (pagamento.especie.match(/^RPV/) !== null) {
						this.validarElemento(`.${prefixo}__renunciaValor`, pagamento.renunciaValor === ultrapassaLimite);
						this.validarElemento(`.${prefixo}__especie`, ! ultrapassaLimite);
					} else {
						this.validarElemento(`.${prefixo}__especie`, ultrapassaLimite || undefined);
					}
				}
			}

		});
	}
}

class PaginaRequisicaoAntigaEditar extends Pagina {

	get numero() {
		const [str] = this.doc.location.search.split(/^\?/).slice(1);
		const parametros = new Map(str.split('&').map(par => par.split('=').map(texto => decodeURIComponent(texto))));
		return Utils.parseDecimalInt(parametros.get('num_requis'));
	}

	adicionarAlteracoes() {
		const win = this.doc.defaultView;
		win.addEventListener('message', this.onMensagemRecebida.bind(this));
		const opener = win.opener;
		this.informarAbertura(opener);
	}

	confirmarRecebimentoOrdem(janela, origem) {
		const data = {
			acao: Acoes.ORDEM_CONFIRMADA,
			ordem: Acoes.PREPARAR_INTIMACAO_ANTIGA,
			requisicao: this.numero
		};
		this.enviarSolicitacao(janela, data, origem);
	}

	enviarSolicitacao(janela, data, origem = null) {
		function enviarDados(urlOrigem) {
			janela.postMessage(JSON.stringify(data), urlOrigem);
		}

		if (origem) {
			enviarDados(origem);
		} else {
			const possiveisDestinos = ['trf4', 'jfpr', 'jfrs', 'jfsc'];
			possiveisDestinos.forEach(destino => {
				const url = `https://eproc.${destino}.jus.br`;
				enviarDados(url);
			});
		}
	}

	informarAbertura(janela) {
		const data = {
			acao: Acoes.VERIFICAR_JANELA,
			requisicao: this.numero
		};
		return this.enviarSolicitacao(janela, data);
	}

	onMensagemRecebida(evt) {
		console.info('Mensagem recebida', evt);
		if (evt.origin.match(/^https:\/\/eproc\.(trf4|jf(pr|rs|sc))\.jus\.br$/)) {
			const data = JSON.parse(evt.data);
			if (data.acao === Acoes.PREPARAR_INTIMACAO_ANTIGA) {
				if (data.requisicao === this.numero) {
					this.confirmarRecebimentoOrdem(evt.source, evt.origin);
					this.prepararIntimacao();
				} else {
					console.info('Ignorando ordem para preparar intimação da requisição, número não confere:', data.requisicao, this.numero);
				}
			}
		}
	}

	prepararIntimacao() {
		const botoes = Array.from(this.doc.querySelectorAll('.infraButton'));
		const botoesPreparar = botoes.filter(botao => botao.value.trim() === 'Preparar Requisição para Intimação');
		if (botoesPreparar.length !== 1) {
			console.error('Número de botões não corresponde ao esperado!', botoesPreparar);
			throw new Error('Número de botões não corresponde ao esperado!');
		}
		const botaoPreparar = botoesPreparar[0];
		botaoPreparar.click();
	}
}

class PaginaRequisicaoAntigaPreparada extends Pagina {
	adicionarAlteracoes() {
		const rePreparada = /^(\d+)\s+-\s+Requisição preparada para intimação.$/;
		const textos = Array.from(this.doc.querySelectorAll('#divInfraAreaTabela .infraText'))
			.map(texto => texto.textContent.trim())
			.filter(texto => rePreparada.test(texto));
		const preparadas = textos.map(texto => Utils.parseDecimalInt(texto.match(rePreparada)[1]));
		if (preparadas.length !== 1) {
			console.error('Número de requisições preparadas para intimação não corresponde ao esperado!', preparadas);
			throw new Error('Número de requisições preparadas para intimação não corresponde ao esperado!');
		}
		const requisicao = preparadas[0];
		const data = {
			acao: Acoes.REQUISICAO_ANTIGA_PREPARADA,
			requisicao
		};
		const opener = this.doc.defaultView.opener;
		const possiveisDestinos = ['trf4', 'jfpr', 'jfrs', 'jfsc'];
		possiveisDestinos.forEach(destino => {
			const url = `https://eproc.${destino}.jus.br`;
			opener.postMessage(JSON.stringify(data), url);
		});
	}
}

class Requisicao {
	get isPrecatorio() {
		return this.especie.match(/^Precatório/) !== null;
	}

	constructor() {
		this.beneficiarios = [];
		this.honorarios = [];
	}
}

class Utils {
	static css(obj) {
		return Array.from(Object.keys(obj)).map(selector => {
			const rules = obj[selector];
			return [
				`${selector} {`,
				Array.from(Object.keys(rules)).map(property => {
					const value = rules[property];
					return `\t${property}: ${value};`;
				}).join('\n'),
				`}`
			].join('\n');
		}).join('\n');
	}

	static parseDecimalInt(texto) {
		return parseInt(texto, 10);
	}

	static round(num, digits = 0) {
		const exp = Math.pow(10, digits);
		return Math.round(num * exp) / exp;
	}
}

class XHR {
	static buscarDocumento(url) {
		return new Promise((resolve, reject) => {
			const xhr = new XMLHttpRequest();
			xhr.open('GET', url);
			xhr.responseType = 'document';
			xhr.addEventListener('load', evt => resolve(evt.target.response));
			xhr.addEventListener('error', reject);
			xhr.send(null);
		});
	}

	static buscarDocumentoExterno(url) {
		return new Promise((resolve, reject) => {
			const options = {
				method: 'GET',
				url: url,
				responseType: 'document',
				onload: obj => resolve(obj.responseXML),
				onerror: reject
			};
			GM_xmlhttpRequest(options);
		});
	}
}

function main() {
	const pagina = Pagina.analisar(document);
	pagina.adicionarAlteracoes();
}

main();
