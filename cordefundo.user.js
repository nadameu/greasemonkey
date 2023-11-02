// ==UserScript==
// @name        Mudar cor de fundo
// @namespace   http://nadameu.com.br/fundo
// @description Muda a cor de fundo do relatório estatístico da Corregedoria
// @include     http://sap.trf4.gov.br/relat_estat/estat_proc_concl_n_desp.php
// @version     1
// @grant       none
// ==/UserScript==

const corFundo = '#ddeeff';
const corDestaque = '#bbddff';

var style = document.createElement('style');
style.innerHTML = `body, div.infraMenu {
	background-color: ${corFundo};
}

div.infraBarraSistema, .gmDestaque, th.infraTh {
	background-color: ${corDestaque};
}

div.infraAreaTelaD, div.infraBarraLocalizacao {
	border-color: transparent;
}

#divInfraAreaDadosDinamica table[style] {
	background-color: transparent !important;
	border: 0.2em solid #c0c0c0;
	border-collapse: collapse;
}

#divInfraAreaDadosDinamica table[style] th.infraTh {
	background-color: none;
}

#divInfraAreaDadosDinamica table[style] td,
#divInfraAreaDadosDinamica table[style] th {
	border: 0.2em solid #c0c0c0;
}

#divInfraAreaDadosDinamica table[style] tr:nth-child(event) {
	background: rgba(223, 223, 223, 0.75) !important;
}

#divInfraAreaDadosDinamica table[style] tr:nth-child(odd) {
	background: rgba(255, 255, 255, 0.75) !important;
}
`;
document.getElementsByTagName('head')[0].appendChild(style);

var celulas = [
  ...document.querySelectorAll(
    '#divInfraAreaDadosDinamica th, #divInfraAreaDadosDinamica td'
  ),
];
celulas = celulas.filter(
  celula => celula.style.backgroundColor === 'rgb(240, 247, 226)'
);
celulas.forEach(function (celula) {
  celula.style.backgroundColor = '';
  celula.classList.add('gmDestaque');
});
