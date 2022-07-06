// ==UserScript==
// @name Processos prioritários
// @namespace   http://nadameu.com.br/processos-prioritarios
// @include     /^https:\/\/eproc\.(jf(pr|rs|sc)|trf4)\.jus\.br/eproc(V2|2trf4)/controlador\.php\?acao\=usuario_tipo_monitoramento_localizador_listar\&/
// @include     /^https:\/\/eproc\.(jf(pr|rs|sc)|trf4)\.jus\.br/eproc(V2|2trf4)/controlador\.php\?acao\=localizador_processos_lista\&/
// @include     /^https:\/\/eproc\.(jf(pr|rs|sc)|trf4)\.jus\.br/eproc(V2|2trf4)/controlador\.php\?acao\=localizador_orgao_listar\&/
// @include     /^https:\/\/eproc\.(jf(pr|rs|sc)|trf4)\.jus\.br/eproc(V2|2trf4)/controlador\.php\?acao\=relatorio_geral_listar\&/
// @include     /^https:\/\/eproc\.(jf(pr|rs|sc)|trf4)\.jus\.br/eproc(V2|2trf4)/controlador\.php\?acao\=[^&]+\&acao_origem=principal\&/
// @version 27.3.0
// @grant none
// ==/UserScript==

/* eslint-env es6, browser */

interface Window {
	infraExibirAviso(permiteCancelar: boolean, texto: string): void;
	infraOcultarAviso(): void;
}

