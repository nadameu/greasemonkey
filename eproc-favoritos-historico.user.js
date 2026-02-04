// ==UserScript==
// @name         eproc-favoritos-historico
// @name:pt-BR   eproc - favoritos e histórico
// @namespace    http://nadameu.com.br
// @version      1.3.1
// @author       nadameu
// @description  Permite definir processos favoritos e visualizar o histórico de processos acessados
// @match        https://eproc.jfpr.jus.br/eprocV2/controlador.php?acao=*
// @match        https://eproc.jfrs.jus.br/eprocV2/controlador.php?acao=*
// @match        https://eproc.jfsc.jus.br/eprocV2/controlador.php?acao=*
// @match        https://eproc.trf4.jus.br/eproc2trf4/controlador.php?acao=*
// @grant        GM_addStyle
// @grant        GM_info
// ==/UserScript==

(o => {
  if (typeof GM_addStyle == 'function') {
    GM_addStyle(o);
    return;
  }
  const t = document.createElement('style');
  (t.textContent = o), document.head.append(t);
})(
  ' .bootstrap-styles #divCapaProcesso .row{align-items:center}.bootstrap-styles #divCapaProcesso ._div_ecv0l_4 a._link_ecv0l_4{--cor: hsl(333, 75%, 25%)}.bootstrap-styles #divCapaProcesso ._div_ecv0l_4 a._link_ecv0l_4._added_ecv0l_7{--cor: hsl(333, 75%, 35%)}.bootstrap-styles #divCapaProcesso ._div_ecv0l_4 a._link_ecv0l_4._wait_ecv0l_10{--cor: hsl(332, 15%, 35%)}.bootstrap-styles #divCapaProcesso ._div_ecv0l_4 a._link_ecv0l_4 ._icon_ecv0l_13{color:var(--cor)}.bootstrap-styles .navbar ._link_ecv0l_4 .navbar-icons._icon_ecv0l_13{color:#eed8e2}.bootstrap-styles .navbar ._link_ecv0l_4 .navbar-icons._icon_ecv0l_13:hover{background-color:#ff80b980!important}.bootstrap-styles ._dialogo_ecv0l_22{min-width:35%;height:90%;border-radius:7px;box-shadow:10px 20px 30px #2c212680;background:#fbf4f7}.bootstrap-styles ._dialogo_ecv0l_22::backdrop{background-color:#2c2126cc}.bootstrap-styles ._dialogo_ecv0l_22 h1{text-align:center}.bootstrap-styles ._dialogo_ecv0l_22 q{font-style:italic}.bootstrap-styles ._dialogo_ecv0l_22 button{border:1px outset hsl(333,50%,75%);padding:.1em 1ch;border-radius:4px;color:#290012;background:#e2cfd8}.bootstrap-styles ._dialogo_ecv0l_22 table thead tr,.bootstrap-styles ._dialogo_ecv0l_22 table tbody tr:nth-child(2n){background:#ebe0e5}.bootstrap-styles ._dialogo_ecv0l_22 table th,.bootstrap-styles ._dialogo_ecv0l_22 table td{border:0 solid black;text-align:center;padding:2px 6px}.bootstrap-styles ._dialogo_ecv0l_22 table th{border-bottom-width:2px}.bootstrap-styles ._dialogo_ecv0l_22 table th+th,.bootstrap-styles ._dialogo_ecv0l_22 table td+td{border-left-width:1px}.bootstrap-styles ._dialogo_ecv0l_22 ._div_download_ecv0l_62,.bootstrap-styles ._dialogo_ecv0l_22 ._div_upload_ecv0l_63{background:transparent;transition:1s background 2s;padding:1em 3ch}.bootstrap-styles ._dialogo_ecv0l_22 ._div_download_ecv0l_62._hidden_ecv0l_68,.bootstrap-styles ._dialogo_ecv0l_22 ._div_upload_ecv0l_63._hidden_ecv0l_68{position:absolute;width:1px;height:1px;overflow:hidden;top:-3em;left:-7ch;background:#ffeedb;transition:none}.bootstrap-styles ._dialogo_ecv0l_22 ._barra_ecv0l_79{text-align:right}.bootstrap-styles ._dialogo_ecv0l_22 ._aviso_ecv0l_82{background:#ffeedb;border:1px solid hsl(31,25%,75%);font-size:90%;margin-block:1em;padding-inline:2ex}.bootstrap-styles ._dialogo_ecv0l_22 ._aviso_ecv0l_82 p{margin-block:.5em} '
);

