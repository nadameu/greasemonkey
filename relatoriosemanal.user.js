// ==UserScript==
// @name        Relatório semanal
// @namespace   http://nadameu.com.br/relatorio-semanal
// @include     /^https:\/\/eproc\.(jf(pr|rs|sc)|trf4)\.jus\.br\/eproc(V2|2trf4)\/controlador\.php\?acao=relatorio_geral_listar\&/
// @include     /^https:\/\/eproc\.(jf(pr|rs|sc)|trf4)\.jus\.br\/eproc(V2|2trf4)\/controlador\.php\?acao=relatorio_geral_consultar\&/
// @version     5
// @grant       none
// ==/UserScript==

/* eslint-env jquery */
/* global NextPagina */

const abrirDB = () => new Promise((resolve, reject) => {
	const req = window.indexedDB.open('relatorioSemanal');
	req.addEventListener('success', ({ target: { result: db } }) => resolve(db));
	req.addEventListener('error', ({ target: { error } }) => reject(error));
	req.addEventListener('upgradeneeded', ({ target: { result: db } }) => {
		const processos = db.createObjectStore('processos', { keyPath: 'numproc' });
		processos.createIndex('classe', 'classe', { unique: false });
		processos.createIndex('situacao', 'situacao', { unique: false });
		processos.createIndex('data', 'data', { unique: false });
		processos.createIndex('localizador', 'localizador', { unique: false, multiEntry: true });

		// eslint-disable-next-line no-unused-vars
		const localizadores = db.createObjectStore('localizadores', { keyPath: 'localizador' });

		// eslint-disable-next-line no-unused-vars
		const situacoes = db.createObjectStore('situacoes', { keyPath: 'situacao' });
	});
});
const chainProcessos = f => abrirDB().then(db => new Promise((resolve, reject) => {
	const processos = [];
	const objectStore = db.transaction(['processos']).objectStore('processos');
	const req = objectStore.openCursor();
	req.addEventListener('success', ({ target: { result: cursor } }) => {
		if (cursor) {
			Array.prototype.push.apply(processos, f(cursor.value));
			cursor.continue();
		} else {
			resolve(processos);
		}
	});
	req.addEventListener('error', ({ target: { error } }) => reject(error));
}));
const forEachLocalizador = f => abrirDB().then(db => new Promise((resolve, reject) => {
	const objectStore = db.transaction(['processos']).objectStore('processos');
	const index = objectStore.index('localizador');

	const req = index.openKeyCursor(null, 'nextunique');
	req.addEventListener('success', ({ target: { result: cursor } }) => {
		if (cursor) {
			f(cursor.key);
			cursor.continue();
		} else {
			resolve();
		}
	});
	req.addEventListener('error', ({ target: { error } }) => reject(error));
}));

const dados = (() => {
	const PARAM_NAME = 'relatorioSemanal';
	const DEFAULT = {
		emAndamento: false,
		sigilo: {
			2: false,
			3: false,
			4: false,
			5: false,
			999: false
		}
	};
	const loadValues = () => JSON.parse(localStorage.getItem(PARAM_NAME));
	const dados = loadValues() || DEFAULT;
	const saveValues = () => localStorage.setItem(PARAM_NAME, JSON.stringify(dados));
	return {
		emAndamento(val) {
			if (val === undefined) {
				return dados.emAndamento;
			}
			dados.emAndamento = val;
			saveValues();
		},
		sigilo(key, val) {
			if (val === undefined) {
				return dados.sigilo[key];
			}
			dados.sigilo[key] = val;
			saveValues();
		}
	};
})();

const acao = (new URL(window.location.href)).searchParams.get('acao');

