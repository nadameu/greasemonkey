import { AjaxListener } from './AjaxListener';

export var Pagina = (function () {
  'use strict';

  function addSelectOneMenuListner(prefixo, fn) {
    var painelOpcoes = document.getElementById(prefixo + '_panel');
    var select = document.getElementById(prefixo + '_input');
    painelOpcoes.addEventListener(
      'click',
      function (evt) {
        var elementoClicado = evt.target;
        if (
          elementoClicado.tagName.toUpperCase() === 'LI' &&
          elementoClicado.dataset.hasOwnProperty('label')
        ) {
          return fn(select.value);
        }
      },
      false
    );
  }

  var Pagina = {
    abrirDetalhesVeiculo(ord) {
      console.debug('Pagina.abrirDetalhesVeiculo(ord)', ord);
      var prefixo = Pagina.obterPrefixoVeiculo(ord);
      var idDivDetalhes = prefixo + ':detalhe-veiculo',
        divDetalhes = document.getElementById(idDivDetalhes);
      var abrirDetalhes = divDetalhes.previousElementSibling,
        idAbrirDetalhes = abrirDetalhes.id;
      var promise = AjaxListener.listenOnce(idAbrirDetalhes).then(function () {
        return document.getElementById(prefixo + ':panel-group-dados-veiculo');
      });
      abrirDetalhes.click();
      return promise;
    },
    abrirRestricoesVeiculo(ord) {
      console.debug('Pagina.abrirDetalhesVeiculo(ord)', ord);
      var prefixo = Pagina.obterPrefixoVeiculo(ord);
      var idAbrirRestricoes = prefixo + ':link-detalhes-veiculo-restricoes',
        abrirRestricoes = document.getElementById(idAbrirRestricoes);
      var promise = AjaxListener.listenOnce(idAbrirRestricoes).then(function () {
        var idDialogo = prefixo + ':dlg-detalhes-veiculo-restricoes',
          dialogo = document.getElementById(idDialogo);
        var fieldsets = dialogo.getElementsByTagName('fieldset');
        var painelRestricoes = fieldsets[1];
        var listaRestricoes = painelRestricoes.getElementsByTagName('ul');
        if (listaRestricoes.length > 0) {
          listaRestricoes = [...listaRestricoes[0].childNodes].map(li => li.textContent.trim());
        } else {
          listaRestricoes = [];
        }
        var painelRestricoesRenajud = fieldsets[2];
        return {
          painel: painelRestricoes,
          lista: listaRestricoes,
          renajud: painelRestricoesRenajud,
        };
      });
      abrirRestricoes.click();
      return promise;
    },
    addOnMagistradoChangeListener(fn) {
      addSelectOneMenuListner('form-incluir-restricao:campo-magistrado', fn);
    },
    addOnMunicipioChangeListener(fn) {
      addSelectOneMenuListner('form-incluir-restricao:campo-municipio', fn);
    },
    addOnOrgaoChangeListener(fn) {
      addSelectOneMenuListner('form-incluir-restricao:campo-orgao', fn);
    },
    aguardarProximaPaginaListagem(pagina) {
      console.debug('Pagina.aguardarProximaPaginaListagem(pagina)', pagina);
      var promise = new Promise(function (resolve, reject) {
        var onPaginaCarregada = function () {
          console.info('pagina carregada');
          var botoesPagina = [...document.getElementsByClassName('ui-paginator-page')].filter(
            botao => botao.classList.contains('ui-state-active')
          );
          if (botoesPagina.length === 2 && Number(botoesPagina[0].textContent) === pagina) {
            resolve();
          } else if (botoesPagina.length === 2) {
            AjaxListener.listenOnce('form-incluir-restricao:lista-veiculo').then(onPaginaCarregada);
          } else {
            reject();
          }
        };
        AjaxListener.listenOnce('form-incluir-restricao:lista-veiculo').then(onPaginaCarregada);
      });
      return promise;
    },
    fecharDetalhesVeiculo(ord) {
      console.debug('Pagina.fecharDetalhesVeiculo(ord)', ord);
      var prefixo = Pagina.obterPrefixoVeiculo(ord);
      var idDivDetalhes = prefixo + ':detalhe-veiculo',
        divDetalhes = document.getElementById(idDivDetalhes);
      var fecharDetalhes = divDetalhes.getElementsByTagName('button')[1];
      fecharDetalhes.click();
    },
    fecharRestricoesVeiculo(ord) {
      console.debug('Pagina.fecharRestricoesVeiculo(ord)', ord);
      var prefixo = Pagina.obterPrefixoVeiculo(ord);
      var idDivDetalhesRestricoes = prefixo + ':dlg-detalhes-veiculo-restricoes',
        divDetalhesRestricoes = document.getElementById(idDivDetalhesRestricoes);
      var fecharRestricoes = divDetalhesRestricoes.getElementsByTagName('button')[1];
      fecharRestricoes.click();
    },
    imprimir() {
      console.debug('Pagina.imprimir()');
      window.print();
    },
    imprimirSemVeiculos() {
      console.debug('Pagina.imprimirSemVeiculos()');
      var veiculos = document.getElementById('form-incluir-restricao:panel-lista-veiculo');
      veiculos.style.display = 'none';
      Pagina.imprimir();
      veiculos.style.display = '';
    },
    limpar() {
      console.debug('Pagina.limpar()');
      var promise = Promise.resolve();
      var form = document.getElementById('form-incluir-restricao:panel-lista-veiculo');
      var botoes = [...form.getElementsByTagName('button')].filter(
        botao => botao.textContent.trim() === 'Limpar lista'
      );
      if (botoes.length === 1) {
        var botaoLimpar = botoes[0],
          idBotaoLimpar = botaoLimpar.id;
        promise = AjaxListener.listenOnce(idBotaoLimpar);
        botaoLimpar.click();
      }
      promise = promise.then(Pagina.limparPesquisa);
      return promise;
    },
    limparPesquisa() {
      console.debug('Pagina.limparPesquisa()');
      var idBotaoPesquisar = 'form-incluir-restricao:botao-pesquisar',
        botaoPesquisar = document.getElementById(idBotaoPesquisar);
      var botaoLimparPesquisa = botaoPesquisar.nextElementSibling,
        idBotaoLimparPesquisa = botaoLimparPesquisa.id;
      var promise = AjaxListener.listenOnce(idBotaoLimparPesquisa);
      botaoLimparPesquisa.click();
      return promise;
    },
    obterCelulaRestricaoVeiculo(ord) {
      console.debug('Pagina.obterCelulaRestricaoVeiculo(ord)', ord);
      var linha = Pagina.obterLinhaVeiculo(ord);
      return linha.cells[8];
    },
    obterLinhaVeiculo(ord) {
      console.debug('Pagina.obterLinhaVeiculo(ord)', ord);
      var tBody = document.getElementById('form-incluir-restricao:lista-veiculo_data');
      return tBody.rows[ord % 100];
    },
    obterMagistrado() {
      return document.getElementById('form-incluir-restricao:campo-magistrado_input').value;
    },
    obterMunicipio() {
      return document.getElementById('form-incluir-restricao:campo-municipio_input').value;
    },
    obterOrgao() {
      return document.getElementById('form-incluir-restricao:campo-orgao_input').value;
    },
    obterPlacaVeiculo(ord) {
      console.debug('Pagina.obterPlacaVeiculo(ord)', ord);
      var linha = Pagina.obterLinhaVeiculo(ord);
      var celulaPlaca = linha.cells[1];
      return celulaPlaca.textContent;
    },
    obterPrefixoVeiculo(ord) {
      console.debug('Pagina.obterPrefixoVeiculo(ord)', ord);
      return 'form-incluir-restricao:lista-veiculo:' + ord;
    },
    obterVeiculosDocumento(documento) {
      console.debug('Pagina.obterVeiculosDocumento(documento)', documento);
      var idBotaoPesquisar = 'form-incluir-restricao:botao-pesquisar';
      var botaoPesquisar = document.getElementById(idBotaoPesquisar);
      var campoDocumento = document.getElementById('form-incluir-restricao:campo-cpf-cnpj');
      var promise = AjaxListener.listenOnce(idBotaoPesquisar).then(function (ext) {
        if (ext === null) {
          return 0;
        } else {
          return ext.totalRecords;
        }
      });
      campoDocumento.value = documento;
      botaoPesquisar.click();
      return promise;
    },
    veiculoPossuiRestricoes(ord) {
      console.debug('Pagina.veiculoPossuiRestricoes(ord)', ord);
      var celulaRestricoes = Pagina.obterCelulaRestricaoVeiculo(ord);
      return celulaRestricoes.textContent === 'Sim';
    },
  };
  return Pagina;
})();
