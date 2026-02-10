// ==UserScript==
// @name         seeu-movimentacoes
// @name:pt-BR   SEEU - Movimentações
// @namespace    nadameu.com.br
// @version      2.10.0
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
  const e = document.createElement('style');
  (e.textContent = t), document.head.append(e);
})(
  ' td a._struck_14zo8_1{cursor:not-allowed}td a._struck_14zo8_1,td a._struck_14zo8_1:hover{text-decoration:line-through}._avisoCarregando_14zo8_8{font-size:1.2em;font-style:italic}._divConfigurarAbertura_14zo8_13{text-align:right;--cor-secundaria: hsl(333, 20%, 35%)}html #container .extendedinfo td a.link{padding:0 1px!important;border:1px solid transparent}html #container .extendedinfo td a.link._ultimoClicado_14zo8_22{background:#f0e0e7!important;border:1px dotted hsl(333,75%,8%)} '
);

(function () {
  'use strict';

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
  const flow = (value, ...fns) => {
    let x = value;
    for (let i = 0; i < fns.length; i++) x = fns[i](x);
    return x;
  };
  const apply = (f, ...args) => f(...args);
  const identity = x => x;
  const foldLeftIterable = (seed, f) => xs => {
    let acc = seed;
    let i = 0;
    for (const x of xs) acc = f(acc, x, i++);
    return acc;
  };
  const mapIterable = f => xs => ({
    [Symbol.iterator]() {
      const it = xs[Symbol.iterator]();
      let index = 0;
      return {
        next() {
          const result = it.next();
          if (result.done === true) return result;
          return { done: false, value: f(result.value, index++) };
        },
      };
    },
  });
  const filterIterable = pred => xs => ({
    [Symbol.iterator]() {
      const it = xs[Symbol.iterator]();
      let index = 0;
      return {
        next() {
          let result = it.next();
          while (result.done !== true && pred(result.value, index++) !== true) {
            result = it.next();
          }
          return result;
        },
      };
    },
  });
  const iterableToArray = xs =>
    foldLeftIterable([], (acc, x) => (acc.push(x), acc))(xs);
  const sequenceIterable = M => tfa => {
    const appendPartial = M.map(xs => x => (xs.push(x), xs));
    let result = M.of([]);
    for (const fa of tfa) {
      result = M.ap(fa)(appendPartial(result));
    }
    return result;
  };
  const query = selector => parentNode => parentNode.querySelector(selector);
  const text = node => node.textContent;
  const FIRST = XPathResult.FIRST_ORDERED_NODE_TYPE;
  const xquery = expression => contextNode =>
    document.evaluate(expression, contextNode, null, FIRST).singleNodeValue;
  const SNAP = XPathResult.ORDERED_NODE_SNAPSHOT_TYPE;
  const xqueryAll = expression => contextNode => {
    const array = [];
    const result = document.evaluate(expression, contextNode, null, SNAP);
    for (let i = 0, len = result.snapshotLength; i < len; i++) {
      array.push(result.snapshotItem(i));
    }
    return array;
  };
  const of = identity;
  const map = f => value => (value == null ? value : f(value));
  const lift2 = f => (a, b) => (a == null ? a : b == null ? b : f(a, b));
  const ap = fa => ff => lift2(apply)(ff, fa);
  const orElse = ifNullish => a => (a == null ? ifNullish() : a);
  const orThrow = message =>
    orElse(() => {
      throw new Error(message);
    });
  const filter = pred => a => (a == null ? a : pred(a) ? a : null);
  const mapProp = prop => obj => obj?.[prop];
  const match = re => map(x => x.match(re));
  const test = re => filter(x => re.test(x));
  const applicativeNullish = { ap, map, of };
  const sequence = sequenceIterable;
  const fanout =
    (...fns) =>
    value =>
      fns.map(f => f(value));
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
  const isFunction = /* @__PURE__ */ isOfType('function');
  const isOfTypeObject = /* @__PURE__ */ isOfType('object');
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
    return value => predicates.every(p2 => p2(value));
  }
  const isObject = /* @__PURE__ */ refine(isOfTypeObject, isNotNull);
  const isInteger = x => Number.isInteger(x);
  const isNonNegativeInteger = /* @__PURE__ */ refine(isInteger, x => x > -1);
  const isNonEmptyString = /* @__PURE__ */ refine(
    isString,
    x => x.trim().length > 0
  );
  const arrayHasLength = num => obj => obj.length === num;
  function hasShape(predicates) {
    return refine(isObject, obj =>
      Object.entries(predicates).every(([key, predicate]) =>
        key in obj ? predicate(obj[key]) : predicate.optional === true
      )
    );
  }
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
            callbacks.get(key)?.delete(callback);
            if (callbacks.get(key)?.size ?? true) {
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
  const TIPO_ABERTURA = 'tipo_abertura';
  const PARAMETROS_JANELA = 'parametros_janela';
  const FECHAR_AUTOMATICAMENTE = 'fechar_automaticamente';
  const isPosicao = /* @__PURE__ */ hasShape({
    top: isInteger,
    left: isInteger,
    width: isNonNegativeInteger,
    height: isNonNegativeInteger,
  });
  const validarPosicao = posicao =>
    check(
      isPosicao,
      posicao,
      `Posição inválida: \`${JSON.stringify(posicao)}\`.`
    );
  function posicaoToFeatures(posicao) {
    return Object.entries(posicao)
      .map(([k, v]) => `${k}=${v.toString(10)}`)
      .join(',');
  }
  function dadosAberturaToFeatures(dadosAbertura) {
    if (dadosAbertura.tipo === 'padrao') return void 0;
    else return posicaoToFeatures(dadosAbertura.posicao);
  }
  const DadosAbertura = {
    carregar() {
      const tipo = _GM_getValue(TIPO_ABERTURA, 'padrao');
      if (tipo === 'padrao') return { tipo };
      if (tipo === 'janela') {
        const posicao = _GM_getValue(PARAMETROS_JANELA, null);
        if (isPosicao(posicao)) return { tipo, posicao };
      }
      DadosAbertura.salvar(null);
      return { tipo: 'padrao' };
    },
    salvar(dadosAbertura) {
      if (dadosAbertura?.tipo ?? true) {
        _GM_deleteValue(PARAMETROS_JANELA);
      }
      if (dadosAbertura === null) {
        _GM_deleteValue(TIPO_ABERTURA);
      } else {
        _GM_setValue(TIPO_ABERTURA, dadosAbertura.tipo);
        if (dadosAbertura.tipo === 'janela') {
          _GM_setValue(PARAMETROS_JANELA, dadosAbertura.posicao);
        }
      }
    },
  };
  const NOME_JANELA = `gm-${_GM_info.script.name}__configurar-abertura`;
  const State = makeConstructorsWith('status', {
    INICIO: current => ({ current }),
    SALVO_PADRAO: () => ({}),
    JANELA_POSICAO: () => ({}),
    JANELA_CONFIRMAR: posicao => ({ posicao }),
    SALVO_JANELA: posicao => ({ posicao }),
  });
  const Action = makeConstructorsWith('type', {
    OPCAO_SELECIONADA: opcao => ({ opcao }),
    SALVAR: () => ({}),
  });
  function configurarAbertura() {
    const antiga = window.open('about:blank', NOME_JANELA);
    antiga?.close();
    const win = window.open(
      'about:blank',
      NOME_JANELA,
      posicaoToFeatures(
        validarPosicao({ top: 0, left: 0, width: 800, height: 450 })
      )
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
  function obterPosicaoJanela(win) {
    return validarPosicao({
      top: win.screenY,
      left: win.screenX,
      width: win.innerWidth,
      height: win.innerHeight,
    });
  }
  function onJanelaAberta(win) {
    const tipoAberturaAtual = DadosAbertura.carregar().tipo;
    const fsm = createFiniteStateMachine(
      State.INICIO(tipoAberturaAtual),
      {
        INICIO: {
          OPCAO_SELECIONADA: ({ opcao }) => State.INICIO(opcao),
          SALVAR: (_, { current }) => {
            if (current === 'padrao') return State.SALVO_PADRAO();
            return State.JANELA_POSICAO();
          },
        },
        SALVO_PADRAO: {},
        JANELA_POSICAO: {
          SALVAR: () => State.JANELA_CONFIRMAR(obterPosicaoJanela(win)),
        },
        JANELA_CONFIRMAR: {
          SALVAR: (_, { posicao }) => State.SALVO_JANELA(posicao),
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
      checked: tipoAberturaAtual === 'padrao',
      onclick: () => fsm.dispatch(Action.OPCAO_SELECIONADA('padrao')),
    });
    const inputJanela = h('input', {
      type: 'radio',
      name: 'tipo',
      value: 'janela',
      checked: tipoAberturaAtual === 'janela',
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
    const botaoSalvar = h('button', {
      type: 'button',
      onclick: () => fsm.dispatch(Action.SALVAR()),
    });
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
    fsm.subscribe(estado => {
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
          DadosAbertura.salvar({ tipo: 'padrao' });
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
          const features = posicaoToFeatures(estado.posicao);
          try {
            const newWin = win.open(
              'about:blank',
              `${NOME_JANELA}_2`,
              features
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
          DadosAbertura.salvar({ tipo: 'janela', posicao: estado.posicao });
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
  const css =
    'div>table.resultTable>tbody>tr>td:nth-last-child(4){--cor-pessoa: hsl(var(--hue-pessoa) 50% 50%);background:linear-gradient(to bottom right,var(--cor-pessoa) 50%,transparent 50%) top left/12px 12px no-repeat}table.resultTable>tbody>tr[id*=",JUIZ,"]{--hue-pessoa: 0}table.resultTable>tbody>tr[id*=",JUIZ,"]>td:nth-last-child(3){border:1px solid var(--cor-pessoa)}table.resultTable>tbody>tr[id*=",SERVIDOR,"]{--hue-pessoa: 40}table.resultTable>tbody>tr[id*=",ADVOGADO,"]{--hue-pessoa: 80}table.resultTable>tbody>tr[id*=",PROMOTOR,"]{--hue-pessoa: 120}table.resultTable>tbody>tr[id*=",DEFENSOR,"]{--hue-pessoa: 160}table.resultTable>tbody>tr[id*=",PROCURADOR,"]{--hue-pessoa: 200}table.resultTable>tbody>tr[id*=",OUTROS,"]{--hue-pessoa: 240}table.resultTable>tbody>tr[id*=",AUDIENCIA,"]{--hue-pessoa: 280}table.resultTable>tbody>tr[id*=",OFICIALJUSTICA,"]{--hue-pessoa: 320}table.resultTable{border-collapse:separate}table.resultTable thead>tr>th{padding:0 5px}table.resultTable tr div.extendedinfo{border:none;margin:0;width:auto}table.resultTable table.form{margin:0 0 4px;width:calc(100% - 4px);border-collapse:collapse;border:1px solid}table.resultTable table.form td{width:auto;padding:0;vertical-align:top!important}table.resultTable table.form td:nth-child(1){width:36px;text-align:center;padding-left:6px;padding-right:2px}table.resultTable table.form td:nth-child(2){width:16px;text-align:center;padding:5px 0 4px}table.resultTable table.form td:nth-child(3){width:89%}table.resultTable table.form td:nth-child(4){width:16px}table.resultTable table.form tr.odd{background:#f0e0e7}table.resultTable table.form tr.even,table.resultTable table.form tr.incidente{background:#faf5f7}table.resultTable table.form .ajaxCalloutGenericoHelp{display:inline;margin-right:4px}';
  const struck = '_struck_14zo8_1';
  const avisoCarregando = '_avisoCarregando_14zo8_8';
  const divConfigurarAbertura = '_divConfigurarAbertura_14zo8_13';
  const ultimoClicado = '_ultimoClicado_14zo8_22';
  const classNames = {
    struck,
    avisoCarregando,
    divConfigurarAbertura,
    ultimoClicado,
  };
  const caminhosValidos = [
    '/seeu/visualizacaoProcesso.do',
    '/seeu/processo.do',
    '/seeu/processo/juntarDocumento.do',
    '/seeu/processo/buscaProcesso.do',
    '/seeu/processo/criminal/execucao/buscaProcessoExecucao.do',
  ];
  function telaMovimentacoes(url) {
    if (!caminhosValidos.includes(url.pathname)) return null;
    const abaCorreta =
      document.querySelector(
        'li[name="tabMovimentacoesProcesso"].currentTab'
      ) !== null;
    if (!abaCorreta) return null;
    const links = flow(
      document,
      xqueryAll('//img[starts-with(@id, "iconmovimentacoes")]'),
      mapIterable((link, i) =>
        flow(
          link,
          xquery(
            'ancestor::tr/following-sibling::*[1]/self::tr//*[contains(concat(" ", normalize-space(@class), " "), " extendedinfo ")]'
          ),
          orThrow(`Lista de eventos não reconhecida: ${i}.`),
          mutationTarget => ({ link, mutationTarget })
        )
      )
    );
    const isAjax = hasShape({ Updater: isFunction });
    assert(isAjax(Ajax), 'Impossível capturar o carregamento de documentos.');
    const oldUpdater = Ajax.Updater;
    Ajax.Updater = function (a, b, c) {
      const regA = /^divArquivosMovimentacaoProcessomovimentacoes(\d+)$/;
      const regB = /^\/seeu\/processo\/movimentacaoArquivoDocumento\.do\?_tj=/;
      const id = flow(
        b,
        test(regB),
        map(() => a),
        match(regA),
        mapProp(1)
      );
      if (id == null) {
        return oldUpdater.call(this, a, b, c);
      }
      const img = flow(
        document,
        xquery(`//img[@id = "iconmovimentacoes${id}"]`),
        orThrow(`Imagem não encontrada: #iconmovimentacoes${id}.`)
      );
      if (/iPlus.gif$/.test(img.src)) {
        return;
      }
      return oldUpdater.call(this, a, b, {
        ...c,
        onComplete() {
          try {
            const resultado = c.onComplete(...arguments);
            const div = check(
              isNotNull,
              document.getElementById(a),
              `Elemento não encontrado: #${a}.`
            );
            const tabela2 = check(
              arrayHasLength(1),
              div.querySelectorAll(':scope > table'),
              `Tabela referente a #${a} não encontrada.`
            )[0];
            div.parentNode
              ?.querySelector(`.${classNames.avisoCarregando}`)
              ?.remove();
            onTabelaAdicionada(tabela2);
            return resultado;
          } catch (err) {
            console.group('<SEEU - Movimentações>');
            console.error(err);
            console.groupEnd();
          }
        },
      });
    };
    Ajax.Updater.prototype = oldUpdater.prototype;
    const obs = createIntersectionObserver();
    for (const { link, mutationTarget } of links) {
      const aviso = h(
        'div',
        { className: classNames.avisoCarregando },
        'Carregando lista de documentos...'
      );
      const { unobserve } = obs.observe(link, () => {
        unobserve();
        link.click();
      });
      link.addEventListener('click', () => {
        if (/iPlus/.test(link.src));
        else {
          mutationTarget.querySelector(':scope > table')?.remove();
          mutationTarget.parentNode.insertBefore(aviso, mutationTarget);
        }
      });
    }
    const janelasAbertas = /* @__PURE__ */ new Map();
    const { exibirBotaoFechar } = criarBotaoJanelasAbertas(janelasAbertas);
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
    const tabela = flow(
      document,
      query('table.resultTable'),
      orThrow('Tabela de movimentações não encontrada.')
    );
    const [colgroup, linhaCabecalho] = flow(
      tabela,
      fanout(xquery('colgroup'), xquery('thead/tr')),
      sequence(applicativeNullish),
      orThrow('Elementos da tabela de movimentações não encontrados.')
    );
    const linhas = flow(tabela, xqueryAll('tbody/tr'));
    for (const linha of linhas) {
      if (arrayHasLength(1)(linha.cells)) {
        const previousRow = linha.previousElementSibling;
        if (previousRow instanceof HTMLTableRowElement) {
          linha.insertCell(0).colSpan = previousRow.cells.length - 1;
          linha.cells[1].colSpan = 1;
        }
      } else {
        const len = linha.cells.length;
        const colunaDataHora = len - 3;
        for (const [i, cell] of Object.entries(linha.cells)) {
          if (Number(i) !== colunaDataHora) {
            cell.removeAttribute('nowrap');
          }
        }
        linha.insertCell();
      }
    }
    colgroup.append(h('col'));
    const cols = colgroup.children;
    for (const [i, col] of Object.entries(cols)) {
      col.removeAttribute('width');
      switch (Number(i)) {
        case cols.length - 4:
          col.style.width = '40%';
          break;
        case cols.length - 2:
          col.style.width = '15%';
          break;
        case cols.length - 1:
          col.style.width = '30%';
          break;
      }
    }
    const fechar = h('input', {
      type: 'checkbox',
      checked: _GM_getValue(FECHAR_AUTOMATICAMENTE, true),
      onclick: () => {
        _GM_setValue(FECHAR_AUTOMATICAMENTE, fechar.checked);
      },
    });
    tabela.insertAdjacentElement(
      'beforebegin',
      h(
        'div',
        { className: classNames.divConfigurarAbertura },
        h(
          'button',
          {
            type: 'button',
            onclick: e => {
              e.preventDefault();
              configurarAbertura();
            },
          },
          'Configurar abertura de documentos'
        ),
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
    const th = h('th', {}, 'Documentos');
    linhaCabecalho.appendChild(th);
    for (const th2 of linhaCabecalho.cells) {
      th2.removeAttribute('style');
    }
    _GM_addStyle(css);
    return null;
  }
  function createOnDocumentClick({ janelasAbertas, exibirBotaoFechar }) {
    return function onDocumentClick(evt) {
      if (
        evt.target instanceof HTMLElement &&
        evt.target.matches('a[href][data-gm-doc-link]')
      ) {
        evt.preventDefault();
        const link = evt.target;
        document
          .querySelectorAll(`.${classNames.ultimoClicado}`)
          .forEach(x => x.classList.remove(classNames.ultimoClicado));
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
        const features = dadosAberturaToFeatures(DadosAbertura.carregar());
        const win = window.open(link.href, `doc${id}`, features);
        janelasAbertas.set(id, win);
      }
    };
  }
  function criarBotaoJanelasAbertas(janelasAbertas) {
    const menu = (() => {
      const opcoes = window.parent?.document.querySelectorAll('seeu-menubar');
      if (!arrayHasLength(1)(opcoes)) return null;
      const menu2 = opcoes[0];
      if (!menu2.shadowRoot) return null;
      const divs = menu2.shadowRoot.querySelectorAll('div.seeu-menubar');
      if (!arrayHasLength(1)(divs)) return null;
      const div = divs[0];
      return div;
    })();
    if (!menu) {
      console.log('Não encontrado.');
      return { exibirBotaoFechar() {} };
    }
    const doc = menu.ownerDocument;
    const fechar = doc.createElement('a');
    fechar.className = 'root-item';
    fechar.style.display = 'none';
    fechar.href = '#';
    fechar.textContent = 'Fechar janelas abertas';
    fechar.style.backgroundColor = 'hsla(333, 35%, 50%, 0.5)';
    fechar.style.marginLeft = '3ch';
    fechar.addEventListener('click', onClick);
    menu.appendChild(fechar);
    window.addEventListener('beforeunload', () => {
      fechar.removeEventListener('click', onClick);
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
  function onTabelaAdicionada(table) {
    return flow(
      table.rows,
      mapIterable((linha, l) => {
        if (!arrayHasLength(8)(linha.cells)) {
          if (
            linha.classList.contains('linhaPeticao') &&
            arrayHasLength(1)(linha.cells) &&
            linha.cells[0].colSpan === 8
          ) {
            const frag = document.createDocumentFragment();
            frag.append(...linha.cells[0].childNodes);
            return [frag];
          }
          throw new Error(`Formato de linha desconhecido: ${l}.`);
        }
        const isTextoObservacoes = xs =>
          xs.length >= 1 &&
          xs[0] instanceof Text &&
          (xs.length === 1 ||
            (xs.length === 3 &&
              xs[1] instanceof HTMLAnchorElement &&
              xs[2] instanceof HTMLElement));
        const isTipoDocumento = xs => xs.length === 1 && xs[0] instanceof Text;
        const sequencialNome = flow(
          linha.cells[0].childNodes,
          filterIterable(
            x => !(x instanceof Text) || isNonEmptyString(x.nodeValue)
          ),
          iterableToArray,
          filter(isTextoObservacoes),
          map(([texto, ...obs]) =>
            flow(
              texto.nodeValue,
              match(/^\s*(\d+\.\d+)\s+Descrição:\s+(.*)\s*$/),
              map(([, sequencial2, nome2]) => ({
                sequencial: sequencial2,
                nome: nome2 || 'Outros',
                observacao: flow(
                  obs,
                  filter(x => x.length === 2)
                ),
              }))
            )
          ),
          orThrow(`Sequencial e nome não reconhecidos: ${l}.`)
        );
        const tipo = flow(
          linha.cells[1].childNodes,
          filterIterable(
            x => !(x instanceof Text) || isNonEmptyString(x.nodeValue)
          ),
          iterableToArray,
          filter(isTipoDocumento),
          map(([texto]) =>
            flow(
              texto.nodeValue,
              match(/^\s*(\d+\.\d+)\s+Tipo de Documento:\s+(.*)\s*$/),
              map(([, _seq, tipo2]) => tipo2)
            )
          ),
          orThrow(`Tipo de documento não reconhecido: ${l}.`)
        );
        const assinatura = flow(
          linha.cells[3],
          text,
          match(/^\s*Ass\.:\s+(.*)\s*$/),
          map(([, assinatura2]) => assinatura2),
          orThrow(`Assinatura não reconhecida: ${l}.`)
        );
        const infoLink = flow(linha.cells[5], celula =>
          flow(
            celula,
            c => c.childNodes,
            filterIterable(
              x => !(x instanceof Text && /^\s*$/.test(x.nodeValue ?? ''))
            ),
            iterableToArray,
            filter(xs => {
              return (
                (xs.length === 3 || xs.length === 4) &&
                xs[0] instanceof HTMLImageElement &&
                xs[1] instanceof HTMLDivElement &&
                xs[2] instanceof HTMLAnchorElement &&
                (xs[3] === void 0 || xs[3] instanceof HTMLAnchorElement)
              );
            }),
            map(childNodes => {
              const [menu2, popup2, link2, play2] = childNodes;
              return { menu: menu2, popup: popup2, link: link2, play: play2 };
            }),
            orElse(() =>
              flow(
                celula,
                xquery('.//strike//a[@href]'),
                map(link2 => {
                  link2.classList.add(classNames.struck);
                  return link2;
                }),
                map(link2 => ({
                  menu: '',
                  popup: '',
                  link: link2,
                  play: void 0,
                })),
                orThrow(`Link para documento não reconhecido: ${l}.`)
              )
            )
          )
        );
        const sigilo = flow(
          linha.cells[7],
          text,
          map(x => x.trim()),
          filter(x => x !== ''),
          orThrow(`Nível de sigilo não reconhecido: ${l}.`)
        );
        const { sequencial, nome, observacao } = sequencialNome;
        const { menu, popup, link, play } = infoLink;
        {
          link.title = `${link.title?.trim() ?? ''}

Ass.: ${assinatura}

${sigilo}`;
          const frag = document.createDocumentFragment();
          frag.append(menu, popup);
          flow(
            new URL(link.href).searchParams.get('_tj'),
            map(getId),
            map(id => {
              link.dataset.gmDocLink = id.toString(36);
            })
          );
          const file = document.createDocumentFragment();
          if (tipo !== nome && tipo !== 'Outros Documentos') {
            file.append(`${tipo}:`, h('br'));
          }
          const span = h(
            'span',
            { style: { fontWeight: 'bold' } },
            nome.replace(/_/g, ' ')
          );
          file.append(span, h('br'));
          if (play) {
            file.append(play);
          }
          link.textContent = link.textContent.trim();
          file.append(link);
          if (observacao != null) {
            file.append(h('br'), ...observacao);
          }
          const cadeado =
            sigilo === 'Público'
              ? ''
              : h('i', { className: 'icon icon-mdi:lock', title: sigilo });
          return [sequencial, frag, file, cadeado];
        }
      }),
      mapIterable((children, r) => {
        const tr = h('tr', { className: r % 2 === 0 ? 'even' : 'odd' });
        for (const child of children) {
          tr.append(h('td', {}, child));
        }
        if (arrayHasLength(1)(tr.cells)) {
          tr.className = 'incidente';
          tr.cells[0].colSpan = 4;
        }
        return tr;
      }),
      linhas => {
        table.replaceChildren(...linhas);
      }
    );
  }
  function getId(sp) {
    let slices = [];
    for (let curr = sp; curr.length > 0; curr = curr.slice(8)) {
      slices.push(curr.slice(0, 8));
    }
    return slices
      .slice(6, 8)
      .map(x => parseInt(x, 16))
      .reduce((acc, x) => acc * 4294967296n + BigInt(x), 0n);
  }
  const alteracoes = /* @__PURE__ */ Object.freeze(
    /* @__PURE__ */ Object.defineProperty(
      {
        __proto__: null,
        telaMovimentacoes,
      },
      Symbol.toStringTag,
      { value: 'Module' }
    )
  );
  const main = () => {
    const url = new URL(document.location.href);
    Object.values(alteracoes).forEach(f => f(url));
    return null;
  };
  try {
    main();
  } catch (err) {
    console.group('<SEEU - Movimentações>');
    console.error(err);
    console.groupEnd();
  }
})();
