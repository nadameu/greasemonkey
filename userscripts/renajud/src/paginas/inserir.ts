import * as p from '@nadameu/predicates';
import * as AjaxListener from '../AjaxListener';
import { DadosPessoa } from '../DadosPessoa';
import { GUI } from '../GUI';
import { obterPorId, obterPorSeletor } from '../obter';
import * as Pagina from '../Pagina';
import { PreferenciasUsuario } from '../PreferenciasUsuario';
import css from './inserir.scss?inline';
import html from './inserir.html?raw';
import { Either, Left, Right } from '@nadameu/either';

export function inserir(): Either<Error, void> {
  document.head.appendChild(document.createElement('style')).textContent = css;
  const painel = obterPorId('panel-inserir-restricao');
  if (painel.isLeft) return painel as Left<Error>;
  painel.rightValue.insertAdjacentHTML('beforebegin', html);
  return Right(undefined);
  GUI.addOnDadosInputListener(texto => {
    try {
      GUI.Logger.clear();
      GUI.Logger.write('Analisando dados...');

      const linhas = texto
        .split(/\n/g)
        .slice(8)
        .map(linha => linha.split(/\t/g));
      p.assert(linhas.length >= 1);
      p.assert(
        linhas.every((x): x is [string, string, string, string, string, string] => x.length === 6)
      );

      const autores: DadosPessoa[] = [];
      const reus: DadosPessoa[] = [];
      for (const [nomeAutor, docAutor, , nomeReu, docReu] of linhas) {
        const resultadoAutor = analisarLinhaExcel(nomeAutor, docAutor);
        if (resultadoAutor) autores.push(resultadoAutor);

        const resultadoReu = analisarLinhaExcel(nomeReu, docReu);
        if (resultadoReu) reus.push(resultadoReu);
      }
      GUI.Logger.clear();
      GUI.hideEntrada();
      GUI.showTabela({ autores, reus });
    } catch (e) {
      GUI.hideEntrada();
      GUI.Logger.write(`Erro:\nFormato dos dados copiados não reconhecido.`);
      return;
    }
  });
  GUI.addOnPesquisarListener(documentos => {
    (async function () {
      try {
        GUI.Logger.clear();
        GUI.areaImpressao.limpar();
        await Pagina.limpar();

        let qtdVeiculos = 0;
        let len = documentos.length,
          ultimo = len - 1,
          documento: string;
        for (let indiceDocumento = 0; indiceDocumento < len; ++indiceDocumento) {
          documento = documentos[indiceDocumento]!;

          GUI.Logger.write(
            `Obtendo veículos de ${documento}${'.'.repeat(Math.max(0, 14 - documento.length))}...`
          );
          let qtdVeiculosAnterior = qtdVeiculos;
          qtdVeiculos = await Pagina.obterVeiculosDocumento(documento);
          let qtdVeiculosReu = qtdVeiculos - qtdVeiculosAnterior;
          GUI.Logger.write(
            `${'.'.repeat(
              Math.max(0, 3 - qtdVeiculosReu.toString().length)
            )}(${qtdVeiculosReu})... ok.\n`
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
                `Há mais de ${paginaAtual * 100} veículos.\n\nAo carregar a página ${
                  paginaAtual + 1
                }, os dados serão atualizados.\n\n`
              );
              await Pagina.aguardarProximaPaginaListagem(++paginaAtual);
              GUI.areaImpressao.limpar();
            }

            let placa = Pagina.obterPlacaVeiculo(i);
            GUI.Logger.write(
              `Obtendo detalhes do veículo ${placa.slice(0, 3)}-${placa.slice(3)}...`
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
                [...detalhesRestricoes.renajud.childNodes].forEach(x =>
                  GUI.areaImpressao.adicionar(x as HTMLElement)
                );
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
    p.assert(p.isNotNullish(opcaoNova), `Não encontrada: opção "${texto}".`);
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
  p.assert(p.isNotNullish(id), `Não encontrado: Id.`);
  AjaxListener.listen(id, ext => {
    p.assert(
      p.hasShape({ currentStep: p.isString })(ext),
      'Informação não encontrada: currentStep.'
    );
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

function analisarLinhaExcel(nome: string, formulaDoc: string): DadosPessoa | null {
  if (nome === '')
    if (formulaDoc === '') return null;
    else throw null;
  else if (formulaDoc === '') return { nome };
  else {
    const match = formulaDoc.match(/^="(\d+)"$/);
    if (!match) throw null;
    return { nome, doc: match[1]! };
  }
}
