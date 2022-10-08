import { Handler } from '@nadameu/handler';
import { getAjaxListener } from './AjaxListener';

function addSelectOneMenuListener(prefixo: string, fn: Handler<string>) {
  var painelOpcoes = document.getElementById(`${prefixo}_panel`);
  var select = document.getElementById(`${prefixo}_input`);
  painelOpcoes.addEventListener(
    'click',
    evt => {
      var elementoClicado = evt.target;
      if (elementoClicado instanceof HTMLElement && elementoClicado.matches('li[data-label]')) {
        return fn(select.value);
      }
    },
    false
  );
}

export function abrirDetalhesVeiculo(ord: number) {
  console.debug('Pagina.abrirDetalhesVeiculo(ord)', ord);
  var prefixo = obterPrefixoVeiculo(ord);
  var idDivDetalhes = `${prefixo}:detalhe-veiculo`,
    divDetalhes = document.getElementById(idDivDetalhes);
  var abrirDetalhes = divDetalhes.previousElementSibling,
    idAbrirDetalhes = abrirDetalhes.id;
  var promise = getAjaxListener()
    .listenOnce(idAbrirDetalhes)
    .then(() => document.getElementById(`${prefixo}:panel-group-dados-veiculo`));
  abrirDetalhes.click();
  return promise;
}