const CompetenciasCorregedoria = {
	JUIZADO: 1,
	CIVEL: 2,
	CRIMINAL: 3,
	EXECUCAO_FISCAL: 4,
} as const;
const Situacoes = {
	'MOVIMENTO': 3,
	'MOVIMENTO-AGUARDA DESPACHO': 2,
	'MOVIMENTO-AGUARDA SENTENÇA': 4,
	'INICIAL': 1,
	'INDEFINIDA': 5,
} as const;
const RegrasCorregedoria = {
	[CompetenciasCorregedoria.JUIZADO]: {
		[Situacoes['INICIAL']]: 10,
		[Situacoes['MOVIMENTO-AGUARDA DESPACHO']]: 15,
		[Situacoes['MOVIMENTO']]: 10,
		[Situacoes['MOVIMENTO-AGUARDA SENTENÇA']]: 45,
		[Situacoes['INDEFINIDA']]: 30,
	},
	[CompetenciasCorregedoria.CIVEL]: {
		[Situacoes['INICIAL']]: 10,
		[Situacoes['MOVIMENTO-AGUARDA DESPACHO']]: 20,
		[Situacoes['MOVIMENTO']]: 15,
		[Situacoes['MOVIMENTO-AGUARDA SENTENÇA']]: 60,
		[Situacoes['INDEFINIDA']]: 60,
	},
	[CompetenciasCorregedoria.CRIMINAL]: {
		[Situacoes['INICIAL']]: 15,
		[Situacoes['MOVIMENTO-AGUARDA DESPACHO']]: 20,
		[Situacoes['MOVIMENTO']]: 15,
		[Situacoes['MOVIMENTO-AGUARDA SENTENÇA']]: 60,
		[Situacoes['INDEFINIDA']]: 30,
	},
	[CompetenciasCorregedoria.EXECUCAO_FISCAL]: {
		[Situacoes['INICIAL']]: 10,
		[Situacoes['MOVIMENTO-AGUARDA DESPACHO']]: 60,
		[Situacoes['MOVIMENTO']]: 25,
		[Situacoes['MOVIMENTO-AGUARDA SENTENÇA']]: 60,
		[Situacoes['INDEFINIDA']]: 120,
	},
};
const invalidSymbols = /[&<>"]/g;
const replacementSymbols = { '&': 'amp', '<': 'lt', '>': 'gt', '"': 'quot' };
function safeHTML(strings: TemplateStringsArray, ...vars: string[]) {
	return vars.reduce(
		(result, variable, i) =>
			result +
			variable.replace(
				invalidSymbols,
				sym => `&${replacementSymbols[sym as keyof typeof replacementSymbols]};`,
			) +
			strings[i + 1],
		strings[0]!,
	);
}

let button: HTMLButtonElement | null = null;
let progresso: HTMLProgressElement | null = null;
let saida: HTMLOutputElement | null = null;
class GUI {
	private static _instance?: GUI;

	atualizarGrafico: () => void;

	constructor() {
		this.atualizarGrafico = () => {
			throw new Error('Função não implementada.');
		};

		const estilos = document.createElement('style');
		estilos.innerHTML = [
			'tr.infraTrEscura { background-color: #f0f0f0; }',
			'.gmProcessos { display: inline-block; margin: 0 0.25ex; padding: 0 0.5ex; font-weight: bold; min-width: 3.5ex; line-height: 1.5em; border: 2px solid transparent; border-radius: 1ex; text-align: center; color: black; }',
			'.gmProcessos.gmPrioridade0 { background-color: #ff8a8a; }',
			'.gmProcessos.gmPrioridade1 { background-color: #f84; }',
			'.gmProcessos.gmPrioridade2 { background-color: #ff8; }',
			'.gmProcessos.gmPrioridade3 { background-color: #8aff8a; }',
			'.gmProcessos.gmVazio { opacity: 0.25; background-color: inherit; color: #888; }',
			'.gmPeticoes { display: inline-block; margin-right: 1ex; width: 15px; height: 15px; line-height: 15px; background: red; color: white; border: 1px solid red; text-align: center; border-radius: 50%; font-size: 12px; }',
			'.gmPeticoes.gmVazio { visibility: hidden; }',
			'.gmDetalhes td:first-child { padding-left: 0; }',
			'.gmNaoMostrarClasses .gmDetalheClasse { display: none; }',
			'.gmNaoMostrarDiasParaFim .gmDiasParaFim { display: none; }',
			'.gmLocalizadorExtra { display: inline-block; float: right; background: #eee; border: 1px solid #aaa; color: #333; padding: 2px; margin: 0 3px 0 0; border-radius: 3px; font-size: 0.9em; }',
			'.gmBaloes { float: right; }',
			'.gmBotoesLocalizador { margin-right: 3ex; }',
			'.gmAtualizar { font-size: 1em; background: #ccc; padding: 4px; border-radius: 4px; margin-right: 1ex; }',
			'.gmFiltrar { font-size: 1em; background: #ccc; padding: 4px; border-radius: 4px; margin-right: 1ex; }',
			'.gmFiltrado .gmFiltrar { display: none; }',
			'.gmDetalhesAberto { transform: translateY(-2px); box-shadow: 0 2px 4px rgba(0,0,0,0.3); }',
			'.gmDetalhes meter { width: 10ex; }',
			'.gmDetalhes meter.gmExcesso { width: 20ex; }',
			'.gmLembreteProcesso { width: 2ex; height: 2ex; margin: 0 1ex; border-width: 0; }',
			'.gmLembreteProcessoVazio { opacity: 0; pointer-events: none; }',
			'.gmPorcentagem { display: inline-block; width: 6ex; text-align: right; }',
			'.gmPrioridade { display: none; color: red; }',
			'.gmPrazoMetade .gmPrioridade { display: inline; }',
		].join('\n');
		const head = document.querySelector('head');
		if (!head) throw new Error('Erro ao localizar o elemento "head".');
		head.appendChild(estilos);
	}
	atualizarVisualizacao(localizador: Localizador, filtrado = false) {
		if (!localizador.infoLink) return;
		const linha = localizador.linha;
		const DIAS_A_FRENTE = 3;
		const avisos = [
			'Processos com prazo excedido em dobro',
			'Processos com prazo vencido',
			`Processos com prazo a vencer nos próximos ${DIAS_A_FRENTE} dias`,
			'Processos no prazo',
		];
		const MILISSEGUNDOS_EM_UM_DIA = 864e5;
		const ULTIMA_HORA = 23;
		const ULTIMO_MINUTO = 59;
		const ULTIMO_SEGUNDO = 59;
		const ULTIMO_MILISSEGUNDO = 999;
		const agora = new Date();
		const aVencer = new Date(
			agora.getFullYear(),
			agora.getMonth(),
			agora.getDate() + DIAS_A_FRENTE,
			ULTIMA_HORA,
			ULTIMO_MINUTO,
			ULTIMO_SEGUNDO,
			ULTIMO_MILISSEGUNDO,
		);
		const atrasoAVencer = (agora.getTime() - aVencer.getTime()) / MILISSEGUNDOS_EM_UM_DIA;
		const prioridades = [
			localizador.processos.filter(processo => processo.atrasoPorcentagem >= 1),
			localizador.processos.filter(
				processo => processo.atraso >= 0 && processo.atrasoPorcentagem < 1,
			),
			localizador.processos.filter(
				processo => processo.atraso < 0 && processo.atraso >= atrasoAVencer,
			),
			localizador.processos.filter(processo => processo.atraso < atrasoAVencer),
		];
		const baloes = prioridades.map(
			(processos, indicePrioridade) =>
				`<span id="gmLocalizador${
					localizador.infoLink!.id
				}Prioridade${indicePrioridade}" class="gmProcessos gmPrioridade${indicePrioridade}${
					processos.length > 0 ? '' : ' gmVazio'
				}" onmouseover="infraTooltipMostrar(&quot;${
					avisos[indicePrioridade]
				}&quot;);" onmouseout="infraTooltipOcultar();">${processos.length}</span>`,
		);
		const conteudo = [];
		switch (localizador.infoNome.tipo) {
			case 'composto':
				conteudo.push(localizador.infoNome.siglaNome);
				break;

			case 'nome':
				conteudo.push(localizador.infoNome.nome);
				break;

			case 'separado':
				if (localizador.infoNome.nome !== localizador.infoNome.siglaNome) {
					if (isContained(localizador.infoNome.sigla, localizador.infoNome.nome)) {
						conteudo.push(localizador.infoNome.nome);
					} else {
						conteudo.push(`${localizador.infoNome.sigla} (${localizador.infoNome.nome})`);
					}
				} else {
					conteudo.push(localizador.infoNome.nome);
				}
				break;
		}
		if (localizador.lembrete) {
			conteudo.push(' ');
			conteudo.push(
				`<img class="infraImgNormal" src="infra_css/imagens/balao.gif" style="width:0.9em; height:0.9em; opacity:1; border-width:0;" onmouseover="${safeHTML`return infraTooltipMostrar('${localizador.lembrete}','',400);`}" onmouseout="return infraTooltipOcultar();"/>`,
			);
		}
		const processosComPeticao = localizador.processos.filter(processo => {
			let localizadoresPeticao = processo.localizadores.filter(
				localizadorProcesso =>
					localizadorProcesso.sigla === 'PETIÇÃO' ||
					localizadorProcesso.sigla === 'SUSPENSOS-RETORNO',
			);
			return localizadoresPeticao.length > 0;
		});
		const OCULTAR_BALOES_COM_MAIS_DE = 99;
		baloes.unshift(
			`<span id="gmLocalizador${localizador.infoLink.id}Peticoes" class="gmPeticoes${
				processosComPeticao.length > 0 ? '' : ' gmVazio'
			}" onmouseover="infraTooltipMostrar(&quot;Processos com localizador PETIÇÃO ou SUSPENSOS-RETORNO&quot;);" onmouseout="infraTooltipOcultar();">${
				processosComPeticao.length > OCULTAR_BALOES_COM_MAIS_DE ? '+' : processosComPeticao.length
			}</span>`,
		);
		conteudo.push('<div class="gmBaloes">');
		conteudo.push(baloes.join(''));
		conteudo.push('</div>');
		if (linha.cells.length < 1) throw new Error('Linha não possui espaço para escrita.');
		linha.cells[0]!.innerHTML = conteudo.join('');
		if (localizador.quantidadeProcessosNaoFiltrados > 0) {
			const container = document.createElement('span');
			container.className = 'gmBotoesLocalizador';
			if (filtrado) {
				linha.classList.add('gmFiltrado');
			} else {
				linha.classList.remove('gmFiltrado');
				const filtrar = document.createElement('a');
				filtrar.setAttribute(
					'onmouseover',
					'infraTooltipMostrar("Excluir processos com prazos em aberto.");',
				);
				filtrar.setAttribute('onmouseout', 'infraTooltipOcultar();');
				filtrar.setAttribute('onclick', 'infraTooltipOcultar();');
				filtrar.className = 'gmFiltrar';
				filtrar.textContent = 'Filtrar';
				filtrar.addEventListener(
					'click',
					async evt => {
						evt.preventDefault();
						evt.stopPropagation();
						Array.from(document.getElementsByClassName('gmDetalhesAberto')).forEach(balaoAberto => {
							const linhaAberta = balaoAberto.closest('tr');
							if (linhaAberta && linhaAberta === linha) {
								balaoAberto.classList.remove('gmDetalhesAberto');
								Array.from(document.getElementsByClassName('gmDetalhes')).forEach(linhaAntiga => {
									linha.parentElement!.removeChild(linhaAntiga);
								});
							}
						});
						const gui = GUI.getInstance();
						gui.avisoCarregando.exibir('Filtrando processos com prazo em aberto...');
						gui.avisoCarregando.atualizar(0, localizador.quantidadeProcessos);
						await localizador.excluirPrazosAbertos();
						gui.avisoCarregando.ocultar();
						gui.atualizarVisualizacao(localizador, true);
						gui.atualizarGrafico();
					},
					false,
				);
				container.appendChild(filtrar);
			}
			const atualizar = document.createElement('a');
			atualizar.className = 'gmAtualizar';
			atualizar.textContent = 'Atualizar';
			atualizar.addEventListener(
				'click',
				async evt => {
					evt.preventDefault();
					evt.stopPropagation();
					Array.from(document.getElementsByClassName('gmDetalhesAberto')).forEach(balaoAberto => {
						const linhaAberta = balaoAberto.closest('tr');
						if (linhaAberta && linhaAberta === linha) {
							balaoAberto.classList.remove('gmDetalhesAberto');
							Array.from(document.getElementsByClassName('gmDetalhes')).forEach(linhaAntiga => {
								linha.parentElement!.removeChild(linhaAntiga);
							});
						}
					});
					const gui = GUI.getInstance();
					gui.avisoCarregando.exibir('Atualizando...');
					gui.avisoCarregando.atualizar(0, localizador.quantidadeProcessosNaoFiltrados);
					await localizador.obterProcessos();
					gui.avisoCarregando.ocultar();
					gui.atualizarVisualizacao(localizador);
					gui.atualizarGrafico();
				},
				false,
			);
			container.appendChild(atualizar);
			const divExistente = linha.cells[0]!.querySelector('div');
			if (!divExistente) throw new Error('DIV inexistente.');
			divExistente.insertBefore(container, divExistente.firstChild);
		}
		function alternarDetalhes(balao: Element, processos: Processo[], indicePrioridade?: number) {
			Array.from(document.getElementsByClassName('gmDetalhes')).forEach(linhaAntiga => {
				linha.parentElement!.removeChild(linhaAntiga);
			});
			if (balao.classList.contains('gmDetalhesAberto')) {
				balao.classList.remove('gmDetalhesAberto');
				return;
			}
			Array.from(document.getElementsByClassName('gmDetalhesAberto')).forEach(balaoAberto => {
				balaoAberto.classList.remove('gmDetalhesAberto');
			});
			balao.classList.add('gmDetalhesAberto');
			$('html').animate(
				{ scrollTop: $(balao).offset()!.top - $(window).innerHeight()! / 2 },
				'fast',
			);
			const MENOR = -1,
				IGUAL = 0,
				MAIOR = +1;
			processos.sort((a, b) => {
				if (a.termoPrazoCorregedoria < b.termoPrazoCorregedoria) return MENOR;
				if (a.termoPrazoCorregedoria > b.termoPrazoCorregedoria) return MAIOR;
				return IGUAL;
			});
			processos.forEach((processo, indiceProcesso) => {
				const linhaNova = (linha.parentElement as HTMLTableSectionElement).insertRow(
					linha.rowIndex + 1 + indiceProcesso,
				);
				const atraso = Math.round(processo.atraso);
				linhaNova.className = 'infraTrClara gmDetalhes';
				const DIGITOS_CLASSE = 6,
					DIGITOS_COMPETENCIA = 2;
				linhaNova.dataset.classe = String(processo.numClasse);
				linhaNova.dataset.competencia = (
					'0'.repeat(DIGITOS_COMPETENCIA) + processo.numCompetencia
				).substr(-DIGITOS_COMPETENCIA);
				let textoData: string;
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
					case 'dataInclusaoLocalizador':
						textoData = 'Data de inclusão no localizador';
						break;
					default:
						throw new Error('Campo "data considerada" desconhecido.');
				}
				const MAXIMO_PRIORIDADE_MENOR_OU_IGUAL_A_UM = 2,
					MAXIMO_PRIORIDADE_DOIS_OU_MAIOR = 1,
					DIAS_BAIXO = 3,
					IDEAL = 0.5;
				let indicePrioridadeProcesso: number = -1;
				if (typeof indicePrioridade === 'undefined') {
					prioridades.forEach((processos, indice) => {
						if (processos.includes(processo)) {
							indicePrioridadeProcesso = indice;
						}
					});
				} else {
					indicePrioridadeProcesso = indicePrioridade;
				}
				const esperado = processo.prazoCorregedoria;
				const minimo = 0;
				const maximo =
					esperado *
					(indicePrioridadeProcesso > 1
						? MAXIMO_PRIORIDADE_DOIS_OU_MAIOR
						: MAXIMO_PRIORIDADE_MENOR_OU_IGUAL_A_UM);
				const baixo = esperado - DIAS_BAIXO;
				const alto = esperado;
				const ideal = esperado * IDEAL;
				const valor = esperado + atraso;
				const PCT = 100;
				const porcentagem = `${Math.round(PCT + processo.atrasoPorcentagem * PCT)}%`;
				const localizadoresExtra = processo.localizadores
					.filter(loc => loc.id !== localizador.infoLink!.id)
					.map(loc => loc.sigla);
				linhaNova.innerHTML = [
					'<td>',
					safeHTML`<img class="gmLembreteProcesso${
						processo.lembretes.length === 0 ? ' gmLembreteProcessoVazio' : ''
					}" src="infra_css/imagens/balao.gif" onmouseover="return infraTooltipMostrar('${processo.lembretes
						.map(lembrete => lembrete.replace(/\n/g, '<br>'))
						.join(
							'<hr style="border-width: 0 0 1px 0;">',
						)}', 'Lembretes', 400);" onmouseout="return infraTooltipOcultar();">`,
					[
						`<a href="${processo.link}">${processo.numprocFormatado}</a>`,
						`<abbr title="${textoData}">${processo[processo.campoDataConsiderada]
							.toLocaleString()
							.substr(0, 10)}</abbr> + ${esperado.toString().replace(/\.5$/, '&half;')}${
							esperado >= 2 ? ' dias' : ' dia'
						} = ${processo.termoPrazoCorregedoria.toLocaleString().substr(0, 10)}`,
					].join(' | '),
					`<span class="gmDetalheClasse"> | ${processo.classe.toUpperCase()}</span>`,
					localizadoresExtra.length > 0
						? localizadoresExtra
								.map(loc => `<span class="gmLocalizadorExtra">${loc}</span>`)
								.join(' ')
						: '',
					'</td>',
					'<td>',
					`<meter ${
						indicePrioridadeProcesso < 2 ? ' class="gmExcesso"' : ''
					} min="${minimo}" max="${maximo}" low="${baixo}" high="${alto}" optimum="${ideal}" value="${valor}">${atraso}</meter>`,
					`<span class="gmPorcentagem">${porcentagem}</span><span class="gmDiasParaFim"> | ${
						processo.atraso >= 0 ? 'Prazo excedido há ' : ''
					}`,
					Math.abs(atraso) < 1
						? processo.atraso >= 0
							? 'menos de um'
							: 'Menos de um'
						: Math.abs(atraso),
					Math.abs(atraso) > 1 ? ' dias ' : ' dia ',
					processo.atraso < 0 ? 'até o fim do prazo' : '',
					processo.prioridade ? '</span> <span class="gmPrioridade">(Prioridade)</span>' : '',
					'</td>',
				].join('');
			});
		}
		prioridades.forEach((processos, indicePrioridade) => {
			const balao = document.getElementById(
				`gmLocalizador${
					localizador.infoLink ? localizador.infoLink.id : '0'
				}Prioridade${indicePrioridade}`,
			);
			balao?.addEventListener(
				'click',
				evt => {
					evt.preventDefault();
					evt.stopPropagation();
					alternarDetalhes(balao, processos, indicePrioridade);
				},
				false,
			);
		});
		const balaoPeticoes = document.getElementById(
			`gmLocalizador${localizador.infoLink.id}Peticoes`,
		);
		balaoPeticoes?.addEventListener(
			'click',
			function (evt) {
				evt.preventDefault();
				evt.stopPropagation();
				alternarDetalhes(balaoPeticoes, processosComPeticao);
			},
			false,
		);
	}
	avisoCarregando = {
		acrescentar(qtd: number) {
			if (!progresso || !saida) {
				throw new Error('Aviso ainda não foi exibido.');
			}
			const atual = progresso.value,
				total = progresso.max;
			this.atualizar(atual + qtd, total);
		},
		atualizar(atual: number, total: number) {
			if (!progresso || !saida) {
				this.exibir();
			}
			progresso!.max = total;
			progresso!.value = atual;
			saida!.textContent = `${atual} / ${total}`;
		},
		exibir(texto = 'Carregando dados dos processos...') {
			window.infraExibirAviso(
				false,
				[
					'<center>',
					`${texto}<br/>`,
					'<progress id="gmProgresso" value="0" max="1"></progress><br/>',
					'<output id="gmSaida"></output>',
					'</center>',
				].join(''),
			);
			progresso = document.getElementById('gmProgresso') as HTMLProgressElement;
			saida = document.getElementById('gmSaida') as HTMLOutputElement;
		},
		ocultar() {
			window.infraOcultarAviso();
			progresso = null;
			saida = null;
		},
	};
	criarBotaoAcao(localizadores: Localizadores) {
		const frag = document.createDocumentFragment();
		const area = document.getElementById('divInfraAreaTelaD');
		if (!area) throw new Error('Área não encontrada.');
		button = document.createElement('button');
		button.textContent = 'Analisar conteúdo dos localizadores';
		frag.appendChild(button);
		frag.appendChild(document.createElement('br'));
		function criarCheckboxMostrar(
			id: string,
			padrao: boolean,
			[classeTrue, classeFalse]: [string, string],
			texto: string,
		) {
			const input = document.createElement('input');
			input.type = 'checkbox';
			function onChange() {
				localStorage.setItem(id, input.checked ? 'S' : 'N');
				if (input.checked) {
					if (classeFalse !== '') document.body.classList.remove(classeFalse);
					if (classeTrue !== '') document.body.classList.add(classeTrue);
				} else {
					if (classeTrue !== '') document.body.classList.remove(classeTrue);
					if (classeFalse !== '') document.body.classList.add(classeFalse);
				}
			}
			input.checked = localStorage.hasOwnProperty(id) ? localStorage.getItem(id) === 'S' : padrao;
			input.addEventListener('click', onChange);
			const gui = GUI.getInstance();
			input.addEventListener('click', () => {
				Array.from(document.querySelectorAll('.gmDetalhes')).forEach(detalhe =>
					detalhe.parentNode!.removeChild(detalhe),
				);
				localizadores.forEach(localizador => gui.atualizarVisualizacao(localizador));
				if (typeof gui.atualizarGrafico === 'function') gui.atualizarGrafico();
			});
			onChange();
			const label = document.createElement('label');
			label.textContent = texto;
			label.insertBefore(input, label.firstChild);
			return label;
		}
		const labelClasses = criarCheckboxMostrar(
			'mostrarClasses',
			true,
			['', 'gmNaoMostrarClasses'],
			' Mostrar classe dos processos',
		);
		frag.appendChild(labelClasses);
		frag.appendChild(document.createElement('br'));
		const labelDias = criarCheckboxMostrar(
			'mostrarDiasParaFim',
			true,
			['', 'gmNaoMostrarDiasParaFim'],
			' Mostrar dias para o fim do prazo',
		);
		frag.appendChild(labelDias);
		frag.appendChild(document.createElement('br'));
		const labelConsiderarDataInclusaoLocalizador = criarCheckboxMostrar(
			'considerarDataInclusaoLocalizador',
			false,
			['gmConsiderarDataInclusaoLocalizador', ''],
			'Entre data do último evento e da inclusão no localizador, considerar a mais antiga',
		);
		frag.appendChild(labelConsiderarDataInclusaoLocalizador);
		frag.appendChild(document.createElement('br'));
		const labelPrazoMetade = criarCheckboxMostrar(
			'prazoMetade',
			true,
			['gmPrazoMetade', ''],
			'Conceder metade do prazo normal para processos prioritários',
		);
		frag.appendChild(labelPrazoMetade);
		frag.appendChild(document.createElement('br'));
		area.insertBefore(frag, area.firstChild);
		return button;
	}
	atualizarBotaoAcao() {
		if (button) {
			button.textContent = 'Atualizar';
		}
	}
	atualizarTabelaExtra(localizadores: Localizadores) {
		let tabela = document.querySelector<HTMLTableElement>('table.gmTabelaExtra');
		if (!tabela) {
			tabela = document.createElement('table');
			tabela.className = 'gmTabelaExtra';
			localizadores[0]?.linha.closest('table')?.parentNode?.appendChild(tabela);
			tabela.createTBody();
		}
		const tBody = tabela.tBodies[0]!;
		while (tBody.firstChild) tBody.removeChild(tBody.firstChild);

		const qtd = localizadores.map(loc => loc.processos.length).reduce((acc, x) => acc + x, 0);
		console.log({ qtd });
		const info = localizadores
			.map(info => ({
				info,
				linha: info.linha,
				processos: info.processos
					.map(info => ({ info, valor: info.atrasoPorcentagem + 1 }))
					.map(({ info, valor }) => ({ info, valor: valor < 1 ? valor / qtd : valor }))
					.sort((a, b) => b.valor - a.valor),
			}))
			.map(({ info, linha, processos }) => ({
				info,
				linha,
				processos,
				valor: processos.reduce((acc, { valor }) => acc + valor, 0),
			}))
			.sort((a, b) => b.valor - a.valor);
		localizadores[0]?.linha.parentNode?.querySelectorAll('.gmDetalhes').forEach(x => x.remove());
		localizadores[0]?.linha.parentNode?.append(...info.map(loc => loc.linha));

		const temp = localizadores.map(localizador =>
			localizador.processos.map(processo => ({ processo, localizador })),
		);
		const sep = ([] as { processo: Processo; localizador: Localizador }[])
			.concat(...temp)
			.filter(x => x.processo.atrasoPorcentagem >= 0)
			.sort((a, b) => b.processo.atrasoPorcentagem - a.processo.atrasoPorcentagem);

		let css = 'Escura';
		for (const { processo: proc, localizador } of sep) {
			const row = document.createElement('tr');
			css = css === 'Clara' ? 'Escura' : 'Clara';
			row.className = `infraTr${css}`;
			let html = '<td class="infraTd">';
			html += `<a href="${proc.link.href}" target="_blank">`;
			html += proc.numprocFormatado;
			html += '</a>';
			html += '</td>';
			html += '<td class="infraTd" style="text-align: right;">';
			html += `${proc.localizadores
				.filter(l => l.id !== localizador.infoLink!.id)
				.map(l => l.sigla)
				.join('<br>')}`;
			html += '</td>';
			html += '<td class="infraTd">';
			html += `${localizador.nomeExibicao}`;
			html += '</td>';
			html += '<td class="infraTd">';
			html += `<progress value="${proc.atrasoPorcentagem + 1}"></progress>`;
			html += '</td>';
			html += '<td class="infraTd">';
			html += new Intl.NumberFormat('pt-BR', { style: 'percent' }).format(
				proc.atrasoPorcentagem + 1,
			);
			html += '</td>';
			row.innerHTML = html;
			tBody.appendChild(row);
		}
	}
	criarGrafico(localizadores: Localizadores) {
		this.atualizarTabelaExtra(localizadores);
		function excluirCanvasAntigo() {
			const canvases = document.getElementsByTagName('canvas');
			if (canvases.length > 0) {
				console.log('Excluindo canvas antigo');
				Array.from(canvases).forEach(canvas => canvas.parentNode!.removeChild(canvas));
			}
		}
		function extrairProcessos(localizadores: Localizadores) {
			const processos = new Map<string, number>();
			const agora = new Date(),
				hoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
			localizadores.forEach(localizador => {
				localizador.processos.forEach(processo => {
					const numproc = processo.numproc;
					const termo = processo.termoPrazoCorregedoria,
						dataTermo = new Date(termo.getFullYear(), termo.getMonth(), termo.getDate());
					const timestamp = Math.max(hoje.getTime(), dataTermo.getTime());
					if (processos.has(numproc)) {
						const timestampAntigo = processos.get(numproc)!,
							timestampNovo = Math.min(timestampAntigo, timestamp);
						processos.set(numproc, timestampNovo);
					} else {
						processos.set(numproc, timestamp);
					}
				});
			});
			return processos;
		}
		function extrairDatas(processos: Map<string, number>) {
			const datas = new Map<number, number>();
			for (let timestamp of processos.values()) {
				let valorAtual = datas.get(timestamp) || 0;
				datas.set(timestamp, valorAtual + 1);
			}
			return datas;
		}
		class Grafico {
			barras: {
				corVencido: string;
				corProximosDias: string;
				corNoPrazo: string;
				espacamento: number;
				readonly largura: number;
			};
			canvas: HTMLCanvasElement;
			categorias: { quantidade: number; distancia: number };
			context: CanvasRenderingContext2D;
			corFundo: string;
			dados: Map<number, number>;
			dimensoes: { altura: number; espacamento: number; largura: number; margem: number };
			escala: {
				maximo: number;
				unidadePrimaria: number;
				unidadeSecundaria: number;
				largura: number;
				linhaPrimaria: { espessura: number; cor: string };
				linhaSecundaria: { espessura: number; cor: string };
			};
			linha: { cor: string; espessura: number };
			texto: { altura: number; cor: string; corSecundaria: string };

			get area(): {
				corFundo: string;
				linha: { espessura: number; cor: string };
				margens: { t: number; r: number; b: number; l: number };
				dimensoes: { largura: number; altura: number };
			} {
				const area = {
					corFundo: 'rgba(102, 102, 102, 0.25)',
					linha: { espessura: 1, cor: '#666' },
				};
				const margemExterna =
					this.dimensoes.margem +
					this.linha.espessura / 2 +
					this.dimensoes.espacamento +
					area.linha.espessura / 2;
				const margens = {
					t: margemExterna + this.texto.altura / 2,
					r: margemExterna,
					b: margemExterna + this.texto.altura + this.dimensoes.espacamento,
					l: margemExterna + this.escala.largura + 2 * this.dimensoes.espacamento,
				};
				const dimensoes = {
					largura: this.dimensoes.largura - margens.l - margens.r,
					altura: this.dimensoes.altura - margens.t - margens.b,
				};
				return { ...area, margens, dimensoes };
			}
			get dadosTrintaDias() {
				const UM_DIA = 864e5;
				const agora = new Date(),
					hoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate()).getTime(),
					maximo = hoje + 30 * UM_DIA;
				return new Map(Array.from(this.dados.entries()).filter(([dia]) => dia <= maximo));
			}
			constructor() {
				this.dimensoes = {
					get largura() {
						const areaTela = document.querySelector('#divInfraAreaTelaD');
						if (!areaTela) throw new Error('Elemento "#divInfraAreaTelaD" não encontrado.');
						return Math.min(1024, areaTela.clientWidth);
					},
					altura: 400,
					margem: 3,
					espacamento: 5,
				};
				this.linha = { espessura: 1, cor: 'rgba(255, 255, 255, 0.9)' };
				this.corFundo = 'rgb(51, 51, 51)';
				this.texto = {
					altura: 10,
					cor: 'hsla(180, 100%, 87%, 0.87)',
					corSecundaria: 'hsla(180, 100%, 87%, 0.5)',
				};
				this.escala = {
					maximo: 20,
					unidadePrimaria: 10,
					unidadeSecundaria: 5,
					largura: 2 * this.texto.altura,
					linhaPrimaria: { espessura: 2, cor: '#888' },
					linhaSecundaria: { espessura: 0.5, cor: '#666' },
				};
				let self: Grafico = this;
				this.categorias = {
					quantidade: 1,
					get distancia() {
						return self.area.dimensoes.largura / self.categorias.quantidade;
					},
				};
				this.barras = {
					corVencido: 'hsla(15, 80%, 75%, 1)',
					corProximosDias: 'hsla(60, 100%, 75%, 1)',
					corNoPrazo: 'hsla(120, 75%, 80%, 1)',
					espacamento: 0.2,
					/* valor entre 0 e 1, proporcional à largura disponível */ get largura() {
						return self.categorias.distancia * (1 - self.barras.espacamento);
					},
				};
				const canvas = document.createElement('canvas');
				canvas.width = this.dimensoes.largura;
				canvas.height = this.dimensoes.altura;
				this.canvas = canvas;
				const context = this.canvas.getContext('2d');
				if (!context) throw new Error('Não foi possível obter o contexto 2D do elemento "canvas".');
				this.context = context;
				this.dados = new Map();
			}
			inserirDados(dados: Map<number, number>) {
				this.dados = dados;
			}
			render() {
				this.calcularEscala();
				this.calcularLarguraEscala();
				this.calcularCategorias();
				this.desenharFundo();
				this.desenharArea();
				this.desenharEscala();
				this.desenharCategorias();
				this.desenharBarras();
				return this.canvas;
			}
			desenharFundo() {
				const context = this.context;
				context.fillStyle = this.corFundo;
				context.fillRect(0, 0, this.dimensoes.largura, this.dimensoes.altura);
				context.beginPath();
				let x = this.dimensoes.margem;
				let y = x;
				let w = this.dimensoes.largura - 2 * this.dimensoes.margem;
				let h = this.dimensoes.altura - 2 * this.dimensoes.margem;
				context.rect(x, y, w, h);
				context.lineWidth = this.linha.espessura;
				context.strokeStyle = this.linha.cor;
				context.stroke();
			}
			desenharArea() {
				const context = this.context;
				context.beginPath();
				context.rect(
					this.area.margens.l,
					this.area.margens.t,
					this.area.dimensoes.largura,
					this.area.dimensoes.altura,
				);
				context.fillStyle = this.area.corFundo;
				context.fill();
				context.lineWidth = this.area.linha.espessura;
				context.strokeStyle = this.area.linha.cor;
				context.stroke();
			}
			desenharEscala() {
				const context = this.context;
				const xTexto =
					this.dimensoes.margem +
					this.linha.espessura / 2 +
					this.dimensoes.espacamento +
					this.escala.largura / 2;
				const xLinha = xTexto + this.escala.largura / 2 + this.dimensoes.espacamento;
				const wLinha = this.area.dimensoes.largura + this.dimensoes.espacamento;
				for (let i = 0; i <= this.escala.maximo; i += this.escala.unidadeSecundaria) {
					if (i % this.escala.unidadePrimaria === 0) {
						context.fillStyle = this.texto.cor;
						context.strokeStyle = this.escala.linhaPrimaria.cor;
						context.lineWidth = this.escala.linhaPrimaria.espessura;
					} else {
						context.fillStyle = this.texto.corSecundaria;
						context.strokeStyle = this.escala.linhaSecundaria.cor;
						context.lineWidth = this.escala.linhaSecundaria.espessura;
					}
					let proporcao = i / this.escala.maximo;
					let y =
						this.dimensoes.altura - this.area.margens.b - proporcao * this.area.dimensoes.altura;
					context.fillText(i.toString(), xTexto, y);
					context.beginPath();
					context.moveTo(xLinha, y);
					context.lineTo(xLinha + wLinha, y);
					context.stroke();
				}
			}
			desenharCategorias() {
				const context = this.context;
				const larguraPossivelTexto = context.measureText('99').width;
				const step = Math.ceil(
					(larguraPossivelTexto + this.dimensoes.espacamento) / this.categorias.distancia,
				);
				const agora = new Date(),
					hoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
				context.fillStyle = this.texto.cor;
				const y =
					this.dimensoes.altura -
					(this.dimensoes.margem + this.linha.espessura / 2 + this.area.margens.b) / 2;
				for (let i = 0; i < this.categorias.quantidade; i += step) {
					let dia = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + i);
					let x = this.area.margens.l + (i + 0.5) * this.categorias.distancia;
					context.fillText(dia.getDate().toString(), x, y);
				}
			}
			desenharBarras() {
				const context = this.context;
				const agora = new Date(),
					hoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
				const larguraBarra = this.categorias.distancia * (1 - this.barras.espacamento);
				for (let i = 0; i < this.categorias.quantidade; i++) {
					if (i === 0) {
						context.fillStyle = this.barras.corVencido;
					} else if (i <= 3) {
						context.fillStyle = this.barras.corProximosDias;
					} else {
						context.fillStyle = this.barras.corNoPrazo;
					}
					let dia = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + i);
					if (this.dados.has(dia.getTime())) {
						let x = this.area.margens.l + (i + 0.5) * this.categorias.distancia - larguraBarra / 2;
						let valor = this.dados.get(dia.getTime())!;
						let altura = (valor / this.escala.maximo) * this.area.dimensoes.altura;
						let y = this.dimensoes.altura - this.area.margens.b - altura;
						context.fillRect(x, y, larguraBarra, altura);
					}
				}
			}
			calcularEscala() {
				const quantidades = Array.from(this.dadosTrintaDias.values());
				const maximo = Math.max.apply(null, quantidades);
				this.calcularDadosEscala(maximo);
				const distanciaMinima = 2 * this.dimensoes.espacamento + 2 * this.texto.altura;
				let secundariaOk = this.assegurarDistanciaMinima('unidadeSecundaria', distanciaMinima);
				if (secundariaOk) return;
				let primariaOk = this.assegurarDistanciaMinima('unidadePrimaria', distanciaMinima);
				if (primariaOk) {
					this.escala.unidadeSecundaria = this.escala.unidadePrimaria;
				} else {
					throw new Error('Não sei o que fazer');
				}
			}
			calcularLarguraEscala() {
				const context = this.context;
				context.textBaseline = 'middle';
				context.textAlign = 'center';
				context.font = `${this.texto.altura}px Arial`;
				const largura = context.measureText(this.escala.maximo.toString()).width;
				this.escala.largura = largura;
			}
			calcularCategorias() {
				const UM_DIA = 864e5;
				const dias = Array.from(this.dadosTrintaDias.keys());
				const agora = new Date(),
					hoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate()).getTime(),
					maximo = Math.max.apply(null, dias);
				this.categorias.quantidade = (maximo - hoje) / UM_DIA + 1;
			}
			calcularDadosEscala(maximo: number) {
				if (maximo <= 10) {
					this.escala.unidadePrimaria = 10;
				} else {
					const ordem = Math.floor(Math.log(maximo) / Math.log(10));
					this.escala.unidadePrimaria = Math.pow(10, ordem);
				}
				this.escala.unidadeSecundaria = this.escala.unidadePrimaria / 10;
				this.escala.maximo =
					Math.ceil(maximo / this.escala.unidadeSecundaria) * this.escala.unidadeSecundaria;
			}
			assegurarDistanciaMinima(
				unidade: 'unidadePrimaria' | 'unidadeSecundaria',
				distancia: number,
			) {
				let tamanhoIdealEncontrado = false;
				[1, 2, 2.5, 5, 10].forEach(mult => {
					if (tamanhoIdealEncontrado) return;
					let novoIntervalo = this.escala[unidade] * mult;
					if (novoIntervalo % 1 !== 0) return;
					let novoMaximo = Math.ceil(this.escala.maximo / novoIntervalo) * novoIntervalo;
					if ((novoMaximo / novoIntervalo) * distancia <= this.area.dimensoes.altura) {
						tamanhoIdealEncontrado = true;
						if (mult !== 1) {
							this.escala[unidade] *= mult;
							this.escala.maximo = novoMaximo;
						}
					}
				});
				return tamanhoIdealEncontrado;
			}
		}
		excluirCanvasAntigo();
		const processos = extrairProcessos(localizadores);
		const tabelaDatas = extrairDatas(processos);
		const grafico = new Grafico();
		grafico.inserirDados(tabelaDatas);
		const areaTela = document.getElementById('divInfraAreaTelaD');
		if (!areaTela) throw new Error('Não foi possível encontrar o elemento "#divInfraAreaTelaD".');
		areaTela.appendChild(grafico.render());
	}
	static getInstance() {
		if (!GUI._instance) {
			GUI._instance = new GUI();
		}
		return GUI._instance;
	}
}
const obterFormularioRelatorioGeral = memoize(async () => {
	const links = document.querySelectorAll<HTMLAnchorElement>('#main-menu a[href]');
	const url = Array.from(links)
		.filter(link => new URL(link.href).searchParams.get('acao') === 'relatorio_geral_listar')
		.map(link => link.href)[0];
	if (!url) throw new Error('Não foi possível obter o link para o relatório geral.');
	const doc = await new Promise<Document>((resolve, reject) => {
		const xml = new XMLHttpRequest();
		xml.open('GET', url);
		xml.responseType = 'document';
		xml.onerror = reject;
		xml.onload = () => resolve(xml.response as Document);
		xml.send(null);
	});
	console.log('Página relatório geral obtida', doc);
	const consultar = doc.getElementById('btnConsultar');
	if (!(consultar instanceof HTMLButtonElement))
		throw new Error('Elemento não encontrado: "#btnConsultar".');
	const form = consultar.form;
	if (!form) throw new Error('Formulário do relatório geral não encontrado.');
	return form;
});
async function trataHTML(localizador: Localizador, doc: HTMLDocument): Promise<Localizador> {
	const pagina = Number(doc.querySelector<HTMLInputElement>('input#hdnInfraPaginaAtual')?.value);
	if (isNaN(pagina)) throw new Error('Não foi possível obter a página.');
	const quantidadeProcessosCarregados = parseInt(
		doc.querySelector<HTMLInputElement>('input#hdnInfraNroItens')?.value ?? '',
	);
	if (isNaN(quantidadeProcessosCarregados))
		throw new Error('Não foi possível obter a quantidade de processos analisados.');
	const gui = GUI.getInstance();
	gui.avisoCarregando.acrescentar(quantidadeProcessosCarregados);
	const linhas = [
		...doc.querySelectorAll<HTMLTableRowElement>(
			'#divInfraAreaTabela > table > tbody > tr[class^="infraTr"]',
		),
	];
	linhas.forEach(linha => {
		localizador.processos.push(ProcessoFactory.fromLinha(linha));
	});
	if (pagina > 0) return localizador;
	const todas = doc.querySelector<HTMLSelectElement>('select#selInfraPaginacaoSuperior');
	if (todas) {
		console.info('Buscando próximas páginas', localizador.nomeExibicao);
		await Promise.all(
			Array.from({ length: todas.options.length - 1 }, (_, i) => i + 1).map(p =>
				localizador.obterPagina(p, doc),
			),
		);
		return localizador;
	}
	const proxima = doc.getElementById('lnkInfraProximaPaginaSuperior');
	if (proxima) {
		console.info('Buscando próxima página', localizador.nomeExibicao);
		return localizador.obterPagina(pagina + 1, doc);
	}
	return localizador;
}
interface InfoLocalizador {
	infoLink?: { link: HTMLAnchorElement; id: string };
	infoNome:
		| { tipo: 'nome'; nome: string }
		| { tipo: 'composto'; siglaNome: string }
		| { tipo: 'separado'; sigla: string; nome: string; siglaNome: string };
	lembrete?: string;
	linha: HTMLTableRowElement;
	processos: Processo[];
	quantidadeProcessosNaoFiltrados: number;
}
class Localizador implements InfoLocalizador {
	infoLink?: { link: HTMLAnchorElement; id: string };
	infoNome:
		| { tipo: 'nome'; nome: string }
		| { tipo: 'composto'; siglaNome: string }
		| { tipo: 'separado'; sigla: string; nome: string; siglaNome: string };
	lembrete?: string;
	linha: HTMLTableRowElement;
	processos: Processo[];
	quantidadeProcessosNaoFiltrados: number;

