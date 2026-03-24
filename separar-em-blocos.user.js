// ==UserScript==
// @name         separar-em-blocos
// @name:pt-BR   Separar em blocos
// @namespace    http://nadameu.com.br
// @version      4.2.0
// @author       nadameu
// @description  Permite a separação de processos em blocos para movimentação separada
// @match        https://eproc.jfpr.jus.br/eprocV2/controlador.php?acao=processo_selecionar&*
// @match        https://eproc.jfrs.jus.br/eprocV2/controlador.php?acao=processo_selecionar&*
// @match        https://eproc.jfsc.jus.br/eprocV2/controlador.php?acao=processo_selecionar&*
// @match        https://eproc.trf4.jus.br/eproc2trf4/controlador.php?acao=processo_selecionar&*
// @match        https://eproc.jfpr.jus.br/eprocV2/controlador.php?acao=localizador_processos_lista&*
// @match        https://eproc.jfrs.jus.br/eprocV2/controlador.php?acao=localizador_processos_lista&*
// @match        https://eproc.jfsc.jus.br/eprocV2/controlador.php?acao=localizador_processos_lista&*
// @match        https://eproc.trf4.jus.br/eproc2trf4/controlador.php?acao=localizador_processos_lista&*
// @match        https://eproc.jfpr.jus.br/eprocV2/controlador.php?acao=relatorio_geral_consultar&*
// @match        https://eproc.jfrs.jus.br/eprocV2/controlador.php?acao=relatorio_geral_consultar&*
// @match        https://eproc.jfsc.jus.br/eprocV2/controlador.php?acao=relatorio_geral_consultar&*
// @match        https://eproc.trf4.jus.br/eproc2trf4/controlador.php?acao=relatorio_geral_consultar&*
// @require      https://cdn.jsdelivr.net/combine/npm/preact@10.29.0,npm/preact@10.29.0/hooks/dist/hooks.umd.js
// @grant        GM_addStyle
// @grant        window.close
// ==/UserScript==

