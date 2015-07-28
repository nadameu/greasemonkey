// ==UserScript==
// @name        Impressão de videoconferência
// @namespace   http://nadameu.com.br/impressao-videoconferencia
// @include     https://eproc.jfpr.jus.br/eprocV2/controlador.php?acao=videoconferencia_consultar&*
// @version     1
// @grant       none
// ==/UserScript==
$('#divInfraAreaDados').css('height', '');
$(window).on('load', corrigir);
$(winows).on('resize', corrigir);

function corrigir() {
  $('#divInfraAreaTela').css('height', '');
}
