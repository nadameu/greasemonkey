// ==UserScript==
// @name         eproc-documentos-sigilosos
// @name:pt-BR   eproc - documentos sigilosos
// @namespace    http://nadameu.com.br
// @version      1.1.0
// @author       nadameu
// @description  Facilita a identificação de documentos sigilosos, de acordo com seu nível, nas telas de alteração em bloco
// @match        https://eproc.jfpr.jus.br/eprocV2/controlador.php?acao=processo_documento_sigilo_listar&*
// @match        https://eproc.jfrs.jus.br/eprocV2/controlador.php?acao=processo_documento_sigilo_listar&*
// @match        https://eproc.jfsc.jus.br/eprocV2/controlador.php?acao=processo_documento_sigilo_listar&*
// @match        https://eproc.trf4.jus.br/eproc2trf4/controlador.php?acao=processo_documento_sigilo_listar&*
// @match        https://eproc.jfpr.jus.br/eprocV2/controlador.php?acao=acesso_usuario_documento_listar&*
// @match        https://eproc.jfrs.jus.br/eprocV2/controlador.php?acao=acesso_usuario_documento_listar&*
// @match        https://eproc.jfsc.jus.br/eprocV2/controlador.php?acao=acesso_usuario_documento_listar&*
// @match        https://eproc.trf4.jus.br/eproc2trf4/controlador.php?acao=acesso_usuario_documento_listar&*
// @grant        GM_addStyle
// @grant        GM_info
// ==/UserScript==

