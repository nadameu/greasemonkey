import * as Pagina from '../Pagina';
import { GUI } from '../GUI';
import * as AjaxListener from '../AjaxListener';
import { PreferenciasUsuario } from '../PreferenciasUsuario';

export function inserir() {
  GUI.addOnNumprocChangeListener(function (numproc) {
    (async function () {
      try {
        GUI.Logger.clear();
        GUI.areaImpressao.limpar();
        await Pagina.limpar();

        GUI.Logger.write('Obtendo dados do processo...');
        const documentos = await ServicoWSDL.obterDocumentosReus(numproc);
        GUI.Logger.write('..................... ok.\n');

        const qtdVeiculos = 0;
        let len = documentos.length,
          ultimo = len - 1,
          documento;
        for (let indiceDocumento = 0; indiceDocumento < len; ++indiceDocumento) {
          documento = documentos[indiceDocumento];

          GUI.Logger.write(
            'Obtendo veículos do réu ' + documento + '.'.repeat(14 - documento.length) + '...'
          );
          let qtdVeiculosAnterior = qtdVeiculos;
          qtdVeiculos = await Pagina.obterVeiculosDocumento(documento);
          let qtdVeiculosReu = qtdVeiculos - qtdVeiculosAnterior;
          GUI.Logger.write(
            '.'.repeat(3 - qtdVeiculosReu.toString().length) + '(' + qtdVeiculosReu + ')... ok.\n'
          );

          if (qtdVeiculosReu === 0) {
            GUI.Logger.write('Imprimindo tela de réu sem veículos...');
            Pagina.imprimirSemVeiculos();
            GUI.Logger.write('........... ok.\n');
            if (indiceDocumento < ultimo) {
              await Pagina.limparPesquisa();
            }
          }
        }

        if (qtdVeiculos > 0) {
          await Pagina.limparPesquisa();

          const paginaAtual = 1;

          for (const i = 0; i < qtdVeiculos; ++i) {
            if (i > 99 && i % 100 === 0) {
              GUI.Logger.write('Imprimindo detalhes dos veículos...');
              Pagina.imprimir();
              GUI.Logger.write('.............. ok.\n');
              GUI.Logger.write('Selecione os veículos a restringir.\n');
              window.alert(
                'Há mais de ' +
                  paginaAtual * 100 +
                  ' veículos.\n\nAo carregar a página ' +
                  (paginaAtual + 1) +
                  ', os dados serão atualizados.\n\n'
              );
              await Pagina.aguardarProximaPaginaListagem(++paginaAtual);
              GUI.areaImpressao.limpar();
            }

            let placa = Pagina.obterPlacaVeiculo(i);
            GUI.Logger.write(
              'Obtendo detalhes do veículo ' + placa.substr(0, 3) + '-' + placa.substr(3) + '...'
            );

            let detalhes = await Pagina.abrirDetalhesVeiculo(i);
            detalhes.style.pageBreakBefore = 'always';
            GUI.areaImpressao.adicionar(detalhes);
            Pagina.fecharDetalhesVeiculo(i);

            if (Pagina.veiculoPossuiRestricoes(i)) {
              let detalhesRestricoes = await Pagina.abrirRestricoesVeiculo(i);
              GUI.definirRestricoesVeiculo(i, detalhesRestricoes.lista);
              GUI.areaImpressao.adicionar(document.createElement('br'));
              GUI.areaImpressao.adicionar(detalhesRestricoes.painel);
              if (detalhesRestricoes.renajud) {
                GUI.areaImpressao.adicionar(document.createElement('br'));
                [...detalhesRestricoes.renajud.childNodes].forEach(GUI.areaImpressao.adicionar);
              }
              Pagina.fecharRestricoesVeiculo(i);
            }
            GUI.Logger.write('.......... ok.\n');
          }
          GUI.Logger.write('Imprimindo detalhes dos veículos...');
          Pagina.imprimir();
          GUI.Logger.write('.............. ok.\n');
          GUI.Logger.write('Terminado. Selecione os veículos a restringir.\n');
        } else {
          GUI.Logger.write('Terminado. Nenhum veículo encontrado.\n');
        }
      } catch (err) {
        console.error(err);
        window.alert(err.message);
        GUI.Logger.clear();
        Pagina.limpar();
      }
    })();
  });

  function preencherSelectOneMenu(idCampo, valor) {
    console.debug('preencherSelectOneMenu(idCampo, valor)', idCampo, valor);
    const idSelect = idCampo + '_input',
      idPainel = idCampo + '_panel';
    const select = document.getElementById(idSelect);
    const opcao = select.querySelectorAll('option[value="' + valor + '"]');
    if (opcao.length === 0) {
      throw new Error('Opção não encontrada (campo "' + idCampo + '"):', valor);
    }
    const texto = opcao[0].innerHTML;
    const menu = document
      .getElementById(idCampo)
      .getElementsByClassName('ui-selectonemenu-trigger');
    opcao = [...document.getElementById(idPainel).getElementsByTagName('li')].filter(
      li => li.dataset.label === texto
    );
    if (menu.length === 0) {
      throw new Error('Campo não encontrado: "' + idCampo + '"', select, texto, menu, opcao);
    }
    menu[0].click();
    opcao[0].click();
  }

  function preencherTudo() {
    console.debug('preencherTudo()');
    if (Pagina.obterMunicipio() !== PreferenciasUsuario.municipio) {
      preencherSelectOneMenu(
        'form-incluir-restricao:campo-municipio',
        PreferenciasUsuario.municipio
      );
    } else if (
      Pagina.obterMunicipio() !== '' &&
      Pagina.obterOrgao() !== PreferenciasUsuario.orgao
    ) {
      try {
        preencherSelectOneMenu('form-incluir-restricao:campo-orgao', PreferenciasUsuario.orgao);
      } catch (err) {
        PreferenciasUsuario.orgao = '';
      }
    } else if (
      Pagina.obterOrgao() !== '' &&
      Pagina.obterMagistrado() !== PreferenciasUsuario.magistrado &&
      PreferenciasUsuario.preencherMagistrado
    ) {
      preencherSelectOneMenu(
        'form-incluir-restricao:campo-magistrado',
        PreferenciasUsuario.magistrado
      );
    } else if (Pagina.obterMagistrado() !== '') {
      document.getElementById('form-incluir-restricao:campo-numero-processo').value = GUI.numproc;
    } else {
      console.info('Tudo preenchido.');
    }
  }

  const form = document.getElementById('form-incluir-restricao');
  const firstDiv = form.getElementsByTagName('div')[0],
    id = firstDiv.id;
  AjaxListener.listen(id, function (ext) {
    if (ext.currentStep === 'inclui-restricao') {
      GUI.hide();
      GUI.areaImpressao.limpar();
      document.getElementById('form-incluir-restricao:campo-magistrado_input').childNodes[0].value =
        '';
      GUI.criarOpcaoPreencherMagistrado();
      AjaxListener.listen('form-incluir-restricao:campo-municipio', function () {
        PreferenciasUsuario.municipio = Pagina.obterMunicipio();
        preencherTudo();
      });
      AjaxListener.listen('form-incluir-restricao:campo-orgao', function () {
        PreferenciasUsuario.orgao = Pagina.obterOrgao();
        preencherTudo();
      });
      Pagina.addOnMagistradoChangeListener(function (valor) {
        PreferenciasUsuario.magistrado = valor;
        preencherTudo();
      });
      preencherTudo();
    } else if (ext.currentStep === 'pesquisa-veiculo') {
      GUI.show();
    } else if (ext.currentStep === 'confirma-restricao') {
      // Não faz nada
    }
  });
}
