import * as Pagina from '../Pagina';
import { GUI } from '../GUI';
import * as AjaxListener from '../AjaxListener';
import { PreferenciasUsuario } from '../PreferenciasUsuario';
import { obterPorId, obterPorSeletor } from '../obter';
import { assert, hasShape, isNotNullish, isString } from '@nadameu/predicates';

export function inserir() {
  GUI.addOnNumprocChangeListener(numproc => {
    (async function () {
      try {
        GUI.Logger.clear();
        GUI.areaImpressao.limpar();
        await Pagina.limpar();

        GUI.Logger.write('Obtendo dados do processo...');
        const documentos = await ServicoWSDL.obterDocumentosReus(numproc);
        GUI.Logger.write('..................... ok.\n');

        let qtdVeiculos = 0;
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

          let paginaAtual = 1;

          for (let i = 0; i < qtdVeiculos; ++i) {
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
        if (err instanceof Error) window.alert(err.message);
        else window.alert(String(err));
        GUI.Logger.clear();
        Pagina.limpar();
      }
    })();
  });

  function preencherSelectOneMenu(idCampo: string, valor: string) {
    console.debug('preencherSelectOneMenu(idCampo, valor)', idCampo, valor);
    const opcao = obterPorSeletor<HTMLOptionElement>(
      `[id="${idCampo}_input"] option[value="${valor}"]`
    );
    const texto = opcao.innerHTML;
    const menu = obterPorSeletor(`[id="${idCampo}"] .ui-selectonemenu-trigger`);
    const opcaoNova = Array.from(
      document.querySelectorAll<HTMLLIElement>(`[id="${idCampo}_panel"] li`)
    ).filter(li => li.dataset.label === texto)[0];
    assert(isNotNullish(opcaoNova), `Não encontrada: opção "${texto}".`);
    menu.click();
    opcaoNova.click();
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
      obterPorId('form-incluir-restricao:campo-numero-processo').value = GUI.numproc;
    } else {
      console.info('Tudo preenchido.');
    }
  }

  const id = document.querySelector('[id="form-incluir-restricao"] div')?.id;
  assert(isNotNullish(id), `Não encontrado: Id.`);
  AjaxListener.listen(id, ext => {
    assert(hasShape({ currentStep: isString })(ext), 'Informação não encontrada: currentStep.');
    if (ext.currentStep === 'inclui-restricao') {
      GUI.hide();
      GUI.areaImpressao.limpar();
      obterPorId('form-incluir-restricao:campo-magistrado_input').childNodes[0].value = '';
      GUI.criarOpcaoPreencherMagistrado();
      AjaxListener.listen('form-incluir-restricao:campo-municipio', () => {
        PreferenciasUsuario.municipio = Pagina.obterMunicipio();
        preencherTudo();
      });
      AjaxListener.listen('form-incluir-restricao:campo-orgao', () => {
        PreferenciasUsuario.orgao = Pagina.obterOrgao();
        preencherTudo();
      });
      Pagina.addOnMagistradoChangeListener(valor => {
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
