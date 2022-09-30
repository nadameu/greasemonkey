// ==UserScript==
// @name         separar-em-blocos
// @name:pt-BR   Separar em blocos
// @namespace    http://nadameu.com.br
// @version      3.0.0
// @author       nadameu
// @description  Permite a separação de processos em blocos para movimentação separada
// @match        https://eproc.jfsc.jus.br/eprocV2/controlador.php?acao=processo_selecionar&*
// @match        https://eproc.jfsc.jus.br/eprocV2/controlador.php?acao=localizador_processos_lista&*
// @match        https://eproc.jfsc.jus.br/eprocV2/controlador.php?acao=relatorio_geral_consultar&*
// @require      https://unpkg.com/preact@10.11.0/dist/preact.min.js
// @require      https://unpkg.com/preact@10.11.0/hooks/dist/hooks.umd.js
// @grant        window.close
// ==/UserScript==

(function (preact2, hooks) {
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
  const isNullish = /* @__PURE__ */ isAnyOf(isNull, isUndefined);
  function isArray(predicate) {
    return refine(
      value => Array.isArray(value),
      xs => xs.every(predicate)
    );
  }
  function hasKeys(...keys) {
    return refine(isObject, obj => keys.every(key => key in obj));
  }
  function hasShape(predicates) {
    const keys = Object.entries(predicates).map(([key, predicate]) => [
      predicate.optional === true,
      key,
    ]);
    const optional = keys.filter(([optional2]) => optional2).map(([, key]) => key);
    const required = keys.filter(([optional2]) => !optional2).map(([, key]) => key);
    return refine(
      hasKeys(...required),
      obj =>
        required.every(key => predicates[key](obj[key])) &&
        optional.every(key => (key in obj ? predicates[key](obj[key]) : true))
    );
  }
  function isTaggedUnion(tagName, union) {
    return isAnyOf(
      ...Object.entries(union).map(([tag, extraProperties]) =>
        refine(
          hasShape({
            [tagName]: isLiteral(tag),
          }),
          hasShape(extraProperties)
        )
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
    processos: isArray(isNumProc),
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
  const isBroadcastMessage = /* @__PURE__ */ isTaggedUnion('type', {
    Blocos: {
      blocos: isArray(isBloco),
    },
    NoOp: {},
  });
  const css$1 =
    '#gm-blocos,\n.gm-blocos__dialog {\n  --accent: hsl(266, 40%, 25%);\n  --bg: hsl(266, 10%, 30%);\n  --border: hsl(266, 15%, 60%);\n  --disabled: hsl(266, 5%, 37.5%);\n  --disabled-text: hsl(266, 0%, 80%);\n  --shadow: hsl(266, 12.5%, 17.5%);\n  --muted-accent: hsl(266, 25%, 25%);\n  --text: hsl(266, 0%, 100%);\n}\n\n.infra-styles #gm-blocos {\n  margin: 4px;\n  padding: 4px 8px;\n  border-radius: 4px;\n  width: max-content;\n  background: var(--bg);\n  color: var(--text);\n  box-shadow: 0 3px 3px var(--shadow);\n}\n\n.infra-styles #gm-blocos h4 {\n  margin: 3px 0;\n  font-size: 1.25rem;\n  font-weight: 300;\n}\n\n.infra-styles #gm-blocos input[type=image] {\n  border: none;\n}\n\n.infra-styles #gm-blocos table {\n  margin: 0;\n  margin-bottom: 16px;\n  border-collapse: collapse;\n}\n\n.infra-styles #gm-blocos td {\n  margin: 0;\n  padding: 3px 0.5ch;\n  vertical-align: middle;\n}\n\n.infra-styles #gm-blocos td label {\n  font-size: 0.92rem;\n}\n\n.infra-styles #gm-blocos td small {\n  font-size: 0.75rem;\n}\n\n.infra-styles #gm-blocos tr {\n  border: 1px solid var(--disabled);\n  border-width: 1px 0;\n}\n\n.infra-styles #gm-blocos tfoot td {\n  padding-top: 1em;\n  padding-bottom: 1em;\n}\n\n.infra-styles #gm-blocos input.rename {\n  font-size: 1em;\n}\n\n.infra-styles #gm-blocos .gm-erro,\n.infra-styles #gm-blocos .gm-aviso {\n  padding: 0.1em 0.5ex;\n  font-size: 0.9rem;\n  background: hsl(0deg, 10%, 95%);\n  color: hsl(0deg, 100%, 40%);\n  margin: 2px auto 6px;\n  width: fit-content;\n}\n\n.infra-styles #gm-blocos button,\n.gm-blocos__dialog button {\n  display: block;\n  margin: 0 auto 7px;\n  padding: 2px 20px;\n  font-size: 0.86rem;\n  border: none;\n  border-radius: 3px;\n  box-shadow: 0 2px 4px var(--shadow);\n  background: var(--muted-accent);\n  color: var(--text);\n}\n\n.infra-styles #gm-blocos button:hover,\n.gm-blocos__dialog button:hover {\n  transition: background-color 0.1s ease-in;\n  background: var(--accent);\n}\n\n.infra-styles #gm-blocos button:disabled,\n.gm-blocos__dialog button:disabled {\n  background: var(--disabled);\n  color: var(--disabled-text);\n  box-shadow: none;\n}\n\n.gm-blocos__dialog {\n  background: var(--bg);\n  color: var(--text);\n  font-family: var(--font-family-sans-serif);\n  font-size: 1rem;\n  min-width: 25vw;\n  border: 3px ridge var(--border);\n  box-shadow: 0 4px 8px 4px hsla(266deg, 25%, 5%, 0.5);\n  border-radius: 12px;\n}\n\n.gm-blocos__dialog::backdrop {\n  background: hsla(266deg, 25%, 5%, 0.75);\n}\n\n.gm-blocos__dialog form {\n  display: grid;\n  grid-template-rows: 1fr 10fr 1fr;\n  justify-items: center;\n  align-items: center;\n}\n\n.gm-blocos__dialog form div {\n  font-weight: 700;\n}\n\n.gm-blocos__processos {\n  border: 1px inset var(--border);\n  padding: 0.5em 0.5ch;\n}';
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
    return preact2.options.vnode && preact2.options.vnode(a), a;
  }
  function LocalizadorProcessoLista() {
    const tabela = document.querySelector('table#tabelaLocalizadores');
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
          },
        ],
      ]);
    }).map(entriess => new Map(entriess.flat(1)));
    if (eitherMapa.isLeft) return eitherMapa;
    const mapa = eitherMapa.rightValue;
    const processosMarcados = /* @__PURE__ */ new Set();
    const processosNaoMarcados = /* @__PURE__ */ new Set();
    for (const [numproc, { checkbox }] of mapa) {
      if (checkbox.checked) {
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
    div.id = 'gm-blocos';
    document.body.insertAdjacentHTML(
      'beforeend',
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
    const Action = createTaggedUnion(
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
        noop: null,
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
    bc.subscribe(msg => store.dispatch(Action.mensagemRecebida(msg)));
    if (tabela) {
      tabela.addEventListener('click', evt => {
        processosMarcados.clear();
        processosNaoMarcados.clear();
        for (const [numproc, { checkbox }] of mapa) {
          if (checkbox.checked) {
            processosMarcados.add(numproc);
          } else {
            processosNaoMarcados.add(numproc);
          }
        }
        update(store.getState());
      });
    }
    document.head.appendChild(document.createElement('style')).textContent = css$1;
    store.subscribe(update);
    store.dispatch(Action.obterBlocos);
    return Right(void 0);
    function update(state) {
      return preact2.render(
        o(Main, {
          state,
        }),
        div
      );
    }
    function reducer(state, action) {
      return Action.match(
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
                  for (const [numproc, { checkbox }] of mapa) {
                    const checked = processos.has(numproc);
                    if (checkbox.checked !== checked) {
                      checkbox.click();
                    }
                  }
                  return state2;
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
          noop: () => state,
          reset: () => Model.init,
        },
        other => other
      );
    }
    function handleAsyncAction(store2) {
      return next => {
        return action => {
          const promise = Action.match(
            action,
            {
              criarBloco: async ({ nome }) => {
                const blocos = await getBlocos();
                if (blocos.some(x => x.nome === nome))
                  return Action.erroCapturado(
                    `Já existe um bloco com o nome ${JSON.stringify(nome)}.`
                  );
                const bloco = {
                  id: Math.max(-1, ...blocos.map(x => x.id)) + 1,
                  nome,
                  processos: [],
                };
                return Action.blocosModificados(await createBloco(bloco));
              },
              excluirBD: async () => {
                await deleteBlocos();
                return Action.obterBlocos;
              },
              excluirBloco: async ({ id }) => Action.blocosModificados(await deleteBloco(id)),
              obterBlocos: async () => Action.blocosModificados(await getBlocos()),
              removerProcessosAusentes: async ({ id }) => {
                const bloco = await getBloco(id);
                if (!bloco) throw new Error(`Bloco não encontrado: ${id}.`);
                const processos = bloco.processos.filter(x => mapa.has(x));
                return Action.blocosModificados(
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
                  return Action.erroCapturado(
                    `Já existe um bloco com o nome ${JSON.stringify(nome)}.`
                  );
                return Action.blocosModificados(
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
          promise.catch(Action.erroDesconhecido).then(store2.dispatch);
          if (action.type === 'obterBlocos') return next(Action.reset);
        };
      };
    }
    function handleAliasAction(store2) {
      return next => {
        return action => {
          const replaced = Action.match(
            action,
            {
              blocosModificados: ({ blocos }) => {
                bc.publish({
                  type: 'Blocos',
                  blocos,
                });
                return Action.blocosObtidos(blocos);
              },
              mensagemRecebida: ({ msg }) =>
                matchBy('type')(msg, {
                  Blocos: ({ blocos }) => Action.blocosObtidos(blocos),
                  NoOp: () => Action.noop,
                }),
            },
            s => s
          );
          return next(replaced);
        };
      };
    }
    function Main({ state }) {
      return Model.match(state, {
        error: state2 =>
          o(ShowError, {
            reason: state2.error,
          }),
        loaded: state2 =>
          o(Blocos, {
            state: state2,
          }),
        init: () => o(Loading, {}),
      });
    }
    function Loading() {
      return o(preact2.Fragment, {
        children: 'Carregando...',
      });
    }
    function ShowError({ reason }) {
      const message = messageFromReason(reason);
      return o(preact2.Fragment, {
        children: [
          o('div', {
            class: 'gm-erro',
            children: message,
          }),
          o('button', {
            onClick: () => store.dispatch(Action.obterBlocos),
            children: 'Tentar carregar dados salvos',
          }),
          ' ',
          o('button', {
            onClick: () => store.dispatch(Action.excluirBD),
            children: 'Apagar os dados locais',
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
    function Blocos({ state }) {
      const [nome, setNome] = hooks.useState('');
      const onSubmit = hooks.useCallback(
        e => {
          e.preventDefault();
          if (isNonEmptyString(nome)) store.dispatch(Action.criarBloco(nome));
          else store.dispatch(Action.erroCapturado('Nome do bloco não pode estar em branco.'));
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
      return o(preact2.Fragment, {
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
                          onClick: () => store.dispatch(Action.checkboxClicado(-1, semBloco)),
                        }),
                      }),
                      o('td', {
                        children: o('label', {
                          onClick: () => store.dispatch(Action.checkboxClicado(-1, semBloco)),
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
          o('br', {}),
          aviso,
        ],
      });
    }
    function onNovoClicked(evt) {
      evt.preventDefault();
      const nome = prompt('Nome do novo bloco:');
      if (nome === null) return;
      if (isNonEmptyString(nome)) {
        store.dispatch(Action.criarBloco(nome));
      } else {
        store.dispatch(Action.erroCapturado('Nome do bloco não pode estar em branco.'));
      }
    }
    function Aviso(props) {
      return o(preact2.Fragment, {
        children: [
          o('div', {
            class: 'gm-aviso',
            children: props.children,
          }),
          o('button', {
            type: 'button',
            onClick: () => store.dispatch(Action.obterBlocos),
            children: 'Recarregar dados',
          }),
        ],
      });
    }
    function BlocoPaginaLista(props) {
      const [editing, setEditing] = hooks.useState(false);
      const input = preact2.createRef();
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
        onClick: () => store.dispatch(Action.removerProcessosAusentes(props.id)),
      });
      if (editing) {
        displayNome = o(preact2.Fragment, {
          children: [
            o('input', {
              class: 'rename',
              ref: input,
              onKeyPress,
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
              onClick: () => store.dispatch(Action.checkboxClicado(props.id, chkState)),
            }),
          }),
          o('td', {
            children: o('label', {
              onClick: () => store.dispatch(Action.checkboxClicado(props.id, chkState)),
              children: displayNome,
            }),
          }),
          o('td', {
            children: o('small', {
              onClick: () => {
                dialogNomeBloco.textContent = props.nome;
                dialogProcessos.innerHTML = props.processos.join('<br>');
                dialog.showModal();
                window.getSelection()?.getRangeAt(0)?.selectNodeContents(dialogProcessos);
              },
              children: ['(', createAbbr(props.nestaPagina, props.total), ')'],
            }),
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
            store.dispatch(Action.renomearBloco(props.id, nome));
          } else {
            store.dispatch(Action.erroCapturado('Nome do bloco não pode estar em branco.'));
          }
        } else if (evt.key === 'Escape') {
          setEditing(() => false);
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
        if (confirmed) store.dispatch(Action.excluirBloco(props.id));
      }
    }
    function BotaoAcao({ onClick, label, src }) {
      return o('img', {
        'class': 'infraButton',
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
  const css =
    '#gm-blocos,\n.gm-blocos__dialog {\n  --accent: hsl(266, 40%, 25%);\n  --bg: hsl(266, 10%, 30%);\n  --border: hsl(266, 15%, 60%);\n  --disabled: hsl(266, 5%, 37.5%);\n  --disabled-text: hsl(266, 0%, 80%);\n  --shadow: hsl(266, 12.5%, 17.5%);\n  --muted-accent: hsl(266, 25%, 25%);\n  --text: hsl(266, 0%, 100%);\n}\n\n/*\n.menu-dark,\n.menu-light {\n  #gm-blocos {\n    --accent: hsl(268, 40%, 26%);\n    --bg: #494251;\n    --disabled: #5d5863;\n    --disabled-text: #ccc;\n    --shadow: #262c31;\n    --muted-accent: #453557;\n    --text: #fff;\n  }\n}\n*/\n\n#gm-blocos {\n  margin: 2px 3px 4px;\n  padding: 4px;\n  border-radius: 4px;\n  background: var(--bg);\n  color: var(--text);\n  box-shadow: 0 3px 3px var(--shadow);\n}\n\n#gm-blocos h4 {\n  margin: 3px 0;\n  font-size: 1.25rem;\n  font-weight: 300;\n}\n\n#gm-blocos ul {\n  list-style-type: none;\n  margin: 3px 0 7px;\n  padding: 0;\n}\n\n#gm-blocos li {\n  position: relative;\n  display: grid;\n  grid-template-columns: auto 1fr auto;\n  grid-gap: 5px;\n  align-items: center;\n  margin: 4px 0;\n  padding: 5px;\n  border-radius: 2px;\n}\n\n#gm-blocos li::before {\n  content: "";\n  position: absolute;\n  top: 2px;\n  width: 100%;\n  height: 100%;\n  border-bottom: 1px solid #888;\n  pointer-events: none;\n}\n\n#gm-blocos li:last-of-type::before {\n  content: none;\n}\n\n#gm-blocos li:hover {\n  background: var(--accent);\n}\n\n#gm-blocos label {\n  margin: 0;\n  font-size: 0.92rem;\n}\n\n#gm-blocos .placeholder span {\n  height: 1.38rem;\n  animation: pulse 1s ease-in-out infinite alternate;\n  border-radius: 4px;\n}\n\n#gm-blocos .placeholder span:first-of-type, #gm-blocos .placeholder span:last-of-type {\n  width: 1.38rem;\n}\n\n@keyframes pulse {\n  from {\n    background-color: var(--disabled);\n  }\n  to {\n    background-color: var(--bg);\n  }\n}\n\n#gm-blocos button {\n  display: block;\n  margin: 0 auto 7px;\n  padding: 2px 20px;\n  font-size: 0.86rem;\n  border: none;\n  border-radius: 3px;\n  box-shadow: 0 2px 4px var(--shadow);\n  background: var(--muted-accent);\n  color: var(--text);\n}\n\n#gm-blocos button:hover {\n  transition: background-color 0.1s ease-in;\n  background: var(--accent);\n}\n\n#gm-blocos button:disabled {\n  background: var(--disabled);\n  color: var(--disabled-text);\n  box-shadow: none;\n}\n\n#gm-blocos .error {\n  margin: 10px 5%;\n  padding: 4px 5%;\n  border-radius: 4px;\n  font-weight: 500;\n  background: white;\n  color: red;\n}';
  function ProcessoSelecionar(numproc) {
    const mainMenu = document.getElementById('main-menu');
    if (isNull(mainMenu)) return Left(new Error('Menu não encontrado'));
    document.head.appendChild(document.createElement('style')).textContent = css;
    const div = mainMenu.insertAdjacentElement('beforebegin', document.createElement('div'));
    div.id = 'gm-blocos';
    const Model = createTaggedUnion(
      {
        Loading: null,
        Success: (blocos, inactive, erro) => ({
          blocos,
          inactive,
          erro,
        }),
        Error: reason => ({
          reason,
        }),
      },
      'status'
    );
    const Action = createTaggedUnion(
      {
        blocosModificados: (blocos, { fecharJanela = false } = {}) => ({
          blocos,
          fecharJanela,
        }),
        blocosObtidos: blocos => ({
          blocos,
        }),
        carregando: null,
        criarBloco: nome => ({
          nome,
        }),
        erro: reason => ({
          reason,
        }),
        erroCapturado: reason => ({
          reason,
        }),
        inserir: (id, { fecharJanela = false } = {}) => ({
          id,
          fecharJanela,
        }),
        inserirEFechar: id => ({
          id,
        }),
        mensagemRecebida: msg => ({
          msg,
        }),
        modificarProcessos: (id, fn, { fecharJanela = false } = {}) => ({
          id,
          fn,
          fecharJanela,
        }),
        noop: null,
        obterBlocos: null,
        remover: id => ({
          id,
        }),
      },
      'type'
    );
    const store = createStore(() => Model.Loading, reducer);
    const bc = createBroadcastService('gm-blocos', isBroadcastMessage);
    bc.subscribe(msg => store.dispatch(Action.mensagemRecebida(msg)));
    store.subscribe(update);
    store.dispatch(Action.obterBlocos);
    return Right(void 0);
    function asyncAction(state, f) {
      f()
        .catch(err => Action.erro(err))
        .then(store.dispatch);
      return reducer(state, Action.carregando);
    }
    function reducer(state, action) {
      return Action.match(action, {
        blocosModificados: ({ blocos, fecharJanela }) =>
          asyncAction(state, async () => {
            bc.publish({
              type: 'Blocos',
              blocos,
            });
            if (fecharJanela) window.close();
            return Action.blocosObtidos(blocos);
          }),
        blocosObtidos: ({ blocos }) => Model.Success(blocos, false),
        carregando: () =>
          Model.match(
            state,
            {
              Success: state2 => Model.Success(state2.blocos, true, void 0),
            },
            () => Model.Loading
          ),
        criarBloco: ({ nome }) =>
          asyncAction(state, async () => {
            const blocos = await getBlocos();
            if (blocos.some(x => x.nome === nome))
              return Action.erroCapturado(`Já existe um bloco com o nome ${JSON.stringify(nome)}.`);
            const bloco = {
              id: Math.max(-1, ...blocos.map(x => x.id)) + 1,
              nome,
              processos: [],
            };
            return Action.blocosModificados(await createBloco(bloco));
          }),
        erro: ({ reason }) => Model.Error(reason),
        erroCapturado: ({ reason }) =>
          Model.match(state, {
            Loading: () => Model.Error(reason),
            Error: s => s,
            Success: ({ blocos }) => Model.Success(blocos, false, reason),
          }),
        inserir: ({ id, fecharJanela }) =>
          reducer(
            state,
            Action.modificarProcessos(
              id,
              (processos, numproc2) => {
                processos.add(numproc2);
              },
              {
                fecharJanela,
              }
            )
          ),
        inserirEFechar: ({ id }) =>
          reducer(
            state,
            Action.inserir(id, {
              fecharJanela: true,
            })
          ),
        mensagemRecebida: ({ msg }) =>
          matchBy('type')(msg, {
            Blocos: ({ blocos }) => reducer(state, Action.blocosObtidos(blocos)),
            NoOp: () => state,
          }),
        modificarProcessos: ({ id, fn, fecharJanela }) =>
          asyncAction(state, async () => {
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
          }),
        noop: () => state,
        obterBlocos: () =>
          asyncAction(state, async () => Action.blocosModificados(await getBlocos())),
        remover: ({ id }) =>
          reducer(
            state,
            Action.modificarProcessos(id, (processos, numproc2) => {
              processos.delete(numproc2);
            })
          ),
      });
    }
    function update(state) {
      preact2.render(
        o(Main, {
          state,
        }),
        div
      );
    }
    function Main({ state }) {
      return Model.match(state, {
        Error: ({ reason }) =>
          o(ShowError, {
            reason,
          }),
        Loading: () => o(Placeholder, {}),
        Success: ({ blocos, inactive, erro }) =>
          o(Blocos, {
            blocos: blocos.map(({ processos, ...rest }) => ({
              ...rest,
              inserido: processos.includes(numproc),
            })),
            disabled: inactive,
            erro,
          }),
      });
    }
    function ShowError({ reason }) {
      const message = messageFromReason(reason);
      return o(preact2.Fragment, {
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
            onClick: () => store.dispatch(Action.obterBlocos),
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
      return o(preact2.Fragment, {
        children: [
          o('h4', {
            children: 'Blocos',
          }),
          o('ul', {
            children: [li, li, li],
          }),
          o('button', {
            type: 'button',
            id: 'gm-novo-bloco',
            disabled: true,
            children: 'Novo',
          }),
        ],
      });
    }
    function Blocos(props) {
      let aviso = null;
      if (props.erro) {
        aviso = o('div', {
          class: 'error',
          children: props.erro,
        });
      }
      return o(preact2.Fragment, {
        children: [
          o('h4', {
            children: 'Blocos',
          }),
          o('ul', {
            children: props.blocos.map(info =>
              o(
                BlocoPaginaProcesso,
                {
                  ...info,
                  disabled: props.disabled,
                },
                info.id
              )
            ),
          }),
          o('button', {
            type: 'button',
            id: 'gm-novo-bloco',
            onClick: onNovoClicked,
            disabled: props.disabled,
            children: 'Novo',
          }),
          aviso,
        ],
      });
      function onNovoClicked(evt) {
        evt.preventDefault();
        const nome = prompt('Nome do novo bloco:');
        if (nome === null) return;
        if (isNonEmptyString(nome)) {
          store.dispatch(Action.criarBloco(nome));
        }
      }
    }
    function BlocoPaginaProcesso(props) {
      const onChange = evt => {
        if (evt.currentTarget.checked) {
          store.dispatch(Action.inserir(props.id));
        } else {
          store.dispatch(Action.remover(props.id));
        }
      };
      return o('li', {
        children: [
          o('input', {
            id: `gm-bloco-${props.id}`,
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
          props.inserido
            ? o('span', {})
            : o(preact2.Fragment, {
                children: [
                  ' ',
                  o('input', {
                    type: 'image',
                    src: 'infra_css/imagens/transportar.gif',
                    onMouseOver: () =>
                      infraTooltipMostrar('Inserir processo no bloco e fechar a janela.'),
                    onMouseOut: () => infraTooltipOcultar(),
                    onClick: () => {
                      infraTooltipOcultar();
                      store.dispatch(Action.inserirEFechar(props.id));
                    },
                    disabled: props.disabled,
                  }),
                ],
              }),
        ],
      });
    }
  }
  function main() {
    const url = new URL(document.location.href);
    const params = url.searchParams;
    const acao = params.get('acao');
    if (!acao) return Left(new Error('Página desconhecida.'));
    switch (acao) {
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
        return Left(new Error(`Ação desconhecida: "${acao}".`));
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