(function (preact, hooks) {
  'use strict';

  const d = new Set();
  const importCSS = async e => {
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

  class _Either {
    catch(f2) {
      return this.match({ Left: f2, Right: () => this });
    }
    chain(f2) {
      return this.match({ Left: () => this, Right: f2 });
    }
    mapLeft(f2) {
      return this.match({ Left: x => Left(f2(x)), Right: () => this });
    }
    map(f2) {
      return this.match({ Left: () => this, Right: x => Right(f2(x)) });
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
    for (const [index, value] of Array.from(collection).entries()) {
      const either = transform(value, index);
      if (either.isLeft) return either;
      results.push(either.rightValue);
    }
    return Right(results);
  }
  const estilosScss =
    '.gm-blocos__lista,.gm-blocos__dialog,.gm-blocos__processo{--accent: hsl(333, 40%, 25%);--bg: hsl(333, 10%, 30%);--border: hsl(333, 15%, 60%);--disabled: hsl(333, 5%, 37.5%);--disabled-text: hsl(333, 0%, 80%);--shadow: hsl(333, 12.5%, 17.5%);--muted-accent: hsl(333, 25%, 25%);--text: hsl(333, 0%, 100%)}.bootstrap-styles .gm-blocos__lista{margin:4px;padding:4px 8px;border-radius:4px;width:max-content;background:var(--bg);color:var(--text);box-shadow:0 3px 3px var(--shadow)}.bootstrap-styles .gm-blocos__lista h4{margin:3px 0;font-size:1.25rem;font-weight:300}.bootstrap-styles .gm-blocos__lista input[type=image]{border:none}.bootstrap-styles .gm-blocos__lista table{margin:6px 0 12px;border-collapse:collapse}.bootstrap-styles .gm-blocos__lista td{margin:0;padding:3px .5ch;vertical-align:middle}.bootstrap-styles .gm-blocos__lista td a[href]{color:#fff}.bootstrap-styles .gm-blocos__lista td label{font-size:.92rem;margin:0}.bootstrap-styles .gm-blocos__lista td small{font-size:.75rem}.bootstrap-styles .gm-blocos__lista tr{border:1px solid var(--disabled);border-width:1px 0}.bootstrap-styles .gm-blocos__lista tfoot td{padding-top:.75em;padding-bottom:.75em}.bootstrap-styles .gm-blocos__lista input.rename{font-size:1em}.bootstrap-styles .gm-blocos__lista .gm-erro,.bootstrap-styles .gm-blocos__lista .gm-aviso{padding:.1em .5ex;font-size:.9rem;background:#f4f1f1;color:#c00;margin:2px auto 6px;width:fit-content}.bootstrap-styles .gm-blocos__processo button,.bootstrap-styles .gm-blocos__lista button,.gm-blocos__dialog button{display:block;margin:0 auto 7px;padding:2px 20px;font-size:.86rem;border:none;border-radius:3px;box-shadow:0 2px 4px var(--shadow);background:var(--muted-accent);color:var(--text)}.bootstrap-styles .gm-blocos__processo button:hover,.bootstrap-styles .gm-blocos__lista button:hover,.gm-blocos__dialog button:hover{transition:background-color .1s ease-in;background:var(--accent)}.bootstrap-styles .gm-blocos__processo button:disabled,.bootstrap-styles .gm-blocos__lista button:disabled,.gm-blocos__dialog button:disabled{background:var(--disabled);color:var(--disabled-text);box-shadow:none}.bootstrap-styles .gm-blocos__dialog{background:var(--bg);color:var(--text);font-family:var(--font-family-sans-serif);font-size:1rem;min-width:25vw;border:3px ridge var(--border);box-shadow:0 4px 8px 4px #100a0c80;border-radius:12px}.bootstrap-styles .gm-blocos__dialog::backdrop{background:#100a0cbf}.bootstrap-styles .gm-blocos__dialog form{display:grid;grid-template-rows:1fr 10fr 1fr;justify-items:center;align-items:center}.bootstrap-styles .gm-blocos__dialog form div{font-weight:700}.bootstrap-styles .gm-blocos__nome{all:unset}.bootstrap-styles .gm-blocos__processos{all:unset;border:1px inset var(--border);padding:.5em .5ch}.bootstrap-styles .gm-blocos__processo{margin:2px 3px 4px;padding:4px;border-radius:4px;background:var(--bg);color:var(--text);box-shadow:0 3px 3px var(--shadow)}.bootstrap-styles .gm-blocos__processo h4{margin:3px 0;font-size:1.25rem;font-weight:300}.bootstrap-styles .gm-blocos__processo ul{list-style-type:none;margin:3px 0 7px;padding:0}.bootstrap-styles .gm-blocos__processo li{position:relative;display:grid;grid-template-columns:auto 1fr auto;grid-gap:5px;align-items:center;margin:4px 0;padding:5px;border-radius:2px}.bootstrap-styles .gm-blocos__processo li:before{content:"";position:absolute;top:2px;width:100%;height:100%;border-bottom:1px solid #888;pointer-events:none}.bootstrap-styles .gm-blocos__processo li:last-of-type:before{content:none}.bootstrap-styles .gm-blocos__processo li:hover{background:var(--accent)}.bootstrap-styles .gm-blocos__processo label{margin:0;font-size:.92rem}.bootstrap-styles .gm-blocos__processo .placeholder span{height:1.38rem;animation:pulse 1s ease-in-out infinite alternate;border-radius:4px}.bootstrap-styles .gm-blocos__processo .placeholder span:first-of-type,.bootstrap-styles .gm-blocos__processo .placeholder span:last-of-type{width:1.38rem}@keyframes pulse{0%{background-color:var(--disabled)}to{background-color:var(--bg)}}.bootstrap-styles .gm-blocos__processo .error{margin:10px 5%;padding:4px 5%;border-radius:4px;font-weight:500;background:#fff;color:red}';
  importCSS(estilosScss);
  var f = 0;
  function u(e, t, n, o, i, u2) {
    t || (t = {});
    var a,
      c,
      p = t;
    if ('ref' in p)
      for (c in ((p = {}), t)) 'ref' == c ? (a = t[c]) : (p[c] = t[c]);
    var l = {
      type: e,
      props: p,
      key: n,
      ref: a,
      __k: null,
      __: null,
      __b: 0,
      __e: null,
      __c: null,
      constructor: void 0,
      __v: --f,
      __i: -1,
      __u: 0,
      __source: i,
      __self: u2,
    };
    if ('function' == typeof e && (a = e.defaultProps))
      for (c in a) void 0 === p[c] && (p[c] = a[c]);
    return (preact.options.vnode && preact.options.vnode(l), l);
  }
  function createBroadcastService(id, validate) {
    const listeners = new Set();
    const bc = new BroadcastChannel(id);
    bc.addEventListener('message', onMessage);
    return { destroy, publish, subscribe };
    function onMessage(evt) {
      if (validate(evt.data))
        for (const listener of listeners) listener(evt.data);
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
  function createStore(getInitialState, reducer) {
    const listeners = new Set();
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
  const makeConstructorsWith = (tagName, constructors) =>
    Object.fromEntries(
      Object.entries(constructors).map(([k, v]) => [
        k,
        (...args) => tagWith(tagName)(k)(v(...args)),
      ])
    );
  const tagWith =
    tagName =>
    tag2 =>
    (obj = {}) => {
      obj[tagName] = tag2;
      return obj;
    };
  const isTaggedWith = tagName => tag2 => obj =>
    typeof obj === 'object' &&
    obj !== null &&
    tagName in obj &&
    obj[tagName] === tag2;
  const Matching = { NOT_FOUND: 'NOT_FOUND', FOUND: 'FOUND' };
  const matchWith = tagName => obj => {
    let status = tagWith('tag')(Matching.NOT_FOUND)();
    const isTagged2 = isTaggedWith(tagName);
    const ret = {
      case(tag2, action) {
        return ret.when(isTagged2(tag2), action);
      },
      get() {
        if (status.tag === Matching.FOUND) return status.result;
        else throw new Error('Match not exhaustive.');
      },
      otherwise(action) {
        return ret.when(() => true, action);
      },
      unsafeGet() {
        return ret.get();
      },
      when(predicate, action) {
        if (status.tag === Matching.NOT_FOUND && predicate(obj)) {
          status = tagWith('tag')(Matching.FOUND)({ result: action(obj) });
        }
        return ret;
      },
    };
    return ret;
  };
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
  const isOfTypeObject = isOfType('object');
  const isString = isOfType('string');
  function isLiteral(literal) {
    return value => value === literal;
  }
  const isUndefined = isLiteral(void 0);
  const isNull = isLiteral(null);
  function negate(predicate) {
    return value => !predicate(value);
  }
  const isNotNull = negate(isNull);
  function refine(...predicates) {
    return value => predicates.every(p => p(value));
  }
  const isObject = refine(isOfTypeObject, isNotNull);
  const isInteger = x => Number.isInteger(x);
  const isNonNegativeInteger = refine(isInteger, x => x > -1);
  const isNonEmptyString = refine(isString, x => x.trim().length > 0);
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
  const isNumProc = refine(isString, x => numprocRE.test(x));
  const isIdBloco = isNonNegativeInteger;
  const isNomeBloco = isNonEmptyString;
  const isBloco = hasShape({
    id: isIdBloco,
    nome: isNomeBloco,
    processos: isTypedArray(isNumProc),
  });
  function promisify(eventName) {
    return obj =>
      new Promise((res, rej) => {
        obj.addEventListener('error', onReject, { once: true });
        obj.addEventListener(eventName, onResolve, { once: true });
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
  const promisifyRequest = promisify('success');
  const promisifyTransaction = promisify('complete');
  function open() {
    const req = indexedDB.open('gm-blocos', 4);
    req.addEventListener('upgradeneeded', onUpgradeNeeded, { once: true });
    return promisifyRequest(req);
    function onUpgradeNeeded({ oldVersion }) {
      const db = req.result;
      const transaction = req.transaction;
      let store;
      if (oldVersion < 1) {
        store = db.createObjectStore('blocos', { keyPath: 'id' });
      } else {
        store = transaction.objectStore('blocos');
      }
      if (oldVersion < 2) {
        store.createIndex('nome', ['nome'], { unique: true });
      }
      if (oldVersion < 3) {
        store.deleteIndex('nome');
        store.createIndex('nome', 'nome', { unique: true });
      }
      if (oldVersion < 4) {
        store.createIndex('processos', 'processos', { multiEntry: true });
      }
    }
  }
  async function makeTransaction(mode, createRequests) {
    const db = await open();
    const tx = db.transaction('blocos', mode);
    const store = tx.objectStore('blocos');
    const requests = createRequests(store);
    const [results, _done] = await Promise.all([
      Promise.all(requests.map(promisifyRequest)),
      promisifyTransaction(tx),
    ]);
    return results;
  }
  async function deleteBlocos() {
    await promisifyRequest(indexedDB.deleteDatabase('gm-blocos'));
  }
  async function getBlocos() {
    const [blocos] = await makeTransaction('readonly', store => [
      store.getAll(),
    ]);
    return validarBlocos(blocos);
  }
  function validarBlocos(blocos) {
    assert(blocos.every(isBloco), 'Formato do banco de dados desconhecido.');
    return blocos.sort(compararBlocos);
  }
  const compararBlocos = compareUsing(
    bloco => bloco.nome,
    alt(
      compareUsing(x => x.toLowerCase()),
      compareDefault,
      nome => {
        throw new Error(
          `Há dois blocos com o mesmo nome: ${JSON.stringify(nome)}.`
        );
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
  function compareUsing(f2, compareFn = compareDefault) {
    return (a, b) => compareFn(f2(a), f2(b));
  }
  async function getBloco(id) {
    const [bloco] = await makeTransaction('readonly', store => [store.get(id)]);
    assert(isAnyOf(isBloco, isUndefined)(bloco));
    return bloco;
  }
  const createBloco = writeBloco('add');
  async function deleteBloco(id) {
    const [_done, blocos] = await makeTransaction('readwrite', store => [
      store.delete(id),
      store.getAll(),
    ]);
    return validarBlocos(blocos);
  }
  const updateBloco = writeBloco('put');
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
  const isBroadcastMessage = hasShape({
    type: isLiteral('Blocos'),
    blocos: isTypedArray(isBloco),
  });
  function LocalizadorProcessoLista() {
    const tabela = document.querySelector('table#tabelaLocalizadores');
    const { desmarcarTodosProcessos, marcarTodosProcessos } = (() => {
      const ret = {
        desmarcarTodosProcessos: () => {},
        marcarTodosProcessos: () => {},
      };
      if (!tabela) return ret;
      const imgInfraCheck = document.getElementById('imgInfraCheck');
      if (!imgInfraCheck) return ret;
      const lnkInfraCheck = document.getElementById('lnkInfraCheck');
      if (!lnkInfraCheck) return ret;
      ret.desmarcarTodosProcessos = () => {
        imgInfraCheck.title = imgInfraCheck.alt = 'Remover Seleção';
        lnkInfraCheck.click();
      };
      ret.marcarTodosProcessos = () => {
        lnkInfraCheck.click();
      };
      return ret;
    })();
    const linhas = tabela?.rows ?? [];
    const eitherMapa = traverse(linhas, (linha, i) => {
      if (i === 0) return Right([]);
      const endereco = linha.cells[1]?.querySelector('a[href]')?.href;
      if (isUndefined(endereco))
        return Left(new Error(`Link do processo não encontrado: linha ${i}.`));
      const numproc = new URL(endereco).searchParams.get('num_processo');
      if (isNull(numproc))
        return Left(
          new Error(`Número do processo não encontrado: linha ${i}.`)
        );
      if (!isNumProc(numproc))
        return Left(
          new Error(
            `Número de processo desconhecido: ${JSON.stringify(numproc)}.`
          )
        );
      const checkbox = linha.cells[0]?.querySelector('input[type=checkbox]');
      if (isNullish(checkbox))
        return Left(new Error(`Caixa de seleção não encontrada: linha ${i}.`));
      return Right([[numproc, { linha, checkbox, checked: checkbox.checked }]]);
    }).map(entriess => new Map(entriess.flat(1)));
    if (eitherMapa.isLeft) return eitherMapa;
    const mapa = eitherMapa.rightValue;
    const processosMarcados = new Set();
    const processosNaoMarcados = new Set();
    for (const [numproc, { checked }] of mapa) {
      if (checked) {
        processosMarcados.add(numproc);
      } else {
        processosNaoMarcados.add(numproc);
      }
    }
    const acoes =
      document.getElementById('fldAcoes') ??
      document.getElementById('divInfraAreaTabela');
    if (isNull(acoes))
      return Left(new Error('Não foi possível inserir os blocos na página.'));
    const div = acoes.insertAdjacentElement(
      'beforebegin',
      h('div', { className: 'gm-blocos__lista' })
    );
    const dialogNomeBloco = h('output', { className: 'gm-blocos__nome' });
    const dialogProcessos = h('output', { className: 'gm-blocos__processos' });
    const dialog = h(
      'dialog',
      { className: 'gm-blocos__dialog' },
      h(
        'form',
        { method: 'dialog' },
        h('div', null, 'Processos do bloco "', dialogNomeBloco, '":'),
        dialogProcessos,
        h('button', null, 'Fechar')
      )
    );
    document.body.appendChild(dialog);
    const Model = makeConstructorsWith('status', {
      init: () => ({}),
      loaded: (blocos, aviso) => ({ blocos, aviso }),
      error: error => ({ error }),
    });
    const matchModel = matchWith('status');
    const AsyncAction = makeConstructorsWith('type', {
      criarBloco: nome => ({ nome }),
      excluirBD: () => ({}),
      excluirBloco: id => ({ id }),
      obterBlocos: () => ({}),
      removerProcessosAusentes: id => ({ id }),
      renomearBloco: (id, nome) => ({ id, nome }),
    });
    const SyncAction = makeConstructorsWith('type', {
      blocosObtidos: blocos => ({ blocos }),
      checkboxClicado: (id, estadoAnterior) => ({
        id,
        estadoAnterior,
      }),
      erroCapturado: aviso => ({ aviso }),
      erroDesconhecido: erro => ({ erro }),
      reset: () => ({}),
    });
    const AliasAction = makeConstructorsWith('type', {
      blocosModificados: blocos => ({ blocos }),
      mensagemRecebida: msg => ({ msg }),
    });
    const Action2 = { ...AsyncAction, ...SyncAction, ...AliasAction };
    const bc = createBroadcastService('gm-blocos', isBroadcastMessage);
    const store = Object.assign(
      {},
      createStore(() => Model.init(), reducer)
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
    store.dispatch(Action2.obterBlocos());
    return Right(void 0);
    function update(state) {
      return preact.render(u(Main2, { state }), div);
    }
    function reducer(state, action) {
      return matchWith('type')(action)
        .case('blocosObtidos', ({ blocos }) =>
          matchModel(state)
            .case('error', state2 => state2)
            .otherwise(() => {
              const info = blocos.map(bloco => ({
                ...bloco,
                nestaPagina: bloco.processos.filter(numproc =>
                  mapa.has(numproc)
                ).length,
                total: bloco.processos.length,
              }));
              return Model.loaded(info);
            })
            .get()
        )
        .case('checkboxClicado', ({ id, estadoAnterior }) =>
          matchModel(state)
            .case('loaded', state2 => {
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
              return { ...state2 };
            })
            .otherwise(state2 => state2)
            .get()
        )
        .case('erroCapturado', ({ aviso }) =>
          matchModel(state)
            .case('init', () => Model.error(aviso))
            .case('error', state2 => state2)
            .case('loaded', state2 => ({ ...state2, aviso }))
            .get()
        )
        .case('erroDesconhecido', ({ erro }) =>
          matchModel(state)
            .case('error', state2 => state2)
            .otherwise(() => Model.error(erro))
            .get()
        )
        .case('reset', () => Model.init())
        .get();
    }
    function handleAsyncAction(store2) {
      return next => {
        return action => {
          const isAsyncAction = action2 =>
            Object.keys(AsyncAction).includes(action2.type);
          if (!isAsyncAction(action)) return next(action);
          const promise = matchWith('type')(action)
            .case('criarBloco', async ({ nome }) => {
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
            })
            .case('excluirBD', async () => {
              await deleteBlocos();
              return Action2.obterBlocos();
            })
            .case('excluirBloco', async ({ id }) =>
              Action2.blocosModificados(await deleteBloco(id))
            )
            .case('obterBlocos', async () =>
              Action2.blocosModificados(await getBlocos())
            )
            .case('removerProcessosAusentes', async ({ id }) => {
              const bloco = await getBloco(id);
              if (!bloco) throw new Error(`Bloco não encontrado: ${id}.`);
              const processos = bloco.processos.filter(x => mapa.has(x));
              return Action2.blocosModificados(
                await updateBloco({ ...bloco, processos })
              );
            })
            .case('renomearBloco', async ({ id, nome }) => {
              const blocos = await getBlocos();
              const bloco = blocos.find(x => x.id === id);
              if (!bloco) throw new Error(`Bloco não encontrado: ${id}.`);
              const others = blocos.filter(x => x.id !== id);
              if (others.some(x => x.nome === nome))
                return Action2.erroCapturado(
                  `Já existe um bloco com o nome ${JSON.stringify(nome)}.`
                );
              return Action2.blocosModificados(
                await updateBloco({ ...bloco, nome })
              );
            })
            .get();
          promise.catch(Action2.erroDesconhecido).then(store2.dispatch);
          if (action.type === 'obterBlocos') return next(Action2.reset());
        };
      };
    }
    function handleAliasAction(_store) {
      return next => {
        return action => {
          const replaced = matchWith('type')(action)
            .case('blocosModificados', ({ blocos }) => {
              bc.publish({ type: 'Blocos', blocos });
              return Action2.blocosObtidos(blocos);
            })
            .case('mensagemRecebida', ({ msg: { blocos } }) =>
              Action2.blocosObtidos(blocos)
            )
            .otherwise(s => s)
            .get();
          return next(replaced);
        };
      };
    }
    function Main2({ state }) {
      return matchModel(state)
        .case('error', state2 => u(ShowError2, { reason: state2.error }))
        .case('loaded', state2 => u(Blocos2, { state: state2 }))
        .case('init', () => u(Loading, {}))
        .get();
    }
    function Loading() {
      return u(preact.Fragment, { children: 'Carregando...' });
    }
    function ShowError2({ reason }) {
      const message = messageFromReason2(reason);
      return u(preact.Fragment, {
        children: [
          u('div', { class: 'gm-erro', children: message }),
          u('button', {
            onClick: () => store.dispatch(Action2.obterBlocos()),
            children: 'Tentar carregar dados salvos',
          }),
          ' ',
          u('button', {
            onClick: () => store.dispatch(Action2.excluirBD()),
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
          else
            store.dispatch(
              Action2.erroCapturado('Nome do bloco não pode estar em branco.')
            );
          setNome('');
        },
        [nome]
      );
      let aviso = state.aviso ? u(Aviso, { children: state.aviso }) : null;
      const processosComBlocoNestaPagina = new Set(
        state.blocos.flatMap(({ processos }) =>
          processos.filter(p2 => mapa.has(p2))
        )
      );
      const processosSemBloco = new Map(
        Array.from(mapa).filter(
          ([numproc]) => !processosComBlocoNestaPagina.has(numproc)
        )
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
      return u(preact.Fragment, {
        children: [
          u('h4', { children: 'Blocos' }),
          u('table', {
            children: [
              u('tbody', {
                children: state.blocos.map(bloco =>
                  u(BlocoPaginaLista, { ...bloco }, bloco.id)
                ),
              }),
              u('tfoot', {
                children:
                  semBloco !== 'disabled' &&
                  u('tr', {
                    children: [
                      u('td', {
                        children: u('input', {
                          type: 'radio',
                          checked: semBloco === 'checked',
                          onClick: () =>
                            store.dispatch(
                              Action2.checkboxClicado(-1, semBloco)
                            ),
                        }),
                      }),
                      u('td', {
                        children: u('label', {
                          onClick: () =>
                            store.dispatch(
                              Action2.checkboxClicado(-1, semBloco)
                            ),
                          children: '(processos sem bloco)',
                        }),
                      }),
                      u('td', {
                        children: u('small', {
                          children: [
                            '(',
                            (s => `${s} processo${s > 1 ? 's' : ''}`)(
                              processosSemBloco.size
                            ),
                            ')',
                          ],
                        }),
                      }),
                    ],
                  }),
              }),
            ],
          }),
          u('form', {
            onSubmit,
            children: u('button', {
              type: 'button',
              onClick: onNovoClicked,
              children: 'Criar bloco',
            }),
          }),
          aviso !== null ? u('br', {}) : null,
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
        store.dispatch(
          Action2.erroCapturado('Nome do bloco não pode estar em branco.')
        );
      }
    }
    function Aviso(props) {
      return u(preact.Fragment, {
        children: [
          u('div', { class: 'gm-aviso', children: props.children }),
          u('button', {
            type: 'button',
            onClick: () => store.dispatch(Action2.obterBlocos()),
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
      let botaoRenomear = u(BotaoAcao, {
        src: 'imagens/minuta_editar.gif',
        label: 'Renomear',
        onClick: onRenomearClicked,
      });
      let removerAusentes = u(BotaoAcao, {
        src: 'imagens/minuta_transferir.png',
        label: 'Remover processos ausentes',
        onClick: () =>
          store.dispatch(Action2.removerProcessosAusentes(props.id)),
      });
      if (editing) {
        displayNome = u(preact.Fragment, {
          children: [
            u('input', {
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
            u('br', {}),
            u('small', {
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
        const meusProcessosNestaPagina = new Set(
          props.processos.filter(n => mapa.has(n))
        );
        if (meusProcessosNestaPagina.size === 0) return 'disabled';
        for (const numproc of processosMarcados) {
          if (!meusProcessosNestaPagina.has(numproc)) return 'unchecked';
        }
        for (const numproc of processosNaoMarcados) {
          if (meusProcessosNestaPagina.has(numproc)) return 'unchecked';
        }
        return 'checked';
      })();
      const qtdProcessos = u('small', {
        children: ['(', createAbbr(props.nestaPagina, props.total), ')'],
      });
      return u('tr', {
        children: [
          u('td', {
            children: u('input', {
              type: 'radio',
              checked: chkState === 'checked',
              disabled: chkState === 'disabled',
              style: {
                cursor: chkState === 'disabled' ? 'not-allowed' : 'auto',
              },
              onClick: () =>
                store.dispatch(Action2.checkboxClicado(props.id, chkState)),
            }),
          }),
          u('td', {
            children: u('label', {
              onClick: () =>
                store.dispatch(Action2.checkboxClicado(props.id, chkState)),
              children: displayNome,
            }),
          }),
          u('td', {
            children:
              props.total > 0
                ? u('a', {
                    href: '#',
                    onClick: e => {
                      e.preventDefault();
                      dialogNomeBloco.textContent = props.nome;
                      console.log(dialogProcessos);
                      dialogProcessos.innerHTML = props.processos.join('<br>');
                      dialog.showModal();
                      window
                        .getSelection()
                        ?.getRangeAt(0)
                        ?.selectNodeContents(dialogProcessos);
                    },
                    children: qtdProcessos,
                  })
                : qtdProcessos,
          }),
          u('td', { children: botaoRenomear }),
          u('td', {
            children: u(BotaoAcao, {
              src: 'imagens/minuta_excluir.gif',
              label: 'Excluir',
              onClick: onExcluirClicked,
            }),
          }),
          u('td', { children: removerAusentes }),
        ],
      });
      function createAbbr(nestaPagina, total) {
        if (nestaPagina === total)
          return `${total} processo${total > 1 ? 's' : ''}`;
        const textoTotal = `${total} processo${total > 1 ? 's' : ''} no bloco`;
        const textoPagina = `${nestaPagina === 0 ? 'nenhum' : nestaPagina} nesta página`;
        const textoResumido = `${nestaPagina}/${total} processo${total > 1 ? 's' : ''}`;
        return u('abbr', {
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
            store.dispatch(
              Action2.erroCapturado('Nome do bloco não pode estar em branco.')
            );
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
      return u('img', {
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
  const Action = makeConstructorsWith('type', {
    blocosModificados: (blocos, { fecharJanela = false } = {}) => ({
      blocos,
      fecharJanela,
    }),
    criarBloco: nome => ({ nome }),
    erro: reason => ({ reason }),
    inserir: (id, { fecharJanela = false } = {}) => ({
      id,
      fecharJanela,
    }),
    mensagemRecebida: msg => ({ msg }),
    obterBlocos: () => ({}),
    remover: id => ({ id }),
  });
  const matchAction = matchWith('type');
  const State = makeConstructorsWith('status', {
    Loading: blocos => ({ blocos }),
    Success: blocos => ({ blocos }),
    Error: reason => ({ reason }),
  });
  function ProcessoSelecionar(numproc) {
    const mainMenu = document.getElementById('main-menu');
    if (isNull(mainMenu)) return Left(new Error('Menu não encontrado'));
    const div = mainMenu.insertAdjacentElement(
      'beforebegin',
      document.createElement('div')
    );
    div.className = 'gm-blocos__processo';
    preact.render(u(Main, { ...{ numproc } }), div);
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
        return Action.blocosModificados(blocos, { fecharJanela });
      });
    }
    function reducer(state, action) {
      return matchAction(action)
        .case('blocosModificados', ({ blocos, fecharJanela }) => {
          bc.publish({ type: 'Blocos', blocos });
          if (fecharJanela) window.close();
          return State.Success(blocos);
        })
        .case('criarBloco', ({ nome }) =>
          asyncAction(state, async () => {
            const blocos = await getBlocos();
            if (blocos.some(x => x.nome === nome))
              return Action.erro(
                `Já existe um bloco com o nome ${JSON.stringify(nome)}.`
              );
            const bloco = {
              id: Math.max(-1, ...blocos.map(x => x.id)) + 1,
              nome,
              processos: [],
            };
            return Action.blocosModificados(await createBloco(bloco));
          })
        )
        .case('erro', ({ reason }) => State.Error(reason))
        .case('inserir', ({ id, fecharJanela }) =>
          modificarProcessos(state, {
            id,
            fn: (processos, numproc2) => {
              processos.add(numproc2);
            },
            fecharJanela,
          })
        )
        .case('mensagemRecebida', ({ msg: { blocos } }) =>
          State.Success(blocos)
        )
        .case('obterBlocos', () =>
          asyncAction(state, async () =>
            Action.blocosModificados(await getBlocos())
          )
        )
        .case('remover', ({ id }) =>
          modificarProcessos(state, {
            id,
            fn: (processos, numproc2) => {
              processos.delete(numproc2);
            },
            fecharJanela: false,
          })
        )
        .get();
    }
  }
  function Main({ numproc }) {
    const bc = hooks.useMemo(() => {
      return createBroadcastService('gm-blocos', isBroadcastMessage);
    }, []);
    const handleStateAction = hooks.useMemo(() => {
      return createReducer({ bc, numproc });
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
      dispatch(Action.obterBlocos());
    }, []);
    const criarBloco = hooks.useCallback(
      nome => dispatch(Action.criarBloco(nome)),
      []
    );
    const toggleBloco = hooks.useCallback((id, operacao, fecharJanela) => {
      if (operacao === 'inserir') {
        dispatch(Action.inserir(id, { fecharJanela }));
      } else {
        dispatch(Action.remover(id));
      }
    }, []);
    if (state.status === 'Error')
      return u(ShowError, {
        reason: state.reason,
        onRecarregarClick: () => dispatch(Action.obterBlocos()),
      });
    if (state.status === 'Loading' && state.blocos.length === 0)
      return u(Placeholder, {});
    return u(Blocos, {
      state,
      numproc,
      criarBloco,
      toggleBloco,
    });
  }
  function ShowError({ reason, onRecarregarClick }) {
    const message = messageFromReason(reason);
    return u(preact.Fragment, {
      children: [
        u('h4', { children: 'Blocos' }),
        u('div', { class: 'error', children: message }),
        u('button', {
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
    const li = u('li', {
      class: 'placeholder',
      children: [u('span', {}), u('span', {}), u('span', {})],
    });
    return u(preact.Fragment, {
      children: [
        u('h4', { children: 'Blocos' }),
        u('ul', { children: [li, li, li] }),
        u('button', { type: 'button', disabled: true, children: 'Novo' }),
      ],
    });
  }
  function Blocos(props) {
    const disabled = hooks.useMemo(
      () => props.state.status === 'Loading',
      [props.state.status]
    );
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
    return u(preact.Fragment, {
      children: [
        u('h4', { children: 'Blocos' }),
        u('ul', {
          children: infoBlocos.map(info =>
            u(
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
        u('button', {
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
      if (props.inserido) return u('span', {});
      return u(preact.Fragment, {
        children: [
          ' ',
          u('input', {
            type: 'image',
            src: 'infra_css/imagens/transportar.gif',
            onMouseOver: () =>
              infraTooltipMostrar(
                'Inserir processo no bloco e fechar a janela.'
              ),
            onMouseOut: () => infraTooltipOcultar(),
            onClick: onTransportarClick,
            disabled: props.disabled,
          }),
        ],
      });
    }, [props.inserido, props.disabled, props.id]);
    const id = hooks.useMemo(() => `gm-bloco-${props.id}`, [props.id]);
    return u('li', {
      children: [
        u('input', {
          id,
          type: 'checkbox',
          checked: props.inserido,
          onChange,
          disabled: props.disabled,
        }),
        ' ',
        u('label', { for: `gm-bloco-${props.id}`, children: props.nome }),
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
        if (!numproc)
          return Left(new Error('Número do processo não encontrado.'));
        if (!isNumProc(numproc))
          return Left(
            new Error(
              `Não foi possível analisar o número do proceso: ${JSON.stringify(
                numproc
              )}.`
            )
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
