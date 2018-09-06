// ==UserScript==
// @name         Data-base honorários periciais
// @namespace    http://nadameu.com.br/
// @version      1.0.0
// @description  Altera os dados dos ofícios requisitórios
// @author       nadameu
// @include      /^https:\/\/eproc\.(trf4|jf(pr|rs|sc))\.jus\.br\/eprocV2\/controlador\.php\?acao=oficio_/
// @grant        none
// ==/UserScript==

/* eslint-env jquery */

const NOME_FLAG = 'ALTERAR_DATA_BASE_HONORARIOS_PERICIAIS';

const addAjaxSuccessListener = (() => {
	let listeners = [];

	const listen = (filtrosGet, listener) => {
		listeners.push({ filtrosGet, listener });
		if (listeners.length === 1) startListening();
		return () => {
			listeners = listeners.filter(
				({ filtrosGet: f, listener: l }) => filtrosGet !== f || listener !== l
			);
		};
	};

	let isListening = false;
	const startListening = () => {
		if (isListening) return;
		const link = document.createElement('a');
		const onAjaxSuccess = (evt, xhr, settings) => {
			link.href = settings.url;
			const url = new URL(link.href);
			const parametrosGet = url.searchParams;
			listeners
				.filter(({ filtrosGet }) =>
					Object.keys(filtrosGet).every(
						parametro => parametrosGet.get(parametro) === filtrosGet[parametro]
					)
				)
				.forEach(({ listener }) => listener());
		};
		jQuery(document).ajaxSuccess(onAjaxSuccess);
		isListening = true;
	};
	return listen;
})();

const pause = int => () =>
	new Promise(res => {
		const timer = setTimeout(() => {
			clearTimeout(timer);
			res();
		}, int);
	});

const pauseBetween = (int, fs) =>
	fs
		.reduce((arr, f, i) => {
			if (i > 0) arr.push(pause(int));
			arr.push(f);
			return arr;
		}, [])
		.reduce(
			(promiseThunk, f) => () => promiseThunk().then(f),
			() => Promise.resolve()
		);

const queryAll = selector => Array.from(document.querySelectorAll(selector));

const alterar = (el, valor) =>
	pauseBetween(17, [
		() => void (el.style.background = 'yellow'),
		() => void (el.value = valor),
		() => void (el.style.background = ''),
	]);

const url = new URL(location.href);
const matchAcao = url.searchParams
	.get('acao')
	.match(/^oficio_requisitorio_(.*)$/);
const acao = (matchAcao || [])[1];

if (acao === 'requisicoes_editar') {
	const unsubscribe = addAjaxSuccessListener(
		{ acao_ajax: 'oficio_requisitorio_requisicoes_buscar_honorarios' },
		() => {
			unsubscribe();
			const editarTodos = Array.from(jQuery(
				'#fldHonorarios #divConteudoHonorarios img[src$="/alterar.gif"]'
			).parent()).filter(link => link && link.parentElement && link.parentElement.parentElement && link.parentElement.parentElement.cells && link.parentElement.parentElement.cells[2] && link.parentElement.parentElement.cells[2].textContent === 'Honorários Periciais');
			const button = jQuery('<button>Data-base honorários periciais</button>');
			button.on('click', evt => {
				evt.preventDefault();
				sessionStorage.setItem(NOME_FLAG, 'yes');
			  if (editarTodos.length === 0) {
				alert('Não há honorários periciais!');
				return;
			  }
				if (editarTodos.length > 1) {
					alert('Há mais de um perito!');
					return;
				}
				$(editarTodos).click();
			});
			button.insertBefore('#divInfraAreaDados');
		}
	);
} else if (acao === 'beneficiarioshonorarios_editar') {
	let salvo = false;
	if (sessionStorage.getItem(NOME_FLAG)) {
		jQuery(document).ajaxStop(() => {
		  const elementos = document.querySelectorAll(`#txtDtaBaseHono`);
		  if (elementos.length !== 1) {
				console.error('Quantidade de campos inesperada:', elementos);
				throw new Error('Quantidade de campos inesperada');
			}
		  const elemento = elementos[0];
			const agora = new Date(),
				anoCorrente = agora.getFullYear().toString(),
				  mesCorrente = (agora.getMonth() + 1).toString().padStart(2,'0'),
				txtMesAnoCorrente = `${mesCorrente}/${anoCorrente}`;
const oldAlert = window.alert;
			pauseBetween(17, [
				alterar(elemento, txtMesAnoCorrente)
			])().then(() => {
				if (salvo) return;
				salvo = true;
			  window.alert = () => {};
				jQuery('#btnSalvarFecharHonorario').click();
			  window.alert = oldAlert;
			});
		});
	}
	sessionStorage.removeItem(NOME_FLAG);
} else {
	console.log('Ação não reconhecida: ', acao);
}