	get nomeExibicao() {
		return this.infoNome.tipo === 'composto' ? this.infoNome.siglaNome : this.infoNome.nome;
	}

	get quantidadeProcessos() {
		return Number(this.infoLink?.link.textContent ?? '0');
	}

	constructor({
		infoNome,
		infoLink,
		lembrete,
		linha,
		processos,
		quantidadeProcessosNaoFiltrados,
	}: InfoLocalizador) {
		this.infoNome = infoNome;
		this.infoLink = infoLink;
		this.lembrete = lembrete;
		this.linha = linha;
		this.processos = processos;
		this.quantidadeProcessosNaoFiltrados = quantidadeProcessosNaoFiltrados;
	}

	obterPagina(pagina: 0): Promise<Localizador>;
	obterPagina(pagina: number, doc: HTMLDocument): Promise<Localizador>;
	async obterPagina(pagina: number, doc?: HTMLDocument): Promise<Localizador> {
		try {
			let url: string, data: FormData;
			if (!this.infoLink)
				throw new Error(
					'Não foi possível obter o endereço da página do localizador "' + this.nomeExibicao + '".',
				);
			if (pagina === 0) {
				url = this.infoLink.link.href;
				data = new FormData();
				const camposPost = [
					'optchkcClasse',
					'optDataAutuacao',
					'optchkcUltimoEvento',
					'optNdiasSituacao',
					'optJuizo',
					'optPrioridadeAtendimento',
					'chkStatusProcesso',
				];
				camposPost.forEach(campo => data.set(campo, 'S'));
				data.set('paginacao', '100');
				data.set('hdnInfraPaginaAtual', String(pagina));
			} else {
				const select = doc!.querySelector<HTMLSelectElement>('select#selLocalizador');
				if (!select) throw new Error('Não foi possível obter o seletor de página.');
				select.value = this.infoLink.id;
				const paginaAtual = doc!.querySelector<HTMLInputElement>('input#hdnInfraPaginaAtual');
				if (!paginaAtual) throw new Error('Não foi possível localizar a página atual.');
				paginaAtual.value = String(pagina);
				let form = paginaAtual.form;
				if (!form) throw new Error('Formulário não encontrado.');
				url = form.action;
				data = new FormData(form);
			}
			const doc_1 = await new Promise<HTMLDocument>((resolve, reject) => {
				const xml = new XMLHttpRequest();
				xml.open('POST', url);
				xml.responseType = 'document';
				xml.onerror = reject;
				xml.onload = () => resolve(xml.response);
				xml.send(data);
			});
			return trataHTML(this, doc_1);
		} catch (e) {
			console.error(e);
			throw e;
		}
	}
	async obterPrazosPagina(pagina = 0): Promise<Localizador> {
		if (!this.infoLink)
			throw new Error(
				`Não foi possível obter o endereço da página do localizador "${this.nomeExibicao}".`,
			);
		const form = await obterFormularioRelatorioGeral();
		const url = form.action;
		const method = form.method;
		const data = new FormData();
		data.set('paginacao', '100');
		data.set('selPrazo', 'A');
		data.set('selLocalizadorPrincipal', this.infoLink.id);
		data.set('selLocalizadorPrincipalSelecionados', this.infoLink.id);
		data.set('optchkcClasse', 'S');
		data.set('hdnInfraPaginaAtual', pagina.toString());
		data.set('selRpvPrecatorio', 'null');
		const doc = await new Promise<HTMLDocument>((resolve, reject) => {
			const xml = new XMLHttpRequest();
			xml.open(method, url);
			xml.responseType = 'document';
			xml.onerror = reject;
			xml.onload = () => resolve(xml.response);
			xml.send(data);
		});
		const tabela = doc.getElementById('tabelaLocalizadores');
		const quantidadeProcessosCarregados = parseInt(
			doc.querySelector<HTMLInputElement>('input#hdnInfraNroItens')?.value ?? '',
		);
		if (isNaN(quantidadeProcessosCarregados))
			throw new Error('Não foi possível obter a quantidade de processos analisados.');
		if (tabela) {
			console.log(pagina, this.infoNome, tabela.querySelector('caption')?.textContent);
			const linhasList = tabela.querySelectorAll<HTMLTableRowElement>('tr[data-classe]');
			const linhas = Array.from(linhasList);
			const processosComPrazoAberto = new Set();
			linhas.forEach(linha => {
				const link = linha.cells[1]?.querySelector<HTMLAnchorElement>('a[href]');
				if (!link) throw new Error('Link não encontrado.');
				const numproc = new URL(link.href).searchParams.get('num_processo');
				processosComPrazoAberto.add(numproc);
			});
			this.processos = this.processos.filter(
				processo => !processosComPrazoAberto.has(processo.numproc),
			);
		} else {
			console.log(pagina, this.infoNome, quantidadeProcessosCarregados);
		}
		if (doc.getElementById('lnkProximaPaginaSuperior')) {
			const paginaAtual = parseInt(
				doc.querySelector<HTMLSelectElement>('select#selInfraPaginacaoSuperior')?.value ?? '',
			);
			if (isNaN(paginaAtual)) throw new Error('Não foi possível detectar a página atual.');
			const paginaNova = paginaAtual < 2 ? 2 : paginaAtual + 1;
			return this.obterPrazosPagina(paginaNova);
		}
		const gui = GUI.getInstance();
		const qtd = parseInt(this.infoLink.link.textContent ?? '');
		if (isNaN(qtd)) throw new Error('Erro ao obter a quantidade de processos.');
		gui.avisoCarregando.acrescentar(qtd);
		return this;
	}
	async excluirPrazosAbertos(): Promise<Localizador> {
		const link = this.infoLink?.link;
		if (!link?.href) {
			return Promise.resolve(this);
		}
		await this.obterPrazosPagina(0);
		link.textContent = String(this.processos.length);
		return this;
	}
	async obterProcessos() {
		this.processos = [];
		const infoLink = this.infoLink;
		const link = infoLink?.link;
		if (!link?.href) {
			return Promise.resolve(this);
		}
		if (!infoLink) throw new Error('Localizador não possui identificador');
		await this.obterPagina(0);
		this.quantidadeProcessosNaoFiltrados = this.processos.length;
		link.textContent = String(this.processos.length);
		if (this.processos.length > 0) {
			const localizadorProcesso = this.processos[0]!.localizadores.filter(
				localizador => localizador.id === infoLink.id,
			)[0]!;
			switch (this.infoNome.tipo) {
				case 'composto': {
					const sigla = localizadorProcesso.sigla;
					const siglaComSeparador = `${sigla} - `;
					const nome = this.infoNome.siglaNome.substr(siglaComSeparador.length);
					this.infoNome = { tipo: 'separado', sigla, nome, siglaNome: [sigla, nome].join(' - ') };
					break;
				}

				case 'nome': {
					const sigla = localizadorProcesso.sigla;
					const nome = this.infoNome.nome;
					this.infoNome = { tipo: 'separado', sigla, nome, siglaNome: [sigla, nome].join(' - ') };
					break;
				}

				case 'separado':
					break;
			}
			this.lembrete = localizadorProcesso.lembrete;
		}
		return this;
	}
}
class LocalizadorFactory {
	static fromLinha(linha: HTMLTableRowElement): Localizador {
		const separador = ' - ';
		const siglaNome = linha.cells[0]?.textContent?.trim() || '';
		let partesSiglaNome = siglaNome.split(separador);
		if (partesSiglaNome.length < 2)
			throw new Error(`Não foi possível analisar o nome do localizador: "${siglaNome}".`);
		let sigla: string | undefined;
		let nome: string | undefined;
		partesSiglaNome.forEach((_, i) => {
			const qtdPartesSigla = i + 1;
			const s = partesSiglaNome.slice(0, qtdPartesSigla).join(separador);
			const n = partesSiglaNome.slice(qtdPartesSigla).join(separador);
			if (isContained(s, n)) {
				sigla = s;
				nome = n;
			}
		});
		const link = linha.querySelector('a');
		if (!link) throw new Error(`Link para a lista de processos não encontrada: "${siglaNome}".`);
		const match = (link.textContent?.trim() || '').match(/^\d+$/);
		if (!match) throw new Error(`Quantidade de processos não encontrada: "${siglaNome}".`);
		const textoQtdProcessos = match[0]!;
		const quantidadeProcessosNaoFiltrados = parseInt(textoQtdProcessos);
		let id: string | undefined;
		if (link.href) {
			const camposGet = new URL(link.href).searchParams;
			id = camposGet.get('selLocalizador') ?? undefined;
		}
		return new Localizador({
			infoLink: id ? { id, link } : undefined,
			infoNome:
				sigla && nome
					? { tipo: 'separado', sigla, nome, siglaNome }
					: { tipo: 'composto', siglaNome },
			linha,
			processos: [],
			quantidadeProcessosNaoFiltrados,
		});
	}
	static fromLinhaPainel(linha: HTMLTableRowElement) {
		const nome = linha.cells[0]?.textContent?.match(/^Processos com Localizador\s+"(.*)"$/)?.[1];
		if (!nome) throw new Error('Nome do localizador não encontrado.');
		const link = linha.querySelector<HTMLElement>('a,u');
		if (!link) throw new Error('Link não encontrado.');
		const quantidadeProcessosNaoFiltrados = parseInt(link.textContent ?? '');

		let id: string | undefined;
		if (link instanceof HTMLAnchorElement) {
			const camposGet = new URL(link.href).searchParams;
			id = camposGet.get('selLocalizador') ?? undefined;
		}
		return new Localizador({
			infoLink: id ? { id, link: link as HTMLAnchorElement } : undefined,
			infoNome: { tipo: 'nome', nome },
			linha,
			processos: [],
			quantidadeProcessosNaoFiltrados,
		});
	}
}

