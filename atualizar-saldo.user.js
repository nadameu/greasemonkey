// ==UserScript==
// @name         atualizar-saldos
// @name:pt-BR   Atualizar saldos
// @namespace    http://nadameu.com.br
// @version      4.5.0
// @author       nadameu
// @description  Atualiza o saldo de contas judiciais
// @match        https://eproc.jfpr.jus.br/eprocV2/controlador.php?acao=processo_precatorio_rpv&*
// @match        https://eproc.jfrs.jus.br/eprocV2/controlador.php?acao=processo_precatorio_rpv&*
// @match        https://eproc.jfsc.jus.br/eprocV2/controlador.php?acao=processo_precatorio_rpv&*
// @match        https://eproc.trf4.jus.br/eproc2trf4/controlador.php?acao=processo_precatorio_rpv&*
// @match        https://eproc.jfpr.jus.br/eprocV2/controlador.php?acao=processo_selecionar&*
// @match        https://eproc.jfrs.jus.br/eprocV2/controlador.php?acao=processo_selecionar&*
// @match        https://eproc.jfsc.jus.br/eprocV2/controlador.php?acao=processo_selecionar&*
// @match        https://eproc.trf4.jus.br/eproc2trf4/controlador.php?acao=processo_selecionar&*
// @match        https://eproc.jfpr.jus.br/eprocV2/controlador.php?acao=processo_depositos_judiciais&*
// @match        https://eproc.jfrs.jus.br/eprocV2/controlador.php?acao=processo_depositos_judiciais&*
// @match        https://eproc.jfsc.jus.br/eprocV2/controlador.php?acao=processo_depositos_judiciais&*
// @match        https://eproc.trf4.jus.br/eproc2trf4/controlador.php?acao=processo_depositos_judiciais&*
// @require      https://unpkg.com/preact@10.17.1/dist/preact.min.js
// @grant        GM_addStyle
// ==/UserScript==

(a => {
  if (typeof GM_addStyle == 'function') {
    GM_addStyle(a);
    return;
  }
  const o = document.createElement('style');
  (o.textContent = a), document.head.append(o);
})(
  ' .gm-atualizar-saldo__contas,.gm-atualizar-saldo__processo{--button-bg: hsl(333, 25%, 40%);--fg-color: hsl(333, 80%, 15%);--border-color: hsl(333, 10%, 40%)}.gm-atualizar-saldo__contas span,.gm-atualizar-saldo__processo span{line-height:2em;color:var(--fg-color)}.gm-atualizar-saldo__contas span.zerado,.gm-atualizar-saldo__processo span.zerado{--fg-color: hsl(333, 10%, 40%)}.gm-atualizar-saldo__contas span.erro,.gm-atualizar-saldo__processo span.erro{--fg-color: hsl(0, 85%, 40%)}.gm-atualizar-saldo__contas span.saldo,.gm-atualizar-saldo__processo span.saldo{--fg-color: hsl(333, 75%, 25%)}.gm-atualizar-saldo__contas button,.gm-atualizar-saldo__processo button{border:none;border-radius:4px;padding:4px 12px;font-size:1.3em;color:#fff;box-shadow:0 2px 4px #00000080;background:var(--button-bg)}.gm-atualizar-saldo__contas button.zerado,.gm-atualizar-saldo__processo button.zerado{--button-bg: hsl(333, 5%, 50%)}.gm-atualizar-saldo__contas button:hover,.gm-atualizar-saldo__contas button:focus,.gm-atualizar-saldo__processo button:hover,.gm-atualizar-saldo__processo button:focus{--button-bg: hsl(333, 40%, 45%)}.gm-atualizar-saldo__contas button:active,.gm-atualizar-saldo__processo button:active{box-shadow:none;translate:0 2px}.gm-atualizar-saldo__processo{margin:0 2px 8px;border-left:4px solid var(--border-color);padding:0 4px}.gm-atualizar-saldo__contas{border-left:4px solid var(--border-color);padding:0 4px} '
);

