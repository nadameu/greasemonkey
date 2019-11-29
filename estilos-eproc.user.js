// ==UserScript==
// @name Estilos eproc
// @namespace http://nadameu.com.br/
// @match https://eproc.jfpr.jus.br/eprocV2/controlador.php?acao=processo_selecionar&*
// @match https://eproc.jfrs.jus.br/eprocV2/controlador.php?acao=processo_selecionar&*
// @match https://eproc.jfsc.jus.br/eprocV2/controlador.php?acao=processo_selecionar&*
// @match https://eproc.trf4.jus.br/eproc2trf4/controlador.php?acao=processo_selecionar&*
// @grant none
// ==/UserScript==

const tblEventos = document.getElementById('tblEventos');
tblEventos.removeAttribute('style');

const cabecalhos = tblEventos.querySelectorAll(':scope > thead > tr > th');
for (const cabecalho of cabecalhos) cabecalho.removeAttribute('width');

const style = document.createElement('style');
style.textContent = `
/* Início da folha de estilos */

table#tblEventos {
  border-spacing: 0;
}

table#tblEventos > thead {
}

table#tblEventos > thead > tr {
}

table#tblEventos > thead > tr > th {
}

table#tblEventos > tbody {
}

table#tblEventos > tbody > tr {
  border-spacing: 0;
}

table#tblEventos > tbody > tr > td {
  border: none;
  border-top: 1px solid #ccc;
  padding: .8em .3em;
  vertical-align: top;
}

table#tblEventos > tbody > tr.infraEventoMuitoImportante[data-parte="INTERNO"] > td {
  border-top: 2px solid rgb(105, 142, 35);
  border-bottom: 2px solid rgb(105, 142, 35);
}

table#tblEventos > tbody > tr > td:nth-child(1) {}

table#tblEventos > tbody > tr > td:nth-child(2) {
  min-width: 51px;
}

table#tblEventos > tbody > tr > td:nth-child(3) {
  text-align: center;
  min-width: 19ex;
  max-width: 21ex;
}

table#tblEventos > tbody > tr > td:nth-child(4) {}

table#tblEventos > tbody > tr > td:nth-child(5) {
  text-align: center;
}

table#tblEventos > tbody > tr > td:nth-child(6) {
  max-width: 50ex;
}

.infra-styles table#tblEventos tr.infraTrClara {
  background: hsl(0, 0%, 98%);
}

.infra-styles table#tblEventos tr.infraTrEscura {
  background: hsl(0, 0%, 94%);
}

/* Fim da folha de estilos */
`;
document.head.append(style);