class Localizadores extends Array<Localizador> {
	constructor(public tabela: HTMLTableElement) {
		super();
	}

	get quantidadeProcessos() {
		return this.reduce((soma, localizador) => soma + localizador.quantidadeProcessos, 0);
	}
	get quantidadeProcessosNaoFiltrados() {
		return this.reduce<number>(
			(soma, localizador) => soma + localizador.quantidadeProcessosNaoFiltrados,
			0,
		);
	}

	async obterProcessos() {
		const cookiesAntigos = parseCookies(document.cookie);
		const promises = this.map(loc => loc.obterProcessos());
		await Promise.all(promises);
		const cookiesNovos = parseCookies(document.cookie);
		const expira = [new Date()]
			.map(d => {
				d.setFullYear(d.getFullYear() + 1);
				return d;
			})
			.map(d => d.toUTCString())[0]!;
		for (let key in cookiesNovos) {
			const valorAntigo = cookiesAntigos[key];
			const valorNovo = cookiesNovos[key];
			if (typeof valorAntigo !== 'undefined' && valorNovo !== valorAntigo) {
				document.cookie = `${escape(key)}=${escape(valorAntigo)}; expires=${expira}`;
			}
		}
	}
}
class LocalizadoresFactory {
	static fromTabela(tabela: HTMLTableElement) {
		const localizadores = new Localizadores(tabela);
		const linhas = [...tabela.querySelectorAll<HTMLTableRowElement>('tr[class^="infraTr"]')];
		linhas.forEach(linha => {
			localizadores.push(LocalizadorFactory.fromLinha(linha));
		});
		return localizadores;
	}
	static fromTabelaPainel(tabela: HTMLTableElement) {
		const localizadores = new Localizadores(tabela);
		const linhas = [...tabela.querySelectorAll<HTMLTableRowElement>('tr[class^="infraTr"]')];
		linhas.forEach(linha => {
			localizadores.push(LocalizadorFactory.fromLinhaPainel(linha));
		});
		return localizadores;
	}
}
interface LocalizadorProcesso {
	id: string;
	lembrete?: string;
	principal: boolean;
	sigla: string;
}
class LocalizadorProcessoFactory {
	static fromInput(input: HTMLInputElement): LocalizadorProcesso {
		const id = input.value;
		const elementoNome = input.nextSibling;
		if (!elementoNome) throw new Error('Não foi possível obter o nome do localizador.');
		const principal = elementoNome.nodeName.toLowerCase() === 'u';
		const sigla = elementoNome.textContent?.trim() ?? '';
		if (!sigla) throw new Error('Localizador não possui sigla.');
		const linkLembrete = (elementoNome as HTMLElement | Text).nextElementSibling;
		let lembrete: string | undefined;
		if (linkLembrete?.attributes.hasOwnProperty('onmouseover')) {
			const onmouseover = linkLembrete.attributes.getNamedItem('onmouseover')?.value ?? '';
			lembrete =
				onmouseover.match(
					/^return infraTooltipMostrar\('Obs: (.*) \/ ([^(]+)\(([^)]+)\)','',400\);$/,
				)?.[1] ?? undefined;
		}
		return { id, lembrete, principal, sigla };
	}
}
interface LocalizadoresProcesso extends Array<LocalizadorProcesso> {
	principal: LocalizadorProcesso;
}
class LocalizadoresProcessoFactory {
	static fromCelula(celula: HTMLTableCellElement): LocalizadoresProcesso {
		const localizadoresProcesso = [...celula.getElementsByTagName('input')].map(
			LocalizadorProcessoFactory.fromInput,
		);
		const principais = localizadoresProcesso.filter(l => l.principal);
		if (principais.length !== 1)
			throw new Error('Não foi possível definir o localizador principal.');
		return Object.assign(localizadoresProcesso, { principal: principais[0]! });
	}
}
const MILISSEGUNDOS_EM_UM_DIA = 864e5;
const COMPETENCIA_JUIZADO_MIN = 9,
	COMPETENCIA_JUIZADO_MAX = 20,
	COMPETENCIA_CRIMINAL_MIN = 21,
	COMPETENCIA_CRIMINAL_MAX = 30,
	COMPETENCIA_EF_MIN = 41,
	COMPETENCIA_EF_MAX = 43,
	CLASSE_EF = 99,
	CLASSE_CARTA_PRECATORIA = 60;

