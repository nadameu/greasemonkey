// ==UserScript==
// @name        Relatório semanal
// @namespace   http://nadameu.com.br/relatorio-semanal
// @include     /^https:\/\/eproc\.(jf(pr|rs|sc)|trf4)\.jus\.br\/eproc(V2|2trf4)\/controlador\.php\?acao=relatorio_geral_listar\&/
// @include     /^https:\/\/eproc\.(jf(pr|rs|sc)|trf4)\.jus\.br\/eproc(V2|2trf4)\/controlador\.php\?acao=relatorio_geral_consultar\&/
// @version     1
// @grant       none
// ==/UserScript==

function openDatabase() {
  return new Promise(function(resolve, reject) {
    let request = indexedDB.open('relatorioSemanal', 1);
    request.onerror = reject;
    request.onsuccess = function(evt) {
      resolve(evt.target.result);
    };
  });
}

openDatabase().then(function(db) {
  console.log(db);
}).catch(function(err) {
  console.error(err);
});

var dados = JSON.parse(localStorage.getItem('relatorioSemanal'));
console.log(dados);
if (! dados) {
  dados = {
    emAndamento: false
  };
}

var [ , acao ] = window.location.search.match(/\^?acao=([^&]+)&/);

if (acao === 'relatorio_geral_listar') {

  let consultarNivel = function(nivel) {
    let limpar = $('#btnLimparCookie');
    limpar.click();

    let sigilo = $('#selIdSigilo');
    sigilo.val(nivel);
    sigilo.trigger('change');

    $('#optNdiasSituacao').get(0).checked = true;
    $('#optPaginacao100').get(0).checked = true;

    /* TESTE COM PAGINAÇÃO */
    $('#optPaginacao100').val(7);

    let consultar = document.getElementById('btnConsultar');
    consultar.click();
  };

  let buttons = [2, 3, 4].map(function(nivel) {
    let button = $(`<button>Nível ${nivel}</button>`);
    button.on('click', consultarNivel.bind(null, nivel));
    return button;
  });

  let area = $('#divInfraAreaTelaD');
  area.prepend(buttons);

} else {
  let pagina = $('#selInfraPaginacaoSuperior'), paginas = $('option', pagina);
  console.log('// obter dados do processo, página ' + pagina.val());
  if (paginas.size() && pagina.val() < paginas.size()) {
    NextPagina('+');
  } else {
    $('#btnVoltar').click();
  }
}

localStorage.setItem('relatorioSemanal', JSON.stringify(dados));
