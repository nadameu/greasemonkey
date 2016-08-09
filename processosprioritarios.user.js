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

    var camposPost = [
      'optchkcClasse',
      'optDataAutuacao',
      'optchkcUltimoEvento',
      'optNdiasSituacao',
      'optPrioridadeAtendimento',
      'chkStatusProcesso'
    ];
    var data = { paginacao: '25' };
    camposPost.forEach((campo) => data[campo] = 'S');

    var linhas = $('#divInfraAreaTabela table tr[class^="infraTr"]');
    var links = linhas.find('a[href]');
    var promises = [], processos = [];

    links.each(function(indiceLink, link) {
      var camposGet = {}, pares = link.search.split(/^\?/)[1].split('&');
      pares.forEach(function(par) {
        var [nome, valor] = par.split('=');
        nome = decodeURIComponent(nome);
        valor = decodeURIComponent(valor);
        camposGet[nome] = valor;
      });
      promises[promises.length] = $.post(link.href, data, function(ret, result, xhr) {
        let doc = $.parseHTML(ret);
        let nomeLocalizador = $(doc).find('#selLocalizador option[value="' + camposGet.selLocalizador + '"]').text();
        console.info(nomeLocalizador);
        let proxima = $(doc).find('#lnkInfraProximaPaginaSuperior');
        if (proxima.size()) {
          console.log('Buscando próxima página');
          console.log('Atual:', $(doc).find('#hdnInfraPaginaAtual').val());
          $(doc).find('#hdnInfraPaginaAtual')[0].value++;
          let form = proxima.parents('form');
          form.find('#selLocalizador').val(camposGet.selLocalizador);
          console.info(form[0].action, form.serialize());
          return $.post(link.href, form.serialize(), function(ret2) {
            console.info('Página obtida!');
            let doc2 = $.parseHTML(ret2);
            let proxima2 = $(doc2).find('#lnkInfraProximaPaginaSuperior');
            var linhas2 = $(doc2).find('#divInfraAreaTabela > table > tbody > tr[class^="infraTr"]');
            console.info(linhas2);
          }, 'html');
        }
        var linhas = $(doc).find('#divInfraAreaTabela > table > tbody > tr[class^="infraTr"]');
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
