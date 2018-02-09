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

const url = new URL(location.href);
const acao = url.searchParams
	.get('acao')
	.match(/^oficio_requisitorio_(.*)$/)[1];

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
					'txtValorExAnterior'
				];
				const elementos = nomesCampos.map(nome => jQuery(`#${nome}`));
				const todosMesmoTamanho =
					elementos
						.map(el => el.length)
						.reduce((last, current) => last === current && current) !== false;
				if (! todosMesmoTamanho) {
					console.error('Tamanhos não coincidem:', elementos);
					throw new Error('Tamanhos não coincidem');
				}
				const beneficiarios = elementos[0]
					.toArray()
					.map((_, indiceBeneficiario) =>
						nomesCampos.reduce((beneficiario, nomeCampo, indiceCampo) => {
							beneficiario[nomeCampo] =
								elementos[indiceCampo][indiceBeneficiario];
							return beneficiario;
						}, {})
					);
				console.log(beneficiarios);
				const agora = new Date(),
					anoCorrente = agora.getFullYear(),
					txtAnoCorrente = anoCorrente.toString();
				beneficiarios.forEach(beneficiario => {
					beneficiario.txtAnoExCorrente.disabled = false;
					beneficiario.txtAnoExCorrente.value = txtAnoCorrente;
					const mesesAnoAnterior = Number(
						beneficiario.txtNumMesesExCorrente.value
					);
					beneficiario.txtNumMesesExCorrente.value = '';
					const centavosAnoAnterior = Number(
						beneficiario.txtValorExCorrente.value.replace(/[\D]/g, '')
					);
					beneficiario.txtValorExCorrente.value = '';
					const mesesAnosAnteriores = Number(
						beneficiario.txtNumMesesExAnterior.value
					);
					beneficiario.txtNumMesesExAnterior.value = (mesesAnoAnterior +
						mesesAnosAnteriores).toString();
					const centavosAnosAnteriores = Number(
						beneficiario.txtValorExAnterior.value.replace(/[\D]/g, '')
					);
					beneficiario.txtValorExAnterior.value = ((centavosAnoAnterior +
						centavosAnosAnteriores) /
						100).toLocaleString('pt-br', {
						useGrouping: true,
						minimumFractionDigits: 2,
						maximumFractionDigits: 2
					});
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
	console.log(acao);
}