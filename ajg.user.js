// ==UserScript==
// @name        Solicitações de pagamento em bloco
// @description Permite a criação de solicitações de pagamento em bloco
// @namespace   http://nadameu.com.br/ajg
// @include     /^https:\/\/eproc\.(trf4|jf(pr|rs|sc))\.jus\.br\/eproc(2trf4|V2)\/controlador\.php\?acao=localizador_processos_ajg&/
// @version     2
// @grant       none
// ==/UserScript==

class ErroLinkCriarNaoExiste extends Error {
	constructor() {
		super('Link para criar solicitação de pagamentos não existe!');
	}
}

class Nomeacao {
}
Nomeacao.prototype.idUnica = null;
Nomeacao.prototype.numProcesso = null;
Nomeacao.prototype.numeroNomeacao = null;

class Pagina {
	constructor(doc) {
		this.doc = doc;
	}

	static analisar(doc) {
		const str = doc.URL.split('?').slice(1).join('?');
		const parametros = new Map(str.split('&').map(par => par.split('=').map(texto => decodeURIComponent(texto))));
		if (parametros.get('acao') === 'localizador_processos_ajg') {
			return new PaginaNomeacoes(doc);
		} else if (parametros.get('acao') === 'criar_solicitacao_pagamento') {
			return new PaginaCriar(doc);
		}
	}
}
Pagina.prototype.doc = null;

class PaginaCriar extends Pagina {
	get formElement() {
		return this.doc.getElementById('frmRequisicaoPagamentoAJG');
	}
}

class PaginaNomeacoes extends Pagina {

	get tabela() {
		return this.doc.getElementById('tabelaNomAJG');
	}

	adicionarAlteracoes() {
		this.adicionarEstilos();
		const aviso = this.adicionarAvisoCarregando();
		this.adicionarFormulario()
			.then(() => {
				aviso.carregado = true;
				this.adicionarAlteracoesTabela();
			})
			.catch(err => {
				aviso.carregado = false;
				if (!(err instanceof ErroLinkCriarNaoExiste)) {
					throw err;
				}
			});
	}

	adicionarAlteracoesTabela() {
		const tabela = this.tabela;
		const linhas = tabela.rows;
		let checkboxCount = 0;
		for (let indice = 1, len = linhas.length; indice < len; indice++) {
			let linha = linhas[indice];
			let celula = linha.insertCell(0);
			linha.cells[1].classList.add('gm-ajg__linha__processo');
			linha.cells[2].classList.add('gm-ajg__linha__nomeacao');
			let linkCriar = linha.querySelector('a[href^="controlador.php?acao=criar_solicitacao_pagamento&"]');
			if (!linkCriar) continue;
			celula.insertAdjacentHTML('afterbegin', `<input class="gm-ajg__linha__checkbox" type="checkbox">`);
			checkboxCount++;
		}
		if (checkboxCount > 0) {
			linhas[0].insertAdjacentHTML('afterbegin', `<th class="infraTh"><input class="gm-ajg__todos" type="checkbox"></th>`);
			tabela.addEventListener('click', this.onTabelaClicada.bind(this));
		}
	}

	adicionarAvisoCarregando() {
		const aviso = this.doc.createElement('label');
		aviso.className = 'gm-ajg__aviso';

		let qtdPontinhos = 0;
		function updateAviso() {
			let pontinhos = '.'.repeat(qtdPontinhos + 1);
			aviso.textContent = `Aguarde, carregando formulário${pontinhos}`;
			qtdPontinhos += 1;
			qtdPontinhos %= 3;
		}
		updateAviso();
		const win = this.doc.defaultView;
		const timer = win.setInterval(updateAviso, 1000 / 3);
		const tabela = this.tabela;
		tabela.parentElement.insertBefore(aviso, tabela);
		return {
			get carregado() {
				return null;
			},
			set carregado(carregado) {
				win.clearInterval(timer);
				if (carregado) {
					aviso.classList.add('gm-ajg__aviso--carregado');
					aviso.textContent = 'Selecione as nomeações desejadas para criar solicitações de pagamento em bloco através do formulário no final da página.';
				} else {
					aviso.classList.add('gm-ajg__aviso--nao-carregado');
				}
			}
		};
	}

