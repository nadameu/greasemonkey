// ==UserScript==
// @name         eproc-favoritos-historico
// @name:pt-BR   eproc - favoritos e histórico
// @namespace    http://nadameu.com.br
// @version      1.0.0
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
  const _ = document.createElement('style');
  (_.textContent = o), document.head.append(_);
})(
  ' .bootstrap-styles .navbar ._link_123p5_1 .navbar-icons._icon_123p5_1:hover{background-color:#ff80b980!important}._historico_123p5_5,._favoritos_123p5_6{width:90%;height:90%;border-radius:7px;box-shadow:10px 20px 30px #2c212680}._historico_123p5_5::backdrop,._favoritos_123p5_6::backdrop{background-color:#2c2126cc}.bootstrap-styles #divCapaProcesso .row{align-items:center}.bootstrap-styles #divCapaProcesso ._div_17q4m_4 a._link_17q4m_4 ._icon_17q4m_4{color:#70103b}.bootstrap-styles #divCapaProcesso ._div_17q4m_4 a._link_17q4m_4._added_17q4m_7 ._icon_17q4m_4{color:#9c1653}.bootstrap-styles #divCapaProcesso ._div_17q4m_4 a._link_17q4m_4._wait_17q4m_10 ._icon_17q4m_4{color:#674c58} '
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
  const isString = /* @__PURE__ */ isOfType('string');
  function isLiteral(literal) {
    return value => value === literal;
  }
  const isNull = /* @__PURE__ */ isLiteral(null);
  function negate(predicate) {
    return value => !predicate(value);
  }
  const isNotNull = /* @__PURE__ */ negate(isNull);
  function refine(...predicates) {
    return value => predicates.every(p => p(value));
  }
  const isNonEmptyString = /* @__PURE__ */ refine(
    isString,
    x => x.trim().length > 0
  );
  const isNullish = x => x == null;
  const isNotNullish = /* @__PURE__ */ negate(isNullish);
  function promisifyRequest(request) {
    return new Promise((resolve, reject) => {
      request.oncomplete = request.onsuccess = () => resolve(request.result);
      request.onabort = request.onerror = () => reject(request.error);
    });
  }
  function createStore(dbName, storeName) {
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
      defaultGetStoreFunc = createStore('keyval-store', 'keyval');
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
  function isNumProc(x) {
    return /^\d{20}$/.test(x);
  }
  const Prioridade = { BAIXA: 1, MEDIA: 2, ALTA: 3 };
  class Store {
    _store;
    constructor() {
      this._store = createStore(DB_NAME, 'itens');
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
  function formatar_numproc(numproc) {
    let index = 0;
    return '#######-##.####.#.##.####'.replace(/#/g, () => numproc[index++]);
  }
  function query_first(selector, parentNode = document) {
    let element = void 0;
    return {
      then(f, g) {
        if (element === void 0) element = parentNode.querySelector(selector);
        if (element === null)
          return g(
            new Error(`Não foi possível obter elemento: \`${selector}\`.`)
          );
        return f(element);
      },
    };
  }
  const link$1 = '_link_123p5_1';
  const icon$1 = '_icon_123p5_1';
  const historico = '_historico_123p5_5';
  const favoritos = '_favoritos_123p5_6';
  const classes$1 = {
    link: link$1,
    icon: icon$1,
    historico,
    favoritos,
  };
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
    const icone_ultimo = criar_icone({
      symbol: 'refresh',
      title: 'Reabrir último processo',
    });
    const icone_historico = criar_icone({
      symbol: 'history',
      title: 'Histórico de processos',
    });
    const icone_favoritos = criar_icone({
      symbol: 'bookmark_border',
      title: 'Favoritos',
    });
    const div2 = h(
      'div',
      { classList: ['px-2'] },
      icone_ultimo,
      icone_historico,
      icone_favoritos
    );
    link_casa.parentNode.insertBefore(div2, link_casa);
    const dialogo_historico = h('dialog', { classList: [classes$1.historico] });
    const dialogo_favoritos = h('dialog', { classList: [classes$1.favoritos] });
    document.body.append(dialogo_historico, dialogo_favoritos);
    icone_historico.addEventListener('click', async evt => {
      evt.preventDefault();
      const dh = dialogo_historico;
      dh.textContent = '';
      dh.showModal();
      dh.append(h('h1', {}, 'Histórico de processos'));
      try {
        dh.append(
          h(
            'table',
            {},
            h(
              'thead',
              {},
              ...['Favorito?', 'Processo', 'Último acesso'].map(texto =>
                h('th', {}, texto)
              )
            ),
            h(
              'tbody',
              {},
              ...(await obter_historico()).map(
                ({ numproc, favorito, acesso }) =>
                  h(
                    'tr',
                    {},
                    h(
                      'td',
                      {},
                      favorito === void 0
                        ? ''
                        : h(
                            'i',
                            {
                              classList: ['material-icons'],
                              title: favorito.motivo,
                            },
                            'star'
                          )
                    ),
                    h(
                      'td',
                      {},
                      h(
                        'a',
                        {
                          href: '#',
                          onclick: evt2 => {
                            evt2.preventDefault();
                            dh.close();
                            abrir_processo(numproc).catch(err => {
                              log_error(err);
                            });
                          },
                        },
                        formatar_numproc(numproc)
                      ),
                      h(
                        'a',
                        {
                          href: '#',
                          onclick: evt2 => {
                            evt2.preventDefault();
                            dh.close();
                            abrir_processo_nova_aba(numproc).catch(err => {
                              log_error(err);
                            });
                          },
                        },
                        ' ',
                        h(
                          'i',
                          {
                            classList: ['material-icons'],
                            title: 'Abrir em nova aba',
                          },
                          'open_in_new'
                        )
                      )
                    ),
                    h('td', {}, new Date(acesso).toLocaleString('pt-BR'))
                  )
              )
            )
          )
        );
      } catch (err) {
        if (err instanceof Error) log_error(err);
        else log_error(new Error(JSON.stringify(err)));
        throw err;
      }
    });
    icone_favoritos.addEventListener('click', async evt => {
      evt.preventDefault();
      const df = dialogo_favoritos;
      df.textContent = '';
      df.showModal();
      df.append(h('h1', {}, 'Favoritos'));
      try {
        df.append(
          h(
            'table',
            {},
            h(
              'thead',
              {},
              h(
                'tr',
                {},
                ...['Prioridade', 'Processo', 'Motivo'].map(texto =>
                  h('th', {}, texto)
                )
              )
            ),
            h(
              'tbody',
              {},
              ...(await obter_favoritos()).map(
                ({ numproc, motivo, prioridade }) =>
                  h(
                    'tr',
                    {},
                    h(
                      'td',
                      {},
                      {
                        [Prioridade.ALTA]: 'Alta',
                        [Prioridade.MEDIA]: 'Média',
                        [Prioridade.BAIXA]: 'Baixa',
                      }[prioridade]
                    ),
                    h(
                      'td',
                      {},
                      h(
                        'a',
                        {
                          href: '#',
                          onclick: evt2 => {
                            evt2.preventDefault();
                            df.close();
                            abrir_processo(numproc).catch(err => {
                              log_error(err);
                            });
                          },
                        },
                        formatar_numproc(numproc)
                      ),
                      h(
                        'a',
                        {
                          href: '#',
                          onclick: evt2 => {
                            evt2.preventDefault();
                            df.close();
                            abrir_processo_nova_aba(numproc).catch(err => {
                              log_error(err);
                            });
                          },
                        },
                        h(
                          'i',
                          {
                            classList: ['material-icons'],
                            title: 'Abrir em nova aba',
                          },
                          'open_in_new'
                        )
                      )
                    ),
                    h('td', {}, motivo)
                  )
              )
            )
          )
        );
      } catch (err) {
        if (err instanceof Error) log_error(err);
        else log_error(new Error(JSON.stringify(err)));
        throw err;
      }
    });
    async function abrir_processo(numproc) {
      const valor_antigo = pesquisa_rapida.value;
      pesquisa_rapida.value = numproc;
      botao_mesma_aba.click();
      pesquisa_rapida.value = valor_antigo;
    }
    async function abrir_processo_nova_aba(numproc) {
      const valor_antigo = pesquisa_rapida.value;
      pesquisa_rapida.value = numproc;
      botao_nova_aba.click();
      pesquisa_rapida.value = valor_antigo;
    }
  }
  function criar_icone({ symbol, title }) {
    const icone = h(
      'i',
      {
        classList: [classes$1.icon, 'material-icons', 'navbar-icons'],
        style: { padding: '0' },
        title,
      },
      symbol
    );
    const link2 = h(
      'a',
      {
        classList: [classes$1.link],
        href: '#',
      },
      icone
    );
    return link2;
  }
  function create_store(initialState) {
    let state = initialState;
    const listeners = /* @__PURE__ */ new Set();
    return {
      get() {
        return state;
      },
      set(newState) {
        state = newState;
        for (const listener of listeners) {
          listener(state);
        }
      },
      subscribe(listener) {
        listeners.add(listener);
        listener(state);
        return {
          unsubscribe() {
            listeners.delete(listener);
          },
        };
      },
    };
  }
  const div = '_div_17q4m_4';
  const link = '_link_17q4m_4';
  const icon = '_icon_17q4m_4';
  const added = '_added_17q4m_7';
  const wait = '_wait_17q4m_10';
  const classes = {
    div,
    link,
    icon,
    added,
    wait,
  };
  async function tela_processo() {
    const elemento_numero = document.getElementById('txtNumProcesso');
    assert(
      isNotNullish(elemento_numero),
      'Erro ao obter o número do processo.'
    );
    const numero_formatado = elemento_numero.textContent?.trim();
    assert(
      isNonEmptyString(numero_formatado),
      'Erro ao obter o número do processo.'
    );
    const numero = check(
      isNumProc,
      numero_formatado.replace(/[.-]/g, ''),
      'Erro ao obter número do processo'
    );
    const status = create_store('PENDING');
    try {
      const resultado = await verificar_favorito(numero);
      status.set(
        resultado !== void 0
          ? { status: 'ACTIVE', motivo: resultado.motivo }
          : 'INACTIVE'
      );
    } catch (err) {
      status.set('ERROR');
      throw err;
    }
    const estrela = render_estrela(elemento_numero);
    status.subscribe(estrela.update);
    estrela.eventTarget.addEventListener('click', async () => {
      const current = status.get();
      if (current === 'ERROR' || current === 'PENDING') return;
      try {
        if (typeof current === 'object' && current.status === 'ACTIVE') {
          status.set('PENDING');
          await remover_favorito(numero);
          status.set('INACTIVE');
        } else {
          status.set('PENDING');
          const motivo = '';
          const prioridade = Prioridade.MEDIA;
          await salvar_favorito({ numproc: numero, motivo, prioridade });
          status.set({ status: 'ACTIVE', motivo });
        }
      } catch (err) {
        status.set('ERROR');
        if (err instanceof Error) log_error(err);
        else log_error(new Error(JSON.stringify(err)));
      }
    });
  }
  function render_estrela(elemento_numero) {
    const parent = elemento_numero.parentNode;
    const icon2 = h('i', { classList: ['material-icons', classes.icon] });
    const eventTarget = new EventTarget();
    const link2 = h(
      'a',
      {
        classList: [classes.link, classes.wait, 'col-auto', 'px-1'],
        href: '#',
        onclick: evt => {
          evt.preventDefault();
          eventTarget.dispatchEvent(new Event('click'));
        },
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
      eventTarget,
      update: status => {
        const { symbol, title } =
          typeof status === 'string' ? info[status] : info[status.status];
        icon2.textContent = symbol;
        if (typeof status === 'string') {
          link2.title = title;
        } else if (typeof status === 'object' && status.status === 'ACTIVE') {
          link2.title = status.motivo.trim() || title;
        } else {
          throw new Error('Status desconhecido.');
        }
        if (status === 'PENDING') {
          link2.classList.add(classes.wait);
        } else {
          link2.classList.remove(classes.wait);
        }
        if (typeof status === 'object' && status.status === 'ACTIVE') {
          link2.classList.add(classes.added);
        } else {
          link2.classList.remove(classes.added);
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
