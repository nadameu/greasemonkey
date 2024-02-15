// ==UserScript==
// @name         seeu-movimentacoes
// @name:pt-BR   SEEU - Movimentações
// @namespace    nadameu.com.br
// @version      2.5.0
// @author       nadameu
// @description  Melhoria na apresentação das movimentações do processo
// @match        https://seeu.pje.jus.br/*
// @grant        GM_addStyle
// @grant        GM_deleteValue
// @grant        GM_getValue
// @grant        GM_info
// @grant        GM_setValue
// ==/UserScript==

(t => {
  if (typeof GM_addStyle == 'function') {
    GM_addStyle(t);
    return;
  }
  const o = document.createElement('style');
  (o.textContent = t), document.head.append(o);
})(
  ' ._dica_25o7b_1{position:absolute;border:1px solid #408;background:hsl(66,25%,93%);max-width:25%}td a._struck_25o7b_8{cursor:not-allowed}td a._struck_25o7b_8,td a._struck_25o7b_8:hover{text-decoration:line-through}._avisoCarregando_25o7b_15{font-size:1.2em;font-style:italic}._divConfigurarAbertura_25o7b_20{text-align:right;--cor-secundaria: hsl(333, 20%, 35%)}html #container .extendedinfo td a.link{padding:0 1px!important;border:1px solid transparent}html #container .extendedinfo td a.link._ultimoClicado_25o7b_29{background:hsl(333,35%,91%)!important;border:1px dotted hsl(333,75%,8%)} '
);

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
  var __publicField = (obj, key, value) => {
    __defNormalProp(obj, typeof key !== 'symbol' ? key + '' : key, value);
    return value;
  };
  const concat = (l, r) => l.concat(r);
  const semigroupArray = { concat };
  const tag = _type => _tag => props => Object.assign(props, { _type, _tag });
  const isTagged = _tag => obj => obj._tag === _tag;
  const tagMaybe = /* @__PURE__ */ tag('Maybe');
  const Just = value => tagMaybe('Just')({ value });
  const isJust = /* @__PURE__ */ isTagged('Just');
  const Nothing = /* @__PURE__ */ tagMaybe('Nothing')({});
  const isNothing = /* @__PURE__ */ isTagged('Nothing');
  const tagEither = /* @__PURE__ */ tag('Either');
  const Left = left => tagEither('Left')({ left });
  const isLeft = /* @__PURE__ */ isTagged('Left');
  const Right = right => tagEither('Right')({ right });
  const isRight = /* @__PURE__ */ isTagged('Right');
  const deriveMap = M => f => M.flatMap(x => M.of(f(x)));
  const deriveAp = M => fa => ff =>
    M.flatMap(f => M.flatMap(a => M.of(f(a)))(fa))(ff);
  const deriveLift2 = M => f => (fa, fb) =>
    M.ap(fb)(M.map(a => b => f(a, b))(fa));
  const of$1 = Right;
  const match = (f, g) => fa => (isLeft(fa) ? f(fa.left) : g(fa.right));
  const flatMapBoth = match;
  const flatMap$1 = f => fa => (isRight(fa) ? f(fa.right) : fa);
  const mapBoth = (f, g) =>
    flatMapBoth(
      e => Left(f(e)),
      a => Right(g(a))
    );
  const map$2 = /* @__PURE__ */ deriveMap({ of: of$1, flatMap: flatMap$1 });
  const ap = /* @__PURE__ */ deriveAp({ of: of$1, flatMap: flatMap$1 });
  const mapLeft = f => fa => (isLeft(fa) ? Left(f(fa.left)) : fa);
  const eitherBool = pred => a => (pred(a) ? Right(a) : Left(a));
  const merge = fa => (isLeft(fa) ? fa.left : fa.right);
  const orElse$1 = f => fa => (isRight(fa) ? fa : f(fa.left));
  const applicativeEither = { ap, map: map$2, of: of$1 };
  const flatMap = f => fa => (isNothing(fa) ? Nothing : f(fa.value));
  const of = Just;
  const map$1 = /* @__PURE__ */ deriveMap({ of, flatMap });
  const orElse = ifNothing => fa => (isNothing(fa) ? ifNothing() : fa);
  const fromNullable = value => (value == null ? Nothing : Just(value));
  const mapNullable = f => flatMap(x => fromNullable(f(x)));
  const getOrElse = getDefault => fa =>
    isNothing(fa) ? getDefault() : fa.value;
  const maybeBool = pred => a => (pred(a) ? Just(a) : Nothing);
  const filter$1 = pred => flatMap(maybeBool(pred));
  const toEither = whenLeft => fb =>
    isNothing(fb) ? Left(whenLeft()) : Right(fb.value);
  const query = selector => parentNode =>
    fromNullable(parentNode.querySelector(selector));
  const queryAll = selector => parentNode =>
    parentNode.querySelectorAll(selector);
  const text = node => fromNullable(node.textContent);
  const identity = x => x;
  const tailRec = (seed, f) => {
    let result = f(seed);
    while (isLeft(result)) result = f(result.left);
    return result.right;
  };
  const constant = a => _ => a;
  const tagList = /* @__PURE__ */ tag('List');
  const Cons = (head, tail) => tagList('Cons')({ head, tail });
  const Nil = /* @__PURE__ */ tagList('Nil')({});
  const isNil = /* @__PURE__ */ isTagged('Nil');
  class Concat {
    constructor(left, right) {
      __publicField(this, 'length');
      this.left = left;
      this.right = right;
      this.length = left.length + right.length;
    }
    *[Symbol.iterator]() {
      let left = this.left;
      let rights = Cons(this.right, Nil);
      while (true) {
        while (left instanceof Concat) {
          rights = Cons(left.right, rights);
          left = left.left;
        }
        yield* left;
        if (isNil(rights)) return;
        left = rights.head;
        rights = rights.tail;
      }
    }
  }
  const fromGen =
    gen =>
    (...args) => [...gen(...args)];
  const empty = () => [];
  const append = (xs, x) => (xs.length === 0 ? [x] : new Concat(xs, [x]));
  const map = f =>
    fromGen(function* (fa, i = 0) {
      for (const a of fa) yield f(a, i++);
    });
  const foldLeft = (seed, f) => fa => {
    let acc = seed,
      i = 0;
    for (const a of fa) acc = f(acc, a, i++);
    return acc;
  };
  const foldMap = M => f =>
    foldLeft(M.empty(), (bs, a, i) => M.concat(bs, f(a, i)));
  const fold = M => foldMap(M)(identity);
  const traverse = M => f => fa => {
    const lifted = deriveLift2(M)(append);
    return M.map(xs => [...xs])(
      foldLeft(M.of(empty()), (ftb, a, i) => lifted(ftb, f(a, i)))(fa)
    );
  };
  const sequence$1 = M => traverse(M)(identity);
  const filterMap = f =>
    fromGen(function* (fa, i = 0) {
      for (const a of fa) {
        const maybe = f(a, i++);
        if (isJust(maybe)) yield maybe.value;
      }
    });
  const filter = pred => filterMap((a, i) => (pred(a, i) ? Just(a) : Nothing));
  const toNonEmptyArray = seq => (seq.length === 0 ? Nothing : Just([...seq]));
  const monoidString = {
    empty: () => '',
    concat: (l, r) => `${l}${r}`,
  };
  const tuple = (...values) => values;
  const sequence = sequence$1;
  const makeApplicativeValidation = M => ({
    map: map$2,
    of: of$1,
    ap: fa => ff =>
      isLeft(ff)
        ? isLeft(fa)
          ? Left(M.concat(ff.left, fa.left))
          : ff
        : isLeft(fa)
        ? fa
        : Right(ff.right(fa.right)),
  });
  function pipe(x) {
    let y = x;
    for (let i = 1, len = arguments.length; i < len; i += 1) {
      y = arguments[i](y);
    }
    return y;
  }
  var _GM_addStyle = /* @__PURE__ */ (() =>
    typeof GM_addStyle != 'undefined' ? GM_addStyle : void 0)();
  var _GM_deleteValue = /* @__PURE__ */ (() =>
    typeof GM_deleteValue != 'undefined' ? GM_deleteValue : void 0)();
  var _GM_getValue = /* @__PURE__ */ (() =>
    typeof GM_getValue != 'undefined' ? GM_getValue : void 0)();
  var _GM_info = /* @__PURE__ */ (() =>
    typeof GM_info != 'undefined' ? GM_info : void 0)();
  var _GM_setValue = /* @__PURE__ */ (() =>
    typeof GM_setValue != 'undefined' ? GM_setValue : void 0)();
  function h(tag2, props = null, ...children) {
    const element = document.createElement(tag2);
    for (const [key, value] of Object.entries(props ?? {})) {
      element[key] = value;
    }
    element.append(...children);
    return element;
  }
  function isOfType(typeRepresentation) {
    return value => typeof value === typeRepresentation;
  }
  const isOfTypeObject = /* @__PURE__ */ isOfType('object');
  const isInstanceOf = Constructor => obj => obj instanceof Constructor;
  function isLiteral(literal) {
    return value => value === literal;
  }
  const isNull = /* @__PURE__ */ isLiteral(null);
  function negate(predicate) {
    return value => !predicate(value);
  }
  const isNotNull = /* @__PURE__ */ negate(isNull);
  function refine(...predicates) {
    return value => predicates.every(p2 => p2(value));
  }
  const isObject = /* @__PURE__ */ refine(isOfTypeObject, isNotNull);
  const isInteger = x => Number.isInteger(x);
  const isNonNegativeInteger = /* @__PURE__ */ refine(isInteger, x => x > -1);
  function isAnyOf(...predicates) {
    return value => predicates.some(p2 => p2(value));
  }
  const isArray = x => Array.isArray(x);
  function hasShape(predicates) {
    return refine(isObject, obj =>
      Object.entries(predicates).every(([key, predicate]) =>
        key in obj ? predicate(obj[key]) : predicate.optional === true
      )
    );
  }
  const isTuple = (...predicates) =>
    refine(isArray, xs => {
      if (xs.length !== predicates.length) return false;
      for (let i = 0; i < predicates.length; i += 1) {
        if (!predicates[i](xs[i])) return false;
      }
      return true;
    });
  const createObserver = nativeObserver => {
    const callbacks = /* @__PURE__ */ new Map();
    const obs = nativeObserver(callbacks);
    return {
      observe(key, callback) {
        if (!callbacks.has(key)) {
          callbacks.set(key, /* @__PURE__ */ new Set());
        }
        callbacks.get(key).add(callback);
        obs.observe(key);
        return {
          unobserve() {
            var _a, _b;
            (_a = callbacks.get(key)) == null ? void 0 : _a.delete(callback);
            if (
              ((_b = callbacks.get(key)) == null ? void 0 : _b.size) ??
              true
            ) {
              callbacks.delete(key);
              if (callbacks.size === 0) {
                obs.disconnect();
              }
            }
          },
        };
      },
    };
  };
  const createIntersectionObserver = () =>
    createObserver(
      callbacks =>
        new IntersectionObserver(entries => {
          for (const entry of entries) {
            if (entry.isIntersecting && callbacks.has(entry.target)) {
              for (const callback of callbacks.get(entry.target)) {
                callback();
              }
            }
          }
        })
    );
  const createMutationObserver = () =>
    createObserver(callbacks => {
      const mut = new MutationObserver(records => {
        for (const record of records) {
          if (callbacks.has(record.target)) {
            for (const callback of callbacks.get(record.target)) {
              for (const node of record.addedNodes) {
                callback(node);
              }
            }
          }
        }
      });
      return {
        disconnect() {
          mut.disconnect();
        },
        observe(key) {
          mut.observe(key, { childList: true, subtree: true });
        },
      };
    });
  function createFiniteStateMachine(
    initialState,
    transitions,
    onInvalidTransition
  ) {
    let state = initialState;
    let subscribers = [];
    return { getState, dispatch, subscribe };
    function getState() {
      return state;
    }
    function dispatch(action) {
      const transition = transitions[state.status][action.type];
      if (transition) {
        state = transition(action, state);
      } else {
        state = onInvalidTransition(state, action);
      }
      for (const subscriber of subscribers) {
        subscriber(state);
      }
    }
    function subscribe(subscriber) {
      subscribers.push(subscriber);
      subscriber(state);
      return {
        unsubscribe() {
          subscribers = subscribers.filter(s => s !== subscriber);
        },
      };
    }
  }
  const TIPO_ABERTURA = 'tipo_abertura';
  const PARAMETROS_JANELA = 'parametros_janela';
  const FECHAR_AUTOMATICAMENTE = 'fechar_automaticamente';
  const NOME_JANELA = `gm-${_GM_info}__configurar-abertura`;
  const Action = {
    OPCAO_SELECIONADA: opcao => ({
      type: 'OPCAO_SELECIONADA',
      opcao,
    }),
    SALVAR: { type: 'SALVAR' },
  };
  function configurarAbertura() {
    const antiga = window.open('about:blank', NOME_JANELA);
    antiga == null ? void 0 : antiga.close();
    const win = window.open(
      'about:blank',
      NOME_JANELA,
      'top=0,left=0,width=800,height=450'
    );
    if (!win) {
      window.alert(
        [
          'Ocorreu um erro ao tentar configurar a abertura de documentos.',
          'Verifique se há permissão para abertura de janelas "pop-up".',
        ].join('\n')
      );
      return;
    }
    aoAbrirJanelaExecutar(win, () => onJanelaAberta(win));
  }
  function onJanelaAberta(win) {
    const fsm = createFiniteStateMachine(
      {
        status: 'INICIO',
        current: _GM_getValue(TIPO_ABERTURA, 'padrao'),
      },
      {
        INICIO: {
          OPCAO_SELECIONADA({ opcao }) {
            return { status: 'INICIO', current: opcao };
          },
          SALVAR(_, state) {
            if (state.current === 'padrao') return { status: 'SALVO_PADRAO' };
            return {
              status: 'JANELA_POSICAO',
            };
          },
        },
        SALVO_PADRAO: {},
        JANELA_POSICAO: {
          SALVAR() {
            return {
              status: 'JANELA_CONFIRMAR',
              posicao: {
                top: win.screenY,
                left: win.screenX,
                width: win.innerWidth,
                height: win.innerHeight,
              },
            };
          },
        },
        JANELA_CONFIRMAR: {
          SALVAR(_, { posicao }) {
            return { status: 'SALVO_JANELA', posicao };
          },
        },
        SALVO_JANELA: {},
      },
      state => state
    );
    win.document.title = 'Configurar abertura de documentos';
    const inputPadrao = h('input', {
      type: 'radio',
      name: 'tipo',
      value: 'padrao',
      checked: (state =>
        state.status === 'INICIO' && state.current === 'padrao')(
        fsm.getState()
      ),
      onclick: () => fsm.dispatch(Action.OPCAO_SELECIONADA('padrao')),
    });
    const inputJanela = h('input', {
      type: 'radio',
      name: 'tipo',
      value: 'janela',
      checked: (state =>
        state.status !== 'INICIO' || state.current === 'janela')(
        fsm.getState()
      ),
      onclick: () => fsm.dispatch(Action.OPCAO_SELECIONADA('janela')),
    });
    const botaoCancelar = h(
      'button',
      {
        type: 'button',
        onclick: () => win.close(),
      },
      'Cancelar'
    );
    const botaoSalvar = h('button', { type: 'button' });
    botaoSalvar.addEventListener('click', () => fsm.dispatch(Action.SALVAR));
    const div = h(
      'div',
      {},
      p('Selecione a forma de abertura de documentos:'),
      p(h('label', {}, inputPadrao, ' ', 'Padrão do SEEU (abrir em abas)')),
      p(h('label', {}, inputJanela, ' ', 'Abrir em janelas separadas'))
    );
    win.document.body.append(
      h('h1', {}, 'Configurar abertura de documentos'),
      div,
      p(botaoCancelar, ' ', botaoSalvar)
    );
    fsm.subscribe(() => {
      const estado = fsm.getState();
      switch (estado.status) {
        case 'INICIO': {
          if (estado.current === 'padrao') {
            botaoSalvar.textContent = 'Salvar';
          } else {
            botaoSalvar.textContent = 'Próximo >';
          }
          break;
        }
        case 'SALVO_PADRAO': {
          _GM_setValue(TIPO_ABERTURA, 'padrao');
          _GM_deleteValue(PARAMETROS_JANELA);
          win.close();
          break;
        }
        case 'JANELA_POSICAO': {
          div.textContent = '';
          div.append(
            p(
              'Mova esta janela para o local em que deseja que os documentos sejam abertos.'
            ),
            p('Depois, clique no botão "Próximo >".')
          );
          break;
        }
        case 'JANELA_CONFIRMAR': {
          const frag = document.createDocumentFragment();
          frag.append(...win.document.body.childNodes);
          win.close();
          const parametros = Object.entries(estado.posicao)
            .map(([key, value]) => `${key}=${value}`)
            .join(',');
          try {
            const newWin = win.open(
              'about:blank',
              `${NOME_JANELA}_2`,
              parametros
            );
            if (!newWin) throw new Error('Não foi possível abrir a janela.');
            win = newWin;
          } catch (e) {
            window.alert(
              [
                'Ocorreu um erro ao tentar configurar a abertura de documentos.',
                'Verifique se há permissão para abertura de janelas "pop-up".',
              ].join('\n')
            );
            return;
          }
          aoAbrirJanelaExecutar(win, () => {
            win.document.title = 'Configurar abertura de documentos';
            win.document.body.append(frag);
            div.textContent = '';
            botaoSalvar.textContent = 'Salvar';
            div.append(
              p('Esta janela foi aberta no local correto?'),
              p('Em caso positivo, clique em "Salvar".'),
              p('Do contrário, clique em "Cancelar" e configure novamente.'),
              p(
                'Obs.: alguns navegadores não permitem a abertura de janelas em ',
                'monitor diverso daquele em que se encontra a janela principal.'
              )
            );
          });
          break;
        }
        case 'SALVO_JANELA': {
          _GM_setValue(TIPO_ABERTURA, 'janela');
          _GM_setValue(PARAMETROS_JANELA, estado.posicao);
          win.close();
          break;
        }
      }
    });
  }
  function p(...children) {
    return h('p', {}, ...children);
  }
  function aoAbrirJanelaExecutar(win, callback) {
    if (win.document.readyState === 'complete') {
      callback();
    } else {
      win.addEventListener('load', () => callback());
    }
  }
  const css$1 =
    'table.resultTable>tbody>tr{--cor-pessoa: #444}div>table.resultTable>tbody>tr>td:nth-last-child(3){background:linear-gradient(to bottom right,var(--cor-pessoa) 50%,transparent 50%) top left/12px 12px no-repeat}table.resultTable>tbody>tr[id*=",JUIZ,"]{--cor-pessoa: #698e23}table.resultTable>tbody>tr[id*=",JUIZ,"]>td:nth-last-child(3){border:1px solid var(--cor-pessoa)}table.resultTable>tbody>tr[id*=",SERVIDOR,"]{--cor-pessoa: #698e23}table.resultTable>tbody>tr[id*=",PROMOTOR,"]{--cor-pessoa: #236e8e}table.resultTable>tbody>tr[id*=",ADVOGADO,"]{--cor-pessoa: #8e3523}table.resultTable>tbody>tr[id*=",OUTROS,"]{--cor-pessoa: #595959}table.resultTable thead>tr>th{padding:0 5px}table.resultTable tr div.extendedinfo{border:none;margin:0;width:auto}table.resultTable table.form{margin:0 0 4px;width:calc(100% - 4px);border-collapse:collapse;border:1px solid}table.resultTable table.form td{width:auto;padding:0;vertical-align:top!important}table.resultTable table.form td:nth-child(1){width:36px;text-align:center;padding-left:6px;padding-right:2px}table.resultTable table.form td:nth-child(2){width:16px;text-align:center;padding:5px 0 4px}table.resultTable table.form td:nth-child(3){width:89%}table.resultTable table.form td:nth-child(4){width:16px}table.resultTable table.form tr.odd{background:hsl(333,34.8%,91%)}table.resultTable table.form tr.even,table.resultTable table.form tr.incidente{background:hsl(333,33.3%,97.1%)}table.resultTable table.form .ajaxCalloutGenericoHelp{display:inline;margin-right:4px}\n';
  const dica$1 = '_dica_25o7b_1';
  const struck = '_struck_25o7b_8';
  const avisoCarregando = '_avisoCarregando_25o7b_15';
  const divConfigurarAbertura = '_divConfigurarAbertura_25o7b_20';
  const ultimoClicado = '_ultimoClicado_25o7b_29';
  const classNames = {
    dica: dica$1,
    struck,
    avisoCarregando,
    divConfigurarAbertura,
    ultimoClicado,
  };
  let dica = null;
  function criarDica() {
    const dica2 = document.createElement('div');
    dica2.hidden = true;
    dica2.className = classNames.dica;
    document.body.appendChild(dica2);
    return dica2;
  }
  function mostrarDica(html) {
    if (!dica) {
      dica = criarDica();
    }
    dica.innerHTML = html;
    dica.hidden = false;
  }
  const distanciaDoMouse = 16;
  const margemBorda = 2 * distanciaDoMouse;
  const intervalMs = 16;
  let lastTime = Date.now();
  let lastE;
  let timer = null;
  function moverDica(e) {
    lastE = e;
    const curTime = Date.now();
    if (curTime < lastTime + intervalMs) {
      if (timer === null) {
        timer = window.setTimeout(() => {
          timer = null;
          moverDica(lastE);
        }, intervalMs);
      }
      return;
    }
    lastTime = curTime;
    let x = e.clientX;
    let y = e.clientY;
    const { width, height } = dica.getBoundingClientRect();
    const { width: docWidth, height: docHeight } =
      document.documentElement.getBoundingClientRect();
    if (x + distanciaDoMouse + width > docWidth - margemBorda) {
      x -= distanciaDoMouse + width - window.scrollX;
    } else {
      x += distanciaDoMouse + window.scrollX;
    }
    if (y + distanciaDoMouse + height > docHeight - margemBorda) {
      y -= distanciaDoMouse + height - window.scrollY;
    } else {
      y += distanciaDoMouse + window.scrollY;
    }
    dica.style.left = `${x}px`;
    dica.style.top = `${y}px`;
  }
  function esconderDica() {
    dica.hidden = true;
  }
  const telaMovimentacoes = url =>
    pipe(
      url.pathname,
      maybeBool(x =>
        [
          '/seeu/visualizacaoProcesso.do',
          '/seeu/processo.do',
          '/seeu/processo/buscaProcesso.do',
        ].includes(x)
      ),
      flatMap(() =>
        pipe(
          document,
          query('li[name="tabMovimentacoesProcesso"].currentTab'),
          map$1(() => {
            return pipe(
              document,
              queryAll('img[id^=iconmovimentacoes]'),
              map((link, i) =>
                pipe(
                  link.closest('tr'),
                  fromNullable,
                  mapNullable(x => x.nextElementSibling),
                  filter$1(x => x.matches('tr')),
                  flatMap(query('.extendedinfo')),
                  map$1(mutationTarget => ({ link, mutationTarget })),
                  toEither(() => `Lista de eventos não reconhecida: ${i}.`)
                )
              ),
              sequence$1(applicativeEither),
              map$2(links => {
                const obs = createIntersectionObserver();
                const mut = createMutationObserver();
                for (const { link, mutationTarget } of links) {
                  const aviso = h(
                    'div',
                    { className: classNames.avisoCarregando },
                    'Carregando lista de documentos...'
                  );
                  mut.observe(mutationTarget, node => {
                    if (!(node instanceof HTMLTableElement)) return;
                    if (link.src.match(/iPlus/)) {
                      node.style.display = 'none';
                      return;
                    }
                    if (aviso.parentNode) {
                      aviso.remove();
                    }
                    pipe(
                      onTabelaAdicionada(node),
                      mapLeft(err => {
                        console.log(
                          '<SEEU - Movimentações>',
                          'Erro encontrado:',
                          err
                        );
                      }),
                      merge
                    );
                  });
                  const { unobserve } = obs.observe(link, () => {
                    unobserve();
                    link.click();
                  });
                  link.addEventListener('click', () => {
                    if (link.src.match(/iPlus/)) {
                      if (aviso.parentNode) {
                        aviso.remove();
                      }
                      const tabela = mutationTarget.querySelector('table');
                      if (tabela) {
                        tabela.style.display = 'none';
                      }
                    } else {
                      mutationTarget.parentNode.insertBefore(
                        aviso,
                        mutationTarget
                      );
                    }
                  });
                }
                const janelasAbertas = /* @__PURE__ */ new Map();
                const { exibirBotaoFechar } =
                  criarBotaoJanelasAbertas(janelasAbertas);
                const onDocumentClick = createOnDocumentClick({
                  janelasAbertas,
                  exibirBotaoFechar,
                });
                document.addEventListener('click', onDocumentClick);
                window.addEventListener('beforeunload', () => {
                  if (_GM_getValue(FECHAR_AUTOMATICAMENTE, true)) {
                    for (const win of janelasAbertas.values()) {
                      if (!win.closed) win.close();
                    }
                  }
                });
                let currentDica = null;
                document.addEventListener('mouseover', e => {
                  if (
                    e.target instanceof HTMLElement &&
                    e.target.matches('[data-gm-dica]')
                  ) {
                    currentDica = e.target;
                    mostrarDica(currentDica.dataset.gmDica);
                    currentDica.addEventListener('mousemove', moverDica);
                  }
                });
                document.addEventListener('mouseout', e => {
                  if (currentDica && e.target === currentDica) {
                    currentDica.removeEventListener('mousemove', moverDica);
                    esconderDica();
                    currentDica = null;
                  }
                });
                pipe(
                  document,
                  queryAll('table.resultTable > tbody > tr'),
                  map(row => {
                    if (row.cells.length === 1) {
                      const previousRow = row.previousElementSibling;
                      if (previousRow instanceof HTMLTableRowElement) {
                        row.insertCell(0).colSpan =
                          previousRow.cells.length - 1;
                        row.cells[1].colSpan = 1;
                      }
                    } else {
                      const len = row.cells.length;
                      const colunaDataHora = len - 3;
                      pipe(
                        row.cells,
                        map((cell, i) => {
                          if (i !== colunaDataHora) {
                            cell.removeAttribute('nowrap');
                          }
                        })
                      );
                      row.insertCell();
                    }
                  })
                );
                pipe(
                  document,
                  query('table.resultTable > colgroup'),
                  map$1(g => {
                    g.appendChild(h('col'));
                    return g;
                  }),
                  map$1(g => {
                    pipe(g.children, cols => {
                      pipe(
                        cols,
                        filter(isInstanceOf(HTMLElement)),
                        map((col, i) => {
                          col.removeAttribute('width');
                          switch (i) {
                            case cols.length - 3:
                              col.style.width = '40%';
                              break;
                            case cols.length - 2:
                              col.style.width = '15%';
                              break;
                            case cols.length - 1:
                              col.style.width = '30%';
                              break;
                          }
                        })
                      );
                    });
                  })
                );
                pipe(
                  document,
                  query('table.resultTable'),
                  map$1(tabela => {
                    const configurar = h(
                      'button',
                      { type: 'button' },
                      'Configurar abertura de documentos'
                    );
                    configurar.addEventListener('click', e => {
                      e.preventDefault();
                      configurarAbertura();
                    });
                    const fechar = h('input', {
                      type: 'checkbox',
                      checked: _GM_getValue(FECHAR_AUTOMATICAMENTE, true),
                    });
                    fechar.addEventListener('click', () => {
                      _GM_setValue(FECHAR_AUTOMATICAMENTE, fechar.checked);
                    });
                    tabela.insertAdjacentElement(
                      'beforebegin',
                      h(
                        'div',
                        { className: classNames.divConfigurarAbertura },
                        configurar,
                        h('br'),
                        h(
                          'label',
                          {},
                          fechar,
                          ' ',
                          'Fechar automaticamente documentos abertos ao sair'
                        )
                      )
                    );
                    return tabela;
                  }),
                  flatMap(query(':scope > thead > tr')),
                  map$1(row => {
                    const th = h('th', {}, 'Documentos');
                    row.appendChild(th);
                    for (const th2 of row.cells) {
                      th2.removeAttribute('style');
                    }
                  })
                );
              })
            );
          }),
          orElse(() => Just(of$1(void 0))),
          map$1(either => {
            _GM_addStyle(css$1);
            return either;
          })
        )
      )
    );
  function createOnDocumentClick({ janelasAbertas, exibirBotaoFechar }) {
    return function onDocumentClick(evt) {
      if (
        evt.target instanceof HTMLElement &&
        evt.target.matches('a[href][data-gm-doc-link]')
      ) {
        evt.preventDefault();
        const link = evt.target;
        pipe(
          document,
          queryAll(`.${classNames.ultimoClicado}`),
          map(x => x.classList.remove(classNames.ultimoClicado))
        );
        link.classList.add(classNames.ultimoClicado);
        exibirBotaoFechar();
        const id = link.dataset.gmDocLink;
        if (janelasAbertas.has(id)) {
          const win2 = janelasAbertas.get(id);
          if (!win2.closed) {
            win2.focus();
            return;
          }
        }
        const features =
          (() => {
            const tipo = _GM_getValue(TIPO_ABERTURA);
            if (isAnyOf(isLiteral('padrao'), isLiteral('janela'))(tipo)) {
              if (tipo === 'padrao') return null;
              const parametros = _GM_getValue(PARAMETROS_JANELA);
              if (
                hasShape({
                  top: isInteger,
                  left: isInteger,
                  width: isNonNegativeInteger,
                  height: isNonNegativeInteger,
                })(parametros)
              ) {
                return Object.entries(parametros)
                  .map(([key, value]) => `${key}=${value}`)
                  .join(',');
              }
            }
            _GM_setValue(TIPO_ABERTURA, 'padrao');
            _GM_deleteValue(PARAMETROS_JANELA);
            return null;
          })() ?? void 0;
        const win = window.open(link.href, `doc${id}`, features);
        janelasAbertas.set(id, win);
      }
    };
  }
  function criarBotaoJanelasAbertas(janelasAbertas) {
    var _a;
    const menu =
      (_a = window.parent) == null
        ? void 0
        : _a.document.querySelector('ul#main-menu');
    if (!menu) {
      console.log('Não encontrado.');
      return {
        exibirBotaoFechar() {},
      };
    }
    const doc = menu.ownerDocument;
    const fechar = doc.createElement('li');
    fechar.className = 'gm-seeu-movimentacoes__fechar-janelas-abertas';
    fechar.style.display = 'none';
    const link = doc.createElement('a');
    link.href = '#';
    link.textContent = 'Fechar janelas abertas';
    link.addEventListener('click', onClick);
    fechar.appendChild(link);
    menu.appendChild(fechar);
    window.addEventListener('beforeunload', () => {
      link.removeEventListener('click', onClick);
      menu.removeChild(fechar);
    });
    return {
      exibirBotaoFechar() {
        fechar.style.display = '';
      },
    };
    function onClick(evt) {
      evt.preventDefault();
      for (const janela of janelasAbertas.values()) {
        if (!janela.closed) {
          janela.close();
        }
      }
      janelasAbertas.clear();
      fechar.style.display = 'none';
    }
  }
  const onTabelaAdicionada = table =>
    pipe(
      table.rows,
      traverse(applicativeEither)((linha, l) => {
        if (linha.cells.length !== 7) {
          if (
            linha.classList.contains('linhaPeticao') &&
            linha.cells.length === 1 &&
            linha.cells[0].colSpan === 7
          ) {
            const frag = document.createDocumentFragment();
            frag.append(...linha.cells[0].childNodes);
            return Right([frag]);
          }
          return Left(`Formato de linha desconhecido: ${l}.`);
        }
        const sequencialNome = pipe(
          linha.cells[0],
          x => x.childNodes,
          filter(x => {
            var _a;
            return (
              !(x instanceof Text) ||
              ((_a = x.nodeValue) == null ? void 0 : _a.trim()) !== ''
            );
          }),
          maybeBool(
            isAnyOf(
              isTuple(isInstanceOf(Text)),
              isTuple(
                isInstanceOf(Text),
                isInstanceOf(HTMLAnchorElement),
                isInstanceOf(HTMLElement)
              )
            )
          ),
          map$1(([texto, ...obs]) =>
            tuple(texto, obs.length === 2 ? Just(obs) : Nothing)
          ),
          flatMap(([texto, observacao]) =>
            pipe(
              texto,
              x => x.nodeValue,
              x =>
                fromNullable(x.match(/^\s*(\d+\.\d+)\s+Arquivo:\s+(.*)\s*$/)),
              filter$1(x => x.length === 3),
              map$1(([, sequencial, nome]) => ({
                sequencial,
                nome: nome || 'Outros',
                observacao,
              }))
            )
          ),
          toEither(() => `Sequencial e nome não reconhecidos: ${l}.`)
        );
        const assinatura = pipe(
          linha.cells[2],
          text,
          mapNullable(x => x.match(/^\s*Ass\.:\s+(.*)\s*$/)),
          filter$1(x => x.length === 2),
          map$1(([, assinatura2]) => ({ assinatura: assinatura2 })),
          toEither(() => `Assinatura não reconhecida: ${l}.`)
        );
        const link = pipe(linha.cells[4], celula =>
          pipe(
            celula,
            c => c.childNodes,
            filter(
              x => !(x instanceof Text && /^\s*$/.test(x.nodeValue ?? ''))
            ),
            eitherBool(
              isAnyOf(
                isTuple(
                  isInstanceOf(HTMLImageElement),
                  isInstanceOf(HTMLDivElement),
                  isInstanceOf(HTMLAnchorElement)
                ),
                isTuple(
                  isInstanceOf(HTMLImageElement),
                  isInstanceOf(HTMLDivElement),
                  isInstanceOf(HTMLAnchorElement),
                  isInstanceOf(HTMLAnchorElement)
                )
              )
            ),
            map$2(childNodes => {
              const [menu, popup, link2, play] = childNodes;
              return { menu, popup, link: link2, play };
            }),
            orElse$1(() =>
              pipe(
                celula,
                query('strike'),
                flatMap(query('a[href]')),
                map$1(link2 => {
                  link2.classList.add(classNames.struck);
                  return link2;
                }),
                map$1(link2 => ({
                  menu: '',
                  popup: '',
                  link: link2,
                  play: void 0,
                })),
                toEither(() => null)
              )
            ),
            mapLeft(() => `Link para documento não reconhecido: ${l}.`)
          )
        );
        const sigilo = pipe(
          linha.cells[6],
          text,
          map$1(x => x.trim()),
          filter$1(x => x !== ''),
          map$1(sigilo2 => ({ sigilo: sigilo2 })),
          toEither(() => `Nível de sigilo não reconhecido: ${l}.`)
        );
        const result = pipe(
          tuple(sequencialNome, assinatura, link, sigilo),
          sequence(applicativeEither),
          map$2(
            ([
              { sequencial, nome, observacao },
              { assinatura: assinatura2 },
              { menu, popup, link: link2, play },
              { sigilo: sigilo2 },
            ]) => {
              var _a;
              link2.title = `${
                ((_a = link2.title) == null ? void 0 : _a.trim()) ?? ''
              }

Ass.: ${assinatura2}

${sigilo2}`;
              const frag = document.createDocumentFragment();
              frag.append(menu, popup);
              pipe(
                link2.href,
                href => new URL(href),
                u => fromNullable(u.searchParams.get('_tj')),
                map$1(getId),
                map$1(id => {
                  link2.dataset.gmDocLink = id.toString(36);
                })
              );
              const file = document.createDocumentFragment();
              const span = h('span', {}, nome.replace(/_/g, ' '));
              span.style.fontWeight = 'bold';
              file.append(span, h('br'));
              if (play) {
                file.append(play);
              }
              link2.textContent = link2.textContent.trim();
              file.append(link2);
              if (isJust(observacao)) {
                file.append(h('br'), ...observacao.value);
              }
              const cadeado =
                sigilo2 === 'Público'
                  ? ''
                  : h('i', { className: 'icon icon-mdi:lock', title: sigilo2 });
              return [sequencial, frag, file, cadeado];
            }
          )
        );
        return result;
      }),
      map$2(linhas => {
        table.replaceChildren(
          ...pipe(
            linhas,
            map((linha, r) =>
              foldLeft(
                h('tr', { className: r % 2 === 0 ? 'even' : 'odd' }),
                (tr, node) => {
                  tr.append(h('td', {}, node));
                  if (linha.length === 1) {
                    tr.className = 'incidente';
                    tr.cells[0].colSpan = 4;
                  }
                  return tr;
                }
              )(linha)
            )
          )
        );
      })
    );
  function getId(sp) {
    return pipe(
      tailRec({ acc: [], curr: sp }, ({ acc, curr }) =>
        curr.length > 0
          ? Left({
              acc: [...acc, curr.slice(0, 8)],
              curr: curr.slice(8),
            })
          : Right(acc)
      ),
      x => x.slice(6, 8),
      map(x => parseInt(x, 16)),
      foldLeft(0n, (acc, x) => acc * 4294967296n + BigInt(x))
    );
  }
  const css =
    '.sm .gm-seeu-movimentacoes__fechar-janelas-abertas{background:hsla(333,35%,50%,.5);margin-left:3ch}\n';
  const barraSuperior = url =>
    pipe(
      url.pathname,
      maybeBool(x => x === '/seeu/usuario/areaAtuacao.do'),
      map$1(() => {
        _GM_addStyle(css);
        return Right(void 0);
      })
    );
  const alteracoes = /* @__PURE__ */ Object.freeze(
    /* @__PURE__ */ Object.defineProperty(
      {
        __proto__: null,
        barraSuperior,
        telaMovimentacoes,
      },
      Symbol.toStringTag,
      { value: 'Module' }
    )
  );
  const main = () => {
    const url = new URL(document.location.href);
    return pipe(
      Object.entries(alteracoes),
      filterMap(([name, f]) =>
        pipe(f(url), map$1(mapLeft(err => [`[${name}]: ${err}`])))
      ),
      toNonEmptyArray,
      map$1(sequence$1(makeApplicativeValidation(semigroupArray))),
      getOrElse(() => Left([`Página não reconhecida: ${url.pathname}.`])),
      mapBoth(fold(monoidString), constant(void 0))
    );
  };
  pipe(
    main(),
    mapLeft(err => {
      console.log('<SEEU - Movimentações>', 'Erro encontrado:', err);
    })
  );
})();
