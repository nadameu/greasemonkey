// ==UserScript==
// @name         Mora ofício requisitório
// @namespace    http://nadameu.com.br/
// @version      1.0.0
// @description  Preenche os dados dos juros de mora nos ofícios requisitórios
// @author       nadameu
// @include      /^https:\/\/eproc\.(trf4|jf(pr|rs|sc))\.jus\.br\/eprocV2\/controlador\.php\?acao=oficio_/
// @grant        none
// ==/UserScript==

/* eslint-env jquery */

/**
 * @typedef {Object} jQueryResult
 * @prop {{(value: string): void}} val
 */

const addAjaxSuccessListener = (() => {
  const listeners = [];

  /**
   * @param {string} acaoEsperada Parâmetro "acao_ajax" da query
   * @param {string} reembolsoEsperado Parâmetro "reembolso_deducoes" do POST
   * @param {function} listener Ação quando terminar a requisição ajax
   */
  const listen = (acaoEsperada, reembolsoEsperado, listener) => {
    listeners.push({ acaoEsperada, reembolsoEsperado, listener });
  };

  jQuery(document).ajaxSuccess((evt, xhr, settings) => {
    const link = document.createElement('a');

    link.href = settings.url;
    const url = new URL(link.href);
    const parametrosGet = url.searchParams;
    const acao = parametrosGet.get('acao_ajax');

    link.href = '?' + settings.data;
    const parametrosPost = new URL(link.href).searchParams;
    const reembolso = parametrosPost.get('reembolso_deducoes');
    listeners
      .filter(
        ({ acaoEsperada, reembolsoEsperado }) =>
          acao === acaoEsperada && (reembolsoEsperado === null || reembolso === reembolsoEsperado)
      )
      .forEach(({ listener }) => listener());
  });

  return listen;
})();

const Opcoes = {
  NAO_FIXADOS: 1,
  MEIO_POR_CENTO: 2,
  UM_POR_CENTO: 3,
  POUPANCA: 4,
};

/**
 * @param {string} nome
 * @param {boolean} value
 */
const definirFlag = (nome, value = true) => sessionStorage.setItem(nome, value ? 'S' : 'N');
/**
 * @param {string} nome
 */
const isFlag = nome => sessionStorage.getItem(nome) === 'S';
/**
 * @param {string[]} flags
 */
const limparFlags = (...flags) => {
  flags.forEach(flag => sessionStorage.removeItem(flag));
};

/**
 * @param {string[]} expectedNames
 * @param {function} whenAllSet
 */
const makeObservable = (expectedNames, whenAllSet) => {
  const propContainer = {};
  /**
   * @param {string} nome
   */
  const getter = nome => propContainer[nome];
  /**
   * @param {string} nome
   * @param {*} valor
   */
  const setter = (nome, valor) => {
    propContainer[nome] = valor;
    if (expectedNames.every(x => x in propContainer)) {
      whenAllSet();
    }
  };
  return { getter, setter };
};

/**
 * @param {string} flagName
 * @param {string} paginaEdicao
 * @param {string} paginaAtualizar
 * @param {{(salvar: boolean, mora: jQueryResult, titulo: string): boolean}} reduceMora
 * @param {string} botaoSalvar
 * @param {{(salvarDone: {(): void}): void}} aposSalvar
 * @param {{(salvar: boolean, obj: any): boolean}} reduceValores
 */
const editarValores = (
  flagName,
  paginaEdicao,
  paginaAtualizar,
  reduceMora,
  botaoSalvar,
  aposSalvar,
  reduceValores = acc => acc
) => {
  if (!isFlag(flagName)) return;

  definirFlag(flagName, false);

  addAjaxSuccessListener(paginaEdicao, null, () => {
    const titulos = jQuery('#divLista .ItemTitulo');
    let salvar = Array.from(jQuery('.selTipoJurosMora')).reduce((salvar, moraElement, i) => {
      const mora = jQuery(moraElement);
      const titulo = jQuery(titulos.get(i)).text();
      return reduceMora(salvar, mora, titulo);
    }, true);
    const nomesCampos = [
      'txtNumMesesExAnterior',
      'txtValorExAnterior',
      'txtNumMesesExCorrente',
      'txtValorExCorrente',
      'txtAnoExCorrente',
    ];
    const elementos = nomesCampos.reduce((obj, nomeClasse) => {
      obj[nomeClasse] = Array.from(jQuery(`.${nomeClasse}`));
      return obj;
    }, {});
    const campos = elementos['txtAnoExCorrente'].reduce((acc, x, i) => {
      if (i === 0) {
        acc[i] = {};
      }
      nomesCampos.forEach(campo => {
        acc[i][campo] = elementos[campo][i];
      });
      return acc;
    }, []);
    salvar = campos.reduce(reduceValores, salvar);
    const ano = new Date().getFullYear().toString();
    jQuery('.txtAnoExCorrente').val(ano);

    const oldAlert = window.alert;

    const salvarDone = () => {
      window.top.setTimeout(win => win.jQuery('#btnPrepTransmissao').click(), 250, window.top);
      jQuery('#btnFechar').click();
    };

    addAjaxSuccessListener(paginaAtualizar, null, () => {
      window.alert = oldAlert;
      aposSalvar(salvarDone);
    });

    if (salvar) {
      window.alert = function () {
        console.log.apply(console, arguments);
      };
      jQuery(botaoSalvar).click();
    }
  });
};

