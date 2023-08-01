// ==UserScript==
// @name         separar-em-blocos
// @name:pt-BR   Separar em blocos
// @namespace    http://nadameu.com.br
// @version      4.0.0
// @author       nadameu
// @description  Permite a separação de processos em blocos para movimentação separada
// @match        https://eproc.jfsc.jus.br/eprocV2/controlador.php?acao=processo_selecionar&*
// @match        https://eproc.jfsc.jus.br/eprocV2/controlador.php?acao=localizador_processos_lista&*
// @match        https://eproc.jfsc.jus.br/eprocV2/controlador.php?acao=relatorio_geral_consultar&*
// @require      https://cdn.jsdelivr.net/combine/npm/preact@10.11.0,npm/preact@10.11.0/hooks/dist/hooks.umd.js
// @grant        window.close
// ==/UserScript==

(s => {
  const o = document.createElement('style');
  (o.dataset.source = 'vite-plugin-monkey'), (o.textContent = s), document.head.append(o);
})(
  ' .gm-blocos__lista,.gm-blocos__dialog,.gm-blocos__processo{--accent: hsl(266, 40%, 25%);--bg: hsl(266, 10%, 30%);--border: hsl(266, 15%, 60%);--disabled: hsl(266, 5%, 37.5%);--disabled-text: hsl(266, 0%, 80%);--shadow: hsl(266, 12.5%, 17.5%);--muted-accent: hsl(266, 25%, 25%);--text: hsl(266, 0%, 100%)}.bootstrap-styles .gm-blocos__lista{margin:4px;padding:4px 8px;border-radius:4px;width:max-content;background:var(--bg);color:var(--text);box-shadow:0 3px 3px var(--shadow)}.bootstrap-styles .gm-blocos__lista h4{margin:3px 0;font-size:1.25rem;font-weight:300}.bootstrap-styles .gm-blocos__lista input[type=image]{border:none}.bootstrap-styles .gm-blocos__lista table{margin:6px 0 12px;border-collapse:collapse}.bootstrap-styles .gm-blocos__lista td{margin:0;padding:3px .5ch;vertical-align:middle}.bootstrap-styles .gm-blocos__lista td a[href]{color:#fff}.bootstrap-styles .gm-blocos__lista td label{font-size:.92rem;margin:0}.bootstrap-styles .gm-blocos__lista td small{font-size:.75rem}.bootstrap-styles .gm-blocos__lista tr{border:1px solid var(--disabled);border-width:1px 0}.bootstrap-styles .gm-blocos__lista tfoot td{padding-top:.75em;padding-bottom:.75em}.bootstrap-styles .gm-blocos__lista input.rename{font-size:1em}.bootstrap-styles .gm-blocos__lista .gm-erro,.bootstrap-styles .gm-blocos__lista .gm-aviso{padding:.1em .5ex;font-size:.9rem;background:hsl(0,10%,95%);color:#c00;margin:2px auto 6px;width:fit-content}.bootstrap-styles .gm-blocos__processo button,.bootstrap-styles .gm-blocos__lista button,.gm-blocos__dialog button{display:block;margin:0 auto 7px;padding:2px 20px;font-size:.86rem;border:none;border-radius:3px;box-shadow:0 2px 4px var(--shadow);background:var(--muted-accent);color:var(--text)}.bootstrap-styles .gm-blocos__processo button:hover,.bootstrap-styles .gm-blocos__lista button:hover,.gm-blocos__dialog button:hover{transition:background-color .1s ease-in;background:var(--accent)}.bootstrap-styles .gm-blocos__processo button:disabled,.bootstrap-styles .gm-blocos__lista button:disabled,.gm-blocos__dialog button:disabled{background:var(--disabled);color:var(--disabled-text);box-shadow:none}.bootstrap-styles .gm-blocos__dialog{background:var(--bg);color:var(--text);font-family:var(--font-family-sans-serif);font-size:1rem;min-width:25vw;border:3px ridge var(--border);box-shadow:0 4px 8px 4px #0c0a1080;border-radius:12px}.bootstrap-styles .gm-blocos__dialog::backdrop{background:hsla(266,25%,5%,.75)}.bootstrap-styles .gm-blocos__dialog form{display:grid;grid-template-rows:1fr 10fr 1fr;justify-items:center;align-items:center}.bootstrap-styles .gm-blocos__dialog form div{font-weight:700}.bootstrap-styles .gm-blocos__nome{all:unset}.bootstrap-styles .gm-blocos__processos{all:unset;border:1px inset var(--border);padding:.5em .5ch}.bootstrap-styles .gm-blocos__processo{margin:2px 3px 4px;padding:4px;border-radius:4px;background:var(--bg);color:var(--text);box-shadow:0 3px 3px var(--shadow)}.bootstrap-styles .gm-blocos__processo h4{margin:3px 0;font-size:1.25rem;font-weight:300}.bootstrap-styles .gm-blocos__processo ul{list-style-type:none;margin:3px 0 7px;padding:0}.bootstrap-styles .gm-blocos__processo li{position:relative;display:grid;grid-template-columns:auto 1fr auto;grid-gap:5px;align-items:center;margin:4px 0;padding:5px;border-radius:2px}.bootstrap-styles .gm-blocos__processo li:before{content:"";position:absolute;top:2px;width:100%;height:100%;border-bottom:1px solid #888;pointer-events:none}.bootstrap-styles .gm-blocos__processo li:last-of-type:before{content:none}.bootstrap-styles .gm-blocos__processo li:hover{background:var(--accent)}.bootstrap-styles .gm-blocos__processo label{margin:0;font-size:.92rem}.bootstrap-styles .gm-blocos__processo .placeholder span{height:1.38rem;animation:pulse 1s ease-in-out infinite alternate;border-radius:4px}.bootstrap-styles .gm-blocos__processo .placeholder span:first-of-type,.bootstrap-styles .gm-blocos__processo .placeholder span:last-of-type{width:1.38rem}@keyframes pulse{0%{background-color:var(--disabled)}to{background-color:var(--bg)}}.bootstrap-styles .gm-blocos__processo .error{margin:10px 5%;padding:4px 5%;border-radius:4px;font-weight:500;background:white;color:red} '
);

(function (preact, hooks) {
  'use strict';

  class _Either {
    catch(f) {
      return this.match({
        Left: f,
        Right: () => this,
      });
    }
    chain(f) {
      return this.match({
        Left: () => this,
        Right: f,
      });
    }
    mapLeft(f) {
      return this.match({
        Left: x => Left(f(x)),
        Right: () => this,
      });
    }
    map(f) {
      return this.match({
        Left: () => this,
        Right: x => Right(f(x)),
      });
    }
  }
  class _Left extends _Either {
    constructor(leftValue) {
      super();
      this.leftValue = leftValue;
    }
    isLeft = true;
    isRight = false;
    match({ Left: Left2 }) {
      return Left2(this.leftValue);
    }
  }
  function Left(leftValue) {
    return new _Left(leftValue);
  }
  class _Right extends _Either {
    constructor(rightValue) {
      super();
      this.rightValue = rightValue;
    }
    isLeft = false;
    isRight = true;
    match({ Right: Right2 }) {
      return Right2(this.rightValue);
    }
  }
  function Right(rightValue) {
    return new _Right(rightValue);
  }
  function traverse(collection, transform) {
    const results = [];
    let i = 0;
    for (const value of collection) {
      const either = transform(value, i++);
      if (either.isLeft) return either;
      results.push(either.rightValue);
    }
    return Right(results);
  }
  function createBroadcastService(id, validate) {
    const listeners = /* @__PURE__ */ new Set();
    const bc = new BroadcastChannel(id);
    bc.addEventListener('message', onMessage);
    return {
      destroy,
      publish,
      subscribe,
    };
    function onMessage(evt) {
      if (validate(evt.data)) for (const listener of listeners) listener(evt.data);
    }
    function destroy() {
      bc.removeEventListener('message', onMessage);
      listeners.clear();
      bc.close();
    }
    function publish(message) {
      bc.postMessage(message);
    }
    function subscribe(listener) {
      listeners.add(listener);
      return {
        unsubscribe() {
          listeners.delete(listener);
        },
      };
    }
  }
  function createStore(getInitialState, reducer) {
    const listeners = /* @__PURE__ */ new Set();
    let state = getInitialState();
    return {
      dispatch,
      getState,
      subscribe,
    };
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
      return {
        unsubscribe,
      };
      function unsubscribe() {
        listeners.delete(listener);
      }
    }
  }
  function createTaggedUnion(definitions, tagName = 'tag') {
    const ctors = {};
    for (const tag of Object.getOwnPropertyNames(definitions).concat(
      Object.getOwnPropertySymbols(definitions)
    )) {
      if (tag === 'match') throw new Error('Invalid tag: "match".');
      const f = definitions[tag];
      if (f === null) {
        ctors[tag] = {
          [tagName]: tag,
        };
      } else {
        ctors[tag] = (...args) => {
          const obj = f(...args);
          obj[tagName] = tag;
          return obj;
        };
      }
    }
    ctors.match = matchBy(tagName);
    return ctors;
  }
  function matchBy(tagName) {
    return (obj, matchers, otherwise) => {
      if ((typeof obj !== 'object' && typeof obj !== 'function') || obj === null)
        throw new Error(
          `${Object.prototype.toString
            .call(obj)
            .slice('[object '.length, -1)
            .toLowerCase()} is not a valid object.`
        );
      const tag = obj[tagName];
      if (tag === void 0)
        throw new Error(`Object does not have a valid "${String(tagName)}" property.`);
      const fn = matchers[tag] ?? otherwise ?? matchNotFound;
      return fn(obj);
    };
    function matchNotFound(obj) {
      throw new Error(`Not matched: "${obj[tagName]}".`);
    }
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
  function isOfType(typeRepresentation) {
    return value => typeof value === typeRepresentation;
  }
  const isNumber = /* @__PURE__ */ isOfType('number');
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
  function refine(...predicates) {
    return value => predicates.every(p => p(value));
  }
  const isObject = /* @__PURE__ */ refine(isOfTypeObject, isNotNull);
  const isInteger = /* @__PURE__ */ refine(isNumber, x => Number.isInteger(x));
  const isNatural = /* @__PURE__ */ refine(isInteger, x => x > 0);
  const isNonNegativeInteger = /* @__PURE__ */ isAnyOf(isLiteral(0), isNatural);
  const isNonEmptyString = /* @__PURE__ */ refine(isString, x => x.trim().length > 0);
  function isAnyOf(...predicates) {
    return value => predicates.some(p => p(value));
  }
  const isNullish = x => x == null;
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
  const numprocRE = /^5\d{8}20\d{2}404(?:00|7(?:0|1|2)|99)\d{2}$/;
  const isNumProc = /* @__PURE__ */ refine(isString, x => numprocRE.test(x));
  const isIdBloco = isNonNegativeInteger;
  const isNomeBloco = isNonEmptyString;
  const isBloco = /* @__PURE__ */ hasShape({
    id: isIdBloco,
    nome: isNomeBloco,
    processos: isTypedArray(isNumProc),
  });
  function promisify(eventName) {
    return obj =>
      new Promise((res, rej) => {
        obj.addEventListener('error', onReject, {
          once: true,
        });
        obj.addEventListener(eventName, onResolve, {
          once: true,
        });
        function onReject() {
          rej(obj.error);
          obj.removeEventListener(eventName, onResolve);
        }
        function onResolve() {
          if ('result' in obj) res(obj.result);
          else res();
          obj.removeEventListener('error', onReject);
        }
      });
  }
  const promisifyRequest = /* @__PURE__ */ promisify('success');
  const promisifyTransaction = /* @__PURE__ */ promisify('complete');
  function open() {
    const req = indexedDB.open('gm-blocos', 4);
    req.addEventListener('upgradeneeded', onUpgradeNeeded, {
      once: true,
    });
    return promisifyRequest(req);
    function onUpgradeNeeded({ oldVersion }) {
      const db = req.result;
      const transaction = req.transaction;
      let store;
      if (oldVersion < 1) {
        store = db.createObjectStore('blocos', {
          keyPath: 'id',
        });
      } else {
        store = transaction.objectStore('blocos');
      }
      if (oldVersion < 2) {
        store.createIndex('nome', ['nome'], {
          unique: true,
        });
      }
      if (oldVersion < 3) {
        store.deleteIndex('nome');
        store.createIndex('nome', 'nome', {
          unique: true,
        });
      }
      if (oldVersion < 4) {
        store.createIndex('processos', 'processos', {
          multiEntry: true,
        });
      }
    }
  }
  async function makeTransaction(mode, createRequests) {
    const db = await open();
    const tx = db.transaction('blocos', mode);
    const store = tx.objectStore('blocos');
    const requests = createRequests(store);
    const [results, done] = await Promise.all([
      Promise.all(requests.map(promisifyRequest)),
      promisifyTransaction(tx),
    ]);
    return results;
  }
  async function deleteBlocos() {
    await promisifyRequest(indexedDB.deleteDatabase('gm-blocos'));
  }
  async function getBlocos() {
    const [blocos] = await makeTransaction('readonly', store => [store.getAll()]);
    return validarBlocos(blocos);
  }
  function validarBlocos(blocos) {
    assert(blocos.every(isBloco), 'Formato do banco de dados desconhecido.');
    return blocos.sort(compararBlocos);
  }
  const compararBlocos = /* @__PURE__ */ compareUsing(
    bloco => bloco.nome,
    alt(
      compareUsing(x => x.toLowerCase()),
      compareDefault,
      nome => {
        throw new Error(`Há dois blocos com o mesmo nome: ${JSON.stringify(nome)}.`);
      }
    )
  );
  function alt(...fns) {
    return (a, b) => {
      for (const fn of fns) {
        const result = fn(a, b);
        if (result !== 0) return result;
      }
      return 0;
    };
  }
  function compareDefault(a, b) {
    if (a < b) return -1;
    if (a > b) return 1;
    return 0;
  }
  function compareUsing(f, compareFn = compareDefault) {
    return (a, b) => compareFn(f(a), f(b));
  }
  async function getBloco(id) {
    const [bloco] = await makeTransaction('readonly', store => [store.get(id)]);
    assert(isAnyOf(isBloco, isUndefined)(bloco));
    return bloco;
  }
  const createBloco = /* @__PURE__ */ writeBloco('add');
  async function deleteBloco(id) {
    const [done, blocos] = await makeTransaction('readwrite', store => [
      store.delete(id),
      store.getAll(),
    ]);
    return validarBlocos(blocos);
  }
  const updateBloco = /* @__PURE__ */ writeBloco('put');
  function writeBloco(method) {
    return async bloco => {
      const [id, blocos] = await makeTransaction('readwrite', store => [
        store[method](bloco),
        store.getAll(),
      ]);
      assert(isIdBloco(id));
      return validarBlocos(blocos);
    };
  }
  const isBroadcastMessage = /* @__PURE__ */ hasShape({
    type: isLiteral('Blocos'),
    blocos: isTypedArray(isBloco),
  });
  var _ = 0;
  function o(o2, e, n, t, f) {
    var l,
      s,
      u = {};
    for (s in e) 'ref' == s ? (l = e[s]) : (u[s] = e[s]);
    var a = {
      type: o2,
      props: u,
      key: n,
      ref: l,
      __k: null,
      __: null,
      __b: 0,
      __e: null,
      __d: void 0,
      __c: null,
      __h: null,
      constructor: void 0,
      __v: --_,
      __source: f,
      __self: t,
    };
    if ('function' == typeof o2 && (l = o2.defaultProps))
      for (s in l) void 0 === u[s] && (u[s] = l[s]);
    return preact.options.vnode && preact.options.vnode(a), a;
  }
  function LocalizadorProcessoLista() {
    const tabela = document.querySelector('table#tabelaLocalizadores');
    const [desmarcarTodosProcessos, marcarTodosProcessos] = (() => {
      const def = [() => {}, () => {}];
      if (!tabela) return def;
      const imgInfraCheck = document.getElementById('imgInfraCheck');
      if (!imgInfraCheck) return def;
      const lnkInfraCheck = document.getElementById('lnkInfraCheck');
      if (!lnkInfraCheck) return def;
      const desmarcarTodosProcessos2 = () => {
        imgInfraCheck.title = imgInfraCheck.alt = 'Remover Seleção';
        lnkInfraCheck.click();
      };
      const marcarTodosProcessos2 = () => {
        lnkInfraCheck.click();
      };
      return [desmarcarTodosProcessos2, marcarTodosProcessos2];
    })();
    const linhas = tabela?.rows ?? [];
    const eitherMapa = traverse(linhas, (linha, i) => {
      if (i === 0) return Right([]);
      const endereco = linha.cells[1]?.querySelector('a[href]')?.href;
      if (isNullish(endereco))
        return Left(new Error(`Link do processo não encontrado: linha ${i}.`));
      const numproc = new URL(endereco).searchParams.get('num_processo');
      if (isNullish(numproc))
        return Left(new Error(`Número do processo não encontrado: linha ${i}.`));
      if (!isNumProc(numproc))
        return Left(new Error(`Número de processo desconhecido: ${JSON.stringify(numproc)}.`));
      const checkbox = linha.cells[0]?.querySelector('input[type=checkbox]');
      if (isNullish(checkbox))
        return Left(new Error(`Caixa de seleção não encontrada: linha ${i}.`));
      return Right([
        [
          numproc,
          {
            linha,
            checkbox,
            checked: checkbox.checked,
          },
        ],
      ]);
    }).map(entriess => new Map(entriess.flat(1)));
    if (eitherMapa.isLeft) return eitherMapa;
    const mapa = eitherMapa.rightValue;
    const processosMarcados = /* @__PURE__ */ new Set();
    const processosNaoMarcados = /* @__PURE__ */ new Set();
    for (const [numproc, { checked }] of mapa) {
      if (checked) {
        processosMarcados.add(numproc);
      } else {
        processosNaoMarcados.add(numproc);
      }
    }
    let acoes = document.getElementById('fldAcoes');
    if (isNullish(acoes)) {
      acoes = document.getElementById('divInfraAreaTabela');
      if (isNullish(acoes)) return Left(new Error('Não foi possível inserir os blocos na página.'));
    }
    const div = acoes.insertAdjacentElement('beforebegin', document.createElement('div'));
    div.className = 'gm-blocos__lista';
    document.body.insertAdjacentHTML(
      'beforeend',
      /*html*/
      `<dialog class="gm-blocos__dialog"><form method="dialog"><div>Processos do bloco "<output class="gm-blocos__nome"></output>":</div><output class="gm-blocos__processos"></output><button>Fechar</button></form></dialog>`
    );
    const dialog = document.querySelector('.gm-blocos__dialog');
    const dialogNomeBloco = dialog.querySelector('.gm-blocos__nome');
    const dialogProcessos = dialog.querySelector('.gm-blocos__processos');
    const Model = createTaggedUnion(
      {
        init: null,
        loaded: (blocos, aviso) => ({
          blocos,
          aviso,
        }),
        error: error => ({
          error,
        }),
      },
      'status'
    );
    const Action2 = createTaggedUnion(
      {
        blocosModificados: blocos => ({
          blocos,
        }),
        blocosObtidos: blocos => ({
          blocos,
        }),
        checkboxClicado: (id, estadoAnterior) => ({
          id,
          estadoAnterior,
        }),
        criarBloco: nome => ({
          nome,
        }),
        erroCapturado: aviso => ({
          aviso,
        }),
        erroDesconhecido: erro => ({
          erro,
        }),
        excluirBD: null,
        excluirBloco: id => ({
          id,
        }),
        mensagemRecebida: msg => ({
          msg,
        }),
        obterBlocos: null,
        removerProcessosAusentes: id => ({
          id,
        }),
        renomearBloco: (id, nome) => ({
          id,
          nome,
        }),
        reset: null,
      },
      'type'
    );
    const bc = createBroadcastService('gm-blocos', isBroadcastMessage);
    const store = Object.assign(
      {},
      createStore(() => Model.init, reducer)
    );
    store.dispatch = handleAliasAction()(store.dispatch);
    store.dispatch = handleAsyncAction(store)(store.dispatch);
    bc.subscribe(msg => store.dispatch(Action2.mensagemRecebida(msg)));
    const onCliqueTabela = (() => {
      function recalcular() {
        processosMarcados.clear();
        processosNaoMarcados.clear();
        for (const [numproc, info] of mapa) {
          if (info.checkbox.checked) {
            info.checked = true;
            processosMarcados.add(numproc);
          } else {
            info.checked = false;
            processosNaoMarcados.add(numproc);
          }
        }
        update(store.getState());
      }
      let timer;
      return () => {
        window.clearTimeout(timer);
        timer = window.setTimeout(recalcular, 100);
      };
    })();
    if (tabela) {
      tabela.addEventListener('click', onCliqueTabela);
    }
    store.subscribe(update);
    store.dispatch(Action2.obterBlocos);
    return Right(void 0);
    function update(state) {
      return preact.render(
        o(Main2, {
          state,
        }),
        div
      );
    }
    function reducer(state, action) {
      return Action2.match(
        action,
        {
          blocosObtidos: ({ blocos }) =>
            Model.match(
              state,
              {
                error: state2 => state2,
              },
              () => {
                const info = blocos.map(bloco => ({
                  ...bloco,
                  nestaPagina: bloco.processos.filter(numproc => mapa.has(numproc)).length,
                  total: bloco.processos.length,
                }));
                return Model.loaded(info);
              }
            ),
          checkboxClicado: ({ id, estadoAnterior }) =>
            Model.match(
              state,
              {
                loaded: state2 => {
                  if (estadoAnterior === 'disabled') return state2;
                  desmarcarTodosProcessos();
                  const processos = (() => {
                    if (id === -1) {
                      const processosComBloco = new Set(
                        Array.from(
                          state2.blocos.flatMap(({ processos: processos2 }) =>
                            processos2.filter(p2 => mapa.has(p2))
                          )
                        )
                      );
                      return new Set(
                        Array.from(mapa)
                          .filter(([x]) => !processosComBloco.has(x))
                          .map(([numproc]) => numproc)
                      );
                    } else {
                      return new Set(
                        state2.blocos
                          .filter(x => x.id === id)
                          .flatMap(x => x.processos.filter(x2 => mapa.has(x2)))
                      );
                    }
                  })();
                  for (const [numproc, info] of mapa) {
                    const checked = processos.has(numproc);
                    info.checked = checked;
                    info.checkbox.disabled = !checked;
                  }
                  marcarTodosProcessos();
                  for (const info of mapa.values()) {
                    info.checkbox.disabled = false;
                  }
                  return {
                    ...state2,
                  };
                },
              },
              state2 => state2
            ),
          erroCapturado: ({ aviso }) =>
            Model.match(state, {
              init: () => Model.error(aviso),
              error: state2 => state2,
              loaded: state2 => ({
                ...state2,
                aviso,
              }),
            }),
          erroDesconhecido: ({ erro }) =>
            Model.match(
              state,
              {
                error: state2 => state2,
              },
              () => Model.error(erro)
            ),
          reset: () => Model.init,
        },
        other => other
      );
    }
    function handleAsyncAction(store2) {
      return next => {
        return action => {
          const promise = Action2.match(
            action,
            {
              criarBloco: async ({ nome }) => {
                const blocos = await getBlocos();
                if (blocos.some(x => x.nome === nome))
                  return Action2.erroCapturado(
                    `Já existe um bloco com o nome ${JSON.stringify(nome)}.`
                  );
                const bloco = {
                  id: Math.max(-1, ...blocos.map(x => x.id)) + 1,
                  nome,
                  processos: [],
                };
                return Action2.blocosModificados(await createBloco(bloco));
              },
              excluirBD: async () => {
                await deleteBlocos();
                return Action2.obterBlocos;
              },
              excluirBloco: async ({ id }) => Action2.blocosModificados(await deleteBloco(id)),
              obterBlocos: async () => Action2.blocosModificados(await getBlocos()),
              removerProcessosAusentes: async ({ id }) => {
                const bloco = await getBloco(id);
                if (!bloco) throw new Error(`Bloco não encontrado: ${id}.`);
                const processos = bloco.processos.filter(x => mapa.has(x));
                return Action2.blocosModificados(
                  await updateBloco({
                    ...bloco,
                    processos,
                  })
                );
              },
              renomearBloco: async ({ id, nome }) => {
                const blocos = await getBlocos();
                const bloco = blocos.find(x => x.id === id);
                if (!bloco) throw new Error(`Bloco não encontrado: ${id}.`);
                const others = blocos.filter(x => x.id !== id);
                if (others.some(x => x.nome === nome))
                  return Action2.erroCapturado(
                    `Já existe um bloco com o nome ${JSON.stringify(nome)}.`
                  );
                return Action2.blocosModificados(
                  await updateBloco({
                    ...bloco,
                    nome,
                  })
                );
              },
            },
            a => a
          );
          if (!('then' in promise)) return next(promise);
          promise.catch(Action2.erroDesconhecido).then(store2.dispatch);
          if (action.type === 'obterBlocos') return next(Action2.reset);
        };
      };
    }
    function handleAliasAction(store2) {
      return next => {
        return action => {
          const replaced = Action2.match(
            action,
            {
              blocosModificados: ({ blocos }) => {
                bc.publish({
                  type: 'Blocos',
                  blocos,
                });
                return Action2.blocosObtidos(blocos);
              },
              mensagemRecebida: ({ msg: { blocos } }) => Action2.blocosObtidos(blocos),
            },
            s => s
          );
          return next(replaced);
        };
      };
    }
    function Main2({ state }) {
      return Model.match(state, {
        error: state2 =>
          o(ShowError2, {
            reason: state2.error,
          }),
        loaded: state2 =>
          o(Blocos2, {
            state: state2,
          }),
        init: () => o(Loading, {}),
      });
    }
    function Loading() {
      return o(preact.Fragment, {
        children: 'Carregando...',
      });
    }
    function ShowError2({ reason }) {
      const message = messageFromReason2(reason);
      return o(preact.Fragment, {
        children: [
          o('div', {
            class: 'gm-erro',
            children: message,
          }),
          o('button', {
            onClick: () => store.dispatch(Action2.obterBlocos),
            children: 'Tentar carregar dados salvos',
          }),
          ' ',
          o('button', {
            onClick: () => store.dispatch(Action2.excluirBD),
            children: 'Apagar os dados locais',
          }),
        ],
      });
    }
    function messageFromReason2(reason) {
      if (reason instanceof Error) {
        if (reason.message) {
          return `Ocorreu um erro: ${reason.message}`;
        }
        return 'Ocorreu um erro desconhecido.';
      }
      return `Ocorreu um erro: ${String(reason)}`;
    }
    function Blocos2({ state }) {
      const [nome, setNome] = hooks.useState('');
      const onSubmit = hooks.useCallback(
        e => {
          e.preventDefault();
          if (isNonEmptyString(nome)) store.dispatch(Action2.criarBloco(nome));
          else store.dispatch(Action2.erroCapturado('Nome do bloco não pode estar em branco.'));
          setNome('');
        },
        [nome]
      );
      let aviso = state.aviso
        ? o(Aviso, {
            children: state.aviso,
          })
        : null;
      const processosComBlocoNestaPagina = new Set(
        state.blocos.flatMap(({ processos }) => processos.filter(p2 => mapa.has(p2)))
      );
      const processosSemBloco = new Map(
        Array.from(mapa).filter(([numproc]) => !processosComBlocoNestaPagina.has(numproc))
      );
      const semBloco = (() => {
        if (processosSemBloco.size === 0) return 'disabled';
        for (const numproc of processosMarcados) {
          if (!processosSemBloco.has(numproc)) return 'unchecked';
        }
        for (const numproc of processosNaoMarcados) {
          if (processosSemBloco.has(numproc)) return 'unchecked';
        }
        return 'checked';
      })();
      return o(preact.Fragment, {
        children: [
          o('h4', {
            children: 'Blocos',
          }),
          o('table', {
            children: [
              o('tbody', {
                children: state.blocos.map(bloco =>
                  o(
                    BlocoPaginaLista,
                    {
                      ...bloco,
                    },
                    bloco.id
                  )
                ),
              }),
              o('tfoot', {
                children:
                  semBloco !== 'disabled' &&
                  o('tr', {
                    children: [
                      o('td', {
                        children: o('input', {
                          type: 'radio',
                          checked: semBloco === 'checked',
                          onClick: () => store.dispatch(Action2.checkboxClicado(-1, semBloco)),
                        }),
                      }),
                      o('td', {
                        children: o('label', {
                          onClick: () => store.dispatch(Action2.checkboxClicado(-1, semBloco)),
                          children: '(processos sem bloco)',
                        }),
                      }),
                      o('td', {
                        children: o('small', {
                          children: [
                            '(',
                            (s => `${s} processo${s > 1 ? 's' : ''}`)(processosSemBloco.size),
                            ')',
                          ],
                        }),
                      }),
                    ],
                  }),
              }),
            ],
          }),
          o('form', {
            onSubmit,
            children: o('button', {
              type: 'button',
              onClick: onNovoClicked,
              children: 'Criar bloco',
            }),
          }),
          aviso !== null ? o('br', {}) : null,
          aviso,
        ],
      });
    }
    function onNovoClicked(evt) {
      evt.preventDefault();
      const nome = prompt('Nome do novo bloco:');
      if (nome === null) return;
      if (isNonEmptyString(nome)) {
        store.dispatch(Action2.criarBloco(nome));
      } else {
        store.dispatch(Action2.erroCapturado('Nome do bloco não pode estar em branco.'));
      }
    }
    function Aviso(props) {
      return o(preact.Fragment, {
        children: [
          o('div', {
            class: 'gm-aviso',
            children: props.children,
          }),
          o('button', {
            type: 'button',
            onClick: () => store.dispatch(Action2.obterBlocos),
            children: 'Recarregar dados',
          }),
        ],
      });
    }
    function BlocoPaginaLista(props) {
      const [editing, setEditing] = hooks.useState(false);
      const input = preact.createRef();
      hooks.useEffect(() => {
        if (editing && input.current) {
          input.current.select();
          input.current.focus();
        }
      }, [editing, input]);
      let displayNome = props.nome;
      let botaoRenomear = o(BotaoAcao, {
        src: 'imagens/minuta_editar.gif',
        label: 'Renomear',
        onClick: onRenomearClicked,
      });
      let removerAusentes = o(BotaoAcao, {
        src: 'imagens/minuta_transferir.png',
        label: 'Remover processos ausentes',
        onClick: () => store.dispatch(Action2.removerProcessosAusentes(props.id)),
      });
      if (editing) {
        displayNome = o(preact.Fragment, {
          children: [
            o('input', {
              class: 'rename',
              ref: input,
              onKeyPress,
              onKeyUp: evt => {
                if (evt.key === 'Escape' || evt.key === 'Esc') {
                  setEditing(() => false);
                }
              },
              value: props.nome,
            }),
            o('br', {}),
            o('small', {
              children: '(Enter para confirmar, Esc para cancelar)',
            }),
          ],
        });
        botaoRenomear = null;
      }
      if (props.total <= props.nestaPagina) {
        removerAusentes = null;
      }
      const chkState = (() => {
        const meusProcessosNestaPagina = new Set(props.processos.filter(n => mapa.has(n)));
        if (meusProcessosNestaPagina.size === 0) return 'disabled';
        for (const numproc of processosMarcados) {
          if (!meusProcessosNestaPagina.has(numproc)) return 'unchecked';
        }
        for (const numproc of processosNaoMarcados) {
          if (meusProcessosNestaPagina.has(numproc)) return 'unchecked';
        }
        return 'checked';
      })();
      const qtdProcessos = o('small', {
        children: ['(', createAbbr(props.nestaPagina, props.total), ')'],
      });
      return o('tr', {
        children: [
          o('td', {
            children: o('input', {
              type: 'radio',
              checked: chkState === 'checked',
              disabled: chkState === 'disabled',
              style: {
                cursor: chkState === 'disabled' ? 'not-allowed' : 'auto',
              },
              onClick: () => store.dispatch(Action2.checkboxClicado(props.id, chkState)),
            }),
          }),
          o('td', {
            children: o('label', {
              onClick: () => store.dispatch(Action2.checkboxClicado(props.id, chkState)),
              children: displayNome,
            }),
          }),
          o('td', {
            children:
              props.total > 0
                ? o('a', {
                    href: '#',
                    onClick: e => {
                      e.preventDefault();
                      dialogNomeBloco.textContent = props.nome;
                      console.log(dialogProcessos);
                      dialogProcessos.innerHTML = props.processos.join('<br>');
                      dialog.showModal();
                      window.getSelection()?.getRangeAt(0)?.selectNodeContents(dialogProcessos);
                    },
                    children: qtdProcessos,
                  })
                : qtdProcessos,
          }),
          o('td', {
            children: botaoRenomear,
          }),
          o('td', {
            children: o(BotaoAcao, {
              src: 'imagens/minuta_excluir.gif',
              label: 'Excluir',
              onClick: onExcluirClicked,
            }),
          }),
          o('td', {
            children: removerAusentes,
          }),
        ],
      });
      function createAbbr(nestaPagina, total) {
        if (nestaPagina === total) return `${total} processo${total > 1 ? 's' : ''}`;
        const textoTotal = `${total} processo${total > 1 ? 's' : ''} no bloco`;
        const textoPagina = `${nestaPagina === 0 ? 'nenhum' : nestaPagina} nesta página`;
        const textoResumido = `${nestaPagina}/${total} processo${total > 1 ? 's' : ''}`;
        return o('abbr', {
          title: `${textoTotal}, ${textoPagina}.`,
          children: textoResumido,
        });
      }
      function onKeyPress(evt) {
        if (evt.key === 'Enter') {
          evt.preventDefault();
          const nome = evt.currentTarget.value;
          setEditing(false);
          if (isNonEmptyString(nome)) {
            store.dispatch(Action2.renomearBloco(props.id, nome));
          } else {
            store.dispatch(Action2.erroCapturado('Nome do bloco não pode estar em branco.'));
          }
        }
      }
      function onRenomearClicked() {
        setEditing(true);
      }
      function onExcluirClicked() {
        let confirmed = true;
        const len = props.total;
        if (len > 0)
          confirmed = window.confirm(
            `Este bloco possui ${len} processo${len > 1 ? 's' : ''}. Deseja excluí-lo?`
          );
        if (confirmed) store.dispatch(Action2.excluirBloco(props.id));
      }
    }
    function BotaoAcao({ onClick, label, src }) {
      return o('img', {
        'style': 'cursor: pointer;',
        src,
        'onMouseOver': () => infraTooltipMostrar(label),
        'onMouseOut': () => infraTooltipOcultar(),
        'onClick': evt => {
          infraTooltipOcultar();
          onClick(evt);
        },
        'aria-label': label,
        'width': '16',
        'height': '16',
      });
    }
  }
  const Action = /* @__PURE__ */ createTaggedUnion(
    {
      blocosModificados: (blocos, { fecharJanela = false } = {}) => ({
        blocos,
        fecharJanela,
      }),
      criarBloco: nome => ({
        nome,
      }),
      erro: reason => ({
        reason,
      }),
      inserir: (id, { fecharJanela = false } = {}) => ({
        id,
        fecharJanela,
      }),
      mensagemRecebida: msg => ({
        msg,
      }),
      obterBlocos: null,
      remover: id => ({
        id,
      }),
    },
    'type'
  );
  const State = /* @__PURE__ */ createTaggedUnion(
    {
      Loading: blocos => ({
        blocos,
      }),
      Success: blocos => ({
        blocos,
      }),
      Error: reason => ({
        reason,
      }),
    },
    'status'
  );
  function ProcessoSelecionar(numproc) {
    const mainMenu = document.getElementById('main-menu');
    if (isNull(mainMenu)) return Left(new Error('Menu não encontrado'));
    const div = mainMenu.insertAdjacentElement('beforebegin', document.createElement('div'));
    div.className = 'gm-blocos__processo';
    preact.render(
      o(Main, {
        numproc,
      }),
      div
    );
    return Right(void 0);
  }
  function createReducer({ bc, numproc }) {
    return reducer;
    function asyncAction(state, eventualAction) {
      const blocos = 'blocos' in state ? state.blocos : [];
      return [State.Loading(blocos), eventualAction()];
    }
    function modificarProcessos(state, { id, fn, fecharJanela }) {
      return asyncAction(state, async () => {
        const bloco = await getBloco(id);
        if (!bloco) throw new Error(`Bloco não encontrado: ${id}.`);
        const processos = new Set(bloco.processos);
        fn(processos, numproc);
        const blocos = await updateBloco({
          ...bloco,
          processos: [...processos],
        });
        return Action.blocosModificados(blocos, {
          fecharJanela,
        });
      });
    }
    function reducer(state, action) {
      return Action.match(action, {
        blocosModificados: ({ blocos, fecharJanela }) => {
          bc.publish({
            type: 'Blocos',
            blocos,
          });
          if (fecharJanela) window.close();
          return State.Success(blocos);
        },
        criarBloco: ({ nome }) =>
          asyncAction(state, async () => {
            const blocos = await getBlocos();
            if (blocos.some(x => x.nome === nome))
              return Action.erro(`Já existe um bloco com o nome ${JSON.stringify(nome)}.`);
            const bloco = {
              id: Math.max(-1, ...blocos.map(x => x.id)) + 1,
              nome,
              processos: [],
            };
            return Action.blocosModificados(await createBloco(bloco));
          }),
        erro: ({ reason }) => State.Error(reason),
        inserir: ({ id, fecharJanela }) =>
          modificarProcessos(state, {
            id,
            fn: (processos, numproc2) => {
              processos.add(numproc2);
            },
            fecharJanela,
          }),
        mensagemRecebida: ({ msg: { blocos } }) => State.Success(blocos),
        obterBlocos: () =>
          asyncAction(state, async () => Action.blocosModificados(await getBlocos())),
        remover: ({ id }) =>
          modificarProcessos(state, {
            id,
            fn: (processos, numproc2) => {
              processos.delete(numproc2);
            },
            fecharJanela: false,
          }),
      });
    }
  }
  function Main({ numproc }) {
    const bc = hooks.useMemo(() => {
      return createBroadcastService('gm-blocos', isBroadcastMessage);
    }, []);
    const handleStateAction = hooks.useMemo(() => {
      return createReducer({
        bc,
        numproc,
      });
    }, []);
    const [state, dispatch] = hooks.useReducer((state2, action) => {
      const result = handleStateAction(state2, action);
      if (!Array.isArray(result)) return result;
      const [newState, promise] = result;
      promise.catch(Action.erro).then(dispatch);
      return newState;
    }, State.Loading([]));
    hooks.useEffect(() => {
      const sub = bc.subscribe(msg => dispatch(Action.mensagemRecebida(msg)));
      return () => {
        sub.unsubscribe();
      };
    }, []);
    hooks.useEffect(() => {
      dispatch(Action.obterBlocos);
    }, []);
    const criarBloco = hooks.useCallback(nome => dispatch(Action.criarBloco(nome)), []);
    const toggleBloco = hooks.useCallback((id, operacao, fecharJanela) => {
      if (operacao === 'inserir') {
        dispatch(
          Action.inserir(id, {
            fecharJanela,
          })
        );
      } else {
        dispatch(Action.remover(id));
      }
    }, []);
    if (state.status === 'Error')
      return o(ShowError, {
        reason: state.reason,
        onRecarregarClick: () => dispatch(Action.obterBlocos),
      });
    if (state.status === 'Loading' && state.blocos.length === 0) return o(Placeholder, {});
    return o(Blocos, {
      state,
      numproc,
      criarBloco,
      toggleBloco,
    });
  }
  function ShowError({ reason, onRecarregarClick }) {
    const message = messageFromReason(reason);
    return o(preact.Fragment, {
      children: [
        o('h4', {
          children: 'Blocos',
        }),
        o('div', {
          class: 'error',
          children: message,
        }),
        o('button', {
          type: 'button',
          onClick: onRecarregarClick,
          children: 'Recarregar',
        }),
      ],
    });
  }
  function messageFromReason(reason) {
    if (reason instanceof Error) {
      if (reason.message) {
        return `Ocorreu um erro: ${reason.message}`;
      }
      return 'Ocorreu um erro desconhecido.';
    }
    return `Ocorreu um erro: ${String(reason)}`;
  }
  function Placeholder() {
    const li = o('li', {
      class: 'placeholder',
      children: [o('span', {}), o('span', {}), o('span', {})],
    });
    return o(preact.Fragment, {
      children: [
        o('h4', {
          children: 'Blocos',
        }),
        o('ul', {
          children: [li, li, li],
        }),
        o('button', {
          type: 'button',
          disabled: true,
          children: 'Novo',
        }),
      ],
    });
  }
  function Blocos(props) {
    const disabled = hooks.useMemo(() => props.state.status === 'Loading', [props.state.status]);
    const infoBlocos = hooks.useMemo(
      () =>
        props.state.blocos.map(({ id, nome, processos }) => ({
          id,
          nome,
          inserido: processos.includes(props.numproc),
        })),
      [props.state.blocos]
    );
    const onNovoClicked = hooks.useCallback(evt => {
      evt.preventDefault();
      const nome = prompt('Nome do novo bloco:');
      if (nome === null) return;
      if (isNonEmptyString(nome)) {
        props.criarBloco(nome);
      }
    }, []);
    return o(preact.Fragment, {
      children: [
        o('h4', {
          children: 'Blocos',
        }),
        o('ul', {
          children: infoBlocos.map(info =>
            o(
              BlocoPaginaProcesso,
              {
                ...info,
                disabled,
                toggleBloco: props.toggleBloco,
              },
              info.id
            )
          ),
        }),
        o('button', {
          type: 'button',
          onClick: onNovoClicked,
          disabled,
          children: 'Novo',
        }),
      ],
    });
  }
  function BlocoPaginaProcesso(props) {
    const onChange = hooks.useCallback(
      evt => {
        if (evt.currentTarget.checked) {
          props.toggleBloco(props.id, 'inserir', false);
        } else {
          props.toggleBloco(props.id, 'remover', false);
        }
      },
      [props.id]
    );
    const onTransportarClick = hooks.useCallback(() => {
      infraTooltipOcultar();
      props.toggleBloco(props.id, 'inserir', true);
    }, [props.id]);
    const transportar = hooks.useMemo(() => {
      if (props.inserido) return o('span', {});
      return o(preact.Fragment, {
        children: [
          ' ',
          o('input', {
            type: 'image',
            src: 'infra_css/imagens/transportar.gif',
            onMouseOver: () => infraTooltipMostrar('Inserir processo no bloco e fechar a janela.'),
            onMouseOut: () => infraTooltipOcultar(),
            onClick: onTransportarClick,
            disabled: props.disabled,
          }),
        ],
      });
    }, [props.inserido, props.disabled, props.id]);
    const id = hooks.useMemo(() => `gm-bloco-${props.id}`, [props.id]);
    return o('li', {
      children: [
        o('input', {
          id,
          type: 'checkbox',
          checked: props.inserido,
          onChange,
          disabled: props.disabled,
        }),
        ' ',
        o('label', {
          for: `gm-bloco-${props.id}`,
          children: props.nome,
        }),
        transportar,
      ],
    });
  }
  function main() {
    const params = new URL(document.location.href).searchParams;
    const acao = params.get('acao');
    switch (acao) {
      case null:
        return Left(new Error('Página desconhecida.'));
      case 'localizador_processos_lista':
        return LocalizadorProcessoLista();
      case 'processo_selecionar': {
        const numproc = params.get('num_processo');
        if (!numproc) return Left(new Error('Número do processo não encontrado.'));
        if (!isNumProc(numproc))
          return Left(
            new Error(`Não foi possível analisar o número do proceso: ${JSON.stringify(numproc)}.`)
          );
        return ProcessoSelecionar(numproc);
      }
      case 'relatorio_geral_consultar':
        return Right(void 0);
      default:
        return Left(new Error(`Ação desconhecida: ${JSON.stringify(acao)}.`));
    }
  }
  main().catch(e => {
    if (e instanceof AggregateError) {
      console.error(e);
      console.debug('Erros:', e.errors);
    } else {
      console.error(e);
    }
    return Right(void 0);
  });
})(preact, preactHooks);