	adicionarEstilos() {
		this.doc.querySelector('head').insertAdjacentHTML('beforeend', `
<style>
.gm-ajg__aviso {}
.gm-ajg__aviso--carregado {}
.gm-ajg__aviso--nao-carregado {
	display: none;
}
.gm-ajg__lista {
	font-size: 1.2em;
}
.gm-ajg__lista__processo {
	float: left;
	margin-right: 3ex;
}
.gm-ajg__lista__resultado {
}
.gm-ajg__lista__resultado--ok {
	color: green;
}
.gm-ajg__lista__resultado--erro {
	color: red;
}
</style>
		`);
	}

	adicionarFormulario() {
		return executarAssincrono(function*() {
			const areaTelaD = this.doc.getElementById('divInfraAreaTelaD');
			areaTelaD.insertAdjacentHTML('beforeend', `<div class="gm-ajg__div"></div>`);
			const div = this.doc.querySelector('.gm-ajg__div');

			const linkCriar = this.doc.querySelector('a[href^="controlador.php?acao=criar_solicitacao_pagamento&"]');
			if (!linkCriar) return Promise.reject(new ErroLinkCriarNaoExiste());
			div.innerHTML = `<label>Aguarde, carregando formulário...</label>`;
			const doc = yield XHR.buscarDocumento(linkCriar.href);
			div.textContent = '';
			const paginaCriar = Pagina.analisar(doc);
			const form = paginaCriar.formElement.cloneNode(true);
			if (!this.validarFormularioExterno(form)) return;
			div.textContent = 'Ok.';
			div.innerHTML = `
	<fieldset class="infraFieldset">
	<legend class="infraLegend">Criar solicitações de pagamento em bloco</legend>
	<form class="gm-ajg__formulario" method="${form.method}" action="${form.action}">
		<label>Valor da solicitação (R$): <input name="txtValorSolicitacao" onpaste="return false;" onkeypress="return infraMascaraDinheiro(this, event, 2, 18);"></label><br>
		<br>
		<label>Data da prestação do serviço: <input id="gm-ajg__formulario__data" name="txtDataPrestacao" onpaste="return false;" onkeypress="return infraMascaraData(this, event);"></label><img title="Selecionar data" alt="Selecionar data" src="../../../infra_css/imagens/calendario.gif" class="infraImg" onclick="infraCalendario('gm-ajg__formulario__data', this);"><br>
		<br>
		<label class="infraLabel">Motivo:</label><br>
		<label><input type="checkbox" name="chkMotivo[]" value="0"> Nível de especialização e complexidade do trabalho</label><br>
		<label><input type="checkbox" name="chkMotivo[]" value="1"> Natureza e importância da causa</label><br>
		<label><input type="checkbox" name="chkMotivo[]" value="6"> Lugar da prestação do serviço</label><br>
		<label><input type="checkbox" name="chkMotivo[]" value="3"> Tempo de tramitação do processo</label><br>
		<label><input type="checkbox" name="chkMotivo[]" value="2"> Grau de zelo profissional</label><br>
		<label><input type="checkbox" name="chkMotivo[]" value="4"> Trabalho realizado pelo profissional</label><br>
		<br>
		<label>Observação:<br><textarea name="selTxtObservacao" cols="55" rows="4" maxlength="500"></textarea></label><br>
		<br>
		<label>Decisão fundamentada <small><em>(Obrigatório quando o valor extrapolar o máximo)</em></small>:<br><textarea name="selTxtDecisao" cols="55" rows="4" maxlength="2000"></textarea></label><br>
	</form>
	<br>
	<button class="gm-ajg__formulario__enviar">Criar solicitações em bloco</button>
	</fieldset>
	<output class="gm-ajg__resultado"></output>
			`;
			const enviar = this.doc.querySelector('.gm-ajg__formulario__enviar');
			enviar.addEventListener('click', this.onEnviarClicado.bind(this));
		}, this);
	}

