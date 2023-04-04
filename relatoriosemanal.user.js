// ==UserScript==
// @name        Relatório semanal
// @namespace   http://nadameu.com.br/relatorio-semanal
// @include     /^https:\/\/eproc\.(jf(pr|rs|sc)|trf4)\.jus\.br\/eproc(V2|2trf4)\/controlador\.php\?acao=relatorio_geral_listar\&/
// @include     /^https:\/\/eproc\.(jf(pr|rs|sc)|trf4)\.jus\.br\/eproc(V2|2trf4)\/controlador\.php\?acao=relatorio_geral_consultar\&/
// @require     https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js
// @version     9.2.0
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

const acao = (new URL(window.location.href)).searchParams.get('acao');

if (acao === 'relatorio_geral_listar') {

	const sigilo = $('#selIdSigilo');
	sigilo.append('<option value="5">Nível 5</option>');

	const preparar = () => {
		sessionStorage.limpando = true;
		const limpar = $('#btnLimparCookie');
		limpar.click();
	};


	if (sessionStorage.limpando) {
		delete sessionStorage.limpando;
		$('#optNdiasSituacao').get(0).checked = true;
		$('#optPaginacao100').get(0).checked = true;
		$('#optAutoresPrincipais').get(0).checked = false;
		$('#optReusPrincipais').get(0).checked = false;
	}

	const button = $(`<button type="button">Preparar</button>`);
	button.on('click', preparar);

	const area = $('#divInfraAreaTelaD');

  area.prepend($(`<input placeholder="Observações" value="${sessionStorage.observacoes || ''}">`).on('change', function() {
    sessionStorage.observacoes = this.value.trim();
  }));

	area.prepend($('<button id="logarLocalizadores">Logar localizadores</button>'));
	$('#logarLocalizadores').on('click', evt => {
		evt.preventDefault();
		forEachLocalizador(localizador => console.info(localizador));
	});

	area.prepend($('<button id="gerarArquivo" type="button">Gerar arquivo</button>'));
	$('#gerarArquivo').on('click', evt => {
		evt.preventDefault();

		const campos = ['processo', 'competenciaCorregedoria', '', 'classe', 'localizador', 'situacao', 'autuacao', 'dataEstatistica', 'data', '', '', '', '', '', '', '', '', '', 'principal', 'outrosLocalizadores', 'todosLocalizadores', 'observacoes'];
		chainProcessos(dadosProcesso => dadosProcesso.localizador.map(localizador => {
			const processo = [];
			campos.forEach(function (campo, indiceCampo) {
				if (campo === 'localizador') {
					processo[indiceCampo] = localizador;
				} else if (campo === 'outrosLocalizadores') {
					processo[indiceCampo] = dadosProcesso.localizador.filter(loc => loc !== localizador).join('; ');
				} else if (campo === 'todosLocalizadores') {
					processo[indiceCampo] = dadosProcesso.localizador.slice().sort().join('; ');
				} else if (campo === 'data' || campo === 'autuacao' || campo === 'dataEstatistica') {
					processo[indiceCampo] = dadosProcesso[campo];
        } else if (campo === 'principal') {
          processo[indiceCampo] = dadosProcesso[campo] === localizador ? 'Sim' : 'Não';
				} else if (campo === '') {
					// não faz nada
				} else {
					processo[indiceCampo] = dadosProcesso[campo];
				}
			});
			return processo;
		})).then(processos => {

			const camposExcel = ['Processo', 'Competência Corregedoria', 'Competência', 'Classe', 'Localizador', 'Situação', 'Data autuação', 'Data Estat.', 'Data Últ. Fase', 'Regra', 'Campo a considerar', 'Data considerada', 'Motivo', 'Esperado', 'Dias', 'Setor', 'Atraso', 'Incluir?', 'Principal', 'Outros localizadores', 'Todos loc. A-Z', 'Observações'];

			const workbook = XLSX.utils.book_new();
			const sheet = XLSX.utils.aoa_to_sheet([Array.from({ length: 11 }, () => '').concat(['=HOJE()']), camposExcel].concat(processos), { cellDates: true });
			const range = XLSX.utils.decode_range(sheet['!ref']);
			const arquivo = 'file:///C:/Users/pmj00/Desktop/regras.ods';
			const localizador_situacao_regra = `'${arquivo}'#$localizador_situacao_regra`;
			const regras_corregedoria = `'${arquivo}'#$regras_corregedoria`;
			for (let R = range.s.r; R <= range.e.r; ++R) {
				for (let C = range.s.c; C <= range.e.c; ++C) {
					const cell_address = { c: C, r: R };
					const cell_ref = XLSX.utils.encode_cell(cell_address);
					const cell = sheet[cell_ref];
					if (cell) {
						if (cell.t === 'd') {
							delete cell.w;
							cell.z = 'dd/mm/yyyy';
						}
					}
					if (R >= 2) {
						if (C === 9) {
							sheet[cell_ref] = { t: 'n', w: '?', f: `VLOOKUP(E${R + 1}, ${localizador_situacao_regra}.$A$2:$D$999, 1 + MATCH(F${R + 1}, ${localizador_situacao_regra}.$B$1:$D$1, 0), FALSE)` };
						} else if (C === 10) {
							sheet[cell_ref] = { t: 'n', f: `VLOOKUP(J${R + 1}, ${regras_corregedoria}.$A$2:$D$99, 4, FALSE)` }
						} else if (C === 11) {
							sheet[cell_ref] = { t: 'n', f: `OFFSET(F${R + 1}, 0, MATCH(K${R + 1}, $G$2:$I$2, 0), 1, 1)` }
						} else if (C === 12) {
							sheet[cell_ref] = { t: 'n', f: `VLOOKUP(J${R + 1}, ${regras_corregedoria}.$A$2:$C$99, 3, FALSE)` }
						} else if (C === 13) {
							sheet[cell_ref] = { t: 'n', f: `VLOOKUP(J${R + 1}, ${regras_corregedoria}.$A$2:$H$99, 4 + MATCH(B${R + 1}, ${regras_corregedoria}.$E$1:$H$1, 0), FALSE)` }
						} else if (C === 14) {
							sheet[cell_ref] = { t: 'n', f: `$L$1 - L${R + 1}`, z: '0' }
						} else if (C === 15) {
							sheet[cell_ref] = { t: 'n', w: '?', f: `VLOOKUP(E${R + 1}, ${localizador_situacao_regra}.$A$2:$E$999, 5, FALSE)` };
						} else if (C === 16) {
							sheet[cell_ref] = { t: 'n', f: `O${R + 1} / N${R + 1} - 1`, z: '0.00%' }
						} else if (C === 17) {
							sheet[cell_ref] = { t: 'n', f: `IF(Q${R + 1} > 0, \"Sim\", \"Não\")` }
						}
					}
				}
			}
			sheet['L1'] = { t: 'n', f: 'TODAY()', z: 'dd/mm/yyyy' };
			XLSX.utils.book_append_sheet(workbook, sheet, "SheetJS");
			XLSX.writeFile(workbook, "SheetJS.ods");
			return;
		});
	});
	area.prepend(button);

	area.prepend($('<button id="excluirDB" type="button">Excluir banco de dados</button>'));
	$('#excluirDB').on('click', function (evt) {
		evt.preventDefault();

		console.info('apagando...');
		new Promise(function (resolve, reject) {
			const req = indexedDB.deleteDatabase('relatorioSemanal');
			req.onsuccess = resolve;
			req.onerror = reject;
		})
			.then(evt => console.log('ok', evt))
			.catch(console.error)
			.then(function () {
				localStorage.removeItem('relatorioSemanal');
				location.reload();
			});
	});


} else if (acao === 'relatorio_geral_consultar') {

	const tabela = $('#tabelaLocalizadores');
	const campos = ['', 'processo', 'autuacao', 'dias', 'situacao', 'sigilo', 'classe', 'localizador', '', 'data'];
	const processos = [], localizadores = new Set(), situacoes = new Set();
	tabela.each(function () {
		$(this).find('tr.infraTrClara, tr.infraTrEscura').each(function () {
			const processo = Object.create(null);
			campos.forEach(function (campo, i) {
				let valor = this.cells[i].textContent;
				switch (campo) {
					case 'processo': {
						processo.numproc = valor.replace(/[-.]/g, '');
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
						const RE = / \(Princ\.\)$/;
						valor = valor.map(loc => {
							if (! RE.test(loc)) return loc;

							processo.principal = loc.replace(RE, '');
							return processo.principal;
						});
						valor.forEach(loc => localizadores.add(loc));
						break;

					case 'situacao':
						situacoes.add(valor);
						break;
				}
				if (campo !== '') processo[campo] = valor;
			}, this);
      processo.observacoes = sessionStorage.observacoes || '';
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
		if (paginas.length && pagina.val() < paginas.length) {
			NextPagina('+');
		} else {
			$('#btnVoltar').click();
		}
	}).catch(err => console.error(err));
}

function numeroDoisDigitos(num) {
	return String(num).padStart(2, '0');
}
