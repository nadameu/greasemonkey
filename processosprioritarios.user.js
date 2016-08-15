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

    infraExibirAviso(false, '<center>Carregando dados dos processos...<br/><progress id="gmProgresso" value="0" max="1"></progress><output id="gmOutput"></output></center>');
    var progresso = $('#gmProgresso'), output = $('#gmOutput');

    var data = { paginacao: '100' };
    var camposPost = [
      'optchkcClasse',
      'optDataAutuacao',
      'optchkcUltimoEvento',
      'optNdiasSituacao',
      'optPrioridadeAtendimento',
      'chkStatusProcesso'
    ];
    camposPost.forEach((campo) => data[campo] = 'S');

    var links = $('#divInfraAreaTabela table a[href]');
    progresso[0].max = Array.prototype.reduce.call(links, (val, link) => val + Number(link.textContent), 0);
    output.text('0 / ' + progresso[0].max);
    var promises = [], processos = [];

    var cookiesAntigos = parseCookies(document.cookie);

    function trataHtml(camposGet, link) {
      return function(ret, result, xhr) {
        let doc = $.parseHTML(ret);
        let nomeLocalizador = $(doc).find('#selLocalizador option[value="' + camposGet.selLocalizador + '"]').text();
        let pagina = Number($(doc).find('#hdnInfraPaginaAtual').val());
        progresso[0].value += Number($(doc).find('#hdnInfraNroItens').val());
        output.text(progresso[0].value + ' / ' + progresso[0].max);
        var linhas = $(doc).find('#divInfraAreaTabela > table > tbody > tr[class^="infraTr"]');
        console.info(nomeLocalizador + ', página ' + pagina, linhas.length, 'processos');
        linhas.each(function(indiceLinha, linha) {
          linha.dataset.localizador = nomeLocalizador;
          linha.dataset.idLocalizador = camposGet.selLocalizador;
          processos.push(linha);
        });
        let proxima = $(doc).find('#lnkInfraProximaPaginaSuperior');
        if (proxima.size()) {
          console.info('Buscando próxima página');
          $(doc).find('#hdnInfraPaginaAtual')[0].value++;
          let form = proxima.parents('form');
          form.find('#selLocalizador').val(camposGet.selLocalizador);
          return $.post(link.href, form.serialize(), 'html').then(trataHtml(camposGet, link));
        }
      };
    }

    links.each(function(indiceLink, link) {
      var camposGet = {}, pares = link.search.split(/^\?/)[1].split('&');
      pares.forEach(function(par) {
        var [nome, valor] = par.split('=');
        nome = decodeURIComponent(nome);
        valor = decodeURIComponent(valor);
        camposGet[nome] = valor;
      });
      $(link).parents('tr')[0].dataset.idLocalizador = camposGet.selLocalizador;
      promises[promises.length] = $.post(link.href, data, 'html').then(trataHtml(camposGet, link));
    });
    Promise.all(promises).then(function() {
      console.info('all done', processos.length);
      infraOcultarAviso();
      var cookiesAtuais = parseCookies(document.cookie);
      var expira = new Date();
      expira.setFullYear(expira.getFullYear() + 1);
      for (let n in cookiesAtuais) {
        if (cookiesAtuais[n] !== cookiesAntigos[n]) {
          document.cookie = encodeURIComponent(n) + '=' + encodeURIComponent(cookiesAntigos[n]) + ';expires=' + expira.toUTCString();
        }
      }
      links.each(function(indiceLink, link) {
        let linha = $(link).parents('tr')[0];
        let idLocalizador = linha.dataset.idLocalizador;
        let processosLocalizador = processos.filter((processo) => processo.dataset.idLocalizador === idLocalizador);
        let vermelho = 0, amarelo = 0, verde = 0;
        processosLocalizador.forEach(function(processo) {
          let hoje = new Date();
          let ultimoEvento = parseDataHora(processo.cells[8].innerHTML);
          let prioridade = processo.cells[9].textContent;
          if (prioridade === 'Sim') {
            vermelho++;
          } else if (ultimoEvento.getTime() < (hoje.getTime() - 60*864e5)) {
            amarelo++;
          } else {
            verde++;
          }
        });
        linha.cells[1].innerHTML = [
          '<span class="gmProcessos gmPrioridade1' + (vermelho > 0 ? '' : ' gmVazio') + '">' + vermelho + '</span>',
          '<span class="gmProcessos gmPrioridade2' + (amarelo > 0 ? '' : ' gmVazio') + '">' + amarelo + '</span>',
          '<span class="gmProcessos gmPrioridade3' + (verde > 0 ? '' : ' gmVazio') + '">' + verde + '</span>'
        ].join('');
        console.info(linha.cells[0].textContent, processosLocalizador.length);
      });
      console.info(processos);
    });
  });
  var estilos = $('<style></style>');
  estilos.html([
    '.gmProcessos { display: inline-block; margin: 0 2px; padding: 0 5px; font-weight: bold; border-radius: 25%; color: black; }',
    '.gmProcessos.gmPrioridade1 { background-color: #ff8a8a; }',
    '.gmProcessos.gmPrioridade2 { background-color: #ff8; }',
    '.gmProcessos.gmPrioridade3 { background-color: #8aff8a; }',
    '.gmProcessos.gmVazio { opacity: 0.5; color: #888; }'
  ].join('\n'));
  $('head').append(estilos);
} else if (/\?acao=localizador_processos_lista\&/.test(location.search)) {
}

function parseCookies(texto) {
  let obj = {};
  let pairs = texto.split('; ');
  pairs.forEach(function(pair) {
    let [key, val] = pair.split('=');
    key = decodeURIComponent(key);
    val = decodeURIComponent(val);
    obj[key] = val;
  });
  return obj;
}

function parseDataHora(texto) {
  let [d,m,y,h,i,s] = texto.split(/\W/g);
  console.info(texto, d,m,y,h,i,s);
  return new Date(y, m - 1, d, h, i, s);
}
