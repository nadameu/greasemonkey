// ==UserScript==
// @name         gerenciar-entidades
// @name:pt-BR   Gerenciar entidades
// @namespace    http://nadameu.com.br
// @version      1.2.0
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

  var _GM_addStyle = /* @__PURE__ */ (() =>
    typeof GM_addStyle != 'undefined' ? GM_addStyle : void 0)();
  var _GM_info = /* @__PURE__ */ (() =>
    typeof GM_info != 'undefined' ? GM_info : void 0)();
  function h(tag, props = null, ...children) {
    const element = document.createElement(tag);
    for (const [key, value] of Object.entries(props ?? {})) {
      if (key === 'style' || key === 'dataset') {
        for (const [k, v] of Object.entries(value)) {
          element[key][k] = v;
        }
      } else if (key === 'classList') {
        let classes;
        if (Array.isArray(value)) {
          classes = value.filter(x => x !== null);
        } else {
          classes = Object.entries(value).flatMap(([k, v]) => {
            if (!v) return [];
            return [k];
          });
        }
        for (const className of classes) {
          element.classList.add(className);
        }
      } else {
        element[key] = value;
      }
    }
    element.append(...children);
    return element;
  }
  function adicionarEstilos() {
    _GM_addStyle(
      /* css */
      `
.bootstrap-styles .${_GM_info.script.name}__div {
  position: relative;
  background: hsl(333deg 35% 70%);
  display: inline-block;
  padding: 1em 2ch;
  border-radius: 4px;
}
    `
    );
  }
  const compare = new Intl.Collator('pt-BR', { sensitivity: 'base' }).compare;
  class StringMap {
    _internal = /* @__PURE__ */ new Map();
    constructor(values = []) {
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
    const { caption, registros, captionNewContent, output } = await queryOne(
      'caption',
      tabela
    ).then(async caption2 => {
      const match = caption2.textContent.match(
        /^Lista de Entidade Assistencial \((\d+) registros\):$/
      );
      if (match === null || match[1] === void 0) {
        throw new Error(
          'Conteúdo da legenda da tabela não corresponde ao esperado.'
        );
      }
      const registros2 = Number(match[1]);
      const output2 = h('output', {}, pluralizar(registros2));
      return {
        caption: caption2,
        registros: registros2,
        captionNewContent: ['Lista de Entidade Assistencial (', output2, '):'],
        output: output2,
      };
    });
    const linhas = Array.from(tabela.rows).slice(1);
    const info = await Promise.all(
      linhas.map(async (linha, index) => {
        if (linha.cells.length === 0) {
          throw new Error(`Linha sem células: ${index}.`);
        }
        const ultimaCelula = linha.cells[linha.cells.length - 1];
        const lupa = await queryOne(
          'img[src$="/lupa.gif"][onmouseover]',
          ultimaCelula
        );
        const partes = lupa
          .getAttribute('onmouseover')
          ?.match(
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
    const selBairro = h(
      'select',
      { disabled: true },
      h('option', { value: '' }, 'TODOS')
    );
    selBairro.addEventListener('change', onBairroChange);
    const div = h(
      'div',
      { className: `${_GM_info.script.name}__div` },
      'Cidade: ',
      selCidade,
      ' Bairro: ',
      selBairro
    );
    adicionarEstilos();
    barra.insertAdjacentElement('afterend', div);
    caption.replaceChildren(...captionNewContent);
    updateLinhas('', '');
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
      const exibidas = linhas
        .map((linha, index) => {
          const exibir = mostrar.has(index);
          linha.hidden = !exibir;
          return exibir ? 1 : 0;
        })
        .reduce((x, y) => x + y, 0);
      if (exibidas === registros) {
        output.textContent = pluralizar(registros);
      } else {
        output.textContent = `exibindo ${exibidas} de ${pluralizar(registros)}`;
      }
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
  function pluralizar(registros) {
    return `${registros} registro${registros <= 1 ? '' : 's'}`;
  }
  main().catch(err => {
    console.group(_GM_info.script.name);
    console.error(err);
    console.groupEnd();
  });
})();