(function () {
  'use strict';
  var s = new Set();
  var _css = async t => {
    if (s.has(t)) return;
    s.add(t);
    (c => {
      if (typeof GM_addStyle === 'function') GM_addStyle(c);
      else
        (document.head || document.documentElement)
          .appendChild(document.createElement('style'))
          .append(c);
    })(t);
  };
  _css(
    ' .infra-styles ._gm_1wbh3_1:is(label){--uniform-spacing:4px;--border-color:black;padding-right:var(--uniform-spacing);border-radius:var(--uniform-spacing);border:1px solid #0000;flex-direction:row;align-items:center;font-size:1em;display:inline-flex}.infra-styles ._gm_1wbh3_1:is(label) input{margin:var(--uniform-spacing)}.infra-styles ._gm_1wbh3_1:is(td)>span{border:1px solid #0000;border-radius:4px;padding:1px;display:inline-flex}.infra-styles tr[data-gm_eproc_documentos_sigilosos]:has(input:checked) ._gm_1wbh3_1:is(td)>span,.infra-styles ._gm_1wbh3_1:has(input:checked){opacity:1;border-color:var(--border-color)}.infra-styles ._gm-nivel0_1wbh3_27{opacity:.5}.infra-styles ._gm-nivel1_1wbh3_30,.infra-styles ._gm-nivel2_1wbh3_31,.infra-styles ._gm-nivel3_1wbh3_32,.infra-styles ._gm-nivel4_1wbh3_33,.infra-styles ._gm-nivel5_1wbh3_34{color:#602;--border-color:#602}.infra-styles ._gm-nivel2_1wbh3_31{background:#ffd}.infra-styles ._gm-nivel3_1wbh3_32,.infra-styles ._gm-nivel4_1wbh3_33,.infra-styles ._gm-nivel5_1wbh3_34{background:#fda}\n/*$vite$:1*/ '
  );
  var CustomError = class extends Error {
    payload;
    constructor(message, payload = {}) {
      super(message);
      this.payload = payload;
    }
  };
  CustomError.prototype.name = 'CustomError';
  var regex = RegExp(
    `^(?:${[
      /Sem Sigilo \(Nível (?<nivel>0)\)/,
      /Segredo de Justiça \(Nível (?<nivel>1)\)/,
      /Sigiloso \(Interno Nível (?<nivel>2|3|4)\)/,
      /Restrito Juiz \(Nível (?<nivel>5)\)/,
    ]
      .map(x => x.source)
      .join('|')})$`
  );
  function parse_nivel_sigilo(texto) {
    return texto.match(regex)?.groups?.nivel ?? null;
  }
  var tela_alteracao_em_bloco_module_default = {
    'gm': '_gm_1wbh3_1',
    'gm-nivel0': '_gm-nivel0_1wbh3_27',
    'gm-nivel1': '_gm-nivel1_1wbh3_30',
    'gm-nivel2': '_gm-nivel2_1wbh3_31',
    'gm-nivel3': '_gm-nivel3_1wbh3_32',
    'gm-nivel4': '_gm-nivel4_1wbh3_33',
    'gm-nivel5': '_gm-nivel5_1wbh3_34',
  };
  function tela_alteracao_em_bloco() {
    const dados = [
      ...document.querySelectorAll('input[type="checkbox"].infraCheckbox'),
    ]
      .filter(input => /^chkInfraItem\d+$/.test(input.id))
      .flatMap(input => {
        const text_node = input.nextSibling;
        if (text_node !== null && text_node.nodeType === Node.TEXT_NODE)
          return [
            {
              input,
              text_node,
              texto: text_node.nodeValue?.trim() ?? '',
            },
          ];
        else return [];
      })
      .map(({ input, texto, text_node }) => {
        const sigilo = parse_nivel_sigilo(texto);
        if (sigilo == null)
          throw new CustomError('Sigilo desconhecido.', { texto });
        return {
          sigilo,
          input,
          text_node,
        };
      });
    for (const { sigilo, input, text_node } of dados) {
      const label = document.createElement('label');
      label.className = tela_alteracao_em_bloco_module_default['gm'];
      const span = document.createElement('span');
      span.className =
        tela_alteracao_em_bloco_module_default[`gm-nivel${sigilo}`];
      span.append(text_node);
      input.replaceWith(label);
      label.append(input, ' ', span);
    }
  }
  function map_nullish(value, f) {
    return value != null ? f(value) : value;
  }
  function tela_permissao_expressa() {
    const dados = [
      {
        summary: 'permissões',
        cells: 10,
        cell: 7,
      },
      {
        summary: 'Eventos',
        cells: 7,
        cell: 5,
      },
    ].flatMap(({ summary, cells, cell }) =>
      [...document.querySelectorAll(`table.infraTable[summary="${summary}"]`)]
        .map(t =>
          [...t.rows]
            .slice(1)
            .filter(r => r.cells.length === cells)
            .map(linha => ({
              linha,
              celula: linha.cells[cell],
            }))
            .map(({ linha, celula }) =>
              map_nullish(
                parse_nivel_sigilo(celula.textContent.trim()),
                sigilo => ({
                  linha,
                  celula,
                  sigilo,
                })
              )
            )
        )
        .filter(t => t.every(not_null))
        .flat(1)
    );
    for (const { linha, celula, sigilo } of dados) {
      linha.dataset['gm_eproc_documentos_sigilosos'] = '';
      celula.classList.add(tela_alteracao_em_bloco_module_default['gm']);
      const span = document.createElement('span');
      span.className =
        tela_alteracao_em_bloco_module_default[`gm-nivel${sigilo}`];
      span.append(...celula.childNodes);
      celula.append(span);
    }
  }
  function not_null(value) {
    return value !== null;
  }
  function main() {
    const acao = new URL(document.location.href).searchParams.get('acao');
    switch (acao) {
      case 'processo_documento_sigilo_listar':
        return tela_alteracao_em_bloco();
      case 'acesso_usuario_documento_listar':
        return tela_permissao_expressa();
      default:
        throw new CustomError('Ação desconhecida', { acao });
    }
  }
  var _GM_info = typeof GM_info != 'undefined' ? GM_info : void 0;
  function try_catch(fn) {
    try {
      fn();
    } catch (err) {
      console.group(`<${_GM_info.script.name}>`);
      console.error(err);
      if (err instanceof CustomError) console.debug(err.payload);
      console.groupEnd();
    }
  }
  try_catch(main);
})();