const DOMINGO = 0,
	SEGUNDA = 1,
	TERCA = 2,
	QUARTA = 3,
	QUINTA = 4,
	SEXTA = 5,
	SABADO = 6;

function adiantarParaSabado(data: Date) {
	let ajuste = 0;
	switch (data.getDay()) {
		case DOMINGO:
			ajuste = -1;
			break;

		case SEGUNDA:
			ajuste = -2;
			break;
	}
	return new Date(data.getFullYear(), data.getMonth(), data.getDate() + ajuste);
}

function prorrogarParaSegunda(data: Date) {
	let ajuste = 0;
	switch (data.getDay()) {
		case SABADO:
			ajuste = 2;
			break;

		case DOMINGO:
			ajuste = 1;
			break;
	}
	return new Date(data.getFullYear(), data.getMonth(), data.getDate() + ajuste);
}

const JANEIRO = 0,
	MAIO = 4,
	DEZEMBRO = 11;
const calcularRecesso = memoize((ano: number) => {
	const inicio = adiantarParaSabado(new Date(ano, DEZEMBRO, 20));
	const retorno = prorrogarParaSegunda(new Date(ano + 1, JANEIRO, 7));
	return { inicio, retorno };
});

function calcularProximo(
	ajusteAno: number,
	fn: (ano: number) => Record<'inicio' | 'retorno', Date>,
) {
	return (data: Date) => {
		let ano = data.getFullYear() + ajusteAno;
		let datas: Record<'inicio' | 'retorno', Date>;
		do datas = fn(ano++);
		while (data.getTime() > datas.retorno.getTime());
		return datas;
	};
}