(function (preact) {
  'use strict';

  const flip = f => b => a => f(a)(b);
  const compose = f => g => a => f(g(a));
  const identity = a => a;
  const pipeValue = (x, ...fns) => fns.reduce((y, f) => f(y), x);
  const lift2 =
    ({ apply: apply2, map: map2 }) =>
    f =>
      compose(apply2)(map2(f));
  const Left = leftValue => ({
    isLeft: true,
    isRight: false,
    leftValue,
  });
  const Right = rightValue => ({
    isLeft: false,
    isRight: true,
    rightValue,
  });
  const Nothing = {
    isJust: false,
    isNothing: true,
  };
  const Just = value => ({
    isJust: true,
    isNothing: false,
    value,
  });
  const liftM1 =
    ({ bind: bind2, pure: pure2 }) =>
    f =>
      bind2(compose(pure2)(f));
  const ap = ({ bind: bind2, pure: pure2 }) =>
    flip(fa =>
      bind2(f =>
        liftM1({
          bind: bind2,
          pure: pure2,
        })(f)(fa)
      )
    );
  const sequenceDefault =
    ({ traverse: traverse2 }) =>
    applicative =>
      traverse2(applicative)(identity);
  const traverseDefaultFoldableUnfoldable =
    ({ foldr: foldr2, unfoldr: unfoldr2 }) =>
    applicative =>
    f =>
    ta => {
      return applicative.map(unfoldr2(x => x))(
        foldr2(compose(lift2(applicative)(hd => tl => Just([hd, tl])))(f))(
          applicative.pure(Nothing)
        )(ta)
      );
    };
  const iteratorReturnResult = {
    done: true,
    value: void 0,
  };
  const iteratorYieldResult = value => ({
    done: false,
    value,
  });
  const unfoldr$2 = f => b => ({
    [Symbol.iterator]() {
      let next = b;
      return {
        next() {
          const result = f(next);
          if (result.isJust) {
            let value;
            [value, next] = result.value;
            return iteratorYieldResult(value);
          } else return iteratorReturnResult;
        },
      };
    },
  });
  const borrow$1 =
    (key, ...args) =>
    xs =>
      Array.prototype[key].apply(xs, args);
  const foldr$1 = f => b => borrow$1('reduceRight', (acc, x) => f(x)(acc), b);
  const unfoldr$1 = f => b => Array.from(unfoldr$2(f)(b));
  const traverse$2 = traverseDefaultFoldableUnfoldable({
    foldr: foldr$1,
    unfoldr: unfoldr$1,
  });
  const borrow =
    (key, ...args) =>
    xs =>
      Array.prototype[key].apply(xs, args);
  const foldr = f => b => borrow('reduceRight', (acc, x) => f(x)(acc), b);
  const unfoldr = f => b => Array.from(unfoldr$2(f)(b));
  const traverse$1 = traverseDefaultFoldableUnfoldable({
    foldr,
    unfoldr,
  });
  const either = f => g => fab =>
    fab.isLeft ? f(fab.leftValue) : g(fab.rightValue);
  const bind = either(Left);
  const pure = Right;
  const map = liftM1({
    bind,
    pure,
  });
  const apply = ap({
    bind,
    pure,
  });
  const catchError = f => either(f)(Right);
  const applicativeEither = {
    apply,
    map,
    pure,
  };
  const entries = obj => Object.entries(obj);
  const traverse = applicative => f => ta => {
    const A = applicative;
    return foldr$1(([k, x]) =>
      A.apply(
        A.map(x2 => obj => {
          obj[k] = x2;
          return obj;
        })(f(x))
      )
    )(A.pure({}))(entries(ta));
  };
  const sequence = sequenceDefault({
    traverse,
  });
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
  const isBoolean = /* @__PURE__ */ isOfType('boolean');
  const isNumber = /* @__PURE__ */ isOfType('number');
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
    return value => predicates.every(p => p(value));
  }
  const isObject = /* @__PURE__ */ refine(isOfTypeObject, isNotNull);
  function isAnyOf(...predicates) {
    return value => predicates.some(p => p(value));
  }
  function hasShape(predicates) {
    return refine(isObject, obj =>
      Object.entries(predicates).every(([key, predicate]) =>
        key in obj ? predicate(obj[key]) : predicate.optional === true
      )
    );
  }
  function isTaggedUnion(tagName, union) {
    return isAnyOf(
      ...Object.entries(union).map(([tag, extraProperties]) =>
        hasShape({
          [tagName]: isLiteral(tag),
          ...extraProperties,
        })
      )
    );
  }
  const isNumproc = refine(isString, x => /^\d{20}$/.test(x));
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
      if (
        (typeof obj !== 'object' && typeof obj !== 'function') ||
        obj === null
      )
        throw new Error(
          `${Object.prototype.toString
            .call(obj)
            .slice('[object '.length, -1)
            .toLowerCase()} is not a valid object.`
        );
      const tag = obj[tagName];
      if (tag === void 0)
        throw new Error(
          `Object does not have a valid "${String(tagName)}" property.`
        );
      const fn = matchers[tag] ?? otherwise ?? matchNotFound;
      return fn(obj);
    };
    function matchNotFound(obj) {
      throw new Error(`Not matched: "${obj[tagName]}".`);
    }
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
  const Mensagem = /* @__PURE__ */ createTaggedUnion(
    {
      InformaContas: (numproc, qtdComSaldo, permiteAtualizar) => ({
        numproc,
        qtdComSaldo,
        permiteAtualizar,
      }),
      InformaSaldoDeposito: (numproc, qtdComSaldo) => ({
        numproc,
        qtdComSaldo,
      }),
      PerguntaAtualizar: numproc => ({
        numproc,
      }),
      RespostaAtualizar: (numproc, atualizar) => ({
        numproc,
        atualizar,
      }),
    },
    'tipo'
  );
  const isMensagem = /* @__PURE__ */ isTaggedUnion('tipo', {
    InformaContas: {
      numproc: isNumproc,
      qtdComSaldo: isNumber,
      permiteAtualizar: isBoolean,
    },
    InformaSaldoDeposito: {
      numproc: isNumproc,
      qtdComSaldo: isNumber,
    },
    PerguntaAtualizar: {
      numproc: isNumproc,
    },
    RespostaAtualizar: {
      numproc: isNumproc,
      atualizar: isBoolean,
    },
  });
  function createMsgService() {
    return createBroadcastService('gm-atualizar-saldo', isMensagem);
  }
  var _ = 0;
  function o(o2, e, n, t, f, l) {
    var s,
      u,
      a = {};
    for (u in e) 'ref' == u ? (s = e[u]) : (a[u] = e[u]);
    var i = {
      type: o2,
      props: a,
      key: n,
      ref: s,
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
      __self: l,
    };
    if ('function' == typeof o2 && (s = o2.defaultProps))
      for (u in s) void 0 === a[u] && (a[u] = s[u]);
    return preact.options.vnode && preact.options.vnode(i), i;
  }
  const Estado$1 = createTaggedUnion({
    Ocioso: infoContas => ({
      infoContas,
    }),
    Atualizando: (infoContas, conta) => ({
      infoContas,
      conta,
    }),
    Erro: erro => ({
      erro,
    }),
  });
  const Acao$1 = createTaggedUnion({
    Atualizar: null,
    SaldoAtualizado: saldo => ({
      saldo,
    }),
    ErroComunicacao: mensagem => ({
      mensagem,
    }),
  });
  function paginaContas(numproc) {
    const barra = document.getElementById('divInfraBarraLocalizacao');
    if (!barra) {
      return Left(new Error('Barra de localização não encontrada.'));
    }
    const div = document.createElement('div');
    div.className = 'gm-atualizar-saldo__contas';
    barra.insertAdjacentElement('afterend', div);
    let sub = null;
    const bc = createMsgService();
    const store = createStore(
      () => {
        const estado = pipeValue(
          obterContas(),
          either(Estado$1.Erro)(Estado$1.Ocioso)
        );
        if (estado.tag !== 'Erro') {
          bc.subscribe(msg =>
            Mensagem.match(msg, {
              InformaContas: () => {},
              InformaSaldoDeposito: () => {},
              PerguntaAtualizar: () => {},
              RespostaAtualizar: ({ numproc: msgNumproc, atualizar }) => {
                if (msgNumproc !== numproc) return;
                if (atualizar) {
                  store.dispatch(Acao$1.Atualizar);
                }
              },
            })
          );
          bc.publish(Mensagem.PerguntaAtualizar(numproc));
        }
        return estado;
      },
      (estado, acao) =>
        Acao$1.match(acao, {
          Atualizar: () =>
            Estado$1.match(estado, {
              Erro: () => estado,
              Ocioso: ({ infoContas }) => {
                ouvirXHR(x => store.dispatch(x));
                const primeiraConta = encontrarContaAtualizavel(infoContas);
                if (primeiraConta < 0) {
                  bc.publish(
                    Mensagem.InformaContas(
                      numproc,
                      infoContas.map(x => x.saldo).filter(x => x > 0).length,
                      false
                    )
                  );
                  return estado;
                }
                infoContas[primeiraConta].atualizacao();
                return Estado$1.Atualizando(infoContas, primeiraConta);
              },
              Atualizando: () =>
                Estado$1.Erro(
                  new Error(
                    'Tentativa de atualização durante outra atualização.'
                  )
                ),
            }),
          SaldoAtualizado: ({ saldo }) =>
            Estado$1.match(estado, {
              Erro: () => estado,
              Ocioso: () => estado,
              Atualizando: ({ conta, infoContas }) => {
                const infoNova = infoContas
                  .slice(0, conta)
                  .concat([
                    {
                      saldo,
                      atualizacao: null,
                    },
                  ])
                  .concat(infoContas.slice(conta + 1));
                const proxima = encontrarContaAtualizavel(infoNova, conta + 1);
                if (proxima < 0) {
                  const qtdComSaldo = infoNova
                    .map(x => x.saldo)
                    .filter(x => x > 0).length;
                  const permiteAtualizar = infoNova.some(
                    x => x.atualizacao !== null
                  );
                  bc.publish(
                    Mensagem.InformaContas(
                      numproc,
                      qtdComSaldo,
                      permiteAtualizar
                    )
                  );
                  return Estado$1.Ocioso(infoNova);
                }
                infoNova[proxima].atualizacao();
                return Estado$1.Atualizando(infoNova, proxima);
              },
            }),
          ErroComunicacao: ({
            mensagem = 'Ocorreu um erro na atualização dos saldos.',
          }) =>
            Estado$1.match(
              estado,
              {
                Erro: () => estado,
              },
              () => {
                bc.destroy();
                return Estado$1.Erro(new Error(mensagem));
              }
            ),
        })
    );
    sub = store.subscribe(update);
    return Right(void 0);
    function App({ estado }) {
      return Estado$1.match(estado, {
        Atualizando: ({ conta }) =>
          o('span', {
            children: ['Atualizando conta ', conta + 1, '...'],
          }),
        Ocioso: ({ infoContas }) => {
          const contasComSaldo = infoContas.filter(x => x.saldo > 0).length;
          const contasAtualizaveis = infoContas
            .map(x => x.atualizacao)
            .filter(x => x !== null);
          const classe = contasComSaldo === 0 ? 'zerado' : 'saldo';
          const mensagem =
            contasComSaldo === 0
              ? 'Sem saldo em conta(s).'
              : contasComSaldo === 1
                ? 'Há 1 conta com saldo.'
                : `Há ${contasComSaldo} contas com saldo.`;
          const botao =
            contasAtualizaveis.length === 0
              ? null
              : o('button', {
                  onClick,
                  children: 'Atualizar',
                });
          return o(preact.Fragment, {
            children: [
              o('span', {
                class: classe,
                children: mensagem,
              }),
              o('br', {}),
              botao,
            ],
          });
        },
        Erro: ({ erro }) => {
          if (sub) {
            sub.unsubscribe();
            sub = null;
          }
          return o('span', {
            class: 'erro',
            children: erro.message,
          });
        },
      });
    }
    function onClick(evt) {
      evt.preventDefault();
      store.dispatch(Acao$1.Atualizar);
    }
    function update(estado) {
      preact.render(
        o(App, {
          estado,
        }),
        div
      );
    }
    function obterContas() {
      const tabela = document.querySelector(
        '#divInfraAreaDadosDinamica > table'
      );
      if (!tabela) return Right([]);
      return pipeValue(
        tabela.querySelectorAll('tr[id^="tdConta"]'),
        traverse$1(applicativeEither)(linha => {
          const info = obterInfoContaLinha$1(linha);
          if (info === null)
            return Left(new Error('Erro ao obter dados das contas.'));
          else return Right(info);
        })
      );
    }
    function ouvirXHR(handler) {
      $.ajaxSetup({
        complete(xhr, resultado) {
          if (
            !hasShape({
              url: isString,
            })(this)
          )
            return;
          const url = new URL(this.url, document.location.href);
          if (!/\/controlador_ajax\.php$/.test(url.pathname)) return;
          if (url.searchParams.get('acao_ajax') !== 'atualizar_precatorio_rpv')
            return;
          try {
            check(isLiteral(200), xhr.status);
            const responseXML = xhr.responseXML;
            if (responseXML) {
              const erros = responseXML.querySelectorAll('erros > erro');
              const mensagem =
                erros.length === 0
                  ? void 0
                  : Array.from(
                      erros,
                      erro => erro.getAttribute('descricao')?.trim() ?? ''
                    )
                      .filter(x => x !== '')
                      .join('\n') || void 0;
              return handler(Acao$1.ErroComunicacao(mensagem));
            }
            const json = check(
              hasShape({
                saldo_valor_total_sem_formatacao: isString,
              }),
              xhr.responseJSON
            );
            const novoSaldo = check(
              x => !Number.isNaN(x),
              Number(json.saldo_valor_total_sem_formatacao)
            );
            return handler(Acao$1.SaldoAtualizado(novoSaldo));
          } catch (err) {
            const mensagem = err instanceof Error ? err.message : void 0;
            return handler(Acao$1.ErroComunicacao(mensagem));
          }
        },
      });
    }
  }
  const jsLinkRE =
    /^javascript:atualizarSaldo\('(\d{20})','(\d+)',(\d+),'(\d+)','(\d{20})',(\d{3}),'(\d+)',(\d+)\)$/;
  function obterInfoContaLinha$1(row) {
    if (row.cells.length !== 15) return null;
    const celulaSaldo = row.querySelector('td[id^="saldoRemanescente"]');
    if (!celulaSaldo) {
      if ((row.cells[12]?.textContent ?? '').match(/^Valor estornado/))
        return {
          saldo: 0,
          atualizacao: null,
        };
      return null;
    }
    const textoSaldo = celulaSaldo.textContent ?? '';
    const match = textoSaldo.match(/^R\$ ([0-9.]*\d,\d{2})$/);
    if (!match || match.length < 2) return null;
    const [, numeros] = match;
    const saldo = Number(numeros.replace(/\./g, '').replace(',', '.'));
    const link = row.cells[row.cells.length - 1].querySelector(
      'a[href^="javascript:atualizarSaldo("]'
    );
    let atualizacao = null;
    if (link) {
      const match2 = link.href.match(jsLinkRE);
      if (!match2 || match2.length < 9) return null;
      const [
        _2,
        numProcessoOriginario,
        agencia,
        strConta,
        idProcesso,
        numProcesso,
        strBanco,
        idRequisicaoBeneficiarioPagamento,
        strQtdMovimentos,
      ] = match2;
      const [conta, numBanco, qtdMovimentos] = [
        Number(strConta),
        Number(strBanco),
        Number(strQtdMovimentos),
      ].filter(x => !Number.isNaN(x));
      if (conta === void 0 || numBanco === void 0 || qtdMovimentos === void 0) {
        return null;
      }
      atualizacao = () =>
        atualizarSaldo(
          numProcessoOriginario,
          agencia,
          conta,
          idProcesso,
          numProcesso,
          numBanco,
          idRequisicaoBeneficiarioPagamento,
          qtdMovimentos
        );
    }
    return {
      saldo,
      atualizacao,
    };
  }
  function encontrarContaAtualizavel(xs, startAt = 0) {
    const len = xs.length;
    for (let i = startAt; i < len; i++) {
      if (xs[i].atualizacao !== null) return i;
    }
    return -1;
  }
  const Estado = createTaggedUnion({
    Ocioso: infoContas => ({
      infoContas,
    }),
    Erro: erro => ({
      erro,
    }),
  });
  const Acao = createTaggedUnion({
    Atualizar: null,
  });
  function paginaDepositos(numproc) {
    const barra = document.getElementById('divInfraBarraLocalizacao');
    if (!barra) {
      return Left(new Error('Barra de localização não encontrada.'));
    }
    const div = document.createElement('div');
    div.className = 'gm-atualizar-saldo__contas';
    barra.insertAdjacentElement('afterend', div);
    const bc = createMsgService();
    const store = createStore(
      () =>
        pipeValue(
          obterContas(),
          either(Estado.Erro)(infoContas => {
            bc.publish(
              Mensagem.InformaSaldoDeposito(
                numproc,
                infoContas.filter(x => x.saldo > 0).length
              )
            );
            bc.destroy();
            return Estado.Ocioso(infoContas);
          })
        ),
      (estado, acao) =>
        Acao.match(acao, {
          Atualizar: () =>
            Estado.match(estado, {
              Erro: () => estado,
              Ocioso: () => {
                consultarSaldoTodos();
                return estado;
              },
            }),
        })
    );
    const sub = store.subscribe(update);
    return Right(void 0);
    function App({ estado }) {
      return Estado.match(estado, {
        Ocioso: ({ infoContas }) => {
          const contasComSaldo = infoContas.filter(x => x.saldo > 0).length;
          const contasAtualizaveis = infoContas.filter(
            x => x.atualizacao
          ).length;
          const classe = contasComSaldo === 0 ? 'zerado' : 'saldo';
          const mensagem =
            contasComSaldo === 0
              ? 'Sem saldo em conta(s).'
              : contasComSaldo === 1
                ? 'Há 1 conta com saldo.'
                : `Há ${contasComSaldo} contas com saldo.`;
          const botao =
            contasAtualizaveis === 0
              ? null
              : o('button', {
                  onClick,
                  children: 'Atualizar',
                });
          return o(preact.Fragment, {
            children: [
              o('span', {
                class: classe,
                children: mensagem,
              }),
              o('br', {}),
              botao,
            ],
          });
        },
        Erro: ({ erro }) => {
          window.setTimeout(() => sub.unsubscribe(), 0);
          return o('span', {
            class: 'erro',
            children: erro.message,
          });
        },
      });
    }
    function onClick(evt) {
      evt.preventDefault();
      store.dispatch(Acao.Atualizar);
    }
    function update(estado) {
      preact.render(
        o(App, {
          estado,
        }),
        div
      );
    }
    function obterContas() {
      const tabela = document.querySelector('table#tblSaldoConta');
      if (!tabela) return Left(new Error('Tabela de contas não encontrada'));
      return pipeValue(
        Array.from(
          tabela.querySelectorAll('tr[id^="tblSaldoContaROW"]')
        ).filter(x => !/Saldos$/.test(x.id)),
        traverse$2(applicativeEither)(linha => {
          const info = obterInfoContaLinha(linha);
          return info
            ? Right(info)
            : Left(new Error('Erro ao obter dados das contas.'));
        })
      );
    }
  }
  function obterInfoContaLinha(row) {
    if (row.cells.length !== 11 && row.cells.length !== 13) return null;
    const textoSaldo = row.cells[row.cells.length - 4].textContent ?? '';
    const match = textoSaldo.match(/^R\$ ([0-9.]*\d,\d{2})$/);
    if (!match || match.length < 2) return null;
    const [, numeros] = match;
    const saldo = Number(numeros.replace(/\./g, '').replace(',', '.'));
    const link = row.cells[row.cells.length - 1].querySelector(
      'a[onclick^="consultarSaldo("]'
    );
    const atualizacao = link !== null;
    return {
      saldo,
      atualizacao,
    };
  }
  function obter(selector, msg) {
    const elt = document.querySelector(selector);
    if (isNull(elt)) return Left(new Error(msg));
    else return Right(elt);
  }
  function paginaProcesso(numproc) {
    return pipeValue(
      sequence(applicativeEither)({
        informacoesAdicionais: obterInformacoesAdicionais(),
        linkDepositos: obterLinkDepositos(),
        linkRPV: obterLinkRPV(),
      }),
      map(props =>
        modificarPaginaProcesso({
          ...props,
          numproc,
        })
      )
    );
  }
  function modificarPaginaProcesso({
    informacoesAdicionais,
    linkRPV,
    linkDepositos,
    numproc,
  }) {
    const Estado2 = createTaggedUnion({
      AguardaVerificacaoInicial: null,
      AguardaAtualizacao: ({ rpv, depositos }) => ({
        rpv,
        depositos,
      }),
      Ocioso: ({ rpv, depositos }) => ({
        rpv,
        depositos,
      }),
      Erro: null,
    });
    const Acao2 = createTaggedUnion({
      Erro: null,
      PaginaContasAberta: null,
      VerificacaoTerminada: ({ rpv, depositos }) => ({
        rpv,
        depositos,
      }),
      AtualizacaoRPV: ({ quantidade, atualiza }) => ({
        quantidade,
        atualiza,
      }),
      AtualizacaoDepositos: ({ quantidade, atualiza }) => ({
        quantidade,
        atualiza,
      }),
      Clique: alvo => ({
        alvo,
      }),
    });
    const bc = createMsgService();
    const store = createStore(
      () => {
        const AGUARDAR_MS = 3e4;
        const timer = window.setTimeout(() => {
          observer.disconnect();
          store.dispatch(Acao2.Erro);
        }, AGUARDAR_MS);
        const observer = new MutationObserver(() => {
          window.clearTimeout(timer);
          observer.disconnect();
          const info = {
            rpv: {
              quantidade: 0,
              atualiza: false,
            },
            depositos: {
              quantidade: 0,
              atualiza: false,
            },
          };
          if (linkRPV.textContent === 'Há conta com saldo')
            info.rpv = {
              quantidade: void 0,
              atualiza: true,
            };
          if (linkDepositos.textContent === 'Há conta com saldo')
            info.depositos = {
              quantidade: void 0,
              atualiza: false,
            };
          store.dispatch(Acao2.VerificacaoTerminada(info));
        });
        observer.observe(linkRPV, {
          childList: true,
        });
        bc.subscribe(msg => {
          Mensagem.match(msg, {
            InformaContas: ({
              numproc: msgNumproc,
              qtdComSaldo,
              permiteAtualizar,
            }) => {
              if (msgNumproc !== numproc) return;
              store.dispatch(
                Acao2.AtualizacaoRPV({
                  quantidade: qtdComSaldo,
                  atualiza: permiteAtualizar,
                })
              );
            },
            InformaSaldoDeposito: ({ numproc: msgNumproc, qtdComSaldo }) => {
              if (msgNumproc !== numproc) return;
              store.dispatch(
                Acao2.AtualizacaoDepositos({
                  quantidade: qtdComSaldo,
                  atualiza: false,
                })
              );
            },
            PerguntaAtualizar: ({ numproc: msgNumproc }) => {
              if (msgNumproc !== numproc) return;
              store.dispatch(Acao2.PaginaContasAberta);
            },
            RespostaAtualizar: () => {},
          });
        });
        return Estado2.AguardaVerificacaoInicial;
      },
      (estado, acao) =>
        Acao2.match(acao, {
          AtualizacaoDepositos: ({ quantidade, atualiza }) =>
            Estado2.match(estado, {
              AguardaAtualizacao: ({ rpv }) =>
                Estado2.AguardaAtualizacao({
                  rpv,
                  depositos: {
                    quantidade,
                    atualiza,
                  },
                }),
              AguardaVerificacaoInicial: () => Estado2.Erro,
              Erro: () => estado,
              Ocioso: ({ rpv }) =>
                Estado2.Ocioso({
                  rpv,
                  depositos: {
                    quantidade,
                    atualiza,
                  },
                }),
            }),
          AtualizacaoRPV: ({ quantidade, atualiza }) =>
            Estado2.match(estado, {
              AguardaAtualizacao: ({ depositos }) =>
                Estado2.Ocioso({
                  rpv: {
                    quantidade,
                    atualiza,
                  },
                  depositos,
                }),
              AguardaVerificacaoInicial: () => Estado2.Erro,
              Erro: () => estado,
              Ocioso: ({ depositos }) =>
                Estado2.Ocioso({
                  rpv: {
                    quantidade,
                    atualiza,
                  },
                  depositos,
                }),
            }),
          Clique: ({ alvo }) =>
            Estado2.match(estado, {
              AguardaVerificacaoInicial: () => estado,
              AguardaAtualizacao: () => estado,
              Ocioso: dados => {
                if (alvo === 'BOTAO_DEP' || alvo === 'LINK_DEP') {
                  window.open(linkDepositos.href);
                } else if (alvo === 'BOTAO_RPV' || alvo === 'LINK_RPV') {
                  window.open(linkRPV.href);
                  if (alvo === 'BOTAO_RPV' && dados.rpv.atualiza) {
                    return Estado2.AguardaAtualizacao(dados);
                  }
                }
                return estado;
              },
              Erro: () => estado,
            }),
          Erro: () =>
            Estado2.match(
              estado,
              {
                Erro: () => estado,
              },
              () => {
                bc.destroy();
                return Estado2.Erro;
              }
            ),
          PaginaContasAberta: () =>
            Estado2.match(estado, {
              AguardaVerificacaoInicial: () => Estado2.Erro,
              AguardaAtualizacao: () => {
                bc.publish(Mensagem.RespostaAtualizar(numproc, true));
                return estado;
              },
              Ocioso: () => estado,
              Erro: () => estado,
            }),
          VerificacaoTerminada: ({ rpv, depositos }) => {
            const ocioso = Estado2.Ocioso({
              rpv,
              depositos,
            });
            return Estado2.match(estado, {
              AguardaVerificacaoInicial: () => ocioso,
              AguardaAtualizacao: () => ocioso,
              Ocioso: () => ocioso,
              Erro: () => estado,
            });
          },
        })
    );
    let div;
    const sub = store.subscribe(estado => {
      if (!div) {
        div = document.createElement('div');
        div.className = 'gm-atualizar-saldo__processo';
        informacoesAdicionais.insertAdjacentElement('beforebegin', div);
      }
      preact.render(
        o(App, {
          estado,
        }),
        div
      );
    });
    function onClick(evt) {
      const tipoBotao = evt.target?.dataset.botao;
      if (tipoBotao === 'RPV') {
        store.dispatch(Acao2.Clique('BOTAO_RPV'));
      } else if (tipoBotao === 'DEP') {
        store.dispatch(Acao2.Clique('BOTAO_DEP'));
      } else {
        return;
      }
      evt.preventDefault();
    }
    function App({ estado }) {
      return Estado2.match(estado, {
        AguardaVerificacaoInicial: () =>
          o('output', {
            children: 'Verificando contas com saldo...',
          }),
        AguardaAtualizacao: () =>
          o('output', {
            children: 'Aguardando atualização das contas...',
          }),
        Ocioso: ({ depositos, rpv }) => {
          const qDep = depositos.quantidade;
          const qRPV = rpv.quantidade;
          const classe = qDep === 0 && qRPV === 0 ? 'zerado' : 'saldo';
          function textoContas(qtd) {
            if (qtd === void 0) return 'conta(s)';
            if (qtd === 1) return `1 conta`;
            return `${qtd} contas`;
          }
          const msgR =
            qRPV === 0
              ? null
              : `${textoContas(qRPV)} de requisição de pagamento`;
          const msgD =
            qDep === 0 ? null : `${textoContas(qDep)} de depósito judicial`;
          const msgs = [msgR, msgD].filter(x => x !== null);
          const mensagem =
            msgs.length === 0
              ? 'Sem saldo em conta(s).'
              : `Há ${msgs.join(' e ')} com saldo.`;
          return o(MensagemComBotao, {
            classe,
            mensagem,
            rpv: qRPV ?? -1,
            dep: qDep ?? -1,
          });
        },
        Erro: () => {
          sub.unsubscribe();
          return o(MensagemComBotao, {
            classe: 'erro',
            mensagem: 'Ocorreu um erro com a atualização de saldos.',
            rpv: 0,
            dep: 0,
          });
        },
      });
    }
    function MensagemComBotao({ classe, mensagem, rpv, dep }) {
      return o(preact.Fragment, {
        children: [
          o('span', {
            class: classe,
            children: mensagem,
          }),
          ' ',
          o('button', {
            'type': 'button',
            'data-botao': 'RPV',
            onClick,
            'class': rpv === 0 ? 'zerado' : 'saldo',
            'children': 'RPVs/precatórios',
          }),
          ' ',
          o('button', {
            'type': 'button',
            'data-botao': 'DEP',
            onClick,
            'class': dep === 0 ? 'zerado' : 'saldo',
            'children': 'Depósitos judiciais',
          }),
        ],
      });
    }
  }
  function obterLinkRPV() {
    return obter(
      'a#labelPrecatorios',
      'Link para requisições de pagamento não encontrado.'
    );
  }
  function obterLinkDepositos() {
    return obter(
      'a#labelDepositoJudicial',
      'Link para depósitos judiciais não encontrado.'
    );
  }
  function obterInformacoesAdicionais() {
    return obter(
      '#fldInformacoesAdicionais',
      'Tabela de informações adicionais não encontrada.'
    );
  }
  const paginas = {
    processo_selecionar: paginaProcesso,
    processo_precatorio_rpv: paginaContas,
    processo_depositos_judiciais: paginaDepositos,
  };
  const isAcaoReconhecida = isAnyOf(
    ...Object.keys(paginas).map(k => isLiteral(k))
  );
  function main() {
    const params = new URL(document.location.href).searchParams;
    const acao = validar(
      params,
      'acao',
      'Página desconhecida',
      isAcaoReconhecida,
      acao2 => `Ação desconhecida: "${acao2}".`
    );
    const numproc = validar(
      params,
      'num_processo',
      'Número do processo não encontrado.',
      isNumproc,
      numproc2 => `Número de processo inválido: "${numproc2}".`
    );
    return pipeValue(
      {
        acao,
        numproc,
      },
      sequence(applicativeEither),
      bind(({ acao: acao2, numproc: numproc2 }) => paginas[acao2](numproc2))
    );
  }
  function validar(
    params,
    nomeParametro,
    mensagemSeVazio,
    validacao,
    mensagemSeInvalido
  ) {
    const valor = params.get(nomeParametro);
    if (isNull(valor)) return Left(new Error(mensagemSeVazio));
    if (!validacao(valor)) return Left(new Error(mensagemSeInvalido(valor)));
    return Right(valor);
  }
  pipeValue(
    main(),
    catchError(error => {
      console.group('<atualizar-saldo>');
      console.error(error);
      console.groupEnd();
      return Right(void 0);
    })
  );
})(preact);
