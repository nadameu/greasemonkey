// ==UserScript==
// @name         eproc-documentos-nao-utilizados
// @name:pt-BR   eproc - documentos não utilizados
// @namespace    http://nadameu.com.br
// @version      1.0.0
// @author       nadameu
// @description  Alerta quando, ao abrir a tela de movimentação processual, já há documentos selecionados anteriormente e não utilizados
// @match        https://eproc.jfpr.jus.br/eprocV2/controlador.php?acao=audiencia_alterar&*
// @match        https://eproc.jfrs.jus.br/eprocV2/controlador.php?acao=audiencia_alterar&*
// @match        https://eproc.jfsc.jus.br/eprocV2/controlador.php?acao=audiencia_alterar&*
// @match        https://eproc.trf4.jus.br/eproc2trf4/controlador.php?acao=audiencia_alterar&*
// @match        https://eproc.jfpr.jus.br/eprocV2/controlador.php?acao=audiencia_cadastrar&*
// @match        https://eproc.jfrs.jus.br/eprocV2/controlador.php?acao=audiencia_cadastrar&*
// @match        https://eproc.jfsc.jus.br/eprocV2/controlador.php?acao=audiencia_cadastrar&*
// @match        https://eproc.trf4.jus.br/eproc2trf4/controlador.php?acao=audiencia_cadastrar&*
// @match        https://eproc.jfpr.jus.br/eprocV2/controlador.php?acao=processo_movimento_consultar&*
// @match        https://eproc.jfrs.jus.br/eprocV2/controlador.php?acao=processo_movimento_consultar&*
// @match        https://eproc.jfsc.jus.br/eprocV2/controlador.php?acao=processo_movimento_consultar&*
// @match        https://eproc.trf4.jus.br/eproc2trf4/controlador.php?acao=processo_movimento_consultar&*
// @grant        GM_addStyle
// @grant        GM_info
// ==/UserScript==

(function () {
  'use strict';

  const d = new Set();
  const o = async e => {
    d.has(e) ||
      (d.add(e),
      (t => {
        typeof GM_addStyle == 'function'
          ? GM_addStyle(t)
          : (document.head || document.documentElement)
              .appendChild(document.createElement('style'))
              .append(t);
      })(e));
  };

  o(
    ' .bootstrap-styles._continha-documentos-ao-carregar_yiwzj_1 form:has(input[name=hdnNumDocumentos][value="0"]) .infraBarraComandos:before{display:none}.bootstrap-styles._continha-documentos-ao-carregar_yiwzj_1 form:has(input[name=hdnNumDocumentos]) .infraBarraComandos:before{content:"ATEN\xC7\xC3O: H\xE1 documentos selecionados e ainda n\xE3o utilizados em movimenta\xE7\xE3o.";display:inline-block;background:#e9e296;color:#000;margin:0 6px;padding:.25rem .5rem;border-radius:2rem;width:fit-content;text-align:center}.bootstrap-styles._erro_yiwzj_21 .infraBarraComandos:before{content:"ERRO ao verificar a exist\xEAncia de documentos selecionados e ainda n\xE3o utilizados em movimenta\xE7\xE3o.";display:inline-block;background:#ebd1dd;color:#000;margin:0 6px;padding:.25rem .5rem;border-radius:2rem;width:fit-content;text-align:center} '
  );

  class CustomError extends Error {
    constructor(message, payload = {}) {
      super(message);
      this.payload = payload;
    }
  }
  CustomError.prototype.name = 'CustomError';
  const erro = '_erro_yiwzj_21';
  const classes = {
    'continha-documentos-ao-carregar':
      '_continha-documentos-ao-carregar_yiwzj_1',
    erro,
  };
  function main() {
    document.body.classList.add(classes['erro']);
    const input = document.getElementById('hdnNumDocumentos');
    if (!(input instanceof HTMLInputElement)) {
      throw new CustomError('Número de documentos não identificado.');
    }
    const valor = input.value;
    const qtd = Number(valor);
    if (isNaN(qtd)) {
      throw new CustomError('Valor não é um número.', { valor });
    }
    document.body.classList.remove(classes['erro']);
    if (qtd > 0) {
      document.body.classList.add(classes['continha-documentos-ao-carregar']);
    }
  }
  var _GM_info = (() => (typeof GM_info != 'undefined' ? GM_info : void 0))();
  function try_catch(fn) {
    try {
      fn();
    } catch (err) {
      console.group(`<${_GM_info.script.name}>`);
      console.error(err);
      if (err instanceof CustomError) {
        console.debug(err.payload);
      }
      console.groupEnd();
    }
  }
  try_catch(main);
})();