const calcularRecessoData = calcularProximo(-1, calcularRecesso);

const calcularInspecao = memoize((ano: number) => {
	// Menor data possível para a terceira segunda-feira do mês
	const quinzeMaio = new Date(ano, MAIO, 15);

	const diasAteSegundaFeira = (SEGUNDA - quinzeMaio.getDay() + 7) % 7;
	const inicio = new Date(ano, MAIO, 15 + diasAteSegundaFeira);
	const retorno = new Date(ano, MAIO, inicio.getDate() + 7);
	return { inicio, retorno };
});

const calcularInspecaoData = calcularProximo(0, calcularInspecao);

function calcularAtraso(a: Date, b: Date) {
	let [ascendente, menor, maior] = a <= b ? [true, a, b] : [false, b, a];
	let recesso = calcularRecessoData(menor);
	let inspecao = calcularInspecaoData(menor);
	let proximaSuspensao: { tipo: 'recesso' | 'inspecao'; inicio: Date; retorno: Date } =
		recesso.inicio < inspecao.inicio
			? { tipo: 'recesso', ...recesso }
			: { tipo: 'inspecao', ...inspecao };

	function ajustarMenorESuspensoes() {
		menor = proximaSuspensao.retorno;
		if (proximaSuspensao.tipo === 'inspecao') {
			inspecao = calcularInspecao(inspecao.retorno.getFullYear() + 1);
			proximaSuspensao = { tipo: 'recesso', ...recesso };
		} else {
			recesso = calcularRecesso(recesso.retorno.getFullYear());
			proximaSuspensao = { tipo: 'inspecao', ...inspecao };
		}
	}

	if (menor >= proximaSuspensao.inicio) ajustarMenorESuspensoes();

	let absoluto = 0;
	while (true) {
		if (maior > proximaSuspensao.inicio) {
			absoluto += proximaSuspensao.inicio.getTime() - menor.getTime();
			if (maior <= proximaSuspensao.retorno) break;
			ajustarMenorESuspensoes();
			continue;
		} else {
			absoluto += maior.getTime() - menor.getTime();
			break;
		}
	}
	return ascendente ? absoluto : -absoluto;
}

interface InfoProcesso {
	classe: string;
	dadosComplementares: Set<string>;
	dataAutuacao: Date;
	dataInclusaoLocalizador: Date;
	dataSituacao: Date;
	dataUltimoEvento: Date;
	juizo: string;
	lembretes: string[];
	linha: HTMLTableRowElement;
	link: HTMLAnchorElement;
	localizadores: LocalizadoresProcesso;
	numClasse: string;
	numCompetencia: number;
	numproc: string;
	numprocFormatado: string;
	sigilo: number;
	situacao: string;
}

interface InfoMeta {
	[idLocalizador: string]: {
		[situacao: string]: {
			campoDataConsiderada: 'dataSituacao' | 'dataUltimoEvento' | 'dataInclusaoLocalizador';
			dias: {
				[competencia in typeof CompetenciasCorregedoria[keyof typeof CompetenciasCorregedoria]]: number;
			};
		};
	};
}