const Acoes = {
  requisicoes_editar: () => {
    limparFlags('beneficiarios', 'honorarios', 'poupanca');

    const $area = jQuery('#divInfraAreaDados');

    const $botaoPoupanca = jQuery('<button>Poupança</button>').css('visibility', 'hidden').hide();
    $botaoPoupanca.on('click', evt => {
      evt.preventDefault();
      definirFlag('poupanca');

      if (getQtd('reembolsos') > 0) {
        throw new Error('Reembolsos?');
      }
      if (getQtd('beneficiarios') > 0) {
        definirFlag('beneficiarios');
        setTimeout(() => jQuery('#fldBeneficiarios > legend a[title="Editar Todos"]').click(), 250);
      }
      if (getQtd('honorarios') > 0) {
        definirFlag('honorarios');
        if (!isFlag('beneficiarios')) {
          setTimeout(() => jQuery('#fldHonorarios > legend a[title="Editar Todos"]').click(), 250);
        }
      }
    });
    $botaoPoupanca.insertBefore($area);

    const { getter: getQtd, setter: setQtd } = makeObservable(
      ['beneficiarios', 'honorarios', 'reembolsos'],
      () => void $botaoPoupanca.css('visibility', 'visible')
    );

    const $botaoExpandir = jQuery('#fldDadosReqHidden img[onclick]');
    $botaoExpandir.one('click', () => void $botaoPoupanca.show());

    addAjaxSuccessListener(
      'oficio_requisitorio_requisicoes_buscar_beneficiarios',
      null,
      () =>
        void setQtd(
          'beneficiarios',
          jQuery('#divConteudoBeneficiarios > table').get(0).rows.length - 1
        )
    );
    addAjaxSuccessListener(
      'oficio_requisitorio_requisicoes_buscar_honorarios',
      'N',
      () =>
        void setQtd('honorarios', jQuery('#divConteudoHonorarios > table').get(0).rows.length - 1)
    );
    addAjaxSuccessListener(
      'oficio_requisitorio_requisicoes_buscar_honorarios',
      'S',
      () =>
        void setQtd(
          'reembolsos',
          jQuery('#divConteudoReembDeducoes > table').get(0).rows.length - 1
        )
    );
    addAjaxSuccessListener(
      'oficio_requisitorio_preparartransmissao',
      null,
      () => void console.log('transmitida.')
    );
  },
  todos_beneficiarios_editar: () => {
    const ehPoupanca = isFlag('poupanca');
    return editarValores(
      'beneficiarios',
      'oficio_requisitorio_requisicoes_buscar_todos_beneficiarios_edicao',
      'oficio_requisitorio_requisicoes_atualizar_todos_beneficiarios',
      (salvar, mora, titulo) => {
        const value = ehPoupanca ? Opcoes.POUPANCA : Opcoes.NAO_FIXADOS;
        mora.val(value);
        console.log(titulo, value);
        return true;
      },
      '#btnSalvarBeneficiarioNormal',
      done => {
        if (isFlag('honorarios')) {
          window.top.jQuery('#fldHonorarios > legend a[title="Editar Todos"]').click();
        } else {
          done();
        }
      }
    );
  },
  todos_honorarios_editar: () => {
    const ehPoupanca = isFlag('poupanca');
    return editarValores(
      'honorarios',
      'oficio_requisitorio_requisicoes_buscar_todos_honorarios_edicao',
      'oficio_requisitorio_requisicoes_atualizar_todos_honorarios',
      (salvar, mora, titulo) => {
        let value;
        if (/RPV - Honorários Contratuais$/.test(titulo)) {
          value = ehPoupanca ? Opcoes.POUPANCA : Opcoes.NAO_FIXADOS;
        } else if (/RPV - Devolução à Seção Judiciária$/.test(titulo)) {
          value = Opcoes.NAO_FIXADOS;
        } else {
          return false;
        }
        mora.val(value);
        console.log(titulo, value);
        return salvar;
      },
      '#btnSalvarHonorariosNormal',
      done => done()
    );
  },
};

const url = new URL(location.href);
const acao = url.searchParams.get('acao').match(/^oficio_requisitorio_(.*)$/)[1];
if (acao in Acoes) Acoes[acao]();
