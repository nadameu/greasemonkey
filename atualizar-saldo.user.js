// ==UserScript==
// @name         atualizar-saldos
// @name:pt-BR   Atualizar saldos
// @namespace    http://nadameu.com.br
// @version      4.2.0
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
// @require      https://unpkg.com/preact@10.11.0/dist/preact.min.js
// ==/UserScript==

(o => {
  const a = document.createElement('style');
  (a.dataset.source = 'vite-plugin-monkey'), (a.textContent = o), document.head.append(a);
})(
  ' .gm-atualizar-saldo__contas,.gm-atualizar-saldo__processo{--button-bg: hsl(266deg, 25%, 40%);--fg-color: hsl(266deg, 80%, 15%);--border-color: hsl(266deg, 10%, 40%)}.gm-atualizar-saldo__contas span,.gm-atualizar-saldo__processo span{line-height:2em;color:var(--fg-color)}.gm-atualizar-saldo__contas span.zerado,.gm-atualizar-saldo__processo span.zerado{--fg-color: hsl(266, 10%, 40%)}.gm-atualizar-saldo__contas span.erro,.gm-atualizar-saldo__processo span.erro{--fg-color: hsl(0, 85%, 40%)}.gm-atualizar-saldo__contas span.saldo,.gm-atualizar-saldo__processo span.saldo{--fg-color: hsl(266, 75%, 25%)}.gm-atualizar-saldo__contas button,.gm-atualizar-saldo__processo button{border:none;border-radius:4px;padding:4px 12px;font-size:1.3em;color:#fff;box-shadow:0 2px 4px #00000080;background:var(--button-bg)}.gm-atualizar-saldo__contas button.zerado,.gm-atualizar-saldo__processo button.zerado{--button-bg: hsl(266deg, 5%, 50%)}.gm-atualizar-saldo__contas button:hover,.gm-atualizar-saldo__contas button:focus,.gm-atualizar-saldo__processo button:hover,.gm-atualizar-saldo__processo button:focus{--button-bg: hsl(266deg, 40%, 45%)}.gm-atualizar-saldo__contas button:active,.gm-atualizar-saldo__processo button:active{box-shadow:none;translate:0 2px}.gm-atualizar-saldo__processo{margin:0 2px 8px;border-left:4px solid var(--border-color);padding:0 4px}.gm-atualizar-saldo__contas{border-left:4px solid var(--border-color);padding:0 4px} '
);