const minhasRegras = {
	AgAssinaturaJuiz: {
		campoDataConsiderada: 'dataInclusaoLocalizador' as const,
		dias: {
			[CompetenciasCorregedoria.JUIZADO]: 3,
			[CompetenciasCorregedoria.CIVEL]: 3,
			[CompetenciasCorregedoria.CRIMINAL]: 3,
			[CompetenciasCorregedoria.EXECUCAO_FISCAL]: 3,
		},
	},
	AgPgtoPrecatorio: {
		campoDataConsiderada: 'dataSituacao' as const,
		dias: {
			[CompetenciasCorregedoria.JUIZADO]: 730,
			[CompetenciasCorregedoria.CIVEL]: 730,
			[CompetenciasCorregedoria.CRIMINAL]: 730,
			[CompetenciasCorregedoria.EXECUCAO_FISCAL]: 730,
		},
	},
	AgPgtoRPV: {
		campoDataConsiderada: 'dataSituacao' as const,
		dias: {
			[CompetenciasCorregedoria.JUIZADO]: 60,
			[CompetenciasCorregedoria.CIVEL]: 60,
			[CompetenciasCorregedoria.CRIMINAL]: 60,
			[CompetenciasCorregedoria.EXECUCAO_FISCAL]: 60,
		},
	},
	Analisar: {
		campoDataConsiderada: 'dataUltimoEvento' as const,
		dias: {
			[CompetenciasCorregedoria.JUIZADO]: 15,
			[CompetenciasCorregedoria.CIVEL]: 20,
			[CompetenciasCorregedoria.CRIMINAL]: 20,
			[CompetenciasCorregedoria.EXECUCAO_FISCAL]: 60,
		},
	},
	AnalisarPrioridade: {
		campoDataConsiderada: 'dataUltimoEvento' as const,
		dias: {
			[CompetenciasCorregedoria.JUIZADO]: 7,
			[CompetenciasCorregedoria.CIVEL]: 10,
			[CompetenciasCorregedoria.CRIMINAL]: 10,
			[CompetenciasCorregedoria.EXECUCAO_FISCAL]: 30,
		},
	},
	Cumprir: {
		campoDataConsiderada: 'dataUltimoEvento' as const,
		dias: {
			[CompetenciasCorregedoria.JUIZADO]: 10,
			[CompetenciasCorregedoria.CIVEL]: 15,
			[CompetenciasCorregedoria.CRIMINAL]: 15,
			[CompetenciasCorregedoria.EXECUCAO_FISCAL]: 25,
		},
	},
	CumprirPrioridade: {
		campoDataConsiderada: 'dataUltimoEvento' as const,
		dias: {
			[CompetenciasCorregedoria.JUIZADO]: 5,
			[CompetenciasCorregedoria.CIVEL]: 7,
			[CompetenciasCorregedoria.CRIMINAL]: 7,
			[CompetenciasCorregedoria.EXECUCAO_FISCAL]: 12,
		},
	},
	Despachar: {
		campoDataConsiderada: 'dataSituacao' as const,
		dias: {
			[CompetenciasCorregedoria.JUIZADO]: 15,
			[CompetenciasCorregedoria.CIVEL]: 20,
			[CompetenciasCorregedoria.CRIMINAL]: 20,
			[CompetenciasCorregedoria.EXECUCAO_FISCAL]: 60,
		},
	},
	DespacharPrioridade: {
		campoDataConsiderada: 'dataSituacao' as const,
		dias: {
			[CompetenciasCorregedoria.JUIZADO]: 7,
			[CompetenciasCorregedoria.CIVEL]: 10,
			[CompetenciasCorregedoria.CRIMINAL]: 10,
			[CompetenciasCorregedoria.EXECUCAO_FISCAL]: 30,
		},
	},
	Prazo05: {
		campoDataConsiderada: 'dataUltimoEvento' as const,
		dias: {
			[CompetenciasCorregedoria.JUIZADO]: 17,
			[CompetenciasCorregedoria.CIVEL]: 17,
			[CompetenciasCorregedoria.CRIMINAL]: 17,
			[CompetenciasCorregedoria.EXECUCAO_FISCAL]: 17,
		},
	},
	Prazo10: {
		campoDataConsiderada: 'dataUltimoEvento' as const,
		dias: {
			[CompetenciasCorregedoria.JUIZADO]: 24,
			[CompetenciasCorregedoria.CIVEL]: 24,
			[CompetenciasCorregedoria.CRIMINAL]: 24,
			[CompetenciasCorregedoria.EXECUCAO_FISCAL]: 24,
		},
	},
	Prazo30: {
		campoDataConsiderada: 'dataUltimoEvento' as const,
		dias: {
			[CompetenciasCorregedoria.JUIZADO]: 52,
			[CompetenciasCorregedoria.CIVEL]: 52,
			[CompetenciasCorregedoria.CRIMINAL]: 52,
			[CompetenciasCorregedoria.EXECUCAO_FISCAL]: 52,
		},
	},
	ProcessoParado: {
		campoDataConsiderada: 'dataUltimoEvento' as const,
		dias: {
			[CompetenciasCorregedoria.JUIZADO]: 30,
			[CompetenciasCorregedoria.CIVEL]: 60,
			[CompetenciasCorregedoria.CRIMINAL]: 30,
			[CompetenciasCorregedoria.EXECUCAO_FISCAL]: 120,
		},
	},
	Sentenciar: {
		campoDataConsiderada: 'dataSituacao' as const,
		dias: {
			[CompetenciasCorregedoria.JUIZADO]: 45,
			[CompetenciasCorregedoria.CIVEL]: 60,
			[CompetenciasCorregedoria.CRIMINAL]: 60,
			[CompetenciasCorregedoria.EXECUCAO_FISCAL]: 60,
		},
	},
	SentenciarPrioridade: {
		campoDataConsiderada: 'dataSituacao' as const,
		dias: {
			[CompetenciasCorregedoria.JUIZADO]: 22,
			[CompetenciasCorregedoria.CIVEL]: 30,
			[CompetenciasCorregedoria.CRIMINAL]: 30,
			[CompetenciasCorregedoria.EXECUCAO_FISCAL]: 30,
		},
	},
	SituacaoErrada: {
		campoDataConsiderada: 'dataSituacao' as const,
		dias: {
			[CompetenciasCorregedoria.JUIZADO]: 1,
			[CompetenciasCorregedoria.CIVEL]: 1,
			[CompetenciasCorregedoria.CRIMINAL]: 1,
			[CompetenciasCorregedoria.EXECUCAO_FISCAL]: 1,
		},
	},
	Suspensao: {
		campoDataConsiderada: 'dataUltimoEvento' as const,
		dias: {
			[CompetenciasCorregedoria.JUIZADO]: 180,
			[CompetenciasCorregedoria.CIVEL]: 180,
			[CompetenciasCorregedoria.CRIMINAL]: 180,
			[CompetenciasCorregedoria.EXECUCAO_FISCAL]: 180,
		},
	},
	UmDiaNoLocalizador: {
		campoDataConsiderada: 'dataInclusaoLocalizador' as const,
		dias: {
			[CompetenciasCorregedoria.JUIZADO]: 1,
			[CompetenciasCorregedoria.CIVEL]: 1,
			[CompetenciasCorregedoria.CRIMINAL]: 1,
			[CompetenciasCorregedoria.EXECUCAO_FISCAL]: 1,
		},
	},
};
const infoMeta: InfoMeta = {
	'721307546622562490210000000013' /* Devolução Turma */: {
		MOVIMENTO: minhasRegras.Analisar,
	},
	'721612283838905044100680025624' /* 3DIR Ag pedido TED */: {
		MOVIMENTO: minhasRegras.Prazo05,
	},
	'721308334450542230220000000003' /* 3DIR Ag pagar BB/CEF */: {
		MOVIMENTO: minhasRegras.Prazo10,
	},
	'721434640434691780220000000004' /* 3DIR Ag saque +1 ano */: {
		MOVIMENTO: minhasRegras.Prazo30,
	},
	'721362003373237310210000000001' /* 3DIR Ag Juiz assinar */: {
		'MOVIMENTO-AGUARDA DESPACHO': minhasRegras.AgAssinaturaJuiz,
		'MOVIMENTO-AGUARDA SENTENÇA': minhasRegras.AgAssinaturaJuiz,
	},
	'721448979119064340240000000001' /* 3DIR Ag pagamento precatório */: {
		'SUSP/SOBR-Aguarda Pagamento': minhasRegras.AgPgtoPrecatorio,
		'MOVIMENTO': minhasRegras.ProcessoParado,
	},
	'721307551490768040230000000002' /* 3DIR Ag pagamento RPV */: {
		'SUSP/SOBR-Aguarda Pagamento': minhasRegras.AgPgtoRPV,
		'MOVIMENTO': minhasRegras.ProcessoParado,
	},
	'721423260735024680230000000001' /* 3DIR Ag prazo */: {
		'MOVIMENTO': minhasRegras.CumprirPrioridade,
		'SUSP/SOBR-P.Decisão Judicial': minhasRegras.Suspensao,
	},
	'721596120821598545737898280283' /* 3DIR Agendar Zoom */: {
		MOVIMENTO: minhasRegras.Cumprir,
	},
	'721307546545352560220000000002' /* 3DIR Baixa */: { MOVIMENTO: minhasRegras.Cumprir },
	'721377617310101250210000000001' /* 3DIR Baixa Demo */: { MOVIMENTO: minhasRegras.Cumprir },
	'721473784358242940217525843407' /* 3DIR Baixa Turma */: { MOVIMENTO: minhasRegras.Cumprir },
	'721307546545352560220000000004' /* 3DIR Cumprimento */: {
		BAIXADO: minhasRegras.CumprirPrioridade,
	},
	'721307546545352560220000000001' /* 3DIR Direção */: {
		'MOVIMENTO': minhasRegras.UmDiaNoLocalizador,
		'MOVIMENTO-AGUARDA DESPACHO': minhasRegras.Despachar,
		'MOVIMENTO-AGUARDA SENTENÇA': minhasRegras.Sentenciar,
	},
	'721593790295233093891502637047' /* 3DIR Entrega */: { MOVIMENTO: minhasRegras.ProcessoParado },
	'721484231615301020214955770825' /* 3DIR Extrato CEF */: { MOVIMENTO: minhasRegras.Cumprir },
	'721394121597912040240000000001' /* 3DIR RPV Prontas */: {
		MOVIMENTO: {
			campoDataConsiderada: 'dataUltimoEvento' as const,
			dias: {
				[CompetenciasCorregedoria.JUIZADO]: 30,
				[CompetenciasCorregedoria.CIVEL]: 30,
				[CompetenciasCorregedoria.CRIMINAL]: 30,
				[CompetenciasCorregedoria.EXECUCAO_FISCAL]: 30,
			},
		},
	},
	'721523553899874850256893780310' /* 3DIR Temporário */: {
		'MOVIMENTO': minhasRegras.UmDiaNoLocalizador,
		'MOVIMENTO-AGUARDA DESPACHO': minhasRegras.Despachar,
		'MOVIMENTO-AGUARDA SENTENÇA': minhasRegras.Sentenciar,
	},
	'721552920360416260216834737727' /* 6PRO Analisar emenda */: {
		MOVIMENTO: minhasRegras.Analisar,
	},
	'721307551490768040230000000001' /* 9EXE Ag contrarrazões */: {
		MOVIMENTO: minhasRegras.Cumprir,
	},
	'721562943669373244747535696808' /* 9EXE Ag decisão supe */: {
		'SUSP/SOBR-Aguarda dec.Inst.Sup': minhasRegras.Suspensao,
	},
	'721583337216547742495762572419' /* 9EXE Ag Fazer INSS 1 */: {
		MOVIMENTO: minhasRegras.Prazo30,
	},
	'721607866102094019347001221238' /* 9EXE Ag prov. partes baixa */: {
		MOVIMENTO: minhasRegras.Analisar,
	},
	'721307552681884870230000000002' /* 9EXE Ag providência partes */: {
		MOVIMENTO: minhasRegras.Analisar,
	},
	'721308062479869640210000000001' /* 9EXE Ag recurso */: {
		MOVIMENTO: minhasRegras.Cumprir,
	},
	'721552920360416260216979817401' /* 9EXE Analisar recurso */: {
		MOVIMENTO: minhasRegras.Cumprir,
	},
	'721307635473840010210000000001' /* 9EXE Cálculo devolvido */: {
		MOVIMENTO: minhasRegras.Analisar,
	},
	'721507130986103060244491911387' /* 9EXE Descumprimento INSS */: {
		MOVIMENTO: minhasRegras.AnalisarPrioridade,
	},
	'721307554204880400230000000001' /* 9EXE Digitar RPV */: {
		MOVIMENTO: minhasRegras.Cumprir,
	},
	'721307558985430470230000000001' /* 9EXE Exp RPV */: {
		MOVIMENTO: minhasRegras.Prazo05,
	},
	'721507130986103060244448466387' /* 9EXE Habilitação sucessores */: {
		MOVIMENTO: minhasRegras.Analisar,
	},
	'721507130986103060244459513559' /* 9EXE Honorários de sucumbência */: {
		MOVIMENTO: minhasRegras.Analisar,
	},
	'721547820988212490231284718313' /* 9EXE Ord impugnação */: {
		MOVIMENTO: minhasRegras.Analisar,
	},
	'721544193174836710212300925863' /* 9EXE P. física */: {
		MOVIMENTO: minhasRegras.Analisar,
	},
	'721400171914790310250000000002' /* 9EXE Rec Assessoria */: {
		MOVIMENTO: minhasRegras.UmDiaNoLocalizador,
	},
	'721544107305944230242168515535' /* 9EXE Suspensos */: {
		'SUSP/SOBR-Aguarda dec.Inst.Sup': minhasRegras.Suspensao,
		'SUSP/SOBR-Aguarda Julg.Embg.': minhasRegras.Suspensao,
		'SUSP/SOBR-P.Decisão Judicial': minhasRegras.Suspensao,
		'SUSP/SOBR-Parcel.Débito.': minhasRegras.Suspensao,
	},
	'721535037528900780222902466001' /* 9EXE Triagem */: {
		MOVIMENTO: minhasRegras.AnalisarPrioridade,
	},
	'721583337216547742495846775052' /* 9EXE Verif obrigação fazer 1 */: {
		MOVIMENTO: minhasRegras.Cumprir,
	},
	'721583337216547742495856888118' /* 9EXE Verif obrigação fazer M */: {
		MOVIMENTO: minhasRegras.Cumprir,
	},
	'721483972730880570255881334762' /* C/ Luciana */: {
		'MOVIMENTO': minhasRegras.Cumprir,
		'MOVIMENTO-AGUARDA DESPACHO': minhasRegras.Despachar,
		'MOVIMENTO-AGUARDA SENTENÇA': minhasRegras.Sentenciar,
	},
	'721527261655975790236901397942' /* C/ Paulo */: {
		'MOVIMENTO': minhasRegras.Cumprir,
		'MOVIMENTO-AGUARDA DESPACHO': minhasRegras.Despachar,
		'MOVIMENTO-AGUARDA SENTENÇA': minhasRegras.Sentenciar,
	},
	'721548256047652070237271128328' /* META 2 */: {
		'MOVIMENTO': minhasRegras.CumprirPrioridade,
		'MOVIMENTO-AGUARDA DESPACHO': minhasRegras.DespacharPrioridade,
		'MOVIMENTO-AGUARDA SENTENÇA': minhasRegras.SentenciarPrioridade,
		'SUSP/SOBR-Aguarda dec.Inst.Sup': minhasRegras.Suspensao,
	},
	'771387208544881780110000003529' /* PEDIDO DE TED AUTOMÁTICO */: {
		MOVIMENTO: minhasRegras.CumprirPrioridade,
	},
	'721335971440797820230000000084' /* REQ INTIMADA */: { MOVIMENTO: minhasRegras.Cumprir },
	'721426007793151980220000000102' /* REQ PAGA LIBERADA */: {
		MOVIMENTO: {
			campoDataConsiderada: 'dataUltimoEvento' as const,
			dias: {
				[CompetenciasCorregedoria.JUIZADO]: 7,
				[CompetenciasCorregedoria.CIVEL]: 7,
				[CompetenciasCorregedoria.CRIMINAL]: 7,
				[CompetenciasCorregedoria.EXECUCAO_FISCAL]: 7,
			},
		},
	},
	'721335971440797820230000000033' /* REQ PREPARADA INTIMAÇÃO */: {
		MOVIMENTO: minhasRegras.ProcessoParado,
	},
	'721335971440797820230000000135' /* REQ PROCESSADA */: { MOVIMENTO: minhasRegras.ProcessoParado },
	'721495116809325210234371229829' /* Conta Req +1Ano com Saldo - BAIXADO */: {
		BAIXADO: {
			...minhasRegras.Analisar,
			campoDataConsiderada: 'dataInclusaoLocalizador' as const,
		},
	},
	'721274465163072970240000000027' /* TRF RECEBIDOS */: {
		MOVIMENTO: minhasRegras.Analisar,
	},
	'721273070396362990240000000266' /* TRF/TR BAIXADOS */: { '*': minhasRegras.Analisar },
	'721273070396362990240000000076' /* TRF/TR DECISÃO */: {
		'*': minhasRegras.Analisar,
	},
	'721273070396362990240000000171' /* TRF/TR JULGADOS */: {
		'*': minhasRegras.Analisar,
	},
};

