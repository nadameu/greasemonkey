// ==UserScript==
// @name         gerenciar-entidades
// @name:pt-BR   Gerenciar entidades
// @namespace    http://nadameu.com.br
// @version      1.1.0
// @author       nadameu
// @description  Permite filtrar entidades assistenciais
// @match        https://eproc.jfpr.jus.br/eprocV2/controlador.php?acao=entidade_assistencial_listar&*
// @match        https://eproc.jfrs.jus.br/eprocV2/controlador.php?acao=entidade_assistencial_listar&*
// @match        https://eproc.jfsc.jus.br/eprocV2/controlador.php?acao=entidade_assistencial_listar&*
// @match        https://eproc.trf4.jus.br/eproc2trf4/controlador.php?acao=entidade_assistencial_listar&*
// @match        https://eproc.jfpr.jus.br/eprocV2/controlador.php?acao=entidade_assistencial_reativar&*
// @match        https://eproc.jfrs.jus.br/eprocV2/controlador.php?acao=entidade_assistencial_reativar&*
// @match        https://eproc.jfsc.jus.br/eprocV2/controlador.php?acao=entidade_assistencial_reativar&*
// @match        https://eproc.trf4.jus.br/eproc2trf4/controlador.php?acao=entidade_assistencial_reativar&*
// @grant        GM_addStyle
// @grant        GM_info
// ==/UserScript==

(function () {
  'use strict';

  var __defProp = Object.defineProperty;
  var __defNormalProp = (obj, key, value) =>
    key in obj
      ? __defProp(obj, key, {
          enumerable: true,
          configurable: true,
          writable: true,
          value,
        })
      : (obj[key] = value);
  var __publicField = (obj, key, value) =>
    __defNormalProp(obj, key + '', value);
  var _GM_addStyle = /* @__PURE__ */ (() =>
    typeof GM_addStyle != 'undefined' ? GM_addStyle : void 0)();
  var _GM_info = /* @__PURE__ */ (() =>
    typeof GM_info != 'undefined' ? GM_info : void 0)();
  function h(tag, props = null, ...children) {
    const element = document.createElement(tag);
    for (const [key, value] of Object.entries(props ?? {})) {
      element[key] = value;
    }
    element.append(...children);
    return element;
  }
  function adicionarEstilos() {
    _GM_addStyle(`
.bootstrap-styles .${_GM_info.script.name}__div {
  position: relative;
  background: hsl(333deg 35% 70%);
  display: inline-block;
  padding: 1em 2ch;
  border-radius: 4px;
}
    `);
  }
  const compare = new Intl.Collator('pt-BR', { sensitivity: 'base' }).compare;
  class StringMap {
    constructor(values = []) {
      __publicField(this, '_internal', /* @__PURE__ */ new Map());
      for (const [key, value] of values) {
        this.set(key, value);
      }
    }
    has(key) {
      for (const k of this._internal.keys()) {
        if (compare(key, k) === 0) return true;
      }
      return false;
    }
    set(key, value) {
      let found = false;
      for (const k of this._internal.keys()) {
        if (compare(key, k) === 0) {
          found = [k];
        }
      }
      if (found) {
        this._internal.delete(found[0]);
      }
      this._internal.set(key, value);
    }
    get(key) {
      for (const [k, v] of this._internal) {
        if (compare(key, k) === 0) {
          return v;
        }
      }
      return void 0;
    }
    keys() {
      return this._internal.keys();
    }
  }
  async function main() {
    const barra = await queryOne('#divInfraBarraComandosSuperior');
    const tabela = await queryOne(
      'table[summary="Tabela de Entidade Assistencial."], table[summary="Tabela de Entidade Assistencial Inativas."]'
    );
    const linhas = Array.from(tabela.rows).slice(1);
    const info = await Promise.all(
      linhas.map(async (linha, index) => {
        var _a;
        if (linha.cells.length === 0) {
          throw new Error(`Linha sem células: ${index}.`);
        }
        const ultimaCelula = linha.cells[linha.cells.length - 1];
        const lupa = await queryOne(
          'img[src$="/lupa.gif"][onmouseover]',
          ultimaCelula
        );
        const partes =
          (_a = lupa.getAttribute('onmouseover')) == null
            ? void 0
            : _a.match(
                /^return infraTooltipMostrar\('Cidade: (.+),Bairro: (.+),Endereço: (.+)','Endereço',400\);$/
              );
        if (!partes || partes.length !== 4)
          throw new Error(
            `Informações de endereço não encontradas: linha ${index}.`
          );
        return [
          partes[1]
            .replace(/\/(PR|RS|SC)/, '')
            .replace(/  +/g, ' ')
            .trim(),
          partes[2]
            .replace(/\/(PR|RS|SC)/, '')
            .replace(/  +/g, ' ')
            .trim(),
          index,
        ];
      })
    );
    const cidades = new StringMap([
      ['', new StringMap([['', /* @__PURE__ */ new Set()]])],
    ]);
    for (const [cidade, bairro, linha] of info) {
      cidades.get('').get('').add(linha);
      if (!cidades.has(cidade)) {
        cidades.set(cidade, new StringMap([['', /* @__PURE__ */ new Set()]]));
      }
      const bairros = cidades.get(cidade);
      bairros.get('').add(linha);
      if (!bairros.has(bairro)) {
        bairros.set(bairro, /* @__PURE__ */ new Set());
      }
      bairros.get(bairro).add(linha);
    }
    const div = h('div', { className: `${_GM_info.script.name}__div` });
    const sortIgnoreCase = new Intl.Collator('pt-BR', {
      sensitivity: 'base',
    }).compare;
    const selCidade = h(
      'select',
      {},
      ...[...cidades.keys()]
        .sort(sortIgnoreCase)
        .map(cidade =>
          h('option', { value: cidade }, cidade === '' ? 'TODAS' : cidade)
        )
    );
    selCidade.addEventListener('change', onCidadeChange);
    const optBairro = h('option');
    optBairro.value = '';
    optBairro.textContent = 'TODOS';
    const selBairro = h('select', { disabled: true }, optBairro);
    selBairro.addEventListener('change', onBairroChange);
    div.append('Cidade: ', selCidade, ' Bairro: ', selBairro);
    adicionarEstilos();
    barra.insertAdjacentElement('afterend', div);
    function onCidadeChange() {
      Array.from(selBairro.children)
        .slice(1)
        .forEach(opt => opt.remove());
      if (selCidade.value === '') {
        selBairro.disabled = true;
      } else {
        selBairro.disabled = false;
        for (const bairro of [...cidades.get(selCidade.value).keys()].sort(
          sortIgnoreCase
        )) {
          if (bairro === '') continue;
          selBairro.append(h('option', { value: bairro }, bairro));
        }
      }
      updateLinhas(selCidade.value, '');
    }
    function onBairroChange() {
      updateLinhas(selCidade.value, selBairro.value);
    }
    function updateLinhas(cidade, bairro) {
      const mostrar = cidades.get(cidade).get(bairro);
      linhas.forEach((linha, index) => {
        linha.hidden = !mostrar.has(index);
      });
    }
  }
  function queryOne(selector, context = document) {
    const elts = context.querySelectorAll(selector);
    if (elts.length !== 1)
      return Promise.reject(
        new Error(
          `Não foi possível encontrar um elemento único: \`${selector}\`.`
        )
      );
    return Promise.resolve(elts[0]);
  }
  main().catch(err => {
    console.group(_GM_info.script.name);
    console.error(err);
    console.groupEnd();
  });
})();
