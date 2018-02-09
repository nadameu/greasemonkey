// ==UserScript==
// @name         Anos anteriores
// @namespace    http://nadameu.com.br/
// @version      2.0.0
// @description  Altera os dados dos ofícios requisitórios
// @author       nadameu
// @include      /^https:\/\/eproc\.(trf4|jf(pr|rs|sc))\.jus\.br\/eprocV2\/controlador\.php\?acao=oficio_/
// @grant        none
// ==/UserScript==

/* eslint-env jquery */

const NOME_FLAG = 'ALTERAR_ANOS_ANTERIORES';

const addAjaxSuccessListener = (() => {
	let listeners = [];

	const listen = (filtrosGet, listener) => {
		listeners.push({ filtrosGet, listener });
		return () => {
			listeners = listeners.filter(
				({ filtrosGet: f, listener: l }) => filtrosGet !== f || listener !== l
			);
		};
	};

	jQuery(document).ajaxSuccess((evt, xhr, settings) => {
		const link = document.createElement('a');

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
	});

	return listen;
})();

const queryAll = selector => Array.from(document.querySelectorAll(selector));

const url = new URL(location.href);
const matchAcao = url.searchParams
	.get('acao')
	.match(/^oficio_requisitorio_(.*)$/);
const acao = (matchAcao || [])[1];

if (acao === 'requisicoes_editar') {
	const unsubscribe = addAjaxSuccessListener(
		{ acao_ajax: 'oficio_requisitorio_requisicoes_buscar_beneficiarios' },
		() => {
			unsubscribe();
			const editarTodos = jQuery(
				'#fldBeneficiarios #divConteudoBeneficiarios img[src$="/alterar.gif"]'
			).parent();
			const button = jQuery('<button>Ano anterior</button>');
			button.on('click', evt => {
				evt.preventDefault();
				sessionStorage.setItem(NOME_FLAG, 'yes');
				if (editarTodos.length > 1) {
					alert('Há mais de um beneficiário!');
					return;
				}
				editarTodos.click();
			});
			button.insertBefore('#divInfraAreaDados');
		}
	);
} else if (acao === 'beneficiarioshonorarios_editar') {
	let salvo = false;
	if (sessionStorage.getItem(NOME_FLAG)) {
		addAjaxSuccessListener(
			{ acao_ajax: 'oficio_requisitorio_requisicoes_buscar_um_beneficiario' },
			() => {
				const nomesCampos = [
					'txtAnoExCorrente',
					'txtNumMesesExCorrente',
					'txtValorExCorrente',
					'txtNumMesesExAnterior',
					'txtValorExAnterior',
				];
				const elementos = nomesCampos.map(nome => queryAll(`#${nome}`));
				const umDeCada = elementos.every(el => el.length === 1);
				if (! umDeCada) {
					console.error('Quantidade de campos inesperada:', elementos);
					throw new Error('Quantidade de campos inesperada');
				}
				const beneficiario = nomesCampos.reduce(
					(obj, nomeCampo, indiceCampo) => {
						obj[nomeCampo] = elementos[indiceCampo][0];
						return obj;
					},
					{}
				);
				const meses = ['txtNumMesesExAnterior', 'txtNumMesesExCorrente']
					.map(campo => Number(beneficiario[campo].value))
					.reduce((a, b) => a + b);

				const valor =
					['txtValorExAnterior', 'txtValorExCorrente']
						.map(campo =>
							Number(beneficiario[campo].value.replace(/[\D]/g, ''))
						)
						.reduce((a, b) => a + b) / 100;

				const agora = new Date(),
					anoCorrente = agora.getFullYear(),
					txtAnoCorrente = anoCorrente.toString();

				beneficiario.txtAnoExCorrente.disabled = false;
				beneficiario.txtAnoExCorrente.value = txtAnoCorrente;
				beneficiario.txtNumMesesExCorrente.value = '';
				beneficiario.txtValorExCorrente.value = '';
				beneficiario.txtNumMesesExAnterior.value = meses.toString();
				beneficiario.txtValorExAnterior.value = valor.toLocaleString('pt-br', {
					useGrouping: true,
					minimumFractionDigits: 2,
					maximumFractionDigits: 2,
				});

				jQuery(document).ajaxStop(() => {
					if (salvo) return;
					salvo = true;
					jQuery('#btnSalvarFecharBeneficiario').click();
				});
			}
		);
	}
	sessionStorage.removeItem(NOME_FLAG);
} else {
	console.log('Ação não reconhecida: ', acao);
}
