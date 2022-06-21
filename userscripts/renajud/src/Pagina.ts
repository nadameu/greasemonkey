import {
  assert,
  isLiteral,
  isNotNull,
  isNonEmptyString,
  isNotNullish,
  negate,
} from '@nadameu/predicates';
import * as AjaxListener from './AjaxListener';
import { obterPorId, obterPorTipoId } from './obter';

function addSelectOneMenuListener(prefixo: string, fn: (value: string) => void) {
  const painelOpcoes = obterPorId(prefixo + '_panel');
  const select = obterPorTipoId('input', prefixo + '_input');
  painelOpcoes.addEventListener(
    'click',
    evt => {
      const elementoClicado = evt.target!;
      if (
        elementoClicado instanceof HTMLLIElement &&
        elementoClicado.dataset.hasOwnProperty('label')
      ) {
        return fn(select.value);
      }
    },
    false
  );
}

export function abrirDetalhesVeiculo(ord: number) {
  console.debug('Pagina.abrirDetalhesVeiculo(ord)', ord);
  const prefixo = obterPrefixoVeiculo(ord);
  const idDivDetalhes = prefixo + ':detalhe-veiculo',
    divDetalhes = obterPorId(idDivDetalhes);
  const abrirDetalhes = divDetalhes.previousElementSibling as HTMLElement | null,
    idAbrirDetalhes = abrirDetalhes?.id;
  assert(
    isNotNull(abrirDetalhes) && isNotNullish(idAbrirDetalhes),
    'Não encontrado: abrir detalhes.'
  );
  const promise = AjaxListener.listenOnce(idAbrirDetalhes).then(function () {
    return obterPorId(prefixo + ':panel-group-dados-veiculo');
  });
  abrirDetalhes.click();
  return promise;
}
export function abrirRestricoesVeiculo(ord: number) {
  console.debug('Pagina.abrirDetalhesVeiculo(ord)', ord);
  const prefixo = obterPrefixoVeiculo(ord);
  const idAbrirRestricoes = prefixo + ':link-detalhes-veiculo-restricoes',
    abrirRestricoes = obterPorId(idAbrirRestricoes);
  const promise = AjaxListener.listenOnce(idAbrirRestricoes).then(function () {
    const idDialogo = prefixo + ':dlg-detalhes-veiculo-restricoes',
      dialogo = obterPorId(idDialogo);
    const fieldsets = dialogo.getElementsByTagName('fieldset');
    assert(fieldsets.length >= 3, 'Não encontrado: painel de restrições.');
    const painelRestricoes = fieldsets[1]!;
    const listasRestricoes = painelRestricoes.getElementsByTagName('ul');
    let listaRestricoes: string[] = [];
    if (listasRestricoes.length > 0) {
      listaRestricoes = Array.from(listasRestricoes[0]!.childNodes)
        .map(li => li.textContent?.trim())
        .filter(isNotNullish);
    }
    const painelRestricoesRenajud = fieldsets[2]!;
    return {
      painel: painelRestricoes,
      lista: listaRestricoes,
      renajud: painelRestricoesRenajud,
    };
  });
  abrirRestricoes.click();
  return promise;
}
export function addOnMagistradoChangeListener(fn: (_: string) => void) {
  addOnChangeListener('magistrado', fn);
}
function addOnMunicipioChangeListener(fn: (_: string) => void) {
  addOnChangeListener('municipio', fn);
}
function addOnOrgaoChangeListener(fn: (_: string) => void) {
  addOnChangeListener('orgao', fn);
}
function addOnChangeListener(campo: string, fn: (_: string) => void) {
  addSelectOneMenuListener(`form-incluir-restricao:campo-${campo}`, fn);
}
export function aguardarProximaPaginaListagem(pagina: number) {
  console.debug('Pagina.aguardarProximaPaginaListagem(pagina)', pagina);
  const promise = new Promise<void>(function (resolve, reject) {
    const onPaginaCarregada = function () {
      console.info('pagina carregada');
      const botoesPagina = [...document.getElementsByClassName('ui-paginator-page')].filter(botao =>
        botao.classList.contains('ui-state-active')
      );
      if (botoesPagina.length === 2 && Number(botoesPagina[0]!.textContent) === pagina) {
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
}
export function fecharDetalhesVeiculo(ord: number) {
  console.debug('Pagina.fecharDetalhesVeiculo(ord)', ord);
  const prefixo = obterPrefixoVeiculo(ord);
  const idDivDetalhes = prefixo + ':detalhe-veiculo',
    divDetalhes = obterPorId(idDivDetalhes);
  const fecharDetalhes = divDetalhes.getElementsByTagName('button')[1];
  assert(isNotNullish(fecharDetalhes), 'Não encontrado: fechar detalhes.');
  fecharDetalhes.click();
}
export function fecharRestricoesVeiculo(ord: number) {
  console.debug('Pagina.fecharRestricoesVeiculo(ord)', ord);
  const prefixo = obterPrefixoVeiculo(ord);
  const idDivDetalhesRestricoes = prefixo + ':dlg-detalhes-veiculo-restricoes',
    divDetalhesRestricoes = obterPorId(idDivDetalhesRestricoes);
  const fecharRestricoes = divDetalhesRestricoes.getElementsByTagName('button')[1];
  assert(isNotNullish(fecharRestricoes), 'Não encontrado: fechar restrições.');
  fecharRestricoes.click();
}
export function imprimir() {
  console.debug('Pagina.imprimir()');
  window.print();
}
export function imprimirSemVeiculos() {
  console.debug('Pagina.imprimirSemVeiculos()');
  const veiculos = obterPorId('form-incluir-restricao:panel-lista-veiculo');
  veiculos.style.display = 'none';
  imprimir();
  veiculos.style.display = '';
}
export function limpar() {
  console.debug('Pagina.limpar()');
  let promise: Promise<unknown> = Promise.resolve();
  const form = obterPorId('form-incluir-restricao:panel-lista-veiculo');
  const botoes = [...form.getElementsByTagName('button')].filter(
    botao => (botao.textContent?.trim() ?? '') === 'Limpar lista'
  );
  if (botoes.length === 1) {
    const botaoLimpar = botoes[0]!,
      idBotaoLimpar = botaoLimpar.id;
    promise = AjaxListener.listenOnce(idBotaoLimpar);
    botaoLimpar.click();
  }
  promise = promise.then(limparPesquisa);
  return promise;
}
export function limparPesquisa() {
  console.debug('Pagina.limparPesquisa()');
  const idBotaoPesquisar = 'form-incluir-restricao:botao-pesquisar',
    botaoPesquisar = obterPorId(idBotaoPesquisar);
  const botaoLimparPesquisa = botaoPesquisar.nextElementSibling as HTMLElement | null,
    idBotaoLimparPesquisa = botaoLimparPesquisa?.id;
  assert(
    isNotNull(botaoLimparPesquisa) && isNotNullish(idBotaoLimparPesquisa),
    'Não encontrado: botão limpar pesquisa.'
  );
  const promise = AjaxListener.listenOnce(idBotaoLimparPesquisa);
  botaoLimparPesquisa.click();
  return promise;
}
export function obterCelulaRestricaoVeiculo(ord: number) {
  console.debug('Pagina.obterCelulaRestricaoVeiculo(ord)', ord);
  const linha = obterLinhaVeiculo(ord);
  assert(linha.cells.length > 8, 'Linha não possui 9 células.');
  return linha.cells[8]!;
}
function obterLinhaVeiculo(ord: number) {
  console.debug('Pagina.obterLinhaVeiculo(ord)', ord);
  const tBody = obterPorTipoId('tbody', 'form-incluir-restricao:lista-veiculo_data');
  const index = ord % 100;
  assert(tBody.rows.length > index, `Tabela não possui ${index + 1} linhas.`);
  return tBody.rows[index]!;
}
export function obterMagistrado() {
  return obterValorInput('magistrado');
}
export function obterMunicipio() {
  return obterValorInput('municipio');
}
export function obterOrgao() {
  return obterValorInput('orgao');
}
function obterValorInput(campo: string) {
  return obterPorTipoId('input', `form-incluir-restricao:campo-${campo}_input`).value;
}
export function obterPlacaVeiculo(ord: number) {
  console.debug('Pagina.obterPlacaVeiculo(ord)', ord);
  const linha = obterLinhaVeiculo(ord);
  assert(linha.cells.length > 1, 'Linha não possui 2 células.');
  const celulaPlaca = linha.cells[1]!;
  const texto = celulaPlaca.textContent?.trim() ?? '';
  assert(texto !== '', 'Não foi possível obter: placa.');
  return texto;
}
function obterPrefixoVeiculo(ord: number) {
  console.debug('Pagina.obterPrefixoVeiculo(ord)', ord);
  return `form-incluir-restricao:lista-veiculo:${ord}`;
}
export function obterVeiculosDocumento(documento: string) {
  console.debug('Pagina.obterVeiculosDocumento(documento)', documento);
  const idBotaoPesquisar = 'form-incluir-restricao:botao-pesquisar';
  const botaoPesquisar = obterPorId(idBotaoPesquisar);
  const campoDocumento = obterPorTipoId('input', 'form-incluir-restricao:campo-cpf-cnpj');
  const promise = AjaxListener.listenOnce(idBotaoPesquisar).then(ext => {
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
  const celulaRestricoes = obterCelulaRestricaoVeiculo(ord);
  return celulaRestricoes.textContent === 'Sim';
}
