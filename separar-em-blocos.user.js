// ==UserScript==
// @name         separar-em-blocos
// @name:pt-BR   Separar em blocos
// @namespace    http://nadameu.com.br
// @version      1.0.0
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
  function expectUnreachable(value) {
    throw new Error('Unexpected.');
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
  const Database = /* @__PURE__ */ Object.freeze(
    /* @__PURE__ */ Object.defineProperty(
      {
        __proto__: null,
        open,
        deleteBlocos,
        getBlocos,
        getBloco,
        createBloco,
        deleteBloco,
        updateBloco,
      },
      Symbol.toStringTag,
      { value: 'Module' }
    )
  );
  function createFromAsyncThunk(onLoading, onError) {
    return asyncThunk => (state, dispatch, extra) => {
      const asyncAction = asyncThunk(state, extra);
      asyncAction.catch(onError).then(dispatch);
      return onLoading(state, dispatch, extra);
    };
  }
  const isBroadcastMessage = /* @__PURE__ */ isTaggedUnion('type', {
    Blocos: {
      blocos: isArray(isBloco),
    },
    NoOp: {},
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
    return preact2.options.vnode && preact2.options.vnode(a), a;
  }
  const fromThunk$1 = createFromAsyncThunk(
    state => state,
    error => () => ({
      status: 'error',
      error,
    })
  );
  const actions$1 = {
    blocosModificados: blocos => (state, dispatch, extra) => {
      const { bc } = extra;
      bc.publish({
        type: 'Blocos',
        blocos,
      });
      return actions$1.blocosObtidos(blocos)(state, dispatch, extra);
    },
    blocosObtidos:
      blocos =>
      (state, _2, { mapa }) => {
        const info = blocos.map(bloco => ({
          ...bloco,
          nestaPagina: bloco.processos.filter(numproc => mapa.has(numproc)).length,
          total: bloco.processos.length,
        }));
        if (state.status === 'error') return state;
        return {
          status: 'loaded',
          blocos: info,
        };
      },
    criarBloco: nome =>
      fromThunk$1(async (state, { DB }) => {
        const blocos = await DB.getBlocos();
        if (blocos.some(x => x.nome === nome))
          return actions$1.erroCapturado(`Já existe um bloco com o nome ${JSON.stringify(nome)}.`);
        const bloco = {
          id: Math.max(-1, ...blocos.map(x => x.id)) + 1,
          nome,
          processos: [],
        };
        return actions$1.blocosModificados(await DB.createBloco(bloco));
      }),
    erroCapturado: aviso => state => {
      switch (state.status) {
        case 'init':
          return {
            status: 'error',
            error: aviso,
          };
        case 'error':
          return state;
        case 'loaded':
          return {
            ...state,
            aviso,
          };
      }
      return expectUnreachable();
    },
    excluirBD: () =>
      fromThunk$1(async ({}, { DB }) => {
        await DB.deleteBlocos();
        return actions$1.obterBlocos();
      }),
    excluirBloco: bloco =>
      fromThunk$1(async ({}, { DB }) => {
        return actions$1.blocosModificados(await DB.deleteBloco(bloco));
      }),
    mensagemRecebida: msg => {
      switch (msg.type) {
        case 'Blocos':
          return actions$1.blocosObtidos(msg.blocos);
        case 'NoOp':
          return actions$1.noop();
        default:
          return expectUnreachable();
      }
    },
    obterBlocos: () =>
      fromThunk$1(async ({}, { DB }) => actions$1.blocosModificados(await DB.getBlocos())),
    noop: () => state => state,
    removerProcessosAusentes: id =>
      fromThunk$1(async (_2, { DB, mapa }) => {
        const bloco = await DB.getBloco(id);
        if (!bloco) throw new Error(`Bloco não encontrado: ${id}.`);
        const processos = bloco.processos.filter(x => mapa.has(x));
        return actions$1.blocosModificados(
          await DB.updateBloco({
            ...bloco,
            processos,
          })
        );
      }),
    renomearBloco: (id, nome) =>
      fromThunk$1(async ({}, { DB }) => {
        const blocos = await DB.getBlocos();
        const bloco = blocos.find(x => x.id === id);
        if (!bloco) throw new Error(`Bloco não encontrado: ${id}.`);
        const others = blocos.filter(x => x.id !== id);
        if (others.some(x => x.nome === nome))
          return actions$1.erroCapturado(`Já existe um bloco com o nome ${JSON.stringify(nome)}.`);
        return actions$1.blocosModificados(
          await DB.updateBloco({
            ...bloco,
            nome,
          })
        );
      }),
    selecionarProcessos: id =>
      fromThunk$1(async ({}, { DB, mapa }) => {
        const bloco = await DB.getBloco(id);
        if (!bloco) throw new Error(`Bloco não encontrado: ${id}.`);
        for (const [numproc, { checkbox }] of mapa) {
          if (bloco.processos.includes(numproc)) {
            if (!checkbox.checked) checkbox.click();
          } else {
            if (checkbox.checked) checkbox.click();
          }
        }
        return actions$1.noop();
      }),
  };
  function LocalizadorProcessoLista() {
    const tabela = document.querySelector('table#tabelaLocalizadores');
    const linhas = Array.from(
      tabela?.rows ?? {
        length: 0,
      }
    );
    if (linhas.length <= 1) return Right(void 0);
    const eitherMapa = traverse(linhas.slice(1), (linha, i) => {
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
        numproc,
        {
          linha,
          checkbox,
        },
      ]);
    });
    if (eitherMapa.isLeft) return eitherMapa;
    const mapa = new Map(eitherMapa.rightValue);
    const barra = document.getElementById('divInfraBarraLocalizacao');
    if (isNullish(barra)) return Left(new Error('Não foi possível inserir os blocos na página.'));
    const div = barra.insertAdjacentElement('afterend', document.createElement('div'));
    preact2.render(
      o(Main$1, {
        mapa,
      }),
      div
    );
    return Right(void 0);
  }
  function Main$1(props) {
    const extra = hooks.useMemo(() => {
      const DB = Database,
        bc = createBroadcastService('gm-blocos', isBroadcastMessage),
        { mapa } = props;
      return {
        DB,
        bc,
        mapa,
      };
    }, []);
    const [state, dispatch] = hooks.useReducer(
      (state2, action) => action(state2, dispatch, extra),
      {
        status: 'init',
      }
    );
    hooks.useLayoutEffect(() => {
      extra.bc.subscribe(msg => dispatch(actions$1.mensagemRecebida(msg)));
      dispatch(actions$1.obterBlocos());
    }, []);
    switch (state.status) {
      case 'error':
        return o(ShowError$1, {
          reason: state.error,
          dispatch,
        });
      case 'loaded':
        return o(Blocos$1, {
          state,
          dispatch,
        });
      case 'init':
        return o(Loading, {});
    }
    return expectUnreachable();
  }
  function Loading() {
    return o(preact2.Fragment, {
      children: 'Carregando...',
    });
  }
  function ShowError$1({ dispatch, reason }) {
    const message =
      reason instanceof Error
        ? reason.message
          ? `Ocorreu um erro: ${reason.message}`
          : 'Ocorreu um erro desconhecido.'
        : `Ocorreu um erro: ${String(reason)}`;
    return o(preact2.Fragment, {
      children: [
        o('span', {
          style: 'color:red; font-weight: bold;',
          children: message,
        }),
        o('br', {}),
        o('br', {}),
        o('button', {
          onClick: () => dispatch(actions$1.obterBlocos()),
          children: 'Tentar carregar dados salvos',
        }),
        o('button', {
          onClick: () => dispatch(actions$1.excluirBD()),
          children: 'Apagar os dados locais',
        }),
      ],
    });
  }
  function Blocos$1(props) {
    const [nome, setNome] = hooks.useState('');
    const onSubmit = hooks.useCallback(
      e => {
        e.preventDefault();
        if (isNonEmptyString(nome)) props.dispatch(actions$1.criarBloco(nome));
        else props.dispatch(actions$1.erroCapturado('Nome do bloco não pode estar em branco.'));
        setNome('');
      },
      [nome]
    );
    let aviso = null;
    if (props.state.aviso) {
      aviso = o(preact2.Fragment, {
        children: [
          o('span', {
            style: 'color:red',
            children: props.state.aviso,
          }),
          o('button', {
            onClick: () => props.dispatch(actions$1.obterBlocos()),
            children: 'Recarregar dados',
          }),
        ],
      });
    }
    return o(preact2.Fragment, {
      children: [
        o('h1', {
          children: 'Blocos',
        }),
        o('ul', {
          children: props.state.blocos.map(bloco =>
            o(
              BlocoPaginaLista,
              {
                ...bloco,
                dispatch: props.dispatch,
              },
              bloco.id
            )
          ),
        }),
        o('form', {
          onSubmit,
          children: [
            o('input', {
              value: nome,
              onInput: evt => setNome(evt.currentTarget.value),
            }),
            ' ',
            o('button', {
              children: 'Criar',
            }),
          ],
        }),
        o('br', {}),
        aviso,
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
    }, [editing]);
    let displayNome = props.nome;
    let botaoRenomear = o('button', {
      onClick: onRenomearClicked,
      children: 'Renomear',
    });
    let removerAusentes = o('button', {
      onClick: () => props.dispatch(actions$1.removerProcessosAusentes(props.id)),
      children: 'Remover processos ausentes',
    });
    if (editing) {
      displayNome = o('input', {
        ref: input,
        onKeyUp,
        value: props.nome,
      });
      botaoRenomear = null;
    } else if (props.nestaPagina > 0) {
      displayNome = o('button', {
        onClick: onSelecionarProcessosClicked,
        children: props.nome,
      });
    }
    if (props.total <= props.nestaPagina) {
      removerAusentes = null;
    }
    return o('li', {
      children: [
        displayNome,
        ' (',
        createAbbr(props.nestaPagina, props.total),
        ') ',
        botaoRenomear,
        ' ',
        o('button', {
          onClick: onExcluirClicked,
          children: 'Excluir',
        }),
        ' ',
        removerAusentes,
      ],
    });
    function createAbbr(nestaPagina, total) {
      if (total === 0) return '0 processo';
      if (nestaPagina === total) return `${total} processo${total > 1 ? 's' : ''}`;
      const textoTotal = `${total} processo${total > 1 ? 's' : ''} no bloco`;
      const textoPagina = `${nestaPagina === 0 ? 'nenhum' : nestaPagina} nesta página`;
      const textoResumido = `${nestaPagina}/${total} processo${total > 1 ? 's' : ''}`;
      return o('abbr', {
        title: `${textoTotal}, ${textoPagina}.`,
        children: textoResumido,
      });
    }
    function onKeyUp(evt) {
      console.log('Key', evt.key);
      if (evt.key === 'Enter') {
        const nome = evt.currentTarget.value;
        setEditing(false);
        if (isNonEmptyString(nome)) {
          props.dispatch(actions$1.renomearBloco(props.id, nome));
        } else {
          props.dispatch(actions$1.erroCapturado('Nome do bloco não pode estar em branco.'));
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
      if (confirmed) props.dispatch(actions$1.excluirBloco(props.id));
    }
    function onSelecionarProcessosClicked() {
      props.dispatch(actions$1.selecionarProcessos(props.id));
    }
  }
  const css =
    ".menu-dark #gm-blocos,\n.menu-light #gm-blocos {\n  --accent: #41285e;\n  --bg: #494251;\n  --disabled: #5d5863;\n  --disabled-text: #ccc;\n  --shadow: #262c31;\n  --muted-accent: #453557;\n  --text: #fff;\n}\n#gm-blocos {\n  margin: 2px 3px 4px;\n  padding: 4px;\n  border-radius: 4px;\n  background: var(--bg);\n  color: var(--text);\n  box-shadow: 0 3px 3px var(--shadow);\n}\n#gm-blocos h4 {\n  margin: 3px 0;\n  font-size: 1.25rem;\n  font-weight: 300;\n}\n#gm-blocos ul {\n  list-style-type: none;\n  margin: 3px 0 7px;\n  padding: 0;\n}\n#gm-blocos li {\n  position: relative;\n  display: grid;\n  grid-template-columns: auto 1fr auto;\n  grid-gap: 5px;\n  align-items: center;\n  margin: 4px 0;\n  padding: 5px;\n  border-radius: 2px;\n}\n#gm-blocos li::before {\n  content: '';\n  position: absolute;\n  top: 2px;\n  width: 100%;\n  height: 100%;\n  border-bottom: 1px solid #888;\n  pointer-events: none;\n}\n#gm-blocos li:last-of-type::before {\n  content: none;\n}\n#gm-blocos li:hover {\n  background: var(--accent);\n}\n#gm-blocos label {\n  margin: 0;\n  font-size: 0.92rem;\n}\n#gm-blocos .placeholder span {\n  height: 1.38rem;\n  animation: pulse 1s ease-in-out infinite alternate;\n  border-radius: 4px;\n}\n#gm-blocos .placeholder span:first-of-type,\n#gm-blocos .placeholder span:last-of-type {\n  width: 1.38rem;\n}\n@keyframes pulse {\n  from {\n    background-color: var(--disabled);\n  }\n  to {\n    background-color: var(--bg);\n  }\n}\n#gm-blocos button {\n  display: block;\n  margin: 0 auto 7px;\n  padding: 2px 20px;\n  font-size: 0.86rem;\n  border: none;\n  border-radius: 3px;\n  box-shadow: 0 2px 4px var(--shadow);\n  background: var(--muted-accent);\n  color: var(--text);\n}\n#gm-blocos button:hover {\n  transition: background-color 0.1s ease-in;\n  background: var(--accent);\n}\n#gm-blocos button:disabled {\n  background: var(--disabled);\n  color: var(--disabled-text);\n  box-shadow: none;\n}\n#gm-blocos .error {\n  margin: 10px 5%;\n  padding: 4px 5%;\n  border-radius: 4px;\n  font-weight: 500;\n  background: white;\n  color: red;\n}\n";
  const actions = {
    blocosModificados:
      (blocos, { fecharJanela = false } = {}) =>
      (state, dispatch, extra) => {
        const { bc } = extra;
        bc.publish({
          type: 'Blocos',
          blocos,
        });
        if (fecharJanela) window.close();
        return actions.blocosObtidos(blocos)(state, dispatch, extra);
      },
    blocosObtidos: blocos => () => ({
      status: 'Success',
      blocos,
      inactive: false,
    }),
    carregando: () => state => {
      switch (state.status) {
        case 'Loading':
        case 'Error':
          return {
            status: 'Loading',
          };
        case 'Success':
          return {
            ...state,
            inactive: true,
            erro: void 0,
          };
      }
      return expectUnreachable();
    },
    criarBloco: nome =>
      fromThunk(async ({}, { DB }) => {
        const blocos = await DB.getBlocos();
        if (blocos.some(x => x.nome === nome))
          return actions.erroCapturado(`Já existe um bloco com o nome ${JSON.stringify(nome)}.`);
        const bloco = {
          id: Math.max(-1, ...blocos.map(x => x.id)) + 1,
          nome,
          processos: [],
        };
        return actions.blocosModificados(await DB.createBloco(bloco));
      }),
    erro: reason => () => ({
      status: 'Error',
      reason,
    }),
    erroCapturado: reason => state => {
      switch (state.status) {
        case 'Loading':
          return {
            status: 'Error',
            reason,
          };
        case 'Error':
          return state;
        case 'Success':
          return {
            ...state,
            inactive: false,
            erro: reason,
          };
      }
      return expectUnreachable();
    },
    inserir: (id, { fecharJanela = false } = {}) =>
      actions.modificarProcessos(
        id,
        (processos, numproc) => {
          processos.add(numproc);
        },
        {
          fecharJanela,
        }
      ),
    inserirEFechar: id =>
      actions.inserir(id, {
        fecharJanela: true,
      }),
    mensagemRecebida: msg => {
      switch (msg.type) {
        case 'Blocos':
          return actions.blocosObtidos(msg.blocos);
        case 'NoOp':
          return actions.noop();
      }
      expectUnreachable();
    },
    modificarProcessos: (id, fn, { fecharJanela = false } = {}) =>
      fromThunk(async (_2, { DB, numproc }) => {
        const bloco = await DB.getBloco(id);
        if (!bloco) throw new Error(`Bloco não encontrado: ${id}.`);
        const processos = new Set(bloco.processos);
        fn(processos, numproc);
        const blocos = await DB.updateBloco({
          ...bloco,
          processos: [...processos],
        });
        return actions.blocosModificados(blocos, {
          fecharJanela,
        });
      }),
    noop: () => state => state,
    obterBlocos: () =>
      fromThunk(async ({}, { DB }) => actions.blocosModificados(await DB.getBlocos())),
    remover: id =>
      actions.modificarProcessos(id, (processos, numproc) => {
        processos.delete(numproc);
      }),
  };
  const fromThunk = /* @__PURE__ */ createFromAsyncThunk(actions.carregando(), actions.erro);
  function ProcessoSelecionar(numproc) {
    const mainMenu = document.getElementById('main-menu');
    if (isNull(mainMenu)) return Left(new Error('Menu não encontrado'));
    const style = document.head.appendChild(document.createElement('style'));
    style.textContent = css;
    const div = mainMenu.insertAdjacentElement('beforebegin', document.createElement('div'));
    div.id = 'gm-blocos';
    preact2.render(
      o(Main, {
        numproc,
      }),
      div
    );
    return Right(void 0);
  }
  function Main(props) {
    const extra = hooks.useMemo(() => {
      const DB = Database,
        bc = createBroadcastService('gm-blocos', isBroadcastMessage),
        { numproc } = props;
      return {
        DB,
        bc,
        numproc,
      };
    }, []);
    const [state, dispatch] = hooks.useReducer(
      (state2, action) => action(state2, dispatch, extra),
      {
        status: 'Loading',
      }
    );
    hooks.useLayoutEffect(() => {
      extra.bc.subscribe(msg => dispatch(actions.mensagemRecebida(msg)));
      dispatch(actions.obterBlocos());
    }, []);
    switch (state.status) {
      case 'Loading':
        return o(Placeholder, {});
      case 'Error':
        return o(ShowError, {
          dispatch,
          reason: state.reason,
        });
      case 'Success':
        return o(Blocos, {
          blocos: state.blocos.map(({ processos, ...rest }) => ({
            ...rest,
            inserido: processos.includes(props.numproc),
          })),
          dispatch,
          disabled: state.inactive,
          erro: state.erro,
        });
    }
    return expectUnreachable();
  }
  function ShowError({ dispatch, reason }) {
    const message =
      typeof reason === 'object' && reason !== null && reason instanceof Error
        ? reason.message
          ? `Ocorreu um erro: ${reason.message}`
          : 'Ocorreu um erro desconhecido.'
        : `Ocorreu um erro: ${String(reason)}`;
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
          onClick: () => dispatch(actions.obterBlocos()),
          children: 'Recarregar',
        }),
      ],
    });
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
                dispatch: props.dispatch,
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
        props.dispatch(actions.criarBloco(nome));
      }
    }
  }
  function BlocoPaginaProcesso(props) {
    const onChange = hooks.useCallback(
      evt => {
        if (evt.currentTarget.checked) {
          props.dispatch(actions.inserir(props.id));
        } else {
          props.dispatch(actions.remover(props.id));
        }
      },
      [props.dispatch]
    );
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
                  onClick: () => props.dispatch(actions.inserirEFechar(props.id)),
                  disabled: props.disabled,
                }),
              ],
            }),
      ],
    });
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
