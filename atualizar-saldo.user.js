// ==UserScript==
// @name        atualizar-saldos
// @name:pt-BR  Atualizar saldos
// @namespace   http://nadameu.com.br
// @match       https://eproc.jfpr.jus.br/eprocV2/controlador.php?acao=processo_precatorio_rpv&*
// @match       https://eproc.jfrs.jus.br/eprocV2/controlador.php?acao=processo_precatorio_rpv&*
// @match       https://eproc.jfsc.jus.br/eprocV2/controlador.php?acao=processo_precatorio_rpv&*
// @match       https://eproc.trf4.jus.br/eproc2trf4/controlador.php?acao=processo_precatorio_rpv&*
// @grant       none
// @version     1.0.0
// @author      nadameu
// @description Atualiza o saldo de contas judiciais
// ==/UserScript==

function comecar() {
  const contas = $('[href^="javascript:atualizarSaldo"]');
  $.ajaxSetup({
    complete(xhr, result) {
      if (result !== 'success') return;
      if (xhr.responseText.match(/"saldo_valor_disponivel"/)) {
        atualizar('saldo');
      } else if (xhr.responseText.match(/"htmlBloqueiosConta"/)) {
        atualizar('bloqueios');
      }
    },
  });
  let aguarda = { conta: 0, tipo: 'saldo' };
  function atualizar(tipo) {
    if (tipo !== aguarda.tipo) return;
    if (tipo === 'saldo') {
      aguarda = { ...aguarda, tipo: 'bloqueios' };
      return;
    } else if (tipo === 'bloqueios') {
      if (aguarda.conta + 1 > contas.length) return;
      aguarda = { conta: aguarda.conta + 1, tipo: 'saldo' };
      window.location.href = contas[aguarda.conta].href;
    }
  }
  if (contas.length > 0) window.location.href = contas[aguarda.conta].href;
}

function main() {
  const barra = document.getElementById('divInfraBarraLocalizacao');
  if (!barra) return;
  const contas = $('[href^="javascript:atualizarSaldo"]');
  if (contas.length === 0) return;
  const btn = document.createElement('button');
  btn.textContent = 'Atualizar saldos';
  btn.addEventListener('click', comecar, { once: true });
  barra.insertAdjacentElement('afterend', btn);
}

main();
