// ==UserScript==
// @name         Anos anteriores
// @namespace    http://nadameu.com.br/
// @version      1.0.0
// @description  Altera os dados dos ofícios requisitórios
// @author       nadameu
// @include      /^https:\/\/eproc\.(trf4|jf(pr|rs|sc))\.jus\.br\/eprocV2\/controlador\.php\?acao=oficio_/
// @grant        none
// ==/UserScript==

/* eslint-env jquery */

const NOME_FLAG = 'ALTERAR_ANOS_ANTERIORES';

const addAjaxSuccessListener = (() => {

	const listeners = [];

	const listen = (acaoEsperada, reembolsoEsperado, listener) => {
		listeners.push({ acaoEsperada, reembolsoEsperado, listener });
	};

	jQuery(document).ajaxSuccess((evt, xhr, settings) => {
		const link = document.createElement('a');

		link.href = settings.url;
		const url = new URL(link.href);
		const parametrosGet = url.searchParams;
		const acao = parametrosGet.get('acao_ajax');

		link.href = '?' + settings.data;
		const parametrosPost = new URL(link.href).searchParams;
		const reembolso = parametrosPost.get('reembolso_deducoes');
		listeners
			.filter(({ acaoEsperada, reembolsoEsperado }) =>
				acao === acaoEsperada && (reembolsoEsperado === null || reembolso === reembolsoEsperado)
			).forEach(({ listener }) => listener());
	});

	return listen;
})();

const url = new URL(location.href);
const acao = url.searchParams.get('acao').match(/^oficio_requisitorio_(.*)$/)[1];

if (acao === 'requisicoes_editar') {
	let botaoAdicionado = false;
	addAjaxSuccessListener('oficio_requisitorio_requisicoes_buscar_beneficiarios', null, () => {
		if (botaoAdicionado) return;
		const editarTodos = jQuery('#fldBeneficiarios #divConteudoBeneficiarios img[src$="/alterar.gif"]').parent();
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
		botaoAdicionado = true;
	});
} else if (acao === 'beneficiarioshonorarios_editar') {
	let salvo = false;
	if (sessionStorage.getItem(NOME_FLAG)) {
		addAjaxSuccessListener('oficio_requisitorio_requisicoes_buscar_um_beneficiario', null, () => {
			const nomesCampos = [
				'txtAnoExCorrente',
				'txtNumMesesExCorrente',
				'txtValorExCorrente',
				'txtNumMesesExAnterior',
				'txtValorExAnterior'
			];
			const elementos = nomesCampos.map(nome => jQuery(`#${nome}`));
			const todosMesmoTamanho = elementos.reduce((last, current) => {
				if (! last) return false;
				if (last.length !== current.length) return false;
				return current;
			}) !== false;
			if (! todosMesmoTamanho) {
				console.error('Tamanhos não coincidem:', elementos);
				throw new Error('Tamanhos não coincidem');
			}
			const beneficiarios = elementos[0].toArray().map(
				(_, indiceBeneficiario) => nomesCampos.reduce(
					(beneficiario, nomeCampo, indiceCampo) => {
						beneficiario[nomeCampo] = elementos[indiceCampo][indiceBeneficiario];
						return beneficiario;
					},
					{}
				)
			);
			console.log(beneficiarios);
			const agora = new Date(), anoCorrente = agora.getFullYear(), txtAnoCorrente = anoCorrente.toString();
			beneficiarios.forEach(beneficiario => {
				beneficiario.txtAnoExCorrente.value = txtAnoCorrente;
				const mesesAnoAnterior = Number(beneficiario.txtNumMesesExCorrente.value);
				beneficiario.txtNumMesesExCorrente.value = '';
				const centavosAnoAnterior = Number(beneficiario.txtValorExCorrente.value.replace(/[\D]/g, ''));
				beneficiario.txtValorExCorrente.value = '';
				const mesesAnosAnteriores = Number(beneficiario.txtNumMesesExAnterior.value);
				beneficiario.txtNumMesesExAnterior.value = (mesesAnoAnterior + mesesAnosAnteriores).toString();
				const centavosAnosAnteriores = Number(beneficiario.txtValorExAnterior.value.replace(/[\D]/g, ''));
				beneficiario.txtValorExAnterior.value = ((centavosAnoAnterior + centavosAnosAnteriores) / 100).toLocaleString('pt-br', {
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

		});
	}
	sessionStorage.removeItem(NOME_FLAG);
} else {
	console.log(acao);
}