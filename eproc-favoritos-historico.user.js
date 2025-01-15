// ==UserScript==
// @name         eproc-favoritos-historico
// @name:pt-BR   eproc - favoritos e histórico
// @namespace    http://nadameu.com.br
// @version      1.1.0
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
  ' .bootstrap-styles .navbar ._link_o5pf7_1 .navbar-icons._icon_o5pf7_1{color:#eed8e2}.bootstrap-styles .navbar ._link_o5pf7_1 .navbar-icons._icon_o5pf7_1:hover{background-color:#ff80b980!important}.bootstrap-styles ._dialogo_o5pf7_7{min-width:35%;height:90%;border-radius:7px;box-shadow:10px 20px 30px #2c212680}.bootstrap-styles ._dialogo_o5pf7_7::backdrop{background-color:#2c2126cc}.bootstrap-styles ._dialogo_o5pf7_7 h1{text-align:center}.bootstrap-styles ._dialogo_o5pf7_7 ._barra_o5pf7_19{text-align:right}.bootstrap-styles ._dialogo_o5pf7_7 ._aviso_o5pf7_22{background:#fdd;border:1px solid #caa;font-size:90%;margin-block:1em;padding-inline:2ex}.bootstrap-styles ._dialogo_o5pf7_7 ._aviso_o5pf7_22 p{margin-block:.5em}.bootstrap-styles #divCapaProcesso .row{align-items:center}.bootstrap-styles #divCapaProcesso ._div_17q4m_4 a._link_17q4m_4 ._icon_17q4m_4{color:#70103b}.bootstrap-styles #divCapaProcesso ._div_17q4m_4 a._link_17q4m_4._added_17q4m_7 ._icon_17q4m_4{color:#9c1653}.bootstrap-styles #divCapaProcesso ._div_17q4m_4 a._link_17q4m_4._wait_17q4m_10 ._icon_17q4m_4{color:#674c58} '
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
  function formatar_numproc(numproc) {
    let index = 0;
    return '#######-##.####.#.##.####'.replace(/#/g, () => numproc[index++]);
  }
  const Prioridade = { BAIXA: 1, MEDIA: 2, ALTA: 3 };
  async function query_first(selector, parentNode = document) {
    const element = parentNode.querySelector(selector);
    if (element === null) {
      throw new Error(`Não foi possível obter elemento: \`${selector}\`.`);
    }
    return element;
  }
  const link$1 = '_link_o5pf7_1';
  const icon$1 = '_icon_o5pf7_1';
  const dialogo = '_dialogo_o5pf7_7';
  const barra = '_barra_o5pf7_19';
  const aviso = '_aviso_o5pf7_22';
  const classes$1 = {
    link: link$1,
    icon: icon$1,
    dialogo,
    barra,
    aviso,
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
    document.body.append(dialogo_historico.dialogo, dialogo_favoritos.dialogo);
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
    icone.classList.add(classes$1.icon, 'navbar-icons');
    icone.style.padding = '0';
    const link2 = h('a', { classList: [classes$1.link], href: '#' }, icone);
    return link2;
  }
  function criar_dialogo(titulo) {
    const aviso2 = h(
      'div',
      { classList: [classes$1.aviso] },
      h('p', { style: { textAlign: 'center' } }, h('strong', {}, 'ATENÇÃO'))
    );
    const output = h('output');
    const dialogo2 = h(
      'dialog',
      { classList: [classes$1.dialogo] },
      aviso2,
      h('h1', {}, titulo),
      h(
        'div',
        { classList: [classes$1.barra] },
        h('button', { type: 'button', onclick }, 'Fechar')
      ),
      output,
      h(
        'div',
        { classList: [classes$1.barra] },
        h('button', { type: 'button', onclick }, 'Fechar')
      )
    );
    return { dialogo: dialogo2, aviso: aviso2, output };
    function onclick(evt) {
      evt.preventDefault();
      dialogo2.close();
    }
  }
  function criar_dialogo_historico(abrir_processo) {
    const {
      aviso: aviso2,
      dialogo: dialogo2,
      output,
    } = criar_dialogo('Histórico de processos');
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
        output.append(
          criar_tabela(
            ['Favorito?', 'Processo', 'Último acesso'],
            dados.map(({ numproc, favorito, acesso }) => {
              const c0 =
                favorito === void 0
                  ? ''
                  : criar_icone_material('star', favorito.motivo);
              const c1 = criar_links_numproc(numproc);
              const c2 = new Date(acesso).toLocaleString('pt-BR');
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
    } = criar_dialogo('Favoritos');
    aviso2.append(
      ...[
        'Os favoritos são salvos apenas neste navegador e computador.',
        'Cabe ao navegador determinar por quanto tempo estes dados serão mantidos e quando precisam ser excluídos.',
        'Para evitar perda de dados, adicione processos importantes a um localizador destinado a este fim.',
      ].map(x => h('p', {}, x))
    );
    const criar_links_numproc = criar_links_dialogo(dialogo2, abrir_processo);
    return {
      dialogo: dialogo2,
      update(dados) {
        if (dados.length === 0) {
          output.textContent = 'Não há favoritos cadastrados.';
          return;
        }
        output.textContent = '';
        output.append(
          criar_tabela(
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
          )
        );
      },
    };
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
        'a',
        { href: '#', onclick: criar_onclick('NOVA_ABA') },
        h(
          'i',
          {
            classList: ['material-icons'],
            title: 'Abrir em nova aba',
          },
          'open_in_new'
        )
      );
      const frag = document.createDocumentFragment();
      frag.append(link_mesma, ' ', link_nova);
      return frag;
    };
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
        log_error(err);
        throw err;
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