if (acao === 'relatorio_geral_listar') {

	const sigilo = $('#selIdSigilo');
	sigilo.append('<option value="5">Nível 5</option>');

	const consultarNivel = nivel => {
		dados.emAndamento(nivel);
		const limpar = $('#btnLimparCookie');
		limpar.click();

		const sigilo = $('#selIdSigilo');
		sigilo.val(nivel);
		sigilo.trigger('change');

		$('#optNdiasSituacao').get(0).checked = true;
		$('#optPaginacao100').get(0).checked = true;
		$('#optAutoresPrincipais').get(0).checked = false;
		$('#optReusPrincipais').get(0).checked = false;

		const consultar = $('#btnConsultar');
		consultar.click();
	};

	const buttons = [2, 3, 4, 5, 999]
		.filter(nivel => ! dados.sigilo(nivel))
		.map(nivel => {
			const button = $(`<button>Nível ${nivel}</button>`);
			button.on('click', consultarNivel.bind(null, nivel));
			return button;
		});

	const area = $('#divInfraAreaTelaD');

	area.prepend($('<button id="logarLocalizadores">Logar localizadores</button>'));
	$('#logarLocalizadores').on('click', evt => {
		evt.preventDefault();
		forEachLocalizador(localizador => console.info(localizador));
	});

	area.prepend($('<button id="gerarArquivo">Gerar arquivo</button>'));
	$('#gerarArquivo').on('click', evt => {
		evt.preventDefault();

		const campos = ['processo', 'competenciaCorregedoria', '', 'classe', 'localizador', 'situacao', 'autuacao', 'dataEstatistica', 'data', '', '', '', '', '', '', 'setor', '', ''];
		chainProcessos(dadosProcesso => dadosProcesso.localizador.map(localizador => {
			const processo = [];
			campos.forEach(function(campo, indiceCampo) {
				if (campo === 'localizador') {
					processo[indiceCampo] = localizador;
				} else if (campo === 'data' || campo === 'autuacao' || campo === 'dataEstatistica') {
					processo[indiceCampo] = dadosProcesso[campo].toLocaleFormat('%Y-%m-%d %H:%M:%S');
				} else if (campo === '') {
					// não faz nada
				} else {
					processo[indiceCampo] = dadosProcesso[campo];
				}
			});
			return processo;
		})).then(processos => {
			const table = document.createElement('table');
			table.insertAdjacentHTML('afterbegin', [
				'<col style="mso-number-format: \'@\';"/>', // Processo
				'<col width="0" style="mso-number-format: \'@\';"/>', // Competência Corregedoria
				'<col width="0" style="mso-number-format: \'@\';"/>', // Competência
				'<col style="mso-number-format: \'@\';"/>', // Classe
				'<col style="mso-number-format: \'@\';"/>', // Localizador
				'<col style="mso-number-format: \'@\';"/>', // Situação
				'<col width="0" style="mso-number-format: \'dd\\/mm\\/yyyy\';"/>', // Data autuação;
				'<col width="0" style="mso-number-format: \'dd\\/mm\\/yyyy\';"/>', // Data Estat.
				'<col width="0" style="mso-number-format: \'dd\\/mm\\/yyyy\';"/>', // Data Últ. Fase
				'<col width="0" style="mso-number-format: \'0\';"/>', // Regra
				'<col width="0" style="mso-number-format: \'@\';"/>', // Campo a considerar
				'<col style="mso-number-format: \'dd\\/mm\\/yyyy\';"/>', // Data considerada
				'<col style="mso-number-format: \'@\';"/>', // Motivo
				'<col style="mso-number-format: \'0\';"/>', // Esperado
				'<col style="mso-number-format: \'0\';"/>', // Dias
				'<col style="mso-number-format: \'@\';"/>', // Setor
				'<col style="mso-number-format: \'0.00%\';"/>', // Atraso
				'<col style="mso-number-format: \'@\';"/>' // Incluir?
			].join(''));
			const tRow = table.createTHead().insertRow();
			const camposExcel = ['Processo', 'Competência Corregedoria', 'Competência', 'Classe', 'Localizador', 'Situação', 'Data autuação', 'Data Estat.', 'Data Últ. Fase', 'Regra', 'Campo a considerar', 'Data considerada', 'Motivo', 'Esperado', 'Dias', 'Setor', 'Atraso', 'Incluir?'];
			for (let i = 0; i < camposExcel.length; i++) tRow.insertCell();
			camposExcel.forEach((campo, i) => tRow.cells[i].innerHTML = '<strong>' + campo + '</strong>');
			const tBody = table.createTBody();
			processos.forEach(processo => {
				const row = tBody.insertRow();
				for (let i = 0; i < camposExcel.length; i++) row.insertCell();
				processo.forEach((campo, i) => {
					row.cells[i].textContent = campo;
					if (i === 0) row.cells[i].setAttribute('x:str', campo);
				});
			});
			const blob = new Blob([
				'<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40"><head>',
				'<meta http-equiv="Content-Type" content="text/html; charset=UTF-8"/>',
				'<style>td { white-space: nowrap; }</style>',
				'<!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>processos</x:Name><x:WorksheetOptions><x:ProtectContents>False</x:ProtectContents></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->',
				'</head><body>',
				table.outerHTML,
				'</body></html>'
			], { type: 'application/vnd.ms-excel' });
			const link = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = link;
			a.textContent = 'download';
			a.download = 'processos.xls';
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
		});
	});
	area.prepend(buttons);

	area.prepend($('<button id="excluirDB">Excluir banco de dados</button>'));
	$('#excluirDB').on('click', function(evt) {
		evt.preventDefault();

		console.info('apagando...');
		new Promise(function(resolve, reject) {
			const req = indexedDB.deleteDatabase('relatorioSemanal');
			req.onsuccess = resolve;
			req.onerror = reject;
		})
			.then(evt => console.log('ok', evt))
			.catch(console.error)
			.then(function() {
				localStorage.removeItem('relatorioSemanal');
				location.reload();
			});
	});


} else if (acao === 'relatorio_geral_consultar') {

	const tabela = $('#tabelaLocalizadores');
	const campos = ['', 'processo', 'autuacao', 'dias', 'situacao', 'sigilo', 'classe', 'localizador', '', 'data'];
	const processos = [], localizadores = new Set(), situacoes = new Set();
	tabela.each(function() {
		$(this).find('tr.infraTrClara, tr.infraTrEscura').each(function() {
			const processo = Object.create(null);
			campos.forEach(function(campo, i) {
				let valor = this.cells[i].textContent;
				switch (campo) {
					case 'processo': {
						processo.numproc = valor.replace(/[-.]/g, '');
						processo.setor = '???';
						const classe = Number(this.dataset.classe);
						const competencia = Number(this.dataset.competencia);
						if (competencia >= 9 && competencia <= 20) {
							processo.competenciaCorregedoria = 'Juizado';
						} else if (competencia >= 21 && competencia <= 30) {
							processo.competenciaCorregedoria = 'Criminal';
						} else if ((competencia === 41 || competencia === 43) &&
(classe === 99 || classe === 60)) {
							processo.competenciaCorregedoria = 'Execução Fiscal';
						} else {
							processo.competenciaCorregedoria = 'Cível';
						}
						break;
					}

					case 'dias': {
						valor = Number(valor);
						var agora = new Date();
						var hoje = new Date(new Date(agora.getFullYear(), agora.getMonth(), agora.getDate() - 1, 23, 59, 59, 999).getTime() + 1);
						processo.dataEstatistica = new Date(hoje.setDate(hoje.getDate() - valor));
						break;
					}

					case 'autuacao':
					case 'data': {
						const [d, m, y, h, i, s] = valor.split(/[/ :]/g);
						valor = new Date(y, m - 1, d, h, i, s);
						break;
					}

					case 'localizador':
						valor = valor.substr(2);
						valor = valor.split(' • ');
						valor = valor.map(loc => loc.replace(/ \(Princ.\)$/, ''));
						valor.forEach(loc => localizadores.add(loc));
						break;

					case 'situacao':
						situacoes.add(valor);
						break;
				}
				processo[campo] = valor;
			}, this);
			processos.push(processo);
		});
	});

	const promise = new Promise((resolve, reject) => {
		if (processos.length) {
			abrirDB().then(db => {
				db.onerror = reject;
				const tx = db.transaction(['processos'], 'readwrite');
				const os = tx.objectStore('processos');
				tx.oncomplete = resolve;
				processos.forEach(processo => {
					os.add(processo);
				});
			}).catch(reject);
		} else {
			resolve();
		}
	});
	promise.then(() => {
		const pagina = $('#selInfraPaginacaoSuperior'), paginas = $('option', pagina);
		if (paginas.size() && pagina.val() < paginas.size()) {
			NextPagina('+');
		} else {
			dados.sigilo(dados.emAndamento(), true);
			dados.emAndamento(false);
			$('#btnVoltar').click();
		}
	}).catch(err => console.error(err));
}
