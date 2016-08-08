// ==UserScript==
// @name        Processos prioritários
// @namespace   http://nadameu.com.br/processos-prioritarios
// @include     /^https:\/\/eproc\.(jf(pr|rs|sc)|trf4)\.jus\.br/eproc(V2|2trf4)/controlador\.php\?acao\=usuario_tipo_monitoramento_localizador_listar\&/
// @include     /^https:\/\/eproc\.(jf(pr|rs|sc)|trf4)\.jus\.br/eproc(V2|2trf4)/controlador\.php\?acao\=localizador_processos_lista\&/
// @version     1
// @grant       none
// ==/UserScript==
if (/\?acao=usuario_tipo_monitoramento_localizador_listar\&/.test(location.search)) {
  $('#divInfraAreaTelaD').prepend('<button id="teste">Teste</button>');
  $('#teste').on('click', function() {
    var linhas = $('#divInfraAreaTabela table tr[class^="infraTr"]');
    var links = linhas.find('a[href^="controlador.php?acao=localizador_processos_lista&acao_origem=localizador_orgao_listar&acao_retorno=principal&selLocalizador="]');
    var campos = [
      'optchkcClasse',
      'optDataAutuacao',
      'optchkcUltimoEvento',
      'optNdiasSituacao',
      'optPrioridadeAtendimento',
      'chkStatusProcesso'
    ];
    let data = {};
    campos.forEach((campo) => data[campo] = 'S');
    data.paginacao = '100';
    var promises = [], processos = [];
    links.each(function(indiceLink, link) {
      promises[promises.length] = $.post(link.href, data, function(ret) {
        var linhas = $(ret).find('#divInfraAreaTabela > table > tbody > tr[class^="infraTr"]');
        console.info(linhas.length);
        linhas.each(function(indiceLinha, linha) {
          linha.dataset.localizador = $(link).parents('tr').find('td')[0].textContent;
          processos.push(linha);
        });
      }, 'html');
    });
    Promise.all(promises).then(function() {
      console.info('all done', processos);
    });
  });
} else if (/\?acao=localizador_processos_lista\&/.test(location.search)) {
}