class Processo implements InfoProcesso {
	classe: string;
	dadosComplementares: Set<string>;
	dataAutuacao: Date;
	dataInclusaoLocalizador: Date;
	dataSituacao: Date;
	dataUltimoEvento: Date;
	juizo: string;
	lembretes: string[];
	linha: HTMLTableRowElement;
	link: HTMLAnchorElement;
	localizadores: LocalizadoresProcesso;
	numClasse: string;
	numCompetencia: number;
	numproc: string;
	numprocFormatado: string;
	sigilo: number;
	situacao: string;
	constructor({
		classe,
		dadosComplementares,
		dataAutuacao,
		dataInclusaoLocalizador,
		dataSituacao,
		dataUltimoEvento,
		juizo,
		lembretes,
		linha,
		link,
		localizadores,
		numClasse,
		numCompetencia,
		numproc,
		numprocFormatado,
		sigilo,
		situacao,
	}: InfoProcesso) {
		this.classe = classe;
		this.dadosComplementares = dadosComplementares;
		this.dataAutuacao = dataAutuacao;
		this.dataInclusaoLocalizador = dataInclusaoLocalizador;
		this.dataSituacao = dataSituacao;
		this.dataUltimoEvento = dataUltimoEvento;
		this.juizo = juizo;
		this.lembretes = lembretes;
		this.linha = linha;
		this.link = link;
		this.localizadores = localizadores;
		this.numClasse = numClasse;
		this.numCompetencia = numCompetencia;
		this.numproc = numproc;
		this.numprocFormatado = numprocFormatado;
		this.sigilo = sigilo;
		this.situacao = situacao;
	}
	private _atraso?: number;
	get atraso() {
		if (this._atraso === undefined) {
			const hoje = new Date();
			this._atraso = calcularAtraso(this.termoPrazoCorregedoria, hoje) / MILISSEGUNDOS_EM_UM_DIA;
		}
		return this._atraso;
	}
	get atrasoPorcentagem() {
		return this.atraso / this.prazoCorregedoria;
	}
	get competenciaCorregedoria() {
		if (
			this.numCompetencia >= COMPETENCIA_JUIZADO_MIN &&
			this.numCompetencia <= COMPETENCIA_JUIZADO_MAX
		) {
			return CompetenciasCorregedoria.JUIZADO;
		} else if (
			this.numCompetencia >= COMPETENCIA_CRIMINAL_MIN &&
			this.numCompetencia <= COMPETENCIA_CRIMINAL_MAX
		) {
			return CompetenciasCorregedoria.CRIMINAL;
		} else if (
			(this.numCompetencia >= COMPETENCIA_EF_MIN || this.numCompetencia <= COMPETENCIA_EF_MAX) &&
			(Number(this.numClasse) === CLASSE_EF || Number(this.numClasse) === CLASSE_CARTA_PRECATORIA)
		) {
			return CompetenciasCorregedoria.EXECUCAO_FISCAL;
		}
		return CompetenciasCorregedoria.CIVEL;
	}
	private _campoDataConsiderada:
		| 'dataSituacao'
		| 'dataUltimoEvento'
		| 'dataInclusaoLocalizador'
		| undefined;
	get campoDataConsiderada(): 'dataSituacao' | 'dataUltimoEvento' | 'dataInclusaoLocalizador' {
		if (this._campoDataConsiderada === undefined) {
			const infos =
				this.localizadores
					.map(loc => {
						return (
							infoMeta[loc.id]?.[this.situacao]?.campoDataConsiderada ??
							infoMeta[loc.id]?.['*']?.campoDataConsiderada ??
							null
						);
					})
					.reduce((prev, curr) =>
						prev === null
							? curr === null
								? null
								: curr
							: curr === null
							? prev
							: this[curr] < this[prev]
							? curr
							: prev,
					) ?? 'dataSituacao';
			this._campoDataConsiderada = infos;
		}
		return this._campoDataConsiderada;
	}
	private _prazoCorregedoria: number | undefined;
	get prazoCorregedoria() {
		if (this._prazoCorregedoria === undefined) {
			const infos =
				this.localizadores
					.map(loc => {
						return (
							infoMeta[loc.id]?.[this.situacao]?.dias?.[this.competenciaCorregedoria] ??
							infoMeta[loc.id]?.['*']?.dias?.[this.competenciaCorregedoria] ??
							null
						);
					})
					.reduce((prev, curr) =>
						prev === null
							? curr === null
								? null
								: curr
							: curr === null
							? prev
							: Math.min(prev, curr),
					) ?? 1;
			this._prazoCorregedoria = infos;
		}
		return this._prazoCorregedoria!;
	}
	get prioridade() {
		return (
			this.dadosComplementares.has('Prioridade Atendimento') ||
			this.dadosComplementares.has('Réu Preso')
		);
	}
	private _termoPrazoCorregedoria: Date | null = null;
	get termoPrazoCorregedoria() {
		if (this._termoPrazoCorregedoria === null) {
			let data = new Date(this[this.campoDataConsiderada].getTime());

			let recesso = calcularRecessoData(data);
			let inspecao = calcularInspecaoData(data);
			let proximaSuspensao: { tipo: 'recesso' | 'inspecao'; inicio: Date; retorno: Date } =
				recesso.inicio < inspecao.inicio
					? { tipo: 'recesso', ...recesso }
					: { tipo: 'inspecao', ...inspecao };

			function ajustarSuspensoes() {
				const temp = proximaSuspensao.retorno.getTime();
				if (proximaSuspensao.tipo === 'inspecao') {
					inspecao = calcularInspecao(inspecao.retorno.getFullYear() + 1);
					proximaSuspensao = { tipo: 'recesso', ...recesso };
				} else {
					recesso = calcularRecesso(recesso.retorno.getFullYear());
					proximaSuspensao = { tipo: 'inspecao', ...inspecao };
				}
				return new Date(temp);
			}

			if (data >= proximaSuspensao.inicio) data = ajustarSuspensoes();

			let prazo = this.prazoCorregedoria * MILISSEGUNDOS_EM_UM_DIA;
			while (true) {
				const tempoAteProximaSuspensao = proximaSuspensao.inicio.getTime() - data.getTime();
				if (tempoAteProximaSuspensao < prazo) {
					prazo -= tempoAteProximaSuspensao;
					data = ajustarSuspensoes();
				} else {
					data.setTime(data.getTime() + prazo);
					break;
				}
			}
			this._termoPrazoCorregedoria = data;
		}
		return this._termoPrazoCorregedoria;
	}
}
class ProcessoFactory {
	static fromLinha(linha: HTMLTableRowElement): Processo {
		if (linha.cells.length < 11) throw new Error('Não foi possível obter os dados do processo.');
		const numClasse = linha.dataset.classe!;
		const numCompetencia = Number(linha.dataset.competencia);
		const link = linha.cells[1]!.querySelector('a');
		if (!link) throw new Error('Link para o processo não encontrado.');
		const numprocFormatado = link.textContent!;
		const numproc = numprocFormatado.replace(/[-.]/g, '');
		const links = linha.cells[1]!.getElementsByTagName('a');
		let lembretes: string[] = [];
		if (links.length === 2) {
			const onmouseover =
				[...links[1]!.attributes].filter(attr => attr.name === 'onmouseover')[0]?.value ?? '';
			const match = onmouseover.match(/^return infraTooltipMostrar\('([^']+)','Lembretes',400\);$/);
			if (!match) throw new Error('Não foi possível obter lembretes do processo.');
			const [, codigoLembrete] = match as [string, string];
			const div = document.createElement('div');
			div.innerHTML = codigoLembrete;
			const tabela = div.childNodes[0] as HTMLTableElement;
			const linhas = Array.from(tabela.rows).reverse();
			lembretes = linhas.map(linha => {
				if (linha.cells.length < 4) throw new Error('Não foi possível obter lembrete do processo.');
				let usuario = linha.cells[2]!.textContent;
				let celulaTexto = linha.cells[3]!;
				celulaTexto.innerHTML = celulaTexto.innerHTML.replace(/<br.*?>/g, '\0\n');
				return `${celulaTexto.textContent} (${usuario})`;
			});
		}
		const textoSigilo = linha.cells[1]!.getElementsByTagName('br')[0]?.nextSibling?.textContent;
		const sigilo = Number(textoSigilo?.match(/Nível ([0-5])/)?.[1]);
		if (isNaN(sigilo)) throw new Error('Não foi possível obter o nível de sigilo do processo.');
		const situacao = linha.cells[2]!.textContent!;
		const juizo = linha.cells[3]!.textContent!;
		const dataAutuacao = parseDataHora(linha.cells[4]!.textContent!);
		const diasNaSituacao = Number(linha.cells[5]!.textContent!);
		const dataSituacao = new Date();
		dataSituacao.setDate(dataSituacao.getDate() - diasNaSituacao);
		const labelsDadosComplementares = [...linha.cells[6]!.getElementsByTagName('label')];
		const dadosComplementares = new Set<string>();
		let classe: string;
		if (labelsDadosComplementares.length === 0) {
			classe = linha.cells[6]!.textContent!;
		} else {
			classe = linha.cells[6]!.firstChild!.textContent!;
			labelsDadosComplementares.forEach(label => dadosComplementares.add(label.textContent!));
		}
		const localizadores = LocalizadoresProcessoFactory.fromCelula(linha.cells[7]!);
		const breakUltimoEvento = linha.cells[8]!.querySelector('br');
		const dataUltimoEvento = parseDataHora(breakUltimoEvento?.previousSibling?.textContent!);
		const ultimoEvento = breakUltimoEvento?.nextSibling?.textContent!;
		const dataInclusaoLocalizador = parseDataHora(linha.cells[9]!.textContent!);
		const textoPrioridade = linha.cells[10]!.textContent;
		if (textoPrioridade === 'Sim') {
			dadosComplementares.add('Prioridade Atendimento');
		}
		return new Processo({
			classe,
			dadosComplementares,
			dataAutuacao,
			dataInclusaoLocalizador,
			dataSituacao,
			dataUltimoEvento,
			juizo,
			lembretes,
			linha,
			link,
			localizadores,
			numClasse,
			numCompetencia,
			numproc,
			numprocFormatado,
			sigilo,
			situacao,
		});
	}
}
function adicionarBotaoComVinculo(localizadores: Localizadores) {
	const gui = GUI.getInstance();
	const botao = gui.criarBotaoAcao(localizadores);
	botao.addEventListener(
		'click',
		() => {
			gui.avisoCarregando.atualizar(0, localizadores.quantidadeProcessosNaoFiltrados);
			localizadores.obterProcessos().then(function () {
				gui.avisoCarregando.ocultar();
				gui.atualizarBotaoAcao();
				localizadores.forEach(function (localizador) {
					gui.atualizarVisualizacao(localizador);
				});
				gui.criarGrafico(localizadores);
				gui.atualizarGrafico = () => gui.criarGrafico(localizadores);
			});
		},
		false,
	);
}
// @ts-ignore
function main() {
	if (/\?acao=usuario_tipo_monitoramento_localizador_listar&/.test(location.search)) {
		let tabela = document.getElementById('divInfraAreaTabela')?.querySelector('table');
		if (!tabela) throw new Error('Não foi possível obter a tabela de localizadores.');
		let localizadores = LocalizadoresFactory.fromTabela(tabela);
		adicionarBotaoComVinculo(localizadores);
	} else if (/\?acao=localizador_processos_lista&/.test(location.search)) {
		/* do nothing */
	} else if (/&acao_origem=principal&/.test(location.search)) {
		let tabela = document.getElementById('fldLocalizadores')?.querySelector('table');
		if (!tabela) throw new Error('Não foi possível obter a tabela de localizadores.');
		let localizadores = LocalizadoresFactory.fromTabelaPainel(tabela);
		adicionarBotaoComVinculo(localizadores);
	}
}
main();
function isContained(origContained: string, origContainer: string) {
	const contained = origContained.toLowerCase();
	const container = origContainer.toLowerCase();
	const ignored = /[./]/;
	let indexFrom = -1;
	return contained
		.split('')
		.every(char => ignored.test(char) || !!(indexFrom = container.indexOf(char, indexFrom) + 1));
}
function parseCookies(texto: string) {
	const pares = texto.split(/\s*;\s*/);
	return parsePares(pares);
}
function parseDataHora(texto: string) {
	const partes = texto.split(/\W/g).map(Number);
	if (partes.length < 6) throw new Error(`Data/hora não reconhecida: "${texto}".`);
	let [d, m, y, h, i, s] = partes as [number, number, number, number, number, number, ...number[]];
	return new Date(y, m - 1, d, h, i, s);
}
function parsePares(pares: string[]) {
	return pares.reduce<Record<string, string>>((obj, par) => {
		let nome: string, valores: string[], valor: string;
		const dividido = par.split('=');
		if (dividido.length < 2) throw new Error(`Não foi possível analisar o texto "${par}".`);
		[nome, ...valores] = dividido as [string, ...string[]];
		nome = unescape(nome);
		valor = unescape(valores.join('='));
		obj[nome] = valor;
		return obj;
	}, {});
}
function memoize<U>(fn: () => U): () => U;
function memoize<T, U>(fn: (_: T) => U): (_: T) => U;
function memoize<T, U>(fn: (_: T) => U): (_: T) => U {
	const store = new Map<T, U>();
	return x => {
		if (!store.has(x)) {
			store.set(x, fn(x));
		}
		return store.get(x)!;
	};
}
