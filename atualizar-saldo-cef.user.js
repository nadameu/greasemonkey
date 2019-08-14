// ==UserScript==
// @name Atualizar saldo CEF
// @namespace http://nadameu.com.br/
// @include https://eproc.jfpr.jus.br/eprocV2/controlador.php?acao=subfrm_atualizar_saldo_conta&*
// @include https://eproc.jfrs.jus.br/eprocV2/controlador.php?acao=subfrm_atualizar_saldo_conta&*
// @include https://eproc.jfsc.jus.br/eprocV2/controlador.php?acao=subfrm_atualizar_saldo_conta&*
// @include https://eproc.trf4.jus.br/eproc2trf4/controlador.php?acao=subfrm_atualizar_saldo_conta&*
// @grant none
// @run-at document-end
// ==/UserScript==

document.getElementById('txtUsuario').removeAttribute('autocomplete');
document.getElementById('txtSenha').removeAttribute('autocomplete');