	enviarFormulario(url, method, data) {
		return XHR.buscarDocumento(url, method, data).then(doc => {
			const validacao = doc.getElementById('txaInfraValidacao');
			if (validacao) {
				const match = validacao.textContent.trim().match(/^Solicitação de pagamento (\d+) criada$/);
				if (match) {
					return match[1];
				}
			}
			let msgsErro = new Set(['Houve um erro ao tentar criar a solicitação!', '']);
			const excecoes = Array.from(doc.querySelectorAll('.infraExcecao'));
			if (excecoes.length > 0) {
				excecoes.forEach(excecao => msgsErro.add(excecao.textContent.trim()));
			}
			const tabelaErros = doc.querySelector('table[summary="Erro(s)"]');
			if (tabelaErros) {
				for (let i = 1, len = tabelaErros.rows.length; i < len; i++) {
					let linha = tabelaErros.rows[i];
					msgsErro.add(linha.cells[1].textContent.trim());
				}
			}
			window.errorDoc = doc;
			console.error('DEBUG: window.errorDoc');
			if (excecoes.length === 0 && !tabelaErros) {
				return false;
			}
			const msgErro = Array.from(msgsErro.values()).join('\n');
			throw new Error(msgErro);
		});
	}

	nomeacaoFromLinha(linha) {
		const nomeacao = new Nomeacao();
		const linkCriar = linha.querySelector('a[href^="controlador.php?acao=criar_solicitacao_pagamento&"]');
		if (linkCriar) {
			const celulaNomeacao = linha.querySelector('.gm-ajg__linha__nomeacao');
			const [str] = linkCriar.search.split(/^\?/).slice(1);
			const parametros = new Map(str.split('&').map(par => par.split('=').map(texto => decodeURIComponent(texto))));
			const idUnica = parametros.get('id_unica');
			nomeacao.idUnica = idUnica;
			nomeacao.numProcesso = idUnica.split('|')[1];
			nomeacao.numeroNomeacao = celulaNomeacao.textContent.trim();
		}
		return nomeacao;
	}

	onEnviarClicado(evt) {
		const form = this.doc.querySelector('.gm-ajg__formulario');
		const url = form.action;
		const method = form.method;

		const tabela = this.doc.getElementById('tabelaNomAJG');
		const linhas = Array.from(tabela.rows);
		const linhasProcessosSelecionados = linhas.filter((linha, indice) => {
			if (indice === 0) return false;
			const checkbox = linha.querySelector('.gm-ajg__linha__checkbox');
			return checkbox && checkbox.checked;
		});

		let pergunta;
		if (linhasProcessosSelecionados.length === 0) {
			return;
		} else if (linhasProcessosSelecionados.length === 1) {
			pergunta = `Criar solicitação de pagamento para 1 processo?`;
		} else {
			pergunta = `Criar solicitações de pagamento para ${linhasProcessosSelecionados.length} processos?`;
		}
		if (!confirm(pergunta)) return;

		const resultado = this.doc.querySelector('.gm-ajg__resultado');
		resultado.innerHTML = `
<label>Solicitações a criar:</label><br>
<dl class="gm-ajg__lista"></dl>
		`;
		const lista = resultado.querySelector('.gm-ajg__lista');

		let promise = Promise.resolve();
		let duvida = false;
		linhasProcessosSelecionados.forEach(linha => {
			const nomeacao = this.nomeacaoFromLinha(linha);
			const data = new FormData(form);
			data.set('hdnInfraTipoPagina', '1');
			data.set('id_unica', nomeacao.idUnica);
			data.set('num_processo', nomeacao.numProcesso);
			data.set('numeroNomeacao', nomeacao.numeroNomeacao);

			const termo = this.doc.createElement('dt');
			termo.className = 'gm-ajg__lista__processo';
			termo.textContent = nomeacao.numProcesso;
			const definicao = this.doc.createElement('dd');
			definicao.className = 'gm-ajg__lista__resultado';
			definicao.textContent = 'Na fila';
			lista.appendChild(termo);
			lista.appendChild(definicao);
			promise = promise.then(() => definicao.textContent = 'Criando...');
			promise = promise.then(this.enviarFormulario.bind(this, url, method, data));

			// fake
			// promise = promise.then(() => {
			// 	return new Promise((resolve, reject) => {
			// 		let timer;
			// 		timer = this.doc.defaultView.setTimeout(() => {
			// 			this.doc.defaultView.clearTimeout(timer);
			// 			if (Math.random() < 0.1) {
			// 				reject(new Error('Erro ao criar solicitação!'));
			// 			} else {
			// 				resolve(parseInt(Math.random() * 1000));
			// 			}
			// 		}, 1000);
			// 	});
			// });
			promise
				.then(num => {
					if (num) {
						definicao.classList.add('gm-ajg__lista__resultado--ok');
						definicao.textContent = `Criada solicitação ${num}.`;
					} else {
						duvida = true;
						definicao.textContent = `???`;
					}
				})
				.catch(err => {
					definicao.classList.add('gm-ajg__lista__resultado--erro');
					definicao.textContent = 'Erro.';
				});
		});

		lista.scrollIntoView();

		promise.then(() => {
			let mensagem;
			if (duvida) {
				mensagem = `Não foi possível verificar se uma ou mais solicitações foram criadas.`;
			} else {
				if (linhasProcessosSelecionados.length === 1) {
					mensagem = `Solicitação criada com sucesso!`;
				} else {
					mensagem = `Solicitações criadas com sucesso!`;
				}
				mensagem += '\nA página será recarregada para atualizar a lista de processos.';
			}
			this.doc.defaultView.alert(mensagem);
			if (!duvida) {
				this.doc.defaultView.location.reload();
			}
		});
		promise.catch(err => {
			console.error(err);
			this.doc.defaultView.alert(err.message);
		});
	}