(function (preact) {
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
  function validateAll(eithers) {
    return validateMap(eithers, x => x);
  }
  function validateMap(collection, transform) {
    const errors = [];
    const results = [];
    let i = 0;
    for (const value of collection) {
      const either = transform(value, i++);
      if (either.isLeft) errors.push(either.leftValue);
      else results.push(either.rightValue);
    }
    if (errors.length > 0) return Left(errors);
    return Right(results);
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
      return Left([new Error('Barra de localização não encontrada.')]);
    }
    const div = document.createElement('div');
    div.className = 'gm-atualizar-saldo__contas';
    barra.insertAdjacentElement('afterend', div);
    let sub = null;
    const bc = createMsgService();
    const store = createStore(
      () => {
        const estado = obterContas().match({
          Left: Estado$1.Erro,
          Right: Estado$1.Ocioso,
        });
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
                Estado$1.Erro(new Error('Tentativa de atualização durante outra atualização.')),
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
                  const qtdComSaldo = infoNova.map(x => x.saldo).filter(x => x > 0).length;
                  const permiteAtualizar = infoNova.some(x => x.atualizacao !== null);
                  bc.publish(Mensagem.InformaContas(numproc, qtdComSaldo, permiteAtualizar));
                  return Estado$1.Ocioso(infoNova);
                }
                infoNova[proxima].atualizacao();
                return Estado$1.Atualizando(infoNova, proxima);
              },
            }),
          ErroComunicacao: ({ mensagem = 'Ocorreu um erro na atualização dos saldos.' }) =>
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
          const contasAtualizaveis = infoContas.map(x => x.atualizacao).filter(x => x !== null);
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
      const tabela = document.querySelector('#divInfraAreaDadosDinamica > table');
      if (!tabela) return Right([]);
      return traverse(tabela.querySelectorAll('tr[id^="tdConta"]'), obterInfoContaLinha$1)
        .mapLeft(e => new Error('Erro ao obter dados das contas.'))
        .map(infos =>
          infos.map(info => {
            if (info.saldo > 0) return info;
            else
              return {
                saldo: 0,
                atualizacao: null,
              };
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
          if (url.searchParams.get('acao_ajax') !== 'atualizar_precatorio_rpv') return;
          try {
            check(isLiteral(200), xhr.status);
            const responseXML = xhr.responseXML;
            if (responseXML) {
              const erros = responseXML.querySelectorAll('erros > erro');
              const mensagem =
                erros.length === 0
                  ? void 0
                  : Array.from(erros, erro => erro.getAttribute('descricao')?.trim() ?? '')
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
    if (row.cells.length !== 15) return Left(null);
    const celulaSaldo = row.querySelector('td[id^="saldoRemanescente"]');
    if (!celulaSaldo) {
      if ((row.cells[12]?.textContent ?? '').match(/^Valor estornado/))
        return Right({
          saldo: 0,
          atualizacao: null,
        });
      return Left(null);
    }
    const textoSaldo = celulaSaldo.textContent ?? '';
    const match = textoSaldo.match(/^R\$ ([0-9.]*\d,\d{2})$/);
    if (!match || match.length < 2) return Left(null);
    const [, numeros] = match;
    const saldo = Number(numeros.replace(/\./g, '').replace(',', '.'));
    const link = row.cells[row.cells.length - 1].querySelector(
      'a[href^="javascript:atualizarSaldo("]'
    );
    let atualizacao = null;
    if (link) {
      const match2 = link.href.match(jsLinkRE);
      if (!match2 || match2.length < 9) return Left(null);
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
        return Left(null);
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
    return Right({
      saldo,
      atualizacao,
    });
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
      return Left([new Error('Barra de localização não encontrada.')]);
    }
    const div = document.createElement('div');
    div.className = 'gm-atualizar-saldo__contas';
    barra.insertAdjacentElement('afterend', div);
    const bc = createMsgService();
    const store = createStore(
      () =>
        obterContas().match({
          Left: Estado.Erro,
          Right: infoContas => {
            bc.publish(
              Mensagem.InformaSaldoDeposito(numproc, infoContas.filter(x => x.saldo > 0).length)
            );
            bc.destroy();
            return Estado.Ocioso(infoContas);
          },
        }),
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
          const contasAtualizaveis = infoContas.filter(x => x.atualizacao).length;
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
      return traverse(
        Array.from(tabela.querySelectorAll('tr[id^="tblSaldoContaROW"]')).filter(
          x => !/Saldos$/.test(x.id)
        ),
        obterInfoContaLinha
      ).mapLeft(e => new Error('Erro ao obter dados das contas.'));
    }
  }
  function obterInfoContaLinha(row) {
    if (row.cells.length !== 11 && row.cells.length !== 13) return Left(null);
    const textoSaldo = row.cells[row.cells.length - 4].textContent ?? '';
    const match = textoSaldo.match(/^R\$ ([0-9.]*\d,\d{2})$/);
    if (!match || match.length < 2) return Left(null);
    const [, numeros] = match;
    const saldo = Number(numeros.replace(/\./g, '').replace(',', '.'));
    const link = row.cells[row.cells.length - 1].querySelector('a[onclick^="consultarSaldo("]');
    const atualizacao = link !== null;
    return Right({
      saldo,
      atualizacao,
    });
  }
  function obter(selector, msg) {
    const elt = document.querySelector(selector);
    if (isNull(elt)) return Left(new Error(msg));
    else return Right(elt);
  }
  function paginaProcesso(numproc) {
    return validateAll([obterInformacoesAdicionais(), obterLinkRPV(), obterLinkDepositos()]).map(
      ([informacoesAdicionais, linkRPV, linkDepositos]) =>
        modificarPaginaProcesso({
          informacoesAdicionais,
          linkRPV,
          linkDepositos,
          numproc,
        })
    );
  }
  function modificarPaginaProcesso({ informacoesAdicionais, linkRPV, linkDepositos, numproc }) {
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
            InformaContas: ({ numproc: msgNumproc, qtdComSaldo, permiteAtualizar }) => {
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
          const msgR = qRPV === 0 ? null : `${textoContas(qRPV)} de requisição de pagamento`;
          const msgD = qDep === 0 ? null : `${textoContas(qDep)} de depósito judicial`;
          const msgs = [msgR, msgD].filter(x => x !== null);
          const mensagem =
            msgs.length === 0 ? 'Sem saldo em conta(s).' : `Há ${msgs.join(' e ')} com saldo.`;
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
    return obter('a#labelPrecatorios', 'Link para requisições de pagamento não encontrado.');
  }
  function obterLinkDepositos() {
    return obter('a#labelDepositoJudicial', 'Link para depósitos judiciais não encontrado.');
  }
  function obterInformacoesAdicionais() {
    return obter('#fldInformacoesAdicionais', 'Tabela de informações adicionais não encontrada.');
  }
  const paginas = {
    processo_selecionar: paginaProcesso,
    processo_precatorio_rpv: paginaContas,
    processo_depositos_judiciais: paginaDepositos,
  };
  const isAcaoReconhecida = isAnyOf(...Object.keys(paginas).map(k => isLiteral(k)));
  function main() {
    const params = new URL(document.location.href).searchParams;
    return validateAll([obterAcao(params), obterNumProc(params)]).chain(([acao, numproc]) =>
      paginas[acao](numproc)
    );
  }
  function obterAcao(params) {
    const acao = params.get('acao');
    if (isNull(acao)) return Left(new Error('Página desconhecida'));
    if (!isAcaoReconhecida(acao)) return Left(new Error(`Ação desconhecida: "${acao}".`));
    return Right(acao);
  }
  function obterNumProc(params) {
    const numproc = params.get('num_processo');
    if (isNull(numproc)) return Left(new Error('Número do processo não encontrado.'));
    if (!isNumproc(numproc)) return Left(new Error(`Número de processo inválido: "${numproc}".`));
    return Right(numproc);
  }
  main().mapLeft(errors => {
    console.group('<atualizar-saldo>');
    for (const error of errors) {
      console.error(error);
    }
    console.groupEnd();
  });
})(preact);
