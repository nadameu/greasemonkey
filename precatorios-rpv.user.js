// ==UserScript==
// @name        Precatórios/RPVs
// @description Cria um link para abrir automaticamente precatórios e RPVs, em uma nova aba/janela.
// @namespace   http://nadameu.com.br/precatorios-rpv
// @include     /^https:\/\/eproc\.(trf4|jf(pr|rs|sc))\.jus\.br\/eproc(2trf4|V2)\/controlador\.php\?acao=processo_selecionar\&/
// @include     /^https:\/\/eproc\.(trf4|jf(pr|rs|sc))\.jus\.br\/eproc(2trf4|V2)\/controlador\.php\?acao=processo_precatorio_rpv\&/
// @version     3
// @grant       none
// ==/UserScript==

const ACOES = {
	Editar: 'acao=editar'
};

function main() {
	const parametros = analisarParametrosPagina();
	switch (parametros.get('acao')) {
		case 'processo_selecionar':
			criarLinkNovo();
			break;

		case 'processo_precatorio_rpv':
			verificarAcaoDefinida(ACOES.Editar) && editarUnicaRequisicaoComStatus('Digitada');
			break;
	}
}

function analisarParametrosPagina() {
	const pares = [];
	const re = /(?:\?|&|$)?([^=]+)=([^&]*)/g;
	for (let partes; partes = re.exec(location.search);) {
		pares.push(partes.slice(1).map(x => decodeURIComponent(x)));
	}
	return new Map(pares);
}

function criarLinkNovo() {
	const linkListar = $('a[href^="controlador.php?acao=processo_precatorio_rpv&"]').clone(),
				legend = $('#legInfAdicional');
	linkListar
		.attr('target', '_blank')
		.text('Editar precatório/RPV')
		.on('click', linkListarClicado);
	legend.append(linkListar);
}

function linkListarClicado(evt) {
	evt.preventDefault();
	definirAcaoProximaPagina(ACOES.Editar);
	window.open(this.href);
	evt.stopPropagation();
}

function definirAcaoProximaPagina(acao) {
	const parametros = analisarParametrosPagina();
	const numproc = parametros.get('num_processo');
	sessionStorage.setItem(numproc, acao);
}

function verificarAcaoDefinida(acao) {
	const parametros = analisarParametrosPagina();
	const numproc = parametros.get('num_processo');
	if (sessionStorage.getItem(numproc) === acao) {
		sessionStorage.removeItem(numproc);
		return true;
	}
	return false;
}

function editarUnicaRequisicaoComStatus(statusDesejado) {
	const linkEditar = $('a[href$="&strAcao=editar"]').filter((l, link) => {
		const linha = $(link).parents('tr');
		const status = linha.children().eq(1).text().trim();
		return status === statusDesejado;
	});
	if (linkEditar.length === 1) {
		window.open(linkEditar.attr('href'), '_top');
	}
}

main();