	onTabelaClicada(evt) {
		if (evt.target.classList.contains('gm-ajg__linha__checkbox')) {
			const input = evt.target;
			let linha = evt.target.parentElement;
			while (linha && linha.tagName.toLowerCase() !== 'tr') linha = linha.parentElement;
			if (input.checked) {
				linha.classList.add('infraTrMarcada');
			} else {
				linha.classList.remove('infraTrMarcada');
			}
		} else if (evt.target.classList.contains('gm-ajg__todos')) {
			const checked = evt.target.checked;
			const caixas = Array.from(this.doc.querySelectorAll('.gm-ajg__linha__checkbox'));
			caixas.forEach(caixa => caixa.checked === checked || caixa.click());
		}
	}

	validarFormularioExterno(form) {
		const campos = ['hdnInfraTipoPagina', 'btnnovo', 'btnVoltar', 'txtValorSolicitacao', 'txtDataPrestacao', 'chkMotivo[]', 'chkMotivo[]', 'chkMotivo[]', 'chkMotivo[]', 'chkMotivo[]', 'chkMotivo[]', 'selTxtObservacao', 'selTxtDecisao', 'id_unica', 'num_processo', 'numeroNomeacao', 'btnnovo', 'btnVoltar'];
		if (form.length !== campos.length) {
			console.error('Formulário não possui o número de elementos esperado.');
			return false;
		}
		for (let i = 0, len = form.length; i < len; i++) {
			let elt = form.elements[i];
			let nome = elt.name || elt.id;
			let index = campos.indexOf(nome);
			if (index === -1) {
				console.error(`Campo imprevisto: ${nome}`);
				return false;
			}
			campos.splice(index, 1);
		}
		if (campos.length !== 0) {
			console.error(`Campo(s) inexistente(s): ${campos.map(texto => `"${texto}"`).join(', ')}`);
			return false;
		}
		return true;
	}
}

class XHR {
	static buscarDocumento(url, method = 'GET', data = null) {
		return new Promise((resolve, reject) => {
			const xhr = new XMLHttpRequest();
			xhr.open(method, url);
			xhr.responseType = 'document';
			xhr.addEventListener('load', evt => resolve(evt.target.response));
			xhr.addEventListener('error', reject);
			xhr.send(data);
		});
	}
}

function main() {
	const pagina = Pagina.analisar(document);
	pagina.adicionarAlteracoes();
}

function executarAssincrono(gerador, thisObj = null) {
	if (!gerador.isGenerator()) {
		throw new Error('Função não é um gerador!');
	}
	return Promise.resolve().then(() => {
		const gerado = gerador.apply(thisObj);
		function analisarRetorno(retorno) {
			if (!retorno.done) {
				const promise = retorno.value;
				if (promise instanceof Promise) {
					return promise.then(enviarValor).catch(enviarErro);
				} else {
					return Promise.reject(new Error('"yield" utilizado sem um objeto Promise!'));
				}
			} else {
				return retorno.value;
			}
		}
		const enviarValor = capturarErros.bind(null, 'next');
		const enviarErro = capturarErros.bind(null, 'throw');
		function capturarErros(metodo, parametro) {
			try {
				const retorno = gerado[metodo](parametro);
				return analisarRetorno(retorno);
			} catch (err) {
				return Promise.reject(err);
			}
		}
		return enviarValor(undefined);
	});
}

main();
