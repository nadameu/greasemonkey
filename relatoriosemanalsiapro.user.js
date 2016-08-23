// ==UserScript==
// @name        Relatório semanal SIAPRO
// @namespace   http://nadameu.com.br/relatorio-semanal
// @include     http://sap.trf4.gov.br/estatistica/controlador.php?menu=8&submenu=3*
// @version     1
// @grant       none
// ==/UserScript==

function criarBotao() {
  var botao = document.createElement('button');
  botao.textContent = 'Gerar relatório semanal';
  var areaTelaD = document.getElementById('divInfraAreaTelaD');
  areaTelaD.insertBefore(botao, areaTelaD.firstChild);
  return {
    adicionarEvento: botao.addEventListener.bind(botao, 'click'),
    remover() {
      areaTelaD.removeChild(botao);
    }
  };
}

function selecionarCompetencias(...competencias) {
  var options = [...document.getElementById('selCompetencia').getElementsByTagName('option')];
  options.forEach(function(option) {
    if (competencias.indexOf(option.value) > -1) {
      option.selected = true;
    } else {
      option.selected = false;
    }
  });
}

switch (sessionStorage.passo) {
  case 'setup':
    console.info('setup');
    document.getElementById('rdoDadosS').checked = true;
    document.getElementById('rdoDadosEv1').checked = false;
    document.getElementById('rdoDadosEv2').checked = true;
    document.getElementById('selEstatistica').value = '23';
    selecionarCompetencias('41', '43');
    break;

  default:
    console.info('início');
    var botao = criarBotao();
    botao.adicionarEvento(function() {
      sessionStorage.passo = 'setup';
      botao.remover();
      location.href = '?menu=8&submenu=3';
    });
    break;
}