export function abrirRestricoesVeiculo(ord: number) {
  console.debug('Pagina.abrirDetalhesVeiculo(ord)', ord);
  var prefixo = obterPrefixoVeiculo(ord);
  var idAbrirRestricoes = `${prefixo}:link-detalhes-veiculo-restricoes`,
    abrirRestricoes = document.getElementById(idAbrirRestricoes);
  var promise = getAjaxListener()
    .listenOnce(idAbrirRestricoes)
    .then(() => {
      var idDialogo = `${prefixo}:dlg-detalhes-veiculo-restricoes`,
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
}

export function addOnMagistradoChangeListener(fn: Handler<string>) {
  addSelectOneMenuListener('form-incluir-restricao:campo-magistrado', fn);
}

export function addOnMunicipioChangeListener(fn: Handler<string>) {
  addSelectOneMenuListener('form-incluir-restricao:campo-municipio', fn);
}

export function addOnOrgaoChangeListener(fn: Handler<string>) {
  addSelectOneMenuListener('form-incluir-restricao:campo-orgao', fn);
}

export function aguardarProximaPaginaListagem(pagina: number) {
  console.debug('Pagina.aguardarProximaPaginaListagem(pagina)', pagina);
  var promise = new Promise((resolve, reject) => {
    var onPaginaCarregada = () => {
      console.info('pagina carregada');
      var botoesPagina = [...document.getElementsByClassName('ui-paginator-page')].filter(botao =>
        botao.classList.contains('ui-state-active')
      );
      if (botoesPagina.length === 2 && Number(botoesPagina[0].textContent) === pagina) {
        resolve();
      } else if (botoesPagina.length === 2) {
        getAjaxListener()
          .listenOnce('form-incluir-restricao:lista-veiculo')
          .then(onPaginaCarregada);
      } else {
        reject();
      }
    };
    getAjaxListener().listenOnce('form-incluir-restricao:lista-veiculo').then(onPaginaCarregada);
  });
  return promise;
}

export function fecharDetalhesVeiculo(ord: number) {
  console.debug('Pagina.fecharDetalhesVeiculo(ord)', ord);
  var prefixo = obterPrefixoVeiculo(ord);
  var idDivDetalhes = `${prefixo}:detalhe-veiculo`,
    divDetalhes = document.getElementById(idDivDetalhes);
  var fecharDetalhes = divDetalhes.getElementsByTagName('button')[1];
  fecharDetalhes.click();
}

export function fecharRestricoesVeiculo(ord: number) {
  console.debug('Pagina.fecharRestricoesVeiculo(ord)', ord);
  var prefixo = obterPrefixoVeiculo(ord);
  var idDivDetalhesRestricoes = `${prefixo}:dlg-detalhes-veiculo-restricoes`,
    divDetalhesRestricoes = document.getElementById(idDivDetalhesRestricoes);
  var fecharRestricoes = divDetalhesRestricoes.getElementsByTagName('button')[1];
  fecharRestricoes.click();
}

export function imprimir() {
  console.debug('Pagina.imprimir()');
  window.print();
}

export function imprimirSemVeiculos() {
  console.debug('Pagina.imprimirSemVeiculos()');
  var veiculos = document.getElementById('form-incluir-restricao:panel-lista-veiculo');
  veiculos.style.display = 'none';
  imprimir();
  veiculos.style.display = '';
}

export function limpar() {
  console.debug('Pagina.limpar()');
  var promise = Promise.resolve();
  var form = document.getElementById('form-incluir-restricao:panel-lista-veiculo');
  var botoes = [...form.getElementsByTagName('button')].filter(
    botao => botao.textContent.trim() === 'Limpar lista'
  );
  if (botoes.length === 1) {
    var botaoLimpar = botoes[0],
      idBotaoLimpar = botaoLimpar.id;
    promise = getAjaxListener().listenOnce(idBotaoLimpar);
    botaoLimpar.click();
  }
  promise = promise.then(limparPesquisa);
  return promise;
}

export function limparPesquisa() {
  console.debug('Pagina.limparPesquisa()');
  var idBotaoPesquisar = 'form-incluir-restricao:botao-pesquisar',
    botaoPesquisar = document.getElementById(idBotaoPesquisar);
  var botaoLimparPesquisa = botaoPesquisar.nextElementSibling,
    idBotaoLimparPesquisa = botaoLimparPesquisa.id;
  var promise = getAjaxListener().listenOnce(idBotaoLimparPesquisa);
  botaoLimparPesquisa.click();
  return promise;
}

export function obterCelulaRestricaoVeiculo(ord: number) {
  console.debug('Pagina.obterCelulaRestricaoVeiculo(ord)', ord);
  var linha = obterLinhaVeiculo(ord);
  return linha.cells[8];
}

export function obterLinhaVeiculo(ord: number) {
  console.debug('Pagina.obterLinhaVeiculo(ord)', ord);
  var tBody = document.getElementById('form-incluir-restricao:lista-veiculo_data');
  return tBody.rows[ord % 100];
}

export function obterMagistrado() {
  return document.getElementById('form-incluir-restricao:campo-magistrado_input').value;
}

export function obterMunicipio() {
  return document.getElementById('form-incluir-restricao:campo-municipio_input').value;
}

export function obterOrgao() {
  return document.getElementById('form-incluir-restricao:campo-orgao_input').value;
}

export function obterPlacaVeiculo(ord: number) {
  console.debug('Pagina.obterPlacaVeiculo(ord)', ord);
  var linha = obterLinhaVeiculo(ord);
  var celulaPlaca = linha.cells[1];
  return celulaPlaca.textContent;
}

export function obterPrefixoVeiculo(ord: number) {
  console.debug('Pagina.obterPrefixoVeiculo(ord)', ord);
  return `form-incluir-restricao:lista-veiculo:${ord}`;
}

export function obterVeiculosDocumento(documento: string) {
  console.debug('Pagina.obterVeiculosDocumento(documento)', documento);
  var idBotaoPesquisar = 'form-incluir-restricao:botao-pesquisar';
  var botaoPesquisar = document.getElementById(idBotaoPesquisar);
  var campoDocumento = document.getElementById('form-incluir-restricao:campo-cpf-cnpj');
  var promise = getAjaxListener()
    .listenOnce(idBotaoPesquisar)
    .then(ext => {
      if (ext === null) {
        return 0;
      } else {
        return ext.totalRecords;
      }
    });
  campoDocumento.value = documento;
  botaoPesquisar.click();
  return promise;
}

export function veiculoPossuiRestricoes(ord: number) {
  console.debug('Pagina.veiculoPossuiRestricoes(ord)', ord);
  var celulaRestricoes = obterCelulaRestricaoVeiculo(ord);
  return celulaRestricoes.textContent === 'Sim';
}