(function () {
  'use strict';

  var _GM_info = /* @__PURE__ */ (() =>
    typeof GM_info != 'undefined' ? GM_info : void 0)();
  function log_error(error) {
    console.group(_GM_info.script.name);
    console.error(error);
    console.groupEnd();
  }
  class AssertionError extends Error {
    name = 'AssertionError';
    constructor(message) {
      super(message);
    }
  }
  function assert(condition, message) {
    if (!condition) throw new AssertionError(message);
  }
  function check(predicate, value, message) {
    assert(predicate(value), message);
    return value;
  }
  function isOfType(typeRepresentation) {
    return value => typeof value === typeRepresentation;
  }
  const isOfTypeObject = /* @__PURE__ */ isOfType('object');
  const isString = /* @__PURE__ */ isOfType('string');
  function isLiteral(literal) {
    return value => value === literal;
  }
  const isUndefined = /* @__PURE__ */ isLiteral(void 0);
  const isNull = /* @__PURE__ */ isLiteral(null);
  function negate(predicate) {
    return value => !predicate(value);
  }
  const isNotNull = /* @__PURE__ */ negate(isNull);
  const isDefined = /* @__PURE__ */ negate(isUndefined);
  function refine(...predicates) {
    return value => predicates.every(p => p(value));
  }
  const isObject = /* @__PURE__ */ refine(isOfTypeObject, isNotNull);
  const isInteger = x => Number.isInteger(x);
  const isNonNegativeInteger = /* @__PURE__ */ refine(isInteger, x => x > -1);
  const isNonEmptyString = /* @__PURE__ */ refine(
    isString,
    x => x.trim().length > 0
  );
  function isAnyOf(...predicates) {
    return value => predicates.some(p => p(value));
  }
  const isNullish = x => x == null;
  const isNotNullish = /* @__PURE__ */ negate(isNullish);
  const isArray = x => Array.isArray(x);
  function isTypedArray(predicate) {
    return refine(isArray, xs => xs.every(predicate));
  }
  function hasShape(predicates) {
    return refine(isObject, obj =>
      Object.entries(predicates).every(([key, predicate]) =>
        key in obj ? predicate(obj[key]) : predicate.optional === true
      )
    );
  }
  function promisifyRequest(request) {
    return new Promise((resolve, reject) => {
      request.oncomplete = request.onsuccess = () => resolve(request.result);
      request.onabort = request.onerror = () => reject(request.error);
    });
  }
  function createStore$1(dbName, storeName) {
    const request = indexedDB.open(dbName);
    request.onupgradeneeded = () => request.result.createObjectStore(storeName);
    const dbp = promisifyRequest(request);
    return (txMode, callback) =>
      dbp.then(db =>
        callback(db.transaction(storeName, txMode).objectStore(storeName))
      );
  }
  let defaultGetStoreFunc;
  function defaultGetStore() {
    if (!defaultGetStoreFunc) {
      defaultGetStoreFunc = createStore$1('keyval-store', 'keyval');
    }
    return defaultGetStoreFunc;
  }
  function get(key, customStore = defaultGetStore()) {
    return customStore('readonly', store => promisifyRequest(store.get(key)));
  }
  function set(key, value, customStore = defaultGetStore()) {
    return customStore('readwrite', store => {
      store.put(value, key);
      return promisifyRequest(store.transaction);
    });
  }
  function update(key, updater, customStore = defaultGetStore()) {
    return customStore(
      'readwrite',
      store =>
        // Need to create the promise manually.
        // If I try to chain promises, the transaction closes in browsers
        // that use a promise polyfill (IE10/11).
        new Promise((resolve, reject) => {
          store.get(key).onsuccess = function () {
            try {
              store.put(updater(this.result), key);
              resolve(promisifyRequest(store.transaction));
            } catch (err) {
              reject(err);
            }
          };
        })
    );
  }
  function eachCursor(store, callback) {
    store.openCursor().onsuccess = function () {
      if (!this.result) return;
      callback(this.result);
      this.result.continue();
    };
    return promisifyRequest(store.transaction);
  }
  function entries(customStore = defaultGetStore()) {
    return customStore('readonly', store => {
      if (store.getAll && store.getAllKeys) {
        return Promise.all([
          promisifyRequest(store.getAllKeys()),
          promisifyRequest(store.getAll()),
        ]).then(([keys, values]) => keys.map((key, i) => [key, values[i]]));
      }
      const items = [];
      return customStore('readonly', store2 =>
        eachCursor(store2, cursor =>
          items.push([cursor.key, cursor.value])
        ).then(() => items)
      );
    });
  }
  const DB_NAME = 'eproc-favoritos-historico';
  class Store {
    _store;
    constructor() {
      this._store = createStore$1(DB_NAME, 'itens');
    }
    get(numproc) {
      return get(numproc, this._store);
    }
    getAll() {
      return entries(this._store);
    }
    set(numproc, item) {
      return set(numproc, item, this._store);
    }
    update(numproc, update$1) {
      return update(numproc, update$1, this._store);
    }
    static getInstance() {
      return new Store();
    }
  }
  async function verificar_favorito(numproc) {
    const item = await Store.getInstance().get(numproc);
    return item?.favorito;
  }
  async function salvar_favorito({ motivo, numproc, prioridade }) {
    const timestamp = /* @__PURE__ */ new Date().getTime();
    await Store.getInstance().set(numproc, {
      favorito: { motivo, prioridade, timestamp },
      acesso: timestamp,
    });
  }
  async function importar_favorito({ numproc, ...favorito }) {
    Store.getInstance().update(numproc, item => {
      const acesso = item === void 0 ? favorito.timestamp : item.acesso;
      return { acesso, favorito };
    });
  }
  async function remover_favorito(numproc) {
    await Store.getInstance().set(numproc, {
      favorito: void 0,
      acesso: /* @__PURE__ */ new Date().getTime(),
    });
  }
  async function acrescentar_historico(numproc) {
    await Store.getInstance().update(numproc, dados => {
      const { favorito } = dados ?? {};
      return { favorito, acesso: /* @__PURE__ */ new Date().getTime() };
    });
  }
  async function obter_historico() {
    return (await Store.getInstance().getAll())
      .map(([numproc, item]) => ({
        numproc,
        ...item,
      }))
      .sort((a, b) => b.acesso - a.acesso);
  }
  async function obter_favoritos() {
    return (await Store.getInstance().getAll())
      .flatMap(([numproc, { favorito }]) => {
        if (favorito === void 0) return [];
        return { numproc, ...favorito };
      })
      .sort((a, b) => {
        if (a.prioridade !== b.prioridade) return b.prioridade - a.prioridade;
        return b.timestamp - a.timestamp;
      });
  }
  function isNumProc(x) {
    return /^\d{20}$/.test(x);
  }
  function h(tag, props = null, ...children) {
    const element = document.createElement(tag);
    for (const [key, value] of Object.entries(props ?? {})) {
      if (key === 'style' || key === 'dataset') {
        for (const [k, v] of Object.entries(value)) {
          element[key][k] = v;
        }
      } else if (key === 'classList') {
        let classes2;
        if (Array.isArray(value)) {
          classes2 = value.filter(x => x !== null);
        } else {
          classes2 = Object.entries(value).flatMap(([k, v]) => {
            if (!v) return [];
            return [k];
          });
        }
        for (const className of classes2) {
          element.classList.add(className);
        }
      } else {
        element[key] = value;
      }
    }
    element.append(...children);
    return element;
  }
  function criar_dialogo(titulo, classes2) {
    const aviso2 = h(
      'div',
      { classList: [classes2.aviso] },
      h('p', { style: { textAlign: 'center' } }, h('strong', {}, 'ATENÇÃO'))
    );
    const output = h('output');
    const barra_topo = h(
      'div',
      { classList: [classes2.barra] },
      h('button', { type: 'button' }, 'Fechar')
    );
    const barra_rodape = barra_topo.cloneNode(true);
    const barras = [barra_topo, barra_rodape];
    const botoes = barras.map(b => b.querySelector('button'));
    botoes.forEach(botao => {
      botao.onclick = onclick;
    });
    const h1 = h('h1', {}, titulo);
    const dialogo2 = h(
      'dialog',
      { classList: [classes2.dialogo] },
      aviso2,
      h1,
      barra_topo,
      output,
      barra_rodape
    );
    return {
      dialogo: dialogo2,
      aviso: aviso2,
      barras,
      botoes,
      output,
      titulo: h1,
    };
    function onclick(evt) {
      evt.preventDefault();
      dialogo2.close();
    }
  }
  function criar_icone_material(symbol, title) {
    return h('i', { classList: ['material-icons'], title }, symbol);
  }
  function criar_tabela(cabecalhos, linhas) {
    return h(
      'table',
      {},
      h(
        'thead',
        {},
        h('tr', {}, ...cabecalhos.map(child => h('th', {}, child)))
      ),
      h(
        'tbody',
        {},
        ...linhas.map(celulas =>
          h('tr', {}, ...celulas.map(conteudo => h('td', {}, conteudo)))
        )
      )
    );
  }
  const div = '_div_ecv0l_4';
  const link = '_link_ecv0l_4';
  const added = '_added_ecv0l_7';
  const wait = '_wait_ecv0l_10';
  const icon = '_icon_ecv0l_13';
  const dialogo = '_dialogo_ecv0l_22';
  const div_download = '_div_download_ecv0l_62';
  const div_upload = '_div_upload_ecv0l_63';
  const hidden = '_hidden_ecv0l_68';
  const barra = '_barra_ecv0l_79';
  const aviso = '_aviso_ecv0l_82';
  const classes = {
    div,
    link,
    added,
    wait,
    icon,
    dialogo,
    div_download,
    div_upload,
    hidden,
    barra,
    aviso,
  };
  const unidades = [
    { max_exclusive: 1e3, format: _ms => 'Agora' },
    { max_exclusive: 60, format: s => `Há ${formatar_plural(s, 'segundo')}` },
    { max_exclusive: 60, format: s => `Há ${formatar_plural(s, 'minuto')}` },
    { max_exclusive: 24, format: s => `Há ${formatar_plural(s, 'hora')}` },
    { max_exclusive: 365, format: s => `Há ${formatar_plural(s, 'dia')}` },
    {
      max_exclusive: Number.POSITIVE_INFINITY,
      format: (_, d) => d.toLocaleDateString(),
    },
  ];
  function formatar_intervalo(inicio, fim) {
    const intervalo_ms = fim.getTime() - inicio.getTime();
    let current = intervalo_ms;
    for (const unidade of unidades) {
      if (current < unidade.max_exclusive) {
        return unidade.format(current, inicio);
      } else {
        current = Math.floor(current / unidade.max_exclusive);
      }
    }
    throw new Error('Erro inesperado.');
  }
  function formatar_plural(n, singular) {
    return `${n.toString()} ${singular}${n > 1 ? 's' : ''}`;
  }
  function formatar_numproc(numproc) {
    let index = 0;
    return '#######-##.####.#.##.####'.replace(/#/g, () => numproc[index++]);
  }
  const mensagem_aviso_favoritos = [
    'Os favoritos são salvos apenas neste navegador e computador.',
    'Cabe ao navegador determinar por quanto tempo estes dados serão mantidos e quando precisam ser excluídos.',
    'Para evitar perda de dados, adicione processos importantes a um localizador destinado a este fim ou exporte regularmente os favoritos para um arquivo e salve-o em local seguro.',
  ];
  const Prioridade = { BAIXA: 1, MEDIA: 2, ALTA: 3 };
  const isPrioridade = isAnyOf(
    isLiteral(Prioridade.BAIXA),
    isLiteral(Prioridade.MEDIA),
    isLiteral(Prioridade.ALTA)
  );
  async function query_first(selector, parentNode = document) {
    const element = parentNode.querySelector(selector);
    if (element === null) {
      throw new Error(`Não foi possível obter elemento: \`${selector}\`.`);
    }
    return element;
  }
  async function tela_com_barra_superior() {
    const icones_casa = Array.from(
      document.querySelectorAll('#navbar i.navbar-icons')
    ).filter(x => x.textContent === 'home');
    if (icones_casa.length > 1) throw new Error('Mais de um ícone encontrado.');
    if (icones_casa.length === 0) return;
    const link_casa = icones_casa[0].closest('a[href]');
    assert(isNotNull(link_casa), 'Erro ao definir localização dos ícones.');
    const pesquisa_rapida = await query_first(
      'input[id="txtNumProcessoPesquisaRapida"]'
    );
    const botao_mesma_aba = await query_first(
      'button[name="btnPesquisaRapidaSubmit"]'
    );
    const botao_nova_aba = await query_first(
      'button[name="btnPesquisaRapidaSubmitNovaAba"]'
    );
    const abrir_processo = (numproc, aba) => {
      const valor_antigo = pesquisa_rapida.value;
      pesquisa_rapida.value = numproc;
      if (aba === 'MESMA_ABA') botao_mesma_aba.click();
      else botao_nova_aba.click();
      pesquisa_rapida.value = valor_antigo;
    };
    const link_historico = criar_link_barra({
      symbol: 'history',
      title: 'Histórico de processos',
    });
    const link_favoritos = criar_link_barra({
      symbol: 'bookmark_border',
      title: 'Favoritos',
    });
    const div2 = h(
      'div',
      { classList: ['px-2'] },
      link_historico,
      link_favoritos
    );
    link_casa.parentNode.insertBefore(div2, link_casa);
    const dialogo_historico = criar_dialogo_historico(abrir_processo);
    const dialogo_favoritos = criar_dialogo_favoritos(abrir_processo);
    document.body.append(
      h(
        'div',
        { className: 'bootstrap-styles' },
        dialogo_historico.dialogo,
        dialogo_favoritos.dialogo
      )
    );
    const criar_handler_abertura =
      ({ dialogo: dialogo2, update: update2 }, obter_dados) =>
      evt => {
        evt.preventDefault();
        update2([]);
        dialogo2.showModal();
        obter_dados()
          .then(update2)
          .catch(err => {
            log_error(err);
            window.alert('Não foi possível obter os dados.');
            dialogo2.close();
          });
      };
    link_historico.addEventListener(
      'click',
      criar_handler_abertura(dialogo_historico, obter_historico)
    );
    link_favoritos.addEventListener(
      'click',
      criar_handler_abertura(dialogo_favoritos, obter_favoritos)
    );
  }
  function criar_link_barra({ symbol, title }) {
    const icone = criar_icone_material(symbol, title);
    icone.classList.add(classes.icon, 'navbar-icons');
    icone.style.padding = '0';
    const link2 = h('a', { classList: [classes.link], href: '#' }, icone);
    return link2;
  }
  function criar_dialogo_historico(abrir_processo) {
    const {
      aviso: aviso2,
      dialogo: dialogo2,
      output,
    } = criar_dialogo('Histórico de processos', classes);
    aviso2.append(
      ...[
        'Aparecerão aqui apenas os processos acessados neste navegador e computador.',
        'Usuários com perfil de Diretor de Secretaria conseguem obter a relação completa de processos acessados.',
      ].map(x => h('p', {}, x))
    );
    const criar_links_numproc = criar_links_dialogo(dialogo2, abrir_processo);
    return {
      dialogo: dialogo2,
      update(dados) {
        if (dados.length === 0) {
          output.textContent = 'Não há dados relativos a processos acessados.';
          return;
        }
        output.textContent = '';
        const data_agora = /* @__PURE__ */ new Date();
        output.append(
          criar_tabela(
            ['Favorito?', 'Processo', 'Último acesso'],
            dados.map(({ numproc, favorito, acesso }) => {
              const c0 =
                favorito === void 0
                  ? ''
                  : criar_icone_material('star', favorito.motivo);
              const c1 = criar_links_numproc(numproc);
              const data_acesso = new Date(acesso);
              const c2 = h(
                'time',
                {
                  dateTime: data_acesso.toISOString(),
                  title: data_acesso.toLocaleString('pt-BR'),
                },
                formatar_intervalo(data_acesso, data_agora)
              );
              return [c0, c1, c2];
            })
          )
        );
      },
    };
  }
  function criar_dialogo_favoritos(abrir_processo) {
    const {
      dialogo: dialogo2,
      aviso: aviso2,
      output,
      barras,
    } = criar_dialogo('Favoritos', classes);
    aviso2.append(...mensagem_aviso_favoritos.map(x => h('p', {}, x)));
    const criar_links_numproc = criar_links_dialogo(dialogo2, abrir_processo);
    const botoes_exportar = [];
    barras.forEach(barra2 => {
      const botao_exportar = h(
        'button',
        {
          type: 'button',
          onclick: function exportar(evt) {
            evt.preventDefault();
            div_upload2.classList.toggle(classes.hidden, true);
            const new_hidden_state = !div_download2.classList.contains(
              classes.hidden
            );
            div_download2.classList.toggle(classes.hidden, new_hidden_state);
          },
        },
        'Exportar...'
      );
      botoes_exportar.push(botao_exportar);
      const botao_importar = h(
        'button',
        {
          type: 'button',
          onclick: function importar(evt) {
            evt.preventDefault();
            div_download2.classList.toggle(classes.hidden, true);
            const new_hidden_state = !div_upload2.classList.contains(
              classes.hidden
            );
            div_upload2.classList.toggle(classes.hidden, new_hidden_state);
          },
        },
        'Importar...'
      );
      barra2.prepend(botao_importar, ' ', botao_exportar, ' ');
    });
    const link_download = h(
      'a',
      {
        href: `data:application/json,${window.encodeURIComponent('[]')}`,
        download: 'processos_favoritos.json',
      },
      'Clique aqui com o botão direito do mouse'
    );
    obter_favoritos()
      .then(favoritos => {
        link_download.href = `data:application/json,${window.encodeURIComponent(JSON.stringify(favoritos))}`;
      })
      .catch(err => {
        div_download2.classList.toggle(classes.hidden, true);
        botoes_exportar.forEach(botao_exportar => {
          botao_exportar.onclick = evt => {
            evt.preventDefault();
            log_error(err);
            window.alert('Erro ao obter os favoritos.');
          };
        });
      });
    const div_download2 = h(
      'div',
      {
        classList: [classes.div_download, classes.hidden],
      },
      h(
        'p',
        {},
        link_download,
        ' e selecione “',
        h('samp', {}, 'Salvar link como...'),
        '” para salvar os favoritos em um arquivo.'
      ),
      h(
        'p',
        {},
        'Posteriormente você poderá usar o botão “',
        h('samp', {}, 'Importar...'),
        '” para utilizá-lo em outro computador ou navegador.'
      )
    );
    const arquivo = h('input', {
      type: 'file',
      accept: 'application/json',
      onchange(evt) {
        evt.preventDefault();
        if ((arquivo.files?.length ?? 0) === 1) {
          (async () => {
            const file = arquivo.files.item(0);
            console.log({ file });
            const text = await file.text();
            const novos_favoritos = check(
              isTypedArray(
                hasShape({
                  numproc: refine(isString, isNumProc),
                  prioridade: isPrioridade,
                  motivo: isString,
                  timestamp: isNonNegativeInteger,
                })
              ),
              JSON.parse(text)
            );
            const resposta = window.confirm(
              'ATENÇÃO: TODOS OS FAVORITOS SERÃO EXCLUÍDOS E SUBSTITUÍDOS PELO ARQUIVO IMPORTADO. DESEJA CONTINUAR?'
            );
            if (resposta === true) {
              for (const { numproc } of await obter_favoritos()) {
                await remover_favorito(numproc);
              }
              for (const fav of novos_favoritos) {
                await importar_favorito(fav);
              }
              window.alert(
                'Favoritos importados. Atualize a página para que as alterações tenham efeito.'
              );
              div_upload2.classList.add(classes.hidden);
              dialogo2.close();
            }
          })().catch(err => {
            log_error(err);
            window.alert('Erro ao abrir arquivo.');
          });
        }
      },
    });
    const div_upload2 = h(
      'div',
      { classList: [classes.div_upload, classes.hidden] },
      h('p', {}, 'Selecione abaixo o arquivo a importar.'),
      arquivo
    );
    barras[0].after(div_download2, div_upload2);
    return {
      dialogo: dialogo2,
      update(dados) {
        if (dados.length === 0) {
          output.textContent = 'Não há favoritos cadastrados.';
          return;
        }
        output.textContent = '';
        const tabela = criar_tabela(
          ['Prioridade', 'Processo', 'Motivo'],
          dados.map(({ numproc, motivo, prioridade }) => {
            const c0 = {
              [Prioridade.ALTA]: 'Alta',
              [Prioridade.MEDIA]: 'Média',
              [Prioridade.BAIXA]: 'Baixa',
            }[prioridade];
            const c1 = criar_links_numproc(numproc);
            const c2 = motivo;
            return [c0, c1, c2];
          })
        );
        const linhas = check(isDefined, tabela.tBodies[0]?.rows);
        for (const linha of linhas) {
          check(isDefined, linha.cells[2]).style.textAlign = 'start';
        }
        output.append(tabela);
      },
    };
  }
  function criar_links_dialogo(dialogo2, abrir_processo) {
    return numproc => {
      const criar_onclick = aba => evt => {
        evt.preventDefault();
        if (aba === 'MESMA_ABA') dialogo2.close();
        try {
          abrir_processo(numproc, aba);
        } catch (err) {
          log_error(err);
          window.alert('Não foi possível abrir o processo selecionado.');
        }
      };
      const link_mesma = h(
        'a',
        { href: '#', onclick: criar_onclick('MESMA_ABA') },
        formatar_numproc(numproc)
      );
      const link_nova = h(
        'small',
        {},
        h(
          'a',
          { href: '#', onclick: criar_onclick('NOVA_ABA') },
          h(
            'i',
            {
              classList: ['material-icons'],
              title: 'Abrir em nova aba',
              style: { fontSize: '17px' },
            },
            'open_in_new'
          )
        )
      );
      const frag = document.createDocumentFragment();
      frag.append(link_mesma, ' ', link_nova);
      return frag;
    };
  }
  function createStore(getInitialState, reducer) {
    const listeners = /* @__PURE__ */ new Set();
    let state = getInitialState();
    return { dispatch, getState, subscribe };
    function dispatch(action) {
      state = reducer(state, action);
      for (const l of listeners) l(state);
    }
    function getState() {
      return state;
    }
    function subscribe(listener) {
      listeners.add(listener);
      listener(state);
      return { unsubscribe };
      function unsubscribe() {
        listeners.delete(listener);
      }
    }
  }
  async function tela_processo() {
    const elemento_numero = document.getElementById('txtNumProcesso');
    assert(
      isNotNullish(elemento_numero),
      'Erro ao obter o número do processo.'
    );
    const numero_formatado = elemento_numero.textContent.trim();
    assert(
      isNonEmptyString(numero_formatado),
      'Erro ao obter o número do processo.'
    );
    const numero = check(
      isNumProc,
      numero_formatado.replace(/[.-]/g, ''),
      'Erro ao obter número do processo'
    );
    const estado = createStore(
      () => ({ status: 'PENDING' }),
      (_, x) => x
    );
    try {
      const resultado = await verificar_favorito(numero);
      estado.dispatch(
        resultado !== void 0
          ? { status: 'ACTIVE', motivo: resultado.motivo }
          : { status: 'INACTIVE' }
      );
    } catch (err) {
      estado.dispatch({ status: 'ERROR' });
      throw err;
    }
    const {
      dialogo: dialogo2,
      aviso: aviso2,
      barras,
      output,
      titulo,
    } = criar_dialogo('TITULO_DIALOGO', classes);
    aviso2.append(...mensagem_aviso_favoritos.map(x => h('p', {}, x)));
    const salvar_e_fechar = evt => {
      evt.preventDefault();
      (async () => {
        const motivo = input.value;
        const valor_prioridade = Number(select.value);
        const prioridade = check(
          p => Object.values(Prioridade).includes(p),
          Number(select.value),
          `Prioridade desconhecida: ${valor_prioridade}`
        );
        await salvar_favorito({ numproc: numero, motivo, prioridade });
        estado.dispatch({ status: 'ACTIVE', motivo });
        dialogo2.close();
      })().catch(err => {
        estado.dispatch({ status: 'ERROR' });
        log_error(err);
        window.alert('Erro ao salvar favorito.');
      });
    };
    const fechar_sem_salvar = evt => {
      evt.preventDefault();
      (async () => {
        dialogo2.close();
        const favorito = await verificar_favorito(numero);
        if (favorito !== void 0) {
          estado.dispatch({ status: 'ACTIVE', motivo: favorito.motivo });
        } else {
          estado.dispatch({ status: 'INACTIVE' });
        }
      })().catch(err => {
        estado.dispatch({ status: 'ERROR' });
        log_error(err);
      });
    };
    const remover_clicado = evt => {
      evt.preventDefault();
      (async () => {
        const resposta = window.confirm(
          `Remover processo ${formatar_numproc(numero)} dos favoritos?`
        );
        if (resposta === true) {
          await remover_favorito(numero);
          dialogo2.close();
          estado.dispatch({ status: 'INACTIVE' });
        }
      })().catch(err => {
        estado.dispatch({ status: 'ERROR' });
        log_error(err);
        window.alert('Erro ao remover dos favoritos.');
      });
    };
    const remover = barras.map(barra2 => {
      const fechar = barra2.firstChild;
      fechar.onclick = fechar_sem_salvar;
      const frag = document.createDocumentFragment();
      const remover2 = h(
        'span',
        {},
        h('button', { type: 'button', onclick: remover_clicado }, 'Remover'),
        ' '
      );
      frag.append(
        h('button', { type: 'button', onclick: salvar_e_fechar }, 'Salvar'),
        ' ',
        remover2
      );
      barra2.insertBefore(frag, barra2.firstChild);
      return remover2;
    });
    const update_dialogo = atual => {
      if (atual === void 0) {
        titulo.textContent = 'Adicionar aos favoritos';
        input.value = '';
        select.value = Prioridade.MEDIA.toString();
        remover.forEach(r => (r.hidden = true));
      } else {
        titulo.textContent = 'Alterar dados do favorito';
        input.value = atual.motivo;
        select.value = atual.prioridade.toString();
        remover.forEach(r => (r.hidden = false));
      }
    };
    document.body.append(dialogo2);
    const textoPrioridades = {
      [Prioridade.BAIXA]: 'Baixa',
      [Prioridade.MEDIA]: 'Média',
      [Prioridade.ALTA]: 'Alta',
    };
    const select = h(
      'select',
      {},
      ...Object.values(Prioridade)
        .sort((x, y) => y - x)
        .map(valor =>
          h('option', { value: valor.toString() }, textoPrioridades[valor])
        )
    );
    const input = h('input', { autofocus: true, size: 50 });
    output.append(
      h('label', {}, 'Motivo: ', input),
      h('br'),
      h('label', {}, 'Prioridade: ', select)
    );
    const estrela = render_estrela(elemento_numero);
    estado.subscribe(estrela.update);
    estrela.link.addEventListener('click', evt => {
      evt.preventDefault();
      const current = estado.getState();
      if (current.status === 'ERROR' || current.status === 'PENDING') return;
      (async () => {
        estado.dispatch({ status: 'PENDING' });
        const dados = await verificar_favorito(numero);
        if (current.status === 'ACTIVE' && dados === void 0) {
          estado.dispatch({ status: 'INACTIVE' });
          window.alert(
            'Dados não encontrados. Possivelmente desativado em outra aba.'
          );
        } else {
          update_dialogo(dados);
          dialogo2.showModal();
        }
      })().catch(err => {
        estado.dispatch({ status: 'ERROR' });
        log_error(err);
        window.alert('Erro ao realizar a operação.');
      });
    });
  }
  function render_estrela(elemento_numero) {
    const parent = elemento_numero.parentNode;
    const icon2 = h('i', { classList: ['material-icons', classes.icon] });
    const link2 = h(
      'a',
      {
        classList: [classes.link, classes.wait, 'col-auto', 'px-1'],
        href: '#',
      },
      icon2
    );
    const div2 = h(
      'div',
      { classList: [classes.div, 'row'] },
      elemento_numero,
      link2
    );
    parent.append(div2);
    elemento_numero.classList.add('col-auto', 'pr-0');
    const info = {
      PENDING: { symbol: 'hourglass_top', title: 'Aguarde' },
      ACTIVE: { symbol: 'star', title: 'Remover dos favoritos' },
      INACTIVE: { symbol: 'star_outline', title: 'Adicionar aos favoritos' },
      ERROR: { symbol: 'error_outline', title: 'Erro ao carregar dados' },
    };
    return {
      link: link2,
      update: estado => {
        const { symbol, title } = info[estado.status];
        icon2.textContent = symbol;
        if (estado.status === 'ACTIVE') {
          link2.classList.add(classes.added);
          link2.classList.remove(classes.wait);
        } else if (estado.status === 'PENDING') {
          link2.classList.remove(classes.added);
          link2.classList.add(classes.wait);
        } else {
          link2.classList.remove(classes.added);
          link2.classList.remove(classes.wait);
        }
        if (estado.status === 'ACTIVE') {
          link2.title = estado.motivo.trim() || title;
        } else {
          link2.title = title;
        }
      },
    };
  }
  async function main() {
    const url = new URL(document.location.href);
    if (url.searchParams.get('acao') === 'processo_selecionar') {
      const numproc = url.searchParams.get('num_processo');
      assert(
        isNotNull(numproc) && isNumProc(numproc),
        'Erro ao obter o número do processo.'
      );
      await acrescentar_historico(numproc);
      await tela_processo();
    }
    await tela_com_barra_superior();
  }
  main().catch(log_error);
})();
