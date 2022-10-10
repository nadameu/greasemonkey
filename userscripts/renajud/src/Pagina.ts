import { Handler } from '@nadameu/handler';
import { getAjaxListener, isExtension } from './AjaxListener';

function addSelectOneMenuListener(prefixo: string, fn: Handler<string>) {
  const painelOpcoes = document.getElementById(`${prefixo}_panel`);
  const select = document.getElementById(`${prefixo}_input`);
  painelOpcoes.addEventListener(
    'click',
    evt => {
      const elementoClicado = evt.target;
      if (elementoClicado instanceof HTMLElement && elementoClicado.matches('li[data-label]')) {
        return fn(select.value);
      }
    },
    false
  );
}

export function abrirDetalhesVeiculo(ord: number) {
  console.debug('Pagina.abrirDetalhesVeiculo(ord)', ord);
  const prefixo = obterPrefixoVeiculo(ord);
  const idDivDetalhes = `${prefixo}:detalhe-veiculo`;
  const divDetalhes = document.getElementById(idDivDetalhes);
  const abrirDetalhes = divDetalhes.previousElementSibling;
  const idAbrirDetalhes = abrirDetalhes.id;
  const promise = (async () => {
    await getAjaxListener().listenOnce(idAbrirDetalhes);
    return document.getElementById(`${prefixo}:panel-group-dados-veiculo`);
  })();
  abrirDetalhes.click();
  return promise;
}

export function abrirRestricoesVeiculo(ord: number) {
  console.debug('Pagina.abrirDetalhesVeiculo(ord)', ord);
  const prefixo = obterPrefixoVeiculo(ord);
  const idAbrirRestricoes = `${prefixo}:link-detalhes-veiculo-restricoes`;
  const abrirRestricoes = document.getElementById(idAbrirRestricoes);
  const promise = (async () => {
    await getAjaxListener().listenOnce(idAbrirRestricoes);
    const idDialogo = `${prefixo}:dlg-detalhes-veiculo-restricoes`;
    const dialogo = document.getElementById(idDialogo);
    const fieldsets = dialogo.getElementsByTagName('fieldset');
    const painelRestricoes = fieldsets[1];
    const listaRestricoes = painelRestricoes.getElementsByTagName('ul');
    if (listaRestricoes.length > 0) {
      listaRestricoes = [...listaRestricoes[0].childNodes].map(li => li.textContent.trim());
    } else {
      listaRestricoes = [];
    }
    const painelRestricoesRenajud = fieldsets[2];
    return {
      painel: painelRestricoes,
      lista: listaRestricoes,
      renajud: painelRestricoesRenajud,
    };
  })();
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

export async function aguardarProximaPaginaListagem(pagina: number) {
  console.debug('Pagina.aguardarProximaPaginaListagem(pagina)', pagina);
  return go();

  async function go(): Promise<void> {
    await getAjaxListener().listenOnce('form-incluir-restricao:lista-veiculo');
    console.info('pagina carregada');
    const botoesPagina = [...document.getElementsByClassName('ui-paginator-page')].filter(botao =>
      botao.classList.contains('ui-state-active')
    );
    if (botoesPagina.length !== 2) throw null;
    if (Number(botoesPagina[0].textContent) === pagina) return;
    else return go();
  }
}

export function fecharDetalhesVeiculo(ord: number) {
  console.debug('Pagina.fecharDetalhesVeiculo(ord)', ord);
  const prefixo = obterPrefixoVeiculo(ord);
  const idDivDetalhes = `${prefixo}:detalhe-veiculo`;
  const divDetalhes = document.getElementById(idDivDetalhes);
  const fecharDetalhes = divDetalhes.getElementsByTagName('button')[1];
  fecharDetalhes.click();
}

export function fecharRestricoesVeiculo(ord: number) {
  console.debug('Pagina.fecharRestricoesVeiculo(ord)', ord);
  const prefixo = obterPrefixoVeiculo(ord);
  const idDivDetalhesRestricoes = `${prefixo}:dlg-detalhes-veiculo-restricoes`;
  const divDetalhesRestricoes = document.getElementById(idDivDetalhesRestricoes);
  const fecharRestricoes = divDetalhesRestricoes.getElementsByTagName('button')[1];
  fecharRestricoes.click();
}

export function imprimir() {
  console.debug('Pagina.imprimir()');
  window.print();
}

export function imprimirSemVeiculos() {
  console.debug('Pagina.imprimirSemVeiculos()');
  const veiculos = document.getElementById('form-incluir-restricao:panel-lista-veiculo');
  veiculos.style.display = 'none';
  imprimir();
  veiculos.style.display = '';
}

export async function limpar() {
  console.debug('Pagina.limpar()');
  const form = document.getElementById('form-incluir-restricao:panel-lista-veiculo');
  const botoes = [...form.getElementsByTagName('button')].filter(
    botao => botao.textContent?.trim() === 'Limpar lista'
  );
  if (botoes.length === 1) {
    const botaoLimpar = botoes[0]!;
    const idBotaoLimpar = botaoLimpar.id;
    const promise = getAjaxListener().listenOnce(idBotaoLimpar);
    botaoLimpar.click();
    await promise;
  }
  return limparPesquisa();
}

export function limparPesquisa() {
  console.debug('Pagina.limparPesquisa()');
  const idBotaoPesquisar = 'form-incluir-restricao:botao-pesquisar';
  const botaoPesquisar = document.getElementById(idBotaoPesquisar);
  const botaoLimparPesquisa = botaoPesquisar.nextElementSibling;
  const idBotaoLimparPesquisa = botaoLimparPesquisa.id;
  const promise = getAjaxListener().listenOnce(idBotaoLimparPesquisa);
  botaoLimparPesquisa.click();
  return promise;
}

export function obterCelulaRestricaoVeiculo(ord: number) {
  console.debug('Pagina.obterCelulaRestricaoVeiculo(ord)', ord);
  const linha = obterLinhaVeiculo(ord);
  return linha.cells[8];
}

export function obterLinhaVeiculo(ord: number) {
  console.debug('Pagina.obterLinhaVeiculo(ord)', ord);
  const tBody = document.getElementById('form-incluir-restricao:lista-veiculo_data');
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
  const linha = obterLinhaVeiculo(ord);
  const celulaPlaca = linha.cells[1];
  return celulaPlaca.textContent;
}

export function obterPrefixoVeiculo(ord: number) {
  console.debug('Pagina.obterPrefixoVeiculo(ord)', ord);
  return `form-incluir-restricao:lista-veiculo:${ord}`;
}

export function obterVeiculosDocumento(documento: string) {
  console.debug('Pagina.obterVeiculosDocumento(documento)', documento);
  const idBotaoPesquisar = 'form-incluir-restricao:botao-pesquisar';
  const botaoPesquisar = document.getElementById(idBotaoPesquisar);
  const campoDocumento = document.getElementById('form-incluir-restricao:campo-cpf-cnpj');
  const promise = (async () => {
    const ext = await getAjaxListener().listenOnce(idBotaoPesquisar);
    if (ext === null) return 0;
    else return ext.totalRecords;
  })();
  campoDocumento.value = documento;
  botaoPesquisar.click();
  return promise;
}

export function veiculoPossuiRestricoes(ord: number) {
  console.debug('Pagina.veiculoPossuiRestricoes(ord)', ord);
  const celulaRestricoes = obterCelulaRestricaoVeiculo(ord);
  return celulaRestricoes.textContent === 'Sim';
}
