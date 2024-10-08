// ==UserScript==
// @name Precatórios/RPVs
// @version 22.0.2
// @description Auxilia a conferência de RPVs e precatórios.
// @namespace http://nadameu.com.br/precatorios-rpv
// @include /^https:\/\/eproc\.(trf4|jf(pr|rs|sc))\.jus\.br\/eproc(2trf4|V2)\/controlador\.php\?acao=processo_selecionar\&/
// @include /^https:\/\/eproc\.(trf4|jf(pr|rs|sc))\.jus\.br\/eproc(2trf4|V2)\/controlador\.php\?acao=processo_precatorio_rpv\&/
// @include /^https:\/\/eproc\.(trf4|jf(pr|rs|sc))\.jus\.br\/eproc(2trf4|V2)\/controlador\.php\?acao=oficio_requisitorio_visualizar\&/
// @include /^https:\/\/eproc\.(trf4|jf(pr|rs|sc))\.jus\.br\/eproc(2trf4|V2)\/controlador\.php\?acao=oficio_requisitorio_listar\&/
// @website https://www.nadameu.com.br/
// @downloadURL https://github.com/nadameu/greasemonkey/raw/master/precatorios-rpv.user.js
// @updateURL https://github.com/nadameu/greasemonkey/raw/master/precatorios-rpv.meta.js
// @supportURL https://github.com/nadameu/precatorios-rpv/issues
// @grant GM_addStyle
// @grant GM_xmlhttpRequest
// ==/UserScript==

!(function (t) {
  var e = {};
  function n(r) {
    if (e[r]) return e[r].exports;
    var o = (e[r] = { i: r, l: !1, exports: {} });
    return t[r].call(o.exports, o, o.exports, n), (o.l = !0), o.exports;
  }
  (n.m = t),
    (n.c = e),
    (n.d = function (t, e, r) {
      n.o(t, e) || Object.defineProperty(t, e, { enumerable: !0, get: r });
    }),
    (n.r = function (t) {
      'undefined' != typeof Symbol &&
        Symbol.toStringTag &&
        Object.defineProperty(t, Symbol.toStringTag, { value: 'Module' }),
        Object.defineProperty(t, '__esModule', { value: !0 });
    }),
    (n.t = function (t, e) {
      if ((1 & e && (t = n(t)), 8 & e)) return t;
      if (4 & e && 'object' == typeof t && t && t.__esModule) return t;
      var r = Object.create(null);
      if (
        (n.r(r),
        Object.defineProperty(r, 'default', { enumerable: !0, value: t }),
        2 & e && 'string' != typeof t)
      )
        for (var o in t)
          n.d(
            r,
            o,
            function (e) {
              return t[e];
            }.bind(null, o)
          );
      return r;
    }),
    (n.n = function (t) {
      var e =
        t && t.__esModule
          ? function () {
              return t.default;
            }
          : function () {
              return t;
            };
      return n.d(e, 'a', e), e;
    }),
    (n.o = function (t, e) {
      return Object.prototype.hasOwnProperty.call(t, e);
    }),
    (n.p = ''),
    n((n.s = 0));
})([
  function (t, e, n) {
    'use strict';
    n.r(e);
    var r = n(1),
      o = n(2);
    const a = n(49);
    (function () {
      return r.a(this, void 0, void 0, function* () {
        return (
          GM_addStyle(a), (yield Object(o.a)(document)).adicionarAlteracoes()
        );
      });
    })().then(
      t => console.log('Resultado:', t),
      t => console.error(t)
    );
  },
  function (t, e, n) {
    'use strict';
    n.d(e, 'a', function () {
      return r;
    });
    function r(t, e, n, r) {
      return new (n || (n = Promise))(function (o, a) {
        function i(t) {
          try {
            c(r.next(t));
          } catch (t) {
            a(t);
          }
        }
        function s(t) {
          try {
            c(r.throw(t));
          } catch (t) {
            a(t);
          }
        }
        function c(t) {
          t.done
            ? o(t.value)
            : new n(function (e) {
                e(t.value);
              }).then(i, s);
        }
        c((r = r.apply(t, e || [])).next());
      });
    }
  },
  function (t, e, n) {
    'use strict';
    n.d(e, 'a', function () {
      return l;
    });
    var r = n(3),
      o = n(16),
      a = n(40),
      i = n(47),
      s = n(32);
    const c = {
        processo_selecionar: o.a,
        processo_precatorio_rpv: r.a,
        oficio_requisitorio_visualizar: a.a,
        oficio_requisitorio_listar: i.a,
      },
      u = new WeakMap();
    function l(t) {
      if (u.has(t)) return Promise.resolve(u.get(t));
      let e = null;
      const n = Object(s.a)(
        t.location,
        t => t.href,
        t => new URL(t)
      );
      if (!n)
        return Promise.reject(
          new Error('Não foi possível obter o endereço da página.')
        );
      if (t.domain.match(/^eproc\.(trf4|jf(pr|rs|sc))\.jus\.br$/)) {
        const t = Object(s.a)(n, t => t.searchParams.get('acao'));
        t && t in c && (e = c[t]);
      }
      if (null !== e) {
        const n = new e(t);
        return u.set(t, n), Promise.resolve(n);
      }
      return Promise.reject(new Error(`Página desconhecida: ${n.href}`));
    }
  },
  function (t, e, n) {
    'use strict';
    n.d(e, 'a', function () {
      return h;
    });
    var r = n(1),
      o = n(4),
      a = n(5),
      i = n(6),
      s = n(14),
      c = n(15);
    class u extends Error {
      constructor(t) {
        super(t),
          (this.name = this.constructor.name),
          'function' == typeof Error.captureStackTrace
            ? Error.captureStackTrace(this, this.constructor)
            : (this.stack = new Error(t).stack);
      }
    }
    class l extends u {}
    const d = t => {
        const e = t.textContent;
        return e
          ? Promise.resolve(e)
          : Promise.reject(new Error(`Elemento não possui texto: ${t}`));
      },
      p = (t, e) =>
        Promise.resolve(t.cells).then(
          (t => e =>
            e.length > t && void 0 !== e[t]
              ? Promise.resolve(e[t])
              : Promise.reject(new Error(`Índice inexistente: ${t}.`)))(e)
        ),
      f = t => {
        const e = e => p(t, e),
          n = t =>
            e(t)
              .then(d)
              .then(t => t.trim());
        return {
          obterElems: (t, n) =>
            e(t)
              .then(t => t.querySelectorAll(n))
              .then(t => Array.from(t)),
          obterNumero: t => n(t).then(s.a),
          obterTexto: n,
        };
      },
      m = t => (e, n) => {
        const r = t.filter(t => t.searchParams.get(e) === n);
        return 0 === r.length
          ? Promise.reject(
              new l(`Não há URL com o parâmetro "${e}" igual a "${n}".`)
            )
          : Promise.resolve(r[0].href);
      };
    class h extends i.a {
      adicionarAlteracoes() {
        return r.a(this, void 0, void 0, function* () {
          const t = this.getWindow().opener;
          yield this.testarJanelaProcessoAberta();
          const e = yield this.obterRequisicoes();
          return Promise.all(
            e.map(e =>
              r.a(this, void 0, void 0, function* () {
                const n = yield p(e.linha, 2),
                  r = a.a.criar('Verificar dados', n => {
                    n.preventDefault(),
                      n.stopPropagation(),
                      this.solicitarAberturaRequisicao(t, e);
                  });
                return (
                  n.appendChild(this.doc.createTextNode(' ')),
                  n.appendChild(r),
                  e.numero
                );
              })
            )
          )
            .then(t => t.join(', '))
            .then(t => `Adicionado(s) botão(ões) à(s) requisição(ões) ${t}.`);
        });
      }
      obterRequisicao(t) {
        return r.a(this, void 0, void 0, function* () {
          const { obterNumero: e, obterTexto: n, obterElems: r } = f(t),
            o = yield e(0),
            a = yield n(1),
            i = (yield r(2, 'a[href]')).map(t => new URL(t.href)),
            s = m(i);
          return {
            linha: t,
            numero: o,
            status: a,
            urlConsultar: yield s('acao', 'oficio_requisitorio_visualizar'),
            urlEditar: yield s(
              'acao',
              'oficio_requisitorio_requisicoes_editar'
            ),
          };
        });
      }
      obterRequisicoes() {
        return r.a(this, void 0, void 0, function* () {
          const t = this.queryAll(
            '#divInfraAreaTabela > table tr[class^="infraTr"]'
          ).map(this.obterRequisicao);
          return (
            Object(c.a)(t).then(t => {
              t.filter(t => !(t instanceof l)).forEach(t => {
                console.log('instanceof Error', t instanceof Error),
                  console.log('instanceof LinkNotFound', t instanceof l),
                  console.warn(t);
              });
            }),
            Object(c.b)(t)
          );
        });
      }
      solicitarAberturaRequisicao(t, e) {
        const n = { acao: o.a.ABRIR_REQUISICAO, requisicao: e };
        t.postMessage(JSON.stringify(n), this.getLocation().origin);
      }
      testarJanelaProcessoAberta() {
        return r.a(this, void 0, void 0, function* () {
          const t = this.getWindow(),
            e = t.opener;
          if (!e || e === t)
            throw new Error('Janela do processo não está aberta.');
          const n = new Promise((t, e) => {
              setTimeout(
                e,
                3e3,
                new Error('Janela do processo não respondeu.')
              );
            }),
            r = new Promise((e, n) => {
              const r = ({ origin: n, data: a }) => {
                if (n === this.getLocation().origin) {
                  const { acao: n } = JSON.parse(a);
                  if (n === o.a.RESPOSTA_JANELA_ABERTA)
                    return t.removeEventListener('message', r), e(!0);
                }
              };
              t.addEventListener('message', r);
            }),
            a = { acao: o.a.VERIFICAR_JANELA };
          return (
            e.postMessage(JSON.stringify(a), this.getLocation().origin),
            Promise.race([r, n])
          );
        });
      }
    }
  },
  function (t, e, n) {
    'use strict';
    var r;
    !(function (t) {
      (t.ABRIR_DOCUMENTO = 'abrirDocumento'),
        (t.ABRIR_REQUISICAO = 'abrirRequisicao'),
        (t.BUSCAR_DADOS = 'buscarDados'),
        (t.EDITAR_REQUISICAO_ANTIGA = 'editarRequisicaoAntiga'),
        (t.EDITAR_REQUISICAO = 'editarRequisicao'),
        (t.ORDEM_CONFIRMADA = 'ordemConfirmada'),
        (t.PREPARAR_INTIMACAO_ANTIGA = 'prepararIntimacaoAntiga'),
        (t.REQUISICAO_ANTIGA_PREPARADA = 'requisicaoAntigaPreparada'),
        (t.RESPOSTA_DADOS = 'respostaDados'),
        (t.RESPOSTA_JANELA_ABERTA = 'respostaJanelaAberta'),
        (t.VERIFICAR_JANELA = 'verificarJanela');
    })(r || (r = {})),
      (e.a = r);
  },
  function (t, e, n) {
    'use strict';
    e.a = {
      criar(t, e) {
        const n = document.createElement('button');
        return (
          (n.className = 'infraButton'),
          (n.textContent = t),
          n.addEventListener('click', e),
          n
        );
      },
    };
  },
  function (t, e, n) {
    'use strict';
    n.d(e, 'a', function () {
      return o;
    });
    var r = n(7);
    class o {
      constructor(t) {
        this.doc = t;
      }
      getLocation() {
        const t = this.doc.location;
        if (!t) throw new Error('Objeto "location" não encontrado.');
        return t;
      }
      getWindow() {
        const t = this.doc.defaultView;
        if (!t) throw new Error('Janela não encontrada.');
        return t;
      }
      queryAll(t, e = this.doc) {
        return Array.from(e.querySelectorAll(t));
      }
      query(t, e = this.doc) {
        const n = e.querySelector(t);
        return null === n
          ? Promise.reject(new Error(`Elemento não encontrado: "${t}".`))
          : Promise.resolve(n);
      }
      queryOption(t, e = this.doc) {
        return r.fromNullable(e.querySelector(t));
      }
      queryTexto(t, e = this.doc) {
        return this.query(t, e).then(e => {
          const n = e.textContent;
          return n
            ? Promise.resolve(n)
            : Promise.reject(`Elemento não possui texto: ${t}.`);
        });
      }
      validarElemento(
        t,
        e,
        n = 'gm-resposta--correta',
        r = 'gm-resposta--incorreta',
        o = 'gm-resposta--indefinida'
      ) {
        const a = this.doc.querySelector(t);
        if (!a) throw new Error(`Elemento não encontrado: ${t}`);
        a.classList.add('gm-resposta'),
          !0 === e
            ? a.classList.add(n)
            : !1 === e
              ? a.classList.add(r)
              : void 0 === e && a.classList.add(o);
      }
    }
  },
  function (t, e, n) {
    'use strict';
    var r =
      (this && this.__assign) ||
      function () {
        return (r =
          Object.assign ||
          function (t) {
            for (var e, n = 1, r = arguments.length; n < r; n++)
              for (var o in (e = arguments[n]))
                Object.prototype.hasOwnProperty.call(e, o) && (t[o] = e[o]);
            return t;
          }).apply(this, arguments);
      };
    Object.defineProperty(e, '__esModule', { value: !0 });
    var o = n(8),
      a = n(9);
    e.URI = 'Option';
    var i = (function () {
      function t() {
        this._tag = 'None';
      }
      return (
        (t.prototype.map = function (t) {
          return e.none;
        }),
        (t.prototype.mapNullable = function (t) {
          return e.none;
        }),
        (t.prototype.ap = function (t) {
          return e.none;
        }),
        (t.prototype.ap_ = function (t) {
          return t.ap(this);
        }),
        (t.prototype.chain = function (t) {
          return e.none;
        }),
        (t.prototype.reduce = function (t, e) {
          return t;
        }),
        (t.prototype.alt = function (t) {
          return t;
        }),
        (t.prototype.orElse = function (t) {
          return t();
        }),
        (t.prototype.extend = function (t) {
          return e.none;
        }),
        (t.prototype.fold = function (t, e) {
          return t;
        }),
        (t.prototype.foldL = function (t, e) {
          return t();
        }),
        (t.prototype.getOrElse = function (t) {
          return t;
        }),
        (t.prototype.getOrElseL = function (t) {
          return t();
        }),
        (t.prototype.toNullable = function () {
          return null;
        }),
        (t.prototype.toUndefined = function () {}),
        (t.prototype.inspect = function () {
          return this.toString();
        }),
        (t.prototype.toString = function () {
          return 'none';
        }),
        (t.prototype.contains = function (t, e) {
          return !1;
        }),
        (t.prototype.isNone = function () {
          return !0;
        }),
        (t.prototype.isSome = function () {
          return !1;
        }),
        (t.prototype.exists = function (t) {
          return !1;
        }),
        (t.prototype.filter = function (t) {
          return e.none;
        }),
        (t.prototype.refine = function (t) {
          return e.none;
        }),
        (t.value = new t()),
        t
      );
    })();
    (e.None = i), (e.none = i.value);
    var s = (function () {
      function t(t) {
        (this.value = t), (this._tag = 'Some');
      }
      return (
        (t.prototype.map = function (e) {
          return new t(e(this.value));
        }),
        (t.prototype.mapNullable = function (t) {
          return e.fromNullable(t(this.value));
        }),
        (t.prototype.ap = function (n) {
          return n.isNone() ? e.none : new t(n.value(this.value));
        }),
        (t.prototype.ap_ = function (t) {
          return t.ap(this);
        }),
        (t.prototype.chain = function (t) {
          return t(this.value);
        }),
        (t.prototype.reduce = function (t, e) {
          return e(t, this.value);
        }),
        (t.prototype.alt = function (t) {
          return this;
        }),
        (t.prototype.orElse = function (t) {
          return this;
        }),
        (t.prototype.extend = function (e) {
          return new t(e(this));
        }),
        (t.prototype.fold = function (t, e) {
          return e(this.value);
        }),
        (t.prototype.foldL = function (t, e) {
          return e(this.value);
        }),
        (t.prototype.getOrElse = function (t) {
          return this.value;
        }),
        (t.prototype.getOrElseL = function (t) {
          return this.value;
        }),
        (t.prototype.toNullable = function () {
          return this.value;
        }),
        (t.prototype.toUndefined = function () {
          return this.value;
        }),
        (t.prototype.inspect = function () {
          return this.toString();
        }),
        (t.prototype.toString = function () {
          return 'some(' + o.toString(this.value) + ')';
        }),
        (t.prototype.contains = function (t, e) {
          return t.equals(this.value, e);
        }),
        (t.prototype.isNone = function () {
          return !1;
        }),
        (t.prototype.isSome = function () {
          return !0;
        }),
        (t.prototype.exists = function (t) {
          return t(this.value);
        }),
        (t.prototype.filter = function (t) {
          return this.exists(t) ? this : e.none;
        }),
        (t.prototype.refine = function (t) {
          return this.filter(t);
        }),
        t
      );
    })();
    (e.Some = s),
      (e.getSetoid = function (t) {
        return {
          equals: function (e, n) {
            return e.isNone()
              ? n.isNone()
              : !n.isNone() && t.equals(e.value, n.value);
          },
        };
      }),
      (e.getOrd = function (t) {
        return r({}, e.getSetoid(t), {
          compare: function (e, n) {
            return e.isSome()
              ? n.isSome()
                ? t.compare(e.value, n.value)
                : 1
              : n.isSome()
                ? -1
                : 0;
          },
        });
      });
    var c = function (t) {
        return new s(t);
      },
      u = function (t, e) {
        return t.chain(e);
      },
      l = function (t, e) {
        return t.alt(e);
      };
    (e.getApplySemigroup = function (t) {
      return {
        concat: function (n, r) {
          return n.isSome() && r.isSome()
            ? e.some(t.concat(n.value, r.value))
            : e.none;
        },
      };
    }),
      (e.getApplyMonoid = function (t) {
        return r({}, e.getApplySemigroup(t), { empty: e.some(t.empty) });
      }),
      (e.getFirstMonoid = function () {
        return { concat: l, empty: e.none };
      }),
      (e.getLastMonoid = function () {
        return a.getDualMonoid(e.getFirstMonoid());
      }),
      (e.getMonoid = function (t) {
        return {
          concat: function (n, r) {
            return n.isNone()
              ? r
              : r.isNone()
                ? n
                : e.some(t.concat(n.value, r.value));
          },
          empty: e.none,
        };
      }),
      (e.fromNullable = function (t) {
        return null == t ? e.none : new s(t);
      }),
      (e.some = c),
      (e.fromPredicate = function (t) {
        return function (n) {
          return t(n) ? e.some(n) : e.none;
        };
      }),
      (e.tryCatch = function (t) {
        try {
          return e.some(t());
        } catch (t) {
          return e.none;
        }
      }),
      (e.fromEither = function (t) {
        return t.isLeft() ? e.none : e.some(t.value);
      }),
      (e.isSome = function (t) {
        return t.isSome();
      }),
      (e.isNone = function (t) {
        return t.isNone();
      }),
      (e.fromRefinement = function (t) {
        return function (n) {
          return t(n) ? e.some(n) : e.none;
        };
      }),
      (e.getRefinement = function (t) {
        return function (e) {
          return t(e).isSome();
        };
      });
    var d = function (t) {
        if (t.isNone()) return { left: e.none, right: e.none };
        var n = t.value;
        return n.isLeft()
          ? { left: e.some(n.value), right: e.none }
          : { left: e.none, right: e.some(n.value) };
      },
      p = u;
    e.option = {
      URI: e.URI,
      map: function (t, e) {
        return t.map(e);
      },
      of: c,
      ap: function (t, e) {
        return e.ap(t);
      },
      chain: u,
      reduce: function (t, e, n) {
        return t.reduce(e, n);
      },
      foldMap: function (t) {
        return function (e, n) {
          return e.isNone() ? t.empty : n(e.value);
        };
      },
      foldr: function (t, e, n) {
        return t.isNone() ? e : n(t.value, e);
      },
      traverse: function (t) {
        return function (n, r) {
          return n.isNone() ? t.of(e.none) : t.map(r(n.value), e.some);
        };
      },
      sequence: function (t) {
        return function (n) {
          return n.isNone() ? t.of(e.none) : t.map(n.value, e.some);
        };
      },
      zero: function () {
        return e.none;
      },
      alt: l,
      extend: function (t, e) {
        return t.extend(e);
      },
      compact: function (t) {
        return t.chain(o.identity);
      },
      separate: d,
      filter: function (t, e) {
        return t.filter(e);
      },
      filterMap: p,
      partition: function (t, e) {
        return { left: t.filter(o.not(e)), right: t.filter(e) };
      },
      partitionMap: function (t, e) {
        return d(t.map(e));
      },
      wither: function (t) {
        return function (e, n) {
          return e.isNone() ? t.of(e) : n(e.value);
        };
      },
      wilt: function (t) {
        return function (n, r) {
          return n.isNone()
            ? t.of({ left: e.none, right: e.none })
            : t.map(r(n.value), function (t) {
                return t.isLeft()
                  ? { left: e.some(t.value), right: e.none }
                  : { left: e.none, right: e.some(t.value) };
              });
        };
      },
    };
  },
  function (t, e, n) {
    'use strict';
    function r(t, n, o) {
      return function (a) {
        var i = e.concat(o, [a]);
        return 0 === n ? t.apply(this, i) : r(t, n - 1, i);
      };
    }
    Object.defineProperty(e, '__esModule', { value: !0 }),
      (e.identity = function (t) {
        return t;
      }),
      (e.unsafeCoerce = e.identity),
      (e.not = function (t) {
        return function (e) {
          return !t(e);
        };
      }),
      (e.or = function (t, e) {
        return function (n) {
          return t(n) || e(n);
        };
      }),
      (e.and = function (t, e) {
        return function (n) {
          return t(n) && e(n);
        };
      }),
      (e.constant = function (t) {
        return function () {
          return t;
        };
      }),
      (e.constTrue = function () {
        return !0;
      }),
      (e.constFalse = function () {
        return !1;
      }),
      (e.constNull = function () {
        return null;
      }),
      (e.constUndefined = function () {}),
      (e.flip = function (t) {
        return function (e) {
          return function (n) {
            return t(n)(e);
          };
        };
      }),
      (e.on = function (t) {
        return function (e) {
          return function (n, r) {
            return t(e(n), e(r));
          };
        };
      }),
      (e.compose = function () {
        for (var t = [], e = 0; e < arguments.length; e++) t[e] = arguments[e];
        var n = t.length - 1;
        return function (e) {
          for (var r = e, o = n; o > -1; o--) r = t[o].call(this, r);
          return r;
        };
      }),
      (e.pipe = function () {
        for (var t = [], e = 0; e < arguments.length; e++) t[e] = arguments[e];
        var n = t.length - 1;
        return function (e) {
          for (var r = e, o = 0; o <= n; o++) r = t[o].call(this, r);
          return r;
        };
      }),
      (e.concat = function (t, e) {
        for (
          var n = t.length, r = e.length, o = Array(n + r), a = 0;
          a < n;
          a++
        )
          o[a] = t[a];
        for (a = 0; a < r; a++) o[a + n] = e[a];
        return o;
      }),
      (e.curried = r),
      (e.curry = function (t) {
        return r(t, t.length - 1, []);
      });
    (e.toString = function (t) {
      if ('string' == typeof t) return JSON.stringify(t);
      if (t instanceof Date) return "new Date('" + t.toISOString() + "')";
      if (Array.isArray(t)) return '[' + t.map(e.toString).join(', ') + ']';
      if ('function' == typeof t)
        return (n = t).displayName || n.name || '<function' + n.length + '>';
      var n;
      if (null == t) return String(t);
      if (
        'function' == typeof t.toString &&
        t.toString !== Object.prototype.toString
      )
        return t.toString();
      try {
        return JSON.stringify(t, null, 2);
      } catch (e) {
        return String(t);
      }
    }),
      (e.tuple = function (t, e) {
        return [t, e];
      }),
      (e.tupleCurried = function (t) {
        return function (e) {
          return [t, e];
        };
      }),
      (e.apply = function (t) {
        return function (e) {
          return t(e);
        };
      }),
      (e.applyFlipped = function (t) {
        return function (e) {
          return e(t);
        };
      }),
      (e.phantom = void 0),
      (e.constIdentity = function () {
        return e.identity;
      }),
      (e.increment = function (t) {
        return t + 1;
      }),
      (e.decrement = function (t) {
        return t - 1;
      });
  },
  function (t, e, n) {
    'use strict';
    var r =
      (this && this.__assign) ||
      function () {
        return (r =
          Object.assign ||
          function (t) {
            for (var e, n = 1, r = arguments.length; n < r; n++)
              for (var o in (e = arguments[n]))
                Object.prototype.hasOwnProperty.call(e, o) && (t[o] = e[o]);
            return t;
          }).apply(this, arguments);
      };
    Object.defineProperty(e, '__esModule', { value: !0 });
    var o = n(8),
      a = n(10);
    (e.fold = function (t) {
      return a.fold(t)(t.empty);
    }),
      (e.getProductMonoid = function (t, e) {
        return r({}, a.getProductSemigroup(t, e), {
          empty: [t.empty, e.empty],
        });
      }),
      (e.getDualMonoid = function (t) {
        return r({}, a.getDualSemigroup(t), { empty: t.empty });
      }),
      (e.monoidAll = r({}, a.semigroupAll, { empty: !0 })),
      (e.monoidAny = r({}, a.semigroupAny, { empty: !1 }));
    (e.unsafeMonoidArray = r({}, a.getArraySemigroup(), { empty: [] })),
      (e.getArrayMonoid = function () {
        return e.unsafeMonoidArray;
      });
    var i = {};
    (e.getDictionaryMonoid = function (t) {
      return r({}, a.getDictionarySemigroup(t), { empty: i });
    }),
      (e.monoidSum = r({}, a.semigroupSum, { empty: 0 })),
      (e.monoidProduct = r({}, a.semigroupProduct, { empty: 1 })),
      (e.monoidString = r({}, a.semigroupString, { empty: '' })),
      (e.monoidVoid = r({}, a.semigroupVoid, { empty: void 0 })),
      (e.getFunctionMonoid = function (t) {
        return function () {
          return r({}, a.getFunctionSemigroup(t)(), {
            empty: function () {
              return t.empty;
            },
          });
        };
      }),
      (e.getEndomorphismMonoid = function () {
        return { concat: o.compose, empty: o.identity };
      }),
      (e.getRecordMonoid = function (t) {
        for (var e = {}, n = 0, o = Object.keys(t); n < o.length; n++) {
          var i = o[n];
          e[i] = t[i].empty;
        }
        return r({}, a.getRecordSemigroup(t), { empty: e });
      }),
      (e.getMeetMonoid = function (t) {
        return r({}, a.getMeetSemigroup(t), { empty: t.top });
      }),
      (e.getJoinMonoid = function (t) {
        return r({}, a.getJoinSemigroup(t), { empty: t.bottom });
      });
  },
  function (t, e, n) {
    'use strict';
    var r =
      (this && this.__assign) ||
      function () {
        return (r =
          Object.assign ||
          function (t) {
            for (var e, n = 1, r = arguments.length; n < r; n++)
              for (var o in (e = arguments[n]))
                Object.prototype.hasOwnProperty.call(e, o) && (t[o] = e[o]);
            return t;
          }).apply(this, arguments);
      };
    Object.defineProperty(e, '__esModule', { value: !0 });
    var o = n(11),
      a = n(8);
    (e.fold = function (t) {
      return function (e) {
        return function (n) {
          return n.reduce(t.concat, e);
        };
      };
    }),
      (e.getFirstSemigroup = function () {
        return { concat: a.identity };
      }),
      (e.getLastSemigroup = function () {
        return {
          concat: function (t, e) {
            return e;
          },
        };
      }),
      (e.getProductSemigroup = function (t, e) {
        return {
          concat: function (n, r) {
            var o = n[0],
              a = n[1],
              i = r[0],
              s = r[1];
            return [t.concat(o, i), e.concat(a, s)];
          },
        };
      }),
      (e.getDualSemigroup = function (t) {
        return {
          concat: function (e, n) {
            return t.concat(n, e);
          },
        };
      }),
      (e.getFunctionSemigroup = function (t) {
        return function () {
          return {
            concat: function (e, n) {
              return function (r) {
                return t.concat(e(r), n(r));
              };
            },
          };
        };
      }),
      (e.getRecordSemigroup = function (t) {
        return {
          concat: function (e, n) {
            for (var r = {}, o = 0, a = Object.keys(t); o < a.length; o++) {
              var i = a[o];
              r[i] = t[i].concat(e[i], n[i]);
            }
            return r;
          },
        };
      }),
      (e.getMeetSemigroup = function (t) {
        return { concat: o.min(t) };
      }),
      (e.getJoinSemigroup = function (t) {
        return { concat: o.max(t) };
      }),
      (e.semigroupAll = {
        concat: function (t, e) {
          return t && e;
        },
      }),
      (e.semigroupAny = {
        concat: function (t, e) {
          return t || e;
        },
      }),
      (e.getArraySemigroup = function () {
        return {
          concat: function (t, e) {
            return a.concat(t, e);
          },
        };
      }),
      (e.getDictionarySemigroup = function (t) {
        return {
          concat: function (e, n) {
            for (
              var o = r({}, e), a = Object.keys(n), i = a.length, s = 0;
              s < i;
              s++
            ) {
              var c = a[s];
              o[c] = e.hasOwnProperty(c) ? t.concat(e[c], n[c]) : n[c];
            }
            return o;
          },
        };
      });
    var i = e.getDictionarySemigroup(e.getLastSemigroup());
    (e.getObjectSemigroup = function () {
      return i;
    }),
      (e.semigroupSum = {
        concat: function (t, e) {
          return t + e;
        },
      }),
      (e.semigroupProduct = {
        concat: function (t, e) {
          return t * e;
        },
      }),
      (e.semigroupString = {
        concat: function (t, e) {
          return t + e;
        },
      }),
      (e.semigroupVoid = { concat: function () {} });
  },
  function (t, e, n) {
    'use strict';
    var r =
      (this && this.__assign) ||
      function () {
        return (r =
          Object.assign ||
          function (t) {
            for (var e, n = 1, r = arguments.length; n < r; n++)
              for (var o in (e = arguments[n]))
                Object.prototype.hasOwnProperty.call(e, o) && (t[o] = e[o]);
            return t;
          }).apply(this, arguments);
      };
    Object.defineProperty(e, '__esModule', { value: !0 });
    var o = n(12),
      a = n(13),
      i = n(8);
    (e.unsafeCompare = function (t, e) {
      return t < e ? -1 : t > e ? 1 : 0;
    }),
      (e.ordString = r({}, a.setoidString, { compare: e.unsafeCompare })),
      (e.ordNumber = r({}, a.setoidNumber, { compare: e.unsafeCompare })),
      (e.ordBoolean = r({}, a.setoidBoolean, { compare: e.unsafeCompare })),
      (e.lessThan = function (t) {
        return function (e, n) {
          return -1 === t.compare(e, n);
        };
      }),
      (e.greaterThan = function (t) {
        return function (e, n) {
          return 1 === t.compare(e, n);
        };
      }),
      (e.lessThanOrEq = function (t) {
        return function (e, n) {
          return 1 !== t.compare(e, n);
        };
      }),
      (e.greaterThanOrEq = function (t) {
        return function (e, n) {
          return -1 !== t.compare(e, n);
        };
      }),
      (e.min = function (t) {
        return function (e, n) {
          return 1 === t.compare(e, n) ? n : e;
        };
      }),
      (e.max = function (t) {
        return function (e, n) {
          return -1 === t.compare(e, n) ? n : e;
        };
      }),
      (e.clamp = function (t) {
        var n = e.min(t),
          r = e.max(t);
        return function (t, e) {
          return function (o) {
            return r(n(o, e), t);
          };
        };
      }),
      (e.between = function (t) {
        var n = e.lessThan(t),
          r = e.greaterThan(t);
        return function (t, e) {
          return function (o) {
            return !n(o, t) && !r(o, e);
          };
        };
      }),
      (e.fromCompare = function (t) {
        return {
          equals: function (e, n) {
            return 0 === t(e, n);
          },
          compare: t,
        };
      }),
      (e.contramap = function (t, n) {
        return e.fromCompare(i.on(n.compare)(t));
      }),
      (e.getSemigroup = function () {
        return {
          concat: function (t, n) {
            return e.fromCompare(function (e, r) {
              return o.semigroupOrdering.concat(
                t.compare(e, r),
                n.compare(e, r)
              );
            });
          },
        };
      }),
      (e.getProductOrd = function (t, e) {
        var n = a.getProductSetoid(t, e);
        return r({}, n, {
          compare: function (n, r) {
            var o = n[0],
              a = n[1],
              i = r[0],
              s = r[1],
              c = t.compare(o, i);
            return 0 === c ? e.compare(a, s) : c;
          },
        });
      }),
      (e.getDualOrd = function (t) {
        return e.fromCompare(function (e, n) {
          return t.compare(n, e);
        });
      }),
      (e.ordDate = e.contramap(function (t) {
        return t.valueOf();
      }, e.ordNumber));
  },
  function (t, e, n) {
    'use strict';
    Object.defineProperty(e, '__esModule', { value: !0 }),
      (e.sign = function (t) {
        return t <= -1 ? -1 : t >= 1 ? 1 : 0;
      }),
      (e.setoidOrdering = {
        equals: function (t, e) {
          return t === e;
        },
      }),
      (e.semigroupOrdering = {
        concat: function (t, e) {
          return 0 !== t ? t : e;
        },
      }),
      (e.invert = function (t) {
        switch (t) {
          case -1:
            return 1;
          case 1:
            return -1;
          default:
            return 0;
        }
      });
  },
  function (t, e, n) {
    'use strict';
    Object.defineProperty(e, '__esModule', { value: !0 });
    var r = n(8);
    e.strictEqual = function (t, e) {
      return t === e;
    };
    var o = { equals: e.strictEqual };
    (e.setoidString = o),
      (e.setoidNumber = o),
      (e.setoidBoolean = o),
      (e.getArraySetoid = function (t) {
        return {
          equals: function (e, n) {
            return (
              e.length === n.length &&
              e.every(function (e, r) {
                return t.equals(e, n[r]);
              })
            );
          },
        };
      }),
      (e.getRecordSetoid = function (t) {
        return {
          equals: function (e, n) {
            for (var r in t) if (!t[r].equals(e[r], n[r])) return !1;
            return !0;
          },
        };
      }),
      (e.getProductSetoid = function (t, e) {
        return {
          equals: function (n, r) {
            var o = n[0],
              a = n[1],
              i = r[0],
              s = r[1];
            return t.equals(o, i) && e.equals(a, s);
          },
        };
      }),
      (e.contramap = function (t, e) {
        return { equals: r.on(e.equals)(t) };
      }),
      (e.setoidDate = e.contramap(function (t) {
        return t.valueOf();
      }, e.setoidNumber));
  },
  function (t, e, n) {
    'use strict';
    function r(t) {
      return parseInt(t, 10);
    }
    n.d(e, 'a', function () {
      return r;
    });
  },
  function (t, e, n) {
    'use strict';
    function r(t) {
      return Promise.all(
        Array.from(t).map(t =>
          t.then(
            t => [],
            t => [t]
          )
        )
      ).then(t => t.reduce((t, e) => t.concat(e), []));
    }
    function o(t) {
      return Promise.all(
        Array.from(t).map(t =>
          t.then(
            t => [t],
            t => []
          )
        )
      ).then(t => t.reduce((t, e) => t.concat(e), []));
    }
    n.d(e, 'a', function () {
      return r;
    }),
      n.d(e, 'b', function () {
        return o;
      });
  },
  function (t, e, n) {
    'use strict';
    n.d(e, 'a', function () {
      return h;
    });
    var r = n(1),
      o = n(17),
      a = n(18),
      i = n(7),
      s = n(4),
      c = n(5),
      u = n(19),
      l = n(6),
      d = n(30),
      p = n(33),
      f = n(36);
    const m = n(39);
    class h extends l.a {
      constructor() {
        super(...arguments),
          (this.janelasDependentes = new Map()),
          (this.urlEditarRequisicoes = new Map());
      }
      obterAssuntos() {
        const t = this.queryOption('table[summary="Assuntos"]'),
          e = a
            .catOptions([t])
            .map(t => Array.from(t.rows).filter((t, e) => e > 0))
            .reduce((t, e) => t.concat(e), [])
            .map(b(0));
        return a.catOptions(e);
      }
      obterAutor(t) {
        const e = v(t),
          n = g('td', t),
          r = n
            .chain(t => this.queryOption('span[id^="spnCpfParteAutor"]', t))
            .mapNullable(t => t.textContent)
            .map(t => t.replace(/\D/g, ''));
        return Object(o.liftA3)(i.option)(t => e => n => {
          const r = this.queryAll('a', e).filter(t =>
              i
                .fromNullable(t.getAttribute('onmouseover'))
                .fold(!1, t => /ADVOGADO/.test(t))
            ),
            o = a.catOptions(
              r.map(t =>
                i
                  .fromNullable(t.previousElementSibling)
                  .mapNullable(t => t.textContent)
              )
            );
          return { nome: t, cpfCnpj: n, advogados: o };
        })(e)(n)(r);
      }
      obterAutores() {
        const t = this.queryAll('a[data-parte="AUTOR"]').map(t =>
          this.obterAutor(t)
        );
        return a.catOptions(t);
      }
      obterAutuacao() {
        return r.a(this, void 0, void 0, function* () {
          return u.d.analisar(yield this.queryTexto('#txtAutuacao'));
        });
      }
      obterCalculos() {
        return this.destacarDocumentosPorTipo('CALC');
      }
      obterContratos() {
        return r.a(this, void 0, void 0, function* () {
          const t = yield this.destacarDocumentosPorTipo('CONHON');
          if (t.length > 0) return t;
          const e = yield this.destacarDocumentosPorMemo(/contrato|honor/i),
            n = yield this.destacarDocumentosPorTipo('PROC');
          return [].concat(e, n);
        });
      }
      obterDespachosCitacao() {
        return this.destacarDocumentosPorEvento(
          /Despacho\/Decisão - Determina Citação/
        );
      }
      obterHonorarios() {
        return r.a(this, void 0, void 0, function* () {
          return [].concat(
            yield this.destacarDocumentosPorTipo('SOLPGTOHON'),
            yield this.destacarDocumentosPorTipo('PGTOPERITO')
          );
        });
      }
      obterInformacoesAdicionais() {
        return this.query('#fldInformacoesAdicionais');
      }
      obterJusticaGratuita() {
        return this.queryOption('#lnkJusticaGratuita')
          .mapNullable(t => t.textContent)
          .getOrElse('???');
      }
      obterLinkListar() {
        return r.a(this, void 0, void 0, function* () {
          return this.query(
            'a[href^="controlador.php?acao=processo_precatorio_rpv&"]',
            yield this.obterInformacoesAdicionais()
          );
        });
      }
      obterMagistrado() {
        return this.queryTexto('#txtMagistrado');
      }
      obterNumproc() {
        return r.a(this, void 0, void 0, function* () {
          return (yield this.obterNumprocf()).replace(/\D/g, '');
        });
      }
      obterNumprocf() {
        return this.queryTexto('#txtNumProcesso');
      }
      obterReus() {
        return this.queryAll('[id^="spnNomeParteReu"]')
          .map(v)
          .map(t => t.fold([], t => [t]))
          .reduce((t, e) => t.concat(e), []);
      }
      obterSentencas() {
        return this.destacarDocumentosPorEvento(
          /(^(Julgamento|Sentença))|Voto/
        );
      }
      obterTabelaEventos() {
        return this.query('#tblEventos');
      }
      obterTransito() {
        return r.a(this, void 0, void 0, function* () {
          const t =
              /(^(Julgamento|Sentença))|Voto|Recurso Extraordinário Inadmitido|Pedido de Uniformização para a Turma Nacional - Inadmitido/,
            e = /CIÊNCIA, COM RENÚNCIA AO PRAZO|Decurso de Prazo/,
            n = /Trânsito em Julgado/,
            r = /Data: (\d\d\/\d\d\/\d\d\d\d)/,
            s = Array.from((yield this.obterTabelaEventos()).tBodies)
              .map(t => Array.from(t.rows))
              .reduce((t, e) => t.concat(e), []),
            c = s.filter(t => b(3)(t).exists(t => n.test(t))),
            l = c.filter(t => b(3)(t).exists(t => r.test(t)));
          if (l.length > 0) {
            const t = l[0];
            t.classList.add('gmEventoDestacado');
            const e = b(3)(t)
              .mapNullable(t => t.match(r))
              .mapNullable(t => t[1])
              .map(t => u.c.analisar(t));
            if (e.isSome()) return { dataTransito: e.value };
          }
          let d = {};
          if (c.length > 0) {
            const t = c[0];
            t.classList.add('gmEventoDestacado');
            const e = b(2)(t).map(t => u.d.analisar(t));
            e.isSome() && (d = { dataEvento: e.value });
          }
          const f = s.filter(e => b(3)(e).exists(e => t.test(e)));
          if (f.length > 0) {
            const t = f[0],
              n = b(1)(t).map(t => p.a(t)),
              r = n.map(
                t =>
                  new RegExp(
                    `^Intimação Eletrônica - Expedida/Certificada - Julgamento|Refer\\. ao Evento: ${t}(\\D|$)`
                  )
              ),
              c = Object(o.liftA2)(i.option)(
                t => e =>
                  s
                    .filter(e =>
                      b(1)(e)
                        .map(t => p.a(t))
                        .exists(e => e <= t)
                    )
                    .filter(t => b(3)(t).exists(t => !e.test(t)))
                    .filter(t =>
                      i
                        .fromNullable(t.cells[3])
                        .mapNullable(t =>
                          t.querySelector('.infraEventoPrazoParte')
                        )
                        .mapNullable(t => t.dataset.parte)
                        .exists(t => /^(AUTOR|REU|MPF)$/.test(t))
                    )
              )(n)(r).getOrElse([]);
            if (c.length > 0) {
              const t =
                  /^return infraTooltipMostrar\('([^']+)','Informações do Evento',1000\);$/,
                n = a.mapOption(c, e =>
                  i
                    .fromNullable(e.cells[1])
                    .mapNullable(t => t.querySelector('a[onmouseover]'))
                    .mapNullable(t => t.getAttribute('onmouseover'))
                    .mapNullable(e => e.match(t))
                    .map(t => t[1])
                    .map(t => {
                      const e = this.doc.createElement('div');
                      return (
                        (e.innerHTML = t),
                        a.mapOption(Array.from(e.querySelectorAll('font')), t =>
                          i.fromNullable(t.textContent).map(t => t.trim())
                        )
                      );
                    })
                    .chain(t => {
                      const e = t.findIndex(
                        t => !!t && /^Fechamento do Prazo:$/.test(t)
                      );
                      if (-1 === e) return i.none;
                      const n = u.d.analisar(t[e + 1]),
                        r = t[e + 2];
                      return i
                        .fromNullable(r.match(/^(\d+) - (.+)$/))
                        .map(([, t, e]) => ({ numero: p.a(t), descricao: e }))
                        .map(({ numero: t, descricao: e }) => {
                          return { numero: t, data: n, descricao: e };
                        });
                    })
                );
              if (n.length > 0) {
                const t = n.reduce((t, e) => (t.numero > e.numero ? t : e)),
                  r = s.filter(e =>
                    b(1)(e)
                      .map(t => p.a(t))
                      .exists(e => e === t.numero)
                  );
                if (r.length > 0) {
                  r[0].classList.add('gmEventoDestacado'),
                    t.descricao.match(e)
                      ? (d.dataDecurso = t.data)
                      : (d.dataFechamento = t.data);
                }
              }
            }
          }
          return d;
        });
      }
      abrirDocumento(t, e) {
        return r.a(this, void 0, void 0, function* () {
          const n = yield this.query(`#tdEvento${t}Doc${e}`);
          (yield this.query('.infraLinkDocumento', n)).click();
        });
      }
      abrirJanela(t, e, n = !1) {
        this.fecharJanela(e);
        const r = n
            ? 'menubar,toolbar,location,personalbar,status,scrollbars'
            : '',
          o = window.open(t, e, r);
        o && this.janelasDependentes.set(e, o);
      }
      abrirJanelaEditarRequisicao(t, e, n = !1) {
        this.abrirJanela(t, `editar-requisicao${e}`, n);
      }
      abrirJanelaListar(t = !1) {
        return r.a(this, void 0, void 0, function* () {
          this.abrirJanela(
            (yield this.obterLinkListar()).href,
            `listarRequisicoes${yield this.obterNumproc()}`,
            t
          );
        });
      }
      abrirJanelaRequisicao(t, e, n = !1) {
        this.abrirJanela(t, `requisicao${e}`, n);
      }
      adicionarAlteracoes() {
        return r.a(this, void 0, void 0, function* () {
          GM_addStyle(m);
          const t = this.getWindow();
          t.addEventListener('pagehide', () => {
            this.fecharJanelasDependentes();
          }),
            t.addEventListener('message', this.onMensagemRecebida.bind(this)),
            yield this.adicionarBotao(),
            (yield this.obterLinkListar()).addEventListener(
              'click',
              this.onLinkListarClicado.bind(this)
            );
        });
      }
      consultarRequisicoesFinalizadas() {
        return r.a(this, void 0, void 0, function* () {
          const t = yield this.obterLinkListar(),
            e = yield f.a(t.href),
            n = new d.a(e),
            r = (yield n.obterRequisicoes()).filter(
              t => 'Finalizada' === t.status
            );
          if (1 === r.length) {
            const t = r[0];
            return (
              this.urlEditarRequisicoes.set(t.numero, t.urlEditar),
              this.abrirJanelaRequisicao(t.urlConsultar, t.numero)
            );
          }
          return this.abrirJanelaListar();
        });
      }
      adicionarBotao() {
        return this.obterInformacoesAdicionais()
          .then(t => {
            const e = t.parentElement;
            if (null == e)
              throw new Error('Informações adicionais não possui ancestral.');
            return n => {
              e.insertBefore(n, t.nextSibling);
            };
          })
          .then(t => {
            const e = c.a.criar('Conferir ofício requisitório', t => {
                t.preventDefault(),
                  t.stopPropagation(),
                  (() =>
                    r.a(this, void 0, void 0, function* () {
                      (e.textContent = 'Aguarde, carregando...'),
                        yield this.consultarRequisicoesFinalizadas(),
                        (e.textContent = 'Conferir ofício requisitório');
                    }))().catch(t => {
                    console.error(t);
                  });
              }),
              n = this.doc.createDocumentFragment();
            return (
              n.appendChild(this.doc.createElement('br')),
              n.appendChild(e),
              n.appendChild(this.doc.createElement('br')),
              t(n),
              Promise.all([e, this.obterTabelaEventos()])
            );
          })
          .then(([t, e]) => {
            try {
              const n = p.a(e.tBodies[0].rows[0].cells[1].textContent.trim());
              if (isNaN(n)) throw new Error('NaN.');
              return { botao: t, ultimoEvento: n };
            } catch (t) {
              throw new Error(
                `Não foi possível localizar o último evento do processo.: ${t.message}`
              );
            }
          })
          .then(({ botao: t, ultimoEvento: e }) => {
            e > 100 &&
              t.insertAdjacentHTML(
                'afterend',
                ' <div style="display: inline-block;"><span class="gmTextoDestacado">Processo possui mais de 100 eventos.</span> &mdash; <a href="#" onclick="event.preventDefault(); event.stopPropagation(); this.parentElement.style.display = \'none\'; carregarTodasPaginas(); return false;">Carregar todos os eventos</a></div>'
              );
          });
      }
      destacarDocumentos(t) {
        return r.a(this, void 0, void 0, function* () {
          return a.catOptions(
            Array.from((yield this.obterTabelaEventos()).tBodies)
              .map(t => Array.from(t.rows))
              .reduce((t, e) => t.concat(e), [])
              .map(e => {
                const n = a.catOptions(
                  t(e).map(t =>
                    i
                      .fromNullable(t.textContent)
                      .mapNullable(t => t.match(/^(.*?)(\d+)$/))
                      .map(([t, e, n]) => ({ ordem: p.a(n), nome: t, tipo: e }))
                  )
                );
                if (n.length > 0) {
                  e.classList.add('gmEventoDestacado');
                  const t = i
                      .fromNullable(e.cells[1])
                      .mapNullable(t => t.textContent)
                      .map(t => p.a(t)),
                    r = i
                      .fromNullable(e.cells[2])
                      .mapNullable(t => t.textContent)
                      .map(t => u.d.analisar(t)),
                    a = i
                      .fromNullable(e.cells[3])
                      .mapNullable(t =>
                        t.querySelector('label.infraEventoDescricao')
                      )
                      .mapNullable(t => t.textContent);
                  return Object(o.liftA3)(i.option)(t => e => r => ({
                    evento: t,
                    data: e,
                    descricao: r,
                    documentos: n,
                  }))(t)(r)(a);
                }
                return i.none;
              })
          );
        });
      }
      destacarDocumentosPorEvento(t) {
        return this.destacarDocumentos(e =>
          [e]
            .filter(e =>
              i
                .fromNullable(e.querySelector('td.infraEventoDescricao'))
                .mapNullable(t => t.textContent)
                .exists(e => t.test(e.trim()))
            )
            .map(t => this.queryAll('.infraLinkDocumento', t))
            .reduce((t, e) => t.concat(e), [])
        );
      }
      destacarDocumentosPorMemo(t) {
        return this.destacarDocumentos(e =>
          a.catOptions(
            this.queryAll('.infraTextoTooltip', e)
              .filter(e =>
                i
                  .some(e)
                  .mapNullable(t => t.textContent)
                  .exists(e => t.test(e))
              )
              .map(t =>
                g('td', t).chain(t =>
                  this.queryOption('.infraLinkDocumento', t)
                )
              )
          )
        );
      }
      destacarDocumentosPorTipo(...t) {
        const e = new RegExp('^(' + t.join('|') + ')\\d+$');
        return this.destacarDocumentos(t =>
          this.queryAll('.infraLinkDocumento', t).filter(t =>
            i.fromNullable(t.textContent).exists(t => e.test(t))
          )
        );
      }
      enviarDadosProcesso(t, e) {
        return r.a(this, void 0, void 0, function* () {
          const n = {
            acao: s.a.RESPOSTA_DADOS,
            dados: {
              assuntos: this.obterAssuntos(),
              autores: this.obterAutores(),
              autuacao: yield this.obterAutuacao(),
              calculos: yield this.obterCalculos(),
              despachosCitacao: yield this.obterDespachosCitacao(),
              contratos: yield this.obterContratos(),
              honorarios: yield this.obterHonorarios(),
              justicaGratuita: this.obterJusticaGratuita(),
              magistrado: yield this.obterMagistrado(),
              reus: this.obterReus(),
              sentencas: yield this.obterSentencas(),
              transito: yield this.obterTransito(),
            },
          };
          t.postMessage(JSON.stringify(n), e);
        });
      }
      enviarRespostaJanelaAberta(t, e) {
        const n = { acao: s.a.RESPOSTA_JANELA_ABERTA };
        this.enviarSolicitacao(t, e, n);
      }
      enviarSolicitacao(t, e, n) {
        t.postMessage(JSON.stringify(n), e);
      }
      fecharJanela(t) {
        const e = this.janelasDependentes.get(t);
        e && this.fecharObjetoJanela(e), this.janelasDependentes.delete(t);
      }
      fecharJanelasDependentes() {
        Array.from(this.janelasDependentes.keys()).forEach(t => {
          this.fecharJanela(t);
        });
      }
      fecharJanelaProcesso() {
        this.fecharJanelasDependentes();
        const t = this.getWindow().wrappedJSObject,
          e = t.documentosAbertos;
        if (e)
          for (let t in e) {
            let n = e[t];
            this.fecharObjetoJanela(n);
          }
        t.close();
      }
      fecharJanelaRequisicao(t) {
        this.fecharJanela(`requisicao${t}`);
      }
      fecharObjetoJanela(t) {
        try {
          t && !t.closed && t.close();
        } catch (t) {}
      }
      onLinkListarClicado(t) {
        t.preventDefault(), t.stopPropagation();
        let e = !1;
        t.shiftKey && (e = !0), this.abrirJanelaListar(e);
      }
      onMensagemRecebida(t) {
        if (
          (console.info('Mensagem recebida', t),
          t.origin === this.getLocation().origin)
        ) {
          const e = JSON.parse(t.data);
          if (e.acao === s.a.VERIFICAR_JANELA)
            t.source && this.enviarRespostaJanelaAberta(t.source, t.origin);
          else if (e.acao === s.a.ABRIR_REQUISICAO)
            console.log('Pediram-me para abrir uma requisicao', e.requisicao),
              this.abrirJanelaRequisicao(
                e.requisicao.urlConsultar,
                e.requisicao.numero
              );
          else if (e.acao === s.a.EDITAR_REQUISICAO) {
            const t = e.requisicao;
            this.fecharJanelaRequisicao(t);
            const n = this.urlEditarRequisicoes.get(t);
            n && this.abrirJanelaEditarRequisicao(n, t);
          } else
            e.acao === s.a.ABRIR_DOCUMENTO
              ? this.abrirDocumento(e.evento, e.documento)
              : e.acao === s.a.BUSCAR_DADOS &&
                t.source &&
                this.enviarDadosProcesso(t.source, t.origin);
        }
      }
    }
    function g(t, e) {
      if (void 0 === e)
        return function (e) {
          return g(t, e);
        };
      let n = e.parentElement;
      for (; null !== n && !n.matches(t); ) n = n.parentElement;
      return null === n ? i.none : i.some(n);
    }
    function v(t) {
      return i.fromNullable(t.textContent);
    }
    function b(t) {
      return e => i.fromNullable(e.cells[t]).mapNullable(t => t.textContent);
    }
  },
  function (t, e, n) {
    'use strict';
    Object.defineProperty(e, '__esModule', { value: !0 });
    var r = n(8);
    function o(t) {
      return function (e) {
        return function (n) {
          return function (r) {
            return t.ap(t.map(n, e), r);
          };
        };
      };
    }
    (e.applyFirst = function (t) {
      return function (e, n) {
        return t.ap(t.map(e, r.constant), n);
      };
    }),
      (e.applySecond = function (t) {
        return function (e, n) {
          return t.ap(
            t.map(e, function () {
              return function (t) {
                return t;
              };
            }),
            n
          );
        };
      }),
      (e.liftA2 = o),
      (e.liftA3 = function (t) {
        return function (e) {
          return function (n) {
            return function (r) {
              return function (o) {
                return t.ap(t.ap(t.map(n, e), r), o);
              };
            };
          };
        };
      }),
      (e.liftA4 = function (t) {
        return function (e) {
          return function (n) {
            return function (r) {
              return function (o) {
                return function (a) {
                  return t.ap(t.ap(t.ap(t.map(n, e), r), o), a);
                };
              };
            };
          };
        };
      }),
      (e.getSemigroup = function (t, e) {
        var n = o(t)(function (t) {
          return function (n) {
            return e.concat(t, n);
          };
        });
        return function () {
          return {
            concat: function (t, e) {
              return n(t)(e);
            },
          };
        };
      });
    var a = {};
    e.sequenceT = function (t) {
      return function () {
        for (var e = [], n = 0; n < arguments.length; n++) e[n] = arguments[n];
        var o = e.length,
          i = a[o];
        Boolean(i) ||
          (i = a[o] =
            r.curried(
              function () {
                for (var t = [], e = 0; e < arguments.length; e++)
                  t[e] = arguments[e];
                return t;
              },
              o - 1,
              []
            ));
        for (var s = t.map(e[0], i), c = 1; c < o; c++) s = t.ap(s, e[c]);
        return s;
      };
    };
  },
  function (t, e, n) {
    'use strict';
    var r =
      (this && this.__assign) ||
      function () {
        return (r =
          Object.assign ||
          function (t) {
            for (var e, n = 1, r = arguments.length; n < r; n++)
              for (var o in (e = arguments[n]))
                Object.prototype.hasOwnProperty.call(e, o) && (t[o] = e[o]);
            return t;
          }).apply(this, arguments);
      };
    Object.defineProperty(e, '__esModule', { value: !0 });
    var o = n(8),
      a = n(7),
      i = n(11),
      s = n(13);
    (e.URI = 'Array'),
      (e.getMonoid = function () {
        return { concat: o.concat, empty: e.empty };
      }),
      (e.getSetoid = s.getArraySetoid),
      (e.getOrd = function (t) {
        return r({}, e.getSetoid(t), {
          compare: function (e, n) {
            for (
              var r = e.length, o = n.length, a = Math.min(r, o), s = 0;
              s < a;
              s++
            ) {
              var c = t.compare(e[s], n[s]);
              if (0 !== c) return c;
            }
            return i.ordNumber.compare(r, o);
          },
        });
      });
    var c = function (t, e) {
        for (var n = t.length, r = new Array(n), o = 0; o < n; o++)
          r[o] = e(t[o]);
        return r;
      },
      u = function (t, e) {
        for (var n = 0, r = t.length, o = new Array(r), a = 0; a < r; a++) {
          (n += (c = e(t[a])).length), (o[a] = c);
        }
        var i = Array(n),
          s = 0;
        for (a = 0; a < r; a++) {
          for (var c, u = (c = o[a]).length, l = 0; l < u; l++) i[l + s] = c[l];
          s += u;
        }
        return i;
      },
      l = function (t, e, n) {
        for (var r = t.length, o = e, a = 0; a < r; a++) o = n(o, t[a]);
        return o;
      };
    function d(t) {
      return function (n, r) {
        return l(n, t.of(p()), function (n, o) {
          return t.ap(
            t.map(n, function (t) {
              return function (n) {
                return e.snoc(t, n);
              };
            }),
            r(o)
          );
        });
      };
    }
    e.traverse = d;
    e.empty = [];
    var p = function () {
        return e.empty;
      },
      f = o.concat;
    (e.makeBy = function (t, e) {
      for (var n = [], r = 0; r < t; r++) n.push(e(r));
      return n;
    }),
      (e.range = function (t, n) {
        return e.makeBy(n - t + 1, function (e) {
          return t + e;
        });
      }),
      (e.replicate = function (t, n) {
        return e.makeBy(t, function () {
          return n;
        });
      });
    (e.flatten = function (t) {
      for (var e = 0, n = t.length, r = 0; r < n; r++) e += t[r].length;
      var o = Array(e),
        a = 0;
      for (r = 0; r < n; r++) {
        for (var i = t[r], s = i.length, c = 0; c < s; c++) o[c + a] = i[c];
        a += s;
      }
      return o;
    }),
      (e.fold = function (t, n, r) {
        return e.isEmpty(t) ? n : r(t[0], t.slice(1));
      }),
      (e.foldL = function (t, n, r) {
        return e.isEmpty(t) ? n() : r(t[0], t.slice(1));
      }),
      (e.foldr = function (t, n, r) {
        return e.isEmpty(t) ? n : r(t.slice(0, t.length - 1), t[t.length - 1]);
      }),
      (e.foldrL = function (t, n, r) {
        return e.isEmpty(t)
          ? n()
          : r(t.slice(0, t.length - 1), t[t.length - 1]);
      }),
      (e.scanLeft = function (t, e, n) {
        var r = t.length,
          o = new Array(r + 1);
        o[0] = e;
        for (var a = 0; a < r; a++) o[a + 1] = n(o[a], t[a]);
        return o;
      }),
      (e.scanRight = function (t, e, n) {
        var r = t.length,
          o = new Array(r + 1);
        o[r] = e;
        for (var a = r - 1; a >= 0; a--) o[a] = n(t[a], o[a + 1]);
        return o;
      }),
      (e.isEmpty = function (t) {
        return 0 === t.length;
      }),
      (e.isOutOfBound = function (t, e) {
        return t < 0 || t >= e.length;
      }),
      (e.index = function (t, n) {
        return e.isOutOfBound(t, n) ? a.none : a.some(n[t]);
      }),
      (e.cons = function (t, e) {
        for (var n = e.length, r = Array(n + 1), o = 0; o < n; o++)
          r[o + 1] = e[o];
        return (r[0] = t), r;
      }),
      (e.snoc = function (t, e) {
        for (var n = t.length, r = Array(n + 1), o = 0; o < n; o++) r[o] = t[o];
        return (r[n] = e), r;
      }),
      (e.head = function (t) {
        return e.isEmpty(t) ? a.none : a.some(t[0]);
      }),
      (e.last = function (t) {
        return e.index(t.length - 1, t);
      }),
      (e.tail = function (t) {
        return e.isEmpty(t) ? a.none : a.some(t.slice(1));
      }),
      (e.init = function (t) {
        var e = t.length;
        return 0 === e ? a.none : a.some(t.slice(0, e - 1));
      }),
      (e.take = function (t, e) {
        return e.slice(0, t);
      }),
      (e.takeEnd = function (t, n) {
        return 0 === t ? e.empty : n.slice(-t);
      }),
      (e.takeWhile = function (t, e) {
        for (var n = m(t, e), r = Array(n), o = 0; o < n; o++) r[o] = t[o];
        return r;
      });
    var m = function (t, e) {
      for (var n = t.length, r = 0; r < n && e(t[r]); r++);
      return r;
    };
    (e.span = function (t, e) {
      for (var n = m(t, e), r = Array(n), o = 0; o < n; o++) r[o] = t[o];
      var a = t.length,
        i = Array(a - n);
      for (o = n; o < a; o++) i[o - n] = t[o];
      return { init: r, rest: i };
    }),
      (e.drop = function (t, e) {
        return e.slice(t, e.length);
      }),
      (e.dropEnd = function (t, e) {
        return e.slice(0, e.length - t);
      }),
      (e.dropWhile = function (t, e) {
        for (var n = m(t, e), r = t.length, o = Array(r - n), a = n; a < r; a++)
          o[a - n] = t[a];
        return o;
      }),
      (e.findIndex = function (t, e) {
        for (var n = t.length, r = 0; r < n; r++) if (e(t[r])) return a.some(r);
        return a.none;
      }),
      (e.findFirst = function (t, e) {
        for (var n = t.length, r = 0; r < n; r++)
          if (e(t[r])) return a.some(t[r]);
        return a.none;
      }),
      (e.findLast = function (t, e) {
        for (var n = t.length - 1; n >= 0; n--)
          if (e(t[n])) return a.some(t[n]);
        return a.none;
      }),
      (e.findLastIndex = function (t, e) {
        for (var n = t.length - 1; n >= 0; n--) if (e(t[n])) return a.some(n);
        return a.none;
      }),
      (e.refine = function (t, n) {
        return e.filter(t, n);
      }),
      (e.copy = function (t) {
        for (var e = t.length, n = Array(e), r = 0; r < e; r++) n[r] = t[r];
        return n;
      }),
      (e.unsafeInsertAt = function (t, n, r) {
        var o = e.copy(r);
        return o.splice(t, 0, n), o;
      }),
      (e.insertAt = function (t, n, r) {
        return t < 0 || t > r.length
          ? a.none
          : a.some(e.unsafeInsertAt(t, n, r));
      }),
      (e.unsafeUpdateAt = function (t, n, r) {
        var o = e.copy(r);
        return (o[t] = n), o;
      }),
      (e.updateAt = function (t, n, r) {
        return e.isOutOfBound(t, r)
          ? a.none
          : a.some(e.unsafeUpdateAt(t, n, r));
      }),
      (e.unsafeDeleteAt = function (t, n) {
        var r = e.copy(n);
        return r.splice(t, 1), r;
      }),
      (e.deleteAt = function (t, n) {
        return e.isOutOfBound(t, n) ? a.none : a.some(e.unsafeDeleteAt(t, n));
      }),
      (e.modifyAt = function (t, n, r) {
        return e.isOutOfBound(n, t) ? a.none : e.updateAt(n, r(t[n]), t);
      }),
      (e.reverse = function (t) {
        return e.copy(t).reverse();
      }),
      (e.rights = function (t) {
        for (var e = [], n = t.length, r = 0; r < n; r++) {
          var o = t[r];
          o.isRight() && e.push(o.value);
        }
        return e;
      }),
      (e.lefts = function (t) {
        for (var e = [], n = t.length, r = 0; r < n; r++) {
          var o = t[r];
          o.isLeft() && e.push(o.value);
        }
        return e;
      }),
      (e.sort = function (t) {
        return function (n) {
          return e.copy(n).sort(t.compare);
        };
      }),
      (e.zipWith = function (t, e, n) {
        for (var r = [], o = Math.min(t.length, e.length), a = 0; a < o; a++)
          r[a] = n(t[a], e[a]);
        return r;
      }),
      (e.zip = function (t, n) {
        return e.zipWith(t, n, o.tuple);
      }),
      (e.rotate = function (t, n) {
        var r = n.length;
        return 0 === t || r <= 1 || r === Math.abs(t)
          ? n
          : t < 0
            ? e.rotate(r + t, n)
            : n.slice(-t).concat(n.slice(0, r - t));
      }),
      (e.member = function (t) {
        return function (e, n) {
          for (var r, o = 0, a = e.length; o < a; o++)
            if (((r = e[o]), t.equals(r, n))) return !0;
          return !1;
        };
      }),
      (e.uniq = function (t) {
        var n = e.member(t);
        return function (t) {
          for (var e = [], r = t.length, o = 0; o < r; o++) {
            var a = t[o];
            n(e, a) || e.push(a);
          }
          return r === e.length ? t : e;
        };
      }),
      (e.sortBy = function (t) {
        return e.fold(t, a.none, function (t, n) {
          return a.some(e.sortBy1(t, n));
        });
      }),
      (e.sortBy1 = function (t, n) {
        return e.sort(n.reduce(i.getSemigroup().concat, t));
      }),
      (e.mapOption = function (t, e) {
        for (var n = [], r = 0, o = t; r < o.length; r++) {
          var a = e(o[r]);
          a.isSome() && n.push(a.value);
        }
        return n;
      }),
      (e.catOptions = function (t) {
        return e.mapOption(t, o.identity);
      }),
      (e.partitionMap = function (t, e) {
        for (var n = [], r = [], o = 0, a = t; o < a.length; o++) {
          var i = e(a[o]);
          i.isLeft() ? n.push(i.value) : r.push(i.value);
        }
        return { left: n, right: r };
      }),
      (e.filter = function (t, e) {
        return t.filter(e);
      });
    var h = e.catOptions,
      g = function (t) {
        for (var e = [], n = [], r = 0, o = t; r < o.length; r++) {
          var a = o[r];
          a.isLeft() ? e.push(a.value) : n.push(a.value);
        }
        return { left: e, right: n };
      },
      v = e.mapOption;
    (e.chop = function (t, e) {
      for (var n = [], r = t; r.length > 0; ) {
        var o = e(r),
          a = o[0],
          i = o[1];
        n.push(a), (r = i);
      }
      return n;
    }),
      (e.split = function (t, e) {
        return [e.slice(0, t), e.slice(t)];
      }),
      (e.chunksOf = function (t, n) {
        return e.isOutOfBound(n - 1, t)
          ? [t]
          : e.chop(t, function (t) {
              return e.split(n, t);
            });
      }),
      (e.comprehension = function (t, n, r) {
        var o = function (t, a) {
          return 0 === a.length
            ? n.apply(void 0, t)
              ? [r.apply(void 0, t)]
              : e.empty
            : u(a[0], function (n) {
                return o(e.snoc(t, n), a.slice(1));
              });
        };
        return o(e.empty, t);
      }),
      (e.array = {
        URI: e.URI,
        map: c,
        compact: h,
        separate: g,
        filter: e.filter,
        filterMap: v,
        partition: function (t, e) {
          for (var n = [], r = [], o = 0, a = t; o < a.length; o++) {
            var i = a[o];
            e(i) ? r.push(i) : n.push(i);
          }
          return { left: n, right: r };
        },
        partitionMap: e.partitionMap,
        of: function (t) {
          return [t];
        },
        ap: function (t, n) {
          return e.flatten(
            c(t, function (t) {
              return c(n, t);
            })
          );
        },
        chain: u,
        reduce: l,
        foldMap: function (t) {
          return function (e, n) {
            return e.reduce(function (e, r) {
              return t.concat(e, n(r));
            }, t.empty);
          };
        },
        foldr: function (t, e, n) {
          return t.reduceRight(function (t, e) {
            return n(e, t);
          }, e);
        },
        unfoldr: function (t, e) {
          for (var n = [], r = t; ; ) {
            var o = e(r);
            if (!o.isSome()) break;
            var a = o.value,
              i = a[0],
              s = a[1];
            n.push(i), (r = s);
          }
          return n;
        },
        traverse: d,
        sequence: function (t) {
          return function (n) {
            return l(n, t.of(p()), function (n, r) {
              return t.ap(
                t.map(n, function (t) {
                  return function (n) {
                    return e.snoc(t, n);
                  };
                }),
                r
              );
            });
          };
        },
        zero: p,
        alt: f,
        extend: function (t, e) {
          return t.map(function (t, n, r) {
            return e(r.slice(n));
          });
        },
        wither: function (t) {
          var e = d(t);
          return function (n, r) {
            return t.map(e(n, r), h);
          };
        },
        wilt: function (t) {
          var e = d(t);
          return function (n, r) {
            return t.map(e(n, r), g);
          };
        },
      });
  },
  function (t, e, n) {
    'use strict';
    var r = n(20);
    n.d(e, 'a', function () {
      return r.a;
    });
    var o = n(21);
    n.d(e, 'b', function () {
      return o.a;
    });
    var a = n(22);
    n.d(e, 'c', function () {
      return a.a;
    });
    var i = n(24);
    n.d(e, 'd', function () {
      return i.a;
    });
    var s = n(25);
    n.d(e, 'e', function () {
      return s.a;
    });
    var c = n(26);
    n.d(e, 'f', function () {
      return c.a;
    });
    var u = n(27);
    n.d(e, 'g', function () {
      return u.a;
    });
    var l = n(28);
    n.d(e, 'h', function () {
      return l.a;
    });
    var d = n(29);
    n.d(e, 'i', function () {
      return d.a;
    });
  },
  function (t, e, n) {
    'use strict';
    var r = n(14);
    const o = {
      analisar(t) {
        const e = t.match(/^\d{4}$/);
        if (!e || 1 !== e.length)
          throw new TypeError(`Valor não corresponde a um ano: "${t}".`);
        return new Date(Object(r.a)(e[0]), 0);
      },
      converter: t => t.getFullYear().toString(),
    };
    e.a = o;
  },
  function (t, e, n) {
    'use strict';
    const r = {
      analisar: t => ('' === t ? void 0 : 'Sim' === t),
      converter: t => (t ? 'Sim' : 'Não'),
    };
    e.a = r;
  },
  function (t, e, n) {
    'use strict';
    var r = n(14),
      o = n(23);
    const a = {
      analisar(t) {
        const e = t.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
        if (!e || 4 !== e.length)
          throw new TypeError(`Valor não corresponde a uma data: "${t}".`);
        let [, n, o, a] = e;
        return new Date(Object(r.a)(a), Object(r.a)(o) - 1, Object(r.a)(n));
      },
      converter(t) {
        const [e, n, r] = [t.getFullYear(), t.getMonth() + 1, t.getDate()]
          .map(String)
          .map(t => Object(o.a)(t, 2, '0'));
        return `${r}/${n}/${e}`;
      },
    };
    e.a = a;
  },
  function (t, e, n) {
    'use strict';
    function r(t, e, n) {
      let r = t;
      for (; r.length < e; ) r = n + r;
      return r;
    }
    n.d(e, 'a', function () {
      return r;
    });
  },
  function (t, e, n) {
    'use strict';
    var r = n(14),
      o = n(23);
    const a = {
      analisar(t) {
        const e = t.match(
          /^(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2}):(\d{2})$/
        );
        if (!e || 7 !== e.length)
          throw new TypeError(`Valor não corresponde a uma data/hora: "${t}".`);
        let [, n, o, a, i, s, c] = e;
        return new Date(
          Object(r.a)(a),
          Object(r.a)(o) - 1,
          Object(r.a)(n),
          Object(r.a)(i),
          Object(r.a)(s),
          Object(r.a)(c)
        );
      },
      converter(t) {
        const [e, n, r, a, i, s] = [
          t.getFullYear(),
          t.getMonth() + 1,
          t.getDate(),
          t.getHours(),
          t.getMinutes(),
          t.getSeconds(),
        ]
          .map(String)
          .map(t => Object(o.a)(t, 2, '0'));
        return `${r}/${n}/${e} ${a}:${i}:${s}`;
      },
    };
    e.a = a;
  },
  function (t, e, n) {
    'use strict';
    var r = n(14);
    const o = {
      analisar: t => Object(r.a)('0' + t),
      converter: t => t.toString(),
    };
    e.a = o;
  },
  function (t, e, n) {
    'use strict';
    var r = n(14),
      o = n(23);
    const a = {
      analisar(t) {
        const e = t.match(/^(\d{2})\/(\d{4})$/);
        if (!e || 3 !== e.length)
          throw new TypeError(`Valor não corresponde a um mês/ano: "${t}".`);
        let [, n, o] = e;
        return new Date(Object(r.a)(o), Object(r.a)(n) - 1, 1);
      },
      converter(t) {
        const [e, n] = [t.getFullYear(), t.getMonth() + 1]
          .map(String)
          .map(t => Object(o.a)(t, 2, '0'));
        return `${n}/${e}`;
      },
    };
    e.a = a;
  },
  function (t, e, n) {
    'use strict';
    const r = {
      analisar: t => parseFloat(t.replace(/\./g, '').replace(/,/, '.')),
      converter(t) {
        const e = Math.round(100 * t) / 100;
        let [n, r] = e.toFixed(2).split('.'),
          [, o, a] = n.match(/^(-?)(\d+)$/),
          i = '';
        for (; a.length > 3; )
          (i = `.${a.substr(-3)}` + i), (a = a.substr(0, a.length - 3));
        return `${o || ''}${a}${i},${r}`;
      },
    };
    e.a = r;
  },
  function (t, e, n) {
    'use strict';
    const r = {
      analisar(t) {
        const e = t.match(/^(-?\d+(,\d+)?)%$/);
        if (!e || 3 !== e.length)
          throw new TypeError(
            `Valor não corresponde a uma porcentagem: "${t}".`
          );
        return Math.round(1e6 * parseFloat(e[1].replace(',', '.'))) / 1e8;
      },
      converter(t, e = !0) {
        const n = e ? 1e8 : 100;
        return (
          ((Math.round(t * n) / n) * 100)
            .toFixed(6)
            .replace('.', ',')
            .replace(/0+$/, '')
            .replace(/,$/, '') + '%'
        );
      },
    };
    e.a = r;
  },
  function (t, e, n) {
    'use strict';
    var r = n(27);
    const o = {
      analisar(t) {
        const e = t.match(/^([\d.,]+)\s+\(([\d.,]+) \+ ([\d.,]+)\)$/);
        if (!e || 4 !== e.length)
          throw new TypeError(`Valor não corresponde ao esperado: "${t}".`);
        let [, n, o, a] = e;
        return {
          principal: r.a.analisar(o),
          juros: r.a.analisar(a),
          total: r.a.analisar(n),
        };
      },
      converter: ({ principal: t, juros: e, total: n }) =>
        `${r.a.converter(n)} (${r.a.converter(t)} + ${r.a.converter(e)})`,
    };
    e.a = o;
  },
  function (t, e, n) {
    'use strict';
    n(2);
    var r = n(3);
    n.d(e, 'a', function () {
      return r.a;
    });
    n(31);
  },
  function (t, e, n) {
    'use strict';
    n(1), n(6), n(32);
  },
  function (t, e, n) {
    'use strict';
    function r(t, ...e) {
      return e.reduce((t, e) => (null == t ? null : e(t)), t);
    }
    n.d(e, 'a', function () {
      return r;
    });
  },
  function (t, e, n) {
    'use strict';
    var r = n(14);
    n.d(e, 'a', function () {
      return r.a;
    });
    n(34), n(23);
    var o = n(35);
    n.d(e, 'b', function () {
      return o.a;
    });
    n(32);
  },
  function (t, e, n) {
    'use strict';
  },
  function (t, e, n) {
    'use strict';
    function r(t, e = 0) {
      const n = Math.pow(10, e);
      return Math.round(t * n) / n;
    }
    n.d(e, 'a', function () {
      return r;
    });
  },
  function (t, e, n) {
    'use strict';
    var r = n(37);
    n.d(e, 'a', function () {
      return r.a;
    });
    n(38);
  },
  function (t, e, n) {
    'use strict';
    function r(t) {
      return new Promise((e, n) => {
        const r = new XMLHttpRequest();
        r.open('GET', t),
          (r.responseType = 'document'),
          r.addEventListener('load', () => {
            e(r.response);
          }),
          r.addEventListener('error', n),
          r.send(null);
      });
    }
    n.d(e, 'a', function () {
      return r;
    });
  },
  function (t, e, n) {
    'use strict';
  },
  function (t, e) {
    t.exports =
      '.gmEventoDestacado > td {\r\n\tbackground: #f8eddb;\r\n\tborder: 0px solid #c0c0c0;\r\n\tborder-width: 1px 0;\r\n}\r\n.gmTextoDestacado {\r\n\tcolor: red;\r\n\tfont-size: 1.2em;\r\n}\r\n';
  },
  function (t, e, n) {
    'use strict';
    n.d(e, 'a', function () {
      return m;
    });
    var r = n(1),
      o = n(4),
      a = n(41),
      i = n(5),
      s = n(42),
      c = n(19),
      u = n(6),
      l = n(43),
      d = n(44),
      p = n(33);
    const f = n(46);
    class m extends u.a {
      obterRequisicao() {
        return r.a(this, void 0, void 0, function* () {
          return (
            this._requisicao ||
              (this._requisicao = yield this.analisarDadosRequisicao()),
            this._requisicao
          );
        });
      }
      adicionarAlteracoes() {
        return r.a(this, void 0, void 0, function* () {
          GM_addStyle(f);
          const t = this.getWindow();
          t.addEventListener('message', this.onMensagemRecebida.bind(this)),
            this.enviarSolicitacaoDados(t.opener);
        });
      }
      adicionarAreaDocumentosProcesso() {
        return r.a(this, void 0, void 0, function* () {
          (yield this.query('#divInfraAreaTabela')).insertAdjacentHTML(
            'beforeend',
            '<div class="gm-documentos"></div>'
          );
        });
      }
      adicionarBotaoTelaIntimacao() {
        return r.a(this, void 0, void 0, function* () {
          const t = i.a.criar(
            'Ir para tela de intimação',
            this.onBotaoTelaIntimacaoClicado.bind(this)
          );
          (yield this.query('#divInfraAreaTabela')).insertAdjacentHTML(
            'beforeend',
            '<div class="gm-botoes"></div>'
          ),
            (yield this.query('.gm-botoes')).appendChild(t);
        });
      }
      analisarDadosProcesso(t) {
        console.log('Dados do processo:', t),
          this.validarDadosProcesso(t),
          this.exibirDocumentosProcesso(t);
      }
      analisarDadosRequisicao() {
        return r.a(this, void 0, void 0, function* () {
          const t = new a.a(
            new l.a(/^<span class="titBold">Status:<\/span> (.*?)$/, 'status'),
            new l.a(
              /^<span class="titBold">Originário Jef:<\/span> (.*?)$/,
              'originarioJEF'
            ),
            new l.a(
              /^<span class="titBold">Extra Orçamentária:<\/span> (.*?)$/,
              'extraorcamentaria'
            ),
            new l.a(
              /^<span class="titBold">Processo Eletrônico:<\/span> (.*?)$/,
              'processoEletronico'
            ),
            new l.a(/^<span class="titBold">Juízo:<\/span> (.*?)$/, 'juizo'),
            new l.a(
              /^<span class="titBold">Ação de Execução:<\/span> (.*?)$/,
              'acaoDeExecucao'
            ),
            new l.a(
              /^<span class="titBold">Ação Originária:<\/span> (.*?)$/,
              'acaoOriginaria'
            ),
            new l.a(
              /^<span class="titBold">Total Requisitado \(R\$\):<\/span> (.*)$/,
              'valorTotalRequisitado'
            ),
            new l.a(
              /^<span class="titBold">Requerido:<\/span> (.*)$/,
              'requerido'
            ),
            new l.a(
              /^<span class="titBold">Advogado:<\/span> ?(.*)$/,
              'advogado'
            ),
            new l.a(
              /^<span class="titBold">Assunto Judicial:<\/span> (\d+)\s+- (.*)\s*$/,
              'codigoAssunto',
              'assunto'
            ),
            new l.a(
              /^<span class="titBold">Data do ajuizamento do processo de conhecimento:<\/span> (\d{2}\/\d{2}\/\d{4})$/,
              'dataAjuizamento'
            ),
            new l.a(
              /^<span class="titBold">Data do trânsito em julgado do processo de conhecimento:<\/span> ?(\d{2}\/\d{2}\/\d{4}|)$/,
              'dataTransitoConhecimento'
            ),
            new l.a(
              /^<span class="titBold">Data do trânsito em julgado da sentença ou acórdão\(JEF\):<\/span> (\d{2}\/\d{2}\/\d{4})$/,
              'dataTransitoSentenca'
            )
          );
          t.definirConversores({
            originarioJEF: c.b,
            extraorcamentaria: c.b,
            processoEletronico: c.b,
            valorTotalRequisitado: c.g,
            dataAjuizamento: c.c,
            dataTransitoSentenca: c.c,
          }),
            (t.prefixo = 'gm-requisicao__dados');
          const e = new d.a(),
            n = (yield this.queryTexto('.titReq')).trim(),
            r = yield Promise.resolve(
              n.match(/^Requisição Nº: (\d+)$/) ||
                Promise.reject(
                  new Error('Número da requisição não encontrado.')
                )
            )
              .then(t => t[1])
              .then(p.a);
          e.numero = r;
          const o = yield this.query(
            '#divInfraAreaTabela > table:nth-child(2)'
          );
          o.classList.add('gm-requisicao__tabela'), t.analisarInto(o, e);
          let i = o.nextElementSibling,
            s = null,
            u = 0;
          for (; i; ) {
            if (i.matches('table')) {
              const t = i;
              if ('Beneficiários' === (t.textContent || '').trim())
                (s = 'Beneficiários'), (u = 0);
              else if ('Honorários' === (t.textContent || '').trim())
                (s = 'Honorários'), (u = 0);
              else if (
                'Reembolsos/Deduções/Multas' === (t.textContent || '').trim()
              )
                (s = 'Multa'), (u = 0);
              else if ('Beneficiários' === s)
                e.beneficiarios.push(this.analisarTabelaBeneficiarios(t, u++));
              else if ('Honorários' === s)
                e.honorarios.push(this.analisarTabelaHonorarios(t, u++));
              else if ('Multa' !== s)
                throw (
                  (console.error('Tabela não analisada!', t),
                  new Error('Tabela não analisada!'))
                );
            }
            i = i.nextElementSibling;
          }
          return e;
        });
      }
      analisarTabela(t, e) {
        t.classList.add('gm-requisicao__tabela');
        const n = new a.a(
          new l.a(
            /^<span class="titBoldUnder">(.+) \(([\d.\/-]+)\)<\/span>$/,
            'nome',
            'cpfCnpj'
          ),
          new l.a(/^<span class="titBold">Espécie:<\/span> (.*)$/, 'especie'),
          new l.a(
            /^<span class="titBold">Tipo Honorário<\/span> (.+)$/,
            'tipoHonorario'
          ),
          new l.a(
            /^<span class="titBold">Data Base:<\/span> (\d{2}\/\d{4})&nbsp;&nbsp;&nbsp;&nbsp;<span class="titBold">Valor Requisitado \(Principal Corrigido \+ Juros\):<\/span> ([\d.,]+ \([\d.,]+ \+ [\d.,]+\))$/,
            'dataBase',
            'valor'
          ),
          new l.a(
            /^<span class="titBold">Data Base:<\/span> (\d{2}\/\d{4})&nbsp;&nbsp;&nbsp;&nbsp;<span class="titBold">Valor Requisitado \(Principal \+ Valor Selic\):<\/span> ([\d.,]+ \([\d.,]+ \+ [\d.,]+\))$/,
            'dataBase',
            'valor'
          ),
          new l.a(
            /^<span class="titBold"[^>]*>(VALOR (?:BLOQUEADO|LIBERADO))<\/span>$/,
            'bloqueado'
          ),
          new l.a(
            /^<span class="titBold">Juros de Mora Fix.no Tít. Executivo:<\/span> (.*)$/,
            'tipoJuros'
          ),
          new l.a(
            /^<span class="titBold">Tipo de Despesa:<\/span> (?:.*) \((\d+)\)$/,
            'codigoTipoDespesa'
          ),
          new l.a(
            /^<span class="titBold">Doença Grave:<\/span> (Sim|Não)$/,
            'doencaGrave'
          ),
          new l.a(
            /^<span class="titBold">Doença Grave:<\/span> (Sim|Não)&nbsp;&nbsp;&nbsp;&nbsp;<span class="titBold">Data Nascimento:<\/span> (\d{2}\/\d{2}\/\d{4})$/,
            'doencaGrave',
            'dataNascimento'
          ),
          new l.a(
            /^<span class="titBold">Renúncia Valor:<\/span> ?(Sim|Não|)$/,
            'renunciaValor'
          ),
          new l.a(
            /^<span class="titBold">Situação Servidor:<\/span> (.*)$/,
            'situacaoServidor'
          ),
          new l.a(
            /^<span class="titBold">Destaque dos Honorários Contratuais:<\/span> (Sim|Não)$/,
            'destaqueHonorariosContratuais'
          ),
          new l.a(
            /^<span class="titBold">Órgao de lotação do servidor:<\/span> (.*)$/,
            'orgaoLotacaoServidor'
          ),
          new l.a(
            /^<span class="titBold">IRPF- RRA a deduzir:<\/span> (Sim|Não)$/,
            'irpf'
          ),
          new l.a(
            /^<span class="titBold">Ano Exercicio Corrente:<\/span> (\d{4})&nbsp;&nbsp;&nbsp;&nbsp;<span class="titBold">Meses Exercicio Corrente:<\/span> (\d*)&nbsp;&nbsp;&nbsp;&nbsp;<span class="titBold">Valor Exercicio Corrente:<\/span> ([\d.,]+)$/,
            'anoCorrente',
            'mesesCorrente',
            'valorCorrente'
          ),
          new l.a(
            /^<span class="titBold">Ano Exercicio Corrente:<\/span> &nbsp;&nbsp;&nbsp;&nbsp;<span class="titBold">Meses Exercicio Corrente:<\/span> (\d*)&nbsp;&nbsp;&nbsp;&nbsp;<span class="titBold">Valor Exercicio Corrente:<\/span> ([\d.,]+)$/,
            'mesesCorrente',
            'valorCorrente'
          ),
          new l.a(
            /^<span class="titBold">Meses Exercicio Anterior:<\/span> (\d*)&nbsp;&nbsp;&nbsp;&nbsp;<span class="titBold">Valor Exercicio Anterior:<\/span> ([\d.,]+)$/,
            'mesesAnterior',
            'valorAnterior'
          ),
          new l.a(
            /^<span class="titBold">Beneficiário:<\/span> (.+)$/,
            'beneficiario'
          ),
          new l.a(
            /^<span class="titBold">Requisição de Natureza Tributária \(ATUALIZADA PELA SELIC\):<\/span> (Sim|Não)$/,
            'naturezaTributaria'
          ),
          new l.a(
            /^<span class="titBold">Incide PSS:<\/span> ?(Sim|Não)$/,
            'pss'
          ),
          new l.a(
            /^<span class="titBold">Atualização Monetária:\s*<\/span>\s*(.+)$/,
            'atualizacao'
          )
        );
        return (
          n.definirConversores({
            dataBase: c.f,
            valor: c.i,
            bloqueado: {
              analisar: t => 'VALOR BLOQUEADO' === t,
              converter: t => (t ? 'VALOR BLOQUEADO' : 'VALOR LIBERADO'),
            },
            dataNascimento: c.c,
            destaqueHonorariosContratuais: c.b,
            doencaGrave: c.b,
            renunciaValor: c.b,
            irpf: c.b,
            anoCorrente: c.a,
            mesesCorrente: c.e,
            valorCorrente: c.g,
            mesesAnterior: c.e,
            valorAnterior: c.g,
            naturezaTributaria: c.b,
            pss: c.b,
          }),
          (n.prefixo = e),
          n.analisar(t)
        );
      }
      analisarTabelaBeneficiarios(t, e) {
        return (
          t.classList.add('gm-requisicao__beneficiarios__tabela'),
          this.analisarTabela(t, `gm-requisicao__beneficiario--${e}`)
        );
      }
      analisarTabelaHonorarios(t, e) {
        return (
          t.classList.add('gm-requisicao__honorarios__tabela'),
          this.analisarTabela(t, `gm-requisicao__honorario--${e}`)
        );
      }
      enviarSolicitacao(t, e) {
        t.postMessage(JSON.stringify(e), this.getLocation().origin);
      }
      enviarSolicitacaoAberturaDocumento(t, e, n) {
        const r = { acao: o.a.ABRIR_DOCUMENTO, evento: e, documento: n };
        return this.enviarSolicitacao(t, r);
      }
      enviarSolicitacaoDados(t) {
        const e = { acao: o.a.BUSCAR_DADOS };
        return this.enviarSolicitacao(t, e);
      }
      enviarSolicitacaoEditarRequisicao(t, e) {
        const n = { acao: o.a.EDITAR_REQUISICAO, requisicao: e };
        return this.enviarSolicitacao(t, n);
      }
      exibirDocumentosProcesso(t) {
        return r.a(this, void 0, void 0, function* () {
          const e = yield this.query('.gm-documentos');
          this.exibirTitulo('Documentos do processo', e);
          let n = [
              '<table class="infraTable gm-tabela-eventos">',
              '<thead>',
              '<tr>',
              '<th class="infraTh">Evento</th>',
              '<th class="infraTh">Data</th>',
              '<th class="infraTh">Descrição</th>',
              '<th class="infraTh">Documentos</th>',
              '</tr>',
              '</thead>',
              '<tbody>',
            ].join('\n'),
            o = 0;
          const a = []
            .concat(
              t.calculos,
              t.contratos,
              t.despachosCitacao,
              t.honorarios,
              t.sentencas
            )
            .sort((t, e) => e.evento - t.evento)
            .reduce((t, e) => {
              t.has(e.evento) ||
                t.set(
                  e.evento,
                  Object.assign({}, e, { documentos: new Map() })
                );
              const n = t.get(e.evento);
              return (
                e.documentos.forEach(t => {
                  n.documentos.set(t.ordem, t);
                }),
                t
              );
            }, new Map());
          Array.from(a.values()).forEach(t => {
            (n += [
              `<tr class="${o++ % 2 == 0 ? 'infraTrClara' : 'infraTrEscura'}">`,
              `<td>${t.evento}</td>`,
              `<td>${c.d.converter(new Date(t.data))}</td>`,
              `<td>${t.descricao}</td>`,
              '<td><table><tbody>',
            ].join('\n')),
              Array.from(t.documentos.values())
                .slice()
                .sort((t, e) => t.ordem - e.ordem)
                .forEach(e => {
                  n += `<tr><td><a class="infraLinkDocumento" id="gm-documento-ev${t.evento}-doc${e.ordem}" data-evento="${t.evento}" data-documento="${e.ordem}" href="#">${e.nome}</a></td></tr>`;
                }),
              (n += ['</tbody></table></td>', '</tr>'].join('\n'));
          }),
            (n += ['</tbody>', '</table>'].join('\n')),
            e.insertAdjacentHTML('beforeend', n),
            yield Promise.all(
              Array.from(a.values()).map(t => {
                Promise.all(
                  Array.from(t.documentos.values()).map(e =>
                    r.a(this, void 0, void 0, function* () {
                      (yield this.query(
                        `#gm-documento-ev${t.evento}-doc${e.ordem}`
                      )).addEventListener(
                        'click',
                        this.onLinkDocumentoClicado.bind(this)
                      );
                    })
                  )
                );
              })
            ),
            this.exibirTitulo('Justiça Gratuita', e),
            e.insertAdjacentHTML(
              'beforeend',
              `<p class="gm-resposta">${t.justicaGratuita}</p>`
            );
        });
      }
      exibirTitulo(t, e) {
        e.insertAdjacentHTML(
          'beforeend',
          `<br><br><table width="100%"><tbody><tr><td><span class="titSecao">${t}</span></td></tr></tbody></table>`
        );
      }
      exibirValoresCalculados() {
        return r.a(this, void 0, void 0, function* () {
          const t = yield this.obterRequisicao(),
            e = yield this.query('#divInfraAreaTabela');
          this.exibirTitulo('Conferência dos cálculos', e),
            t.beneficiarios.forEach((n, r) => {
              const o = `.gm-requisicao__beneficiario--${r}`;
              this.validarElemento(`${o}__valor`, !0);
              const a = n.nome;
              let i = n.valor.principal,
                s = n.valor.juros,
                u = n.valor.total;
              const l = t.honorarios
                .map((t, e) => Object.assign({}, t, { ordinal: e }))
                .filter(t => 'Honorários Contratuais' === t.tipoHonorario)
                .filter(
                  t => t.beneficiario.toUpperCase() === n.nome.toUpperCase()
                );
              l.forEach(t => {
                const e = `.gm-requisicao__honorario--${t.ordinal}`;
                this.validarElemento(`${e}__tipoHonorario`, !0),
                  (i += t.valor.principal),
                  (s += t.valor.juros),
                  (u += t.valor.total);
              });
              let d = 1 - n.valor.total / u,
                f = p.b(100 * d, 0),
                m = p.b((u * f) / 100, 2),
                h = p.b(u - n.valor.total, 2) - m;
              Math.abs(h) > 0.01 && (f = 100 * d);
              const [g, v, b] = [i, s, u].map(t => c.g.converter(t));
              if (
                (e.insertAdjacentHTML(
                  'beforeend',
                  `<p class="gm-resposta">${a} &mdash; <span class="gm-resposta--indefinida">${g}</span> + <span class="gm-resposta--indefinida">${v}</span> = <span class="gm-resposta--indefinida">${b}</span> em <span class="gm-resposta--indefinida">${c.f.converter(
                    n.dataBase
                  )}</span></p>`
                ),
                n.irpf)
              ) {
                this.validarElemento(`${o}__irpf`, !0);
                let t = n.mesesAnterior,
                  r = n.valorAnterior;
                d > 0 && (r /= 1 - d),
                  e.insertAdjacentHTML(
                    'beforeend',
                    `<p class="gm-resposta gm-dados-adicionais">IRPF &mdash; Exercício Anterior &mdash; <span class="gm-resposta--indefinida">${c.e.converter(
                      t
                    )} ${
                      t > 1 ? 'meses' : 'mês'
                    }</span> &mdash; <span class="gm-resposta--indefinida">${c.g.converter(
                      r
                    )}</span></p>`
                  );
                let a = n.mesesCorrente,
                  i = n.valorCorrente;
                d > 0 && (i /= 1 - d);
                const s =
                  void 0 === n.anoCorrente
                    ? ''
                    : `(<span class="gm-resposta--indefinida">${
                        n.anoCorrente ? c.a.converter(n.anoCorrente) : ''
                      }</span>)`;
                e.insertAdjacentHTML(
                  'beforeend',
                  `<p class="gm-resposta gm-dados-adicionais">IRPF &mdash; Exercício Corrente ${s} &mdash; <span class="gm-resposta--indefinida">${c.e.converter(
                    a
                  )} ${
                    a > 1 ? 'meses' : 'mês'
                  }</span> &mdash; <span class="gm-resposta--indefinida">${c.g.converter(
                    i
                  )}</span></p>`
                );
              } else !1 === n.irpf && this.validarElemento(`${o}__irpf`);
              if (d > 0) {
                const t = l.map(t => t.valor.total),
                  n = t.reduce((t, e) => t + e, 0),
                  r = t
                    .map(t => t / n)
                    .map(t => (t * f) / 100)
                    .map(t => c.h.converter(t)),
                  o = l
                    .map(t => t.nome)
                    .map((t, e) => (r.length < 2 ? t : `${t} (${r[e]})`))
                    .join(', ');
                e.insertAdjacentHTML(
                  'beforeend',
                  `<p class="gm-resposta gm-dados-adicionais">Honorários Contratuais &mdash; ${o} &mdash; <span class="gm-resposta--indefinida">${c.h.converter(
                    f / 100
                  )}</span></p>`
                );
              }
            }),
            t.honorarios
              .map((t, e) => Object.assign({}, t, { ordinal: e }))
              .filter(t => 'Honorários Contratuais' !== t.tipoHonorario)
              .forEach(t => {
                const n = `.gm-requisicao__honorario--${t.ordinal}`;
                this.validarElemento(`${n}__nome`, !0),
                  this.validarElemento(`${n}__tipoHonorario`, !0),
                  this.validarElemento(`${n}__valor`, !0),
                  e.insertAdjacentHTML(
                    'beforeend',
                    [
                      `<p class="gm-resposta gm-resposta--indefinida">${t.nome}</p>`,
                      `<p class="gm-resposta gm-dados-adicionais"><span class="gm-resposta--indefinida">${
                        t.tipoHonorario
                      }</span> &mdash; <span class="gm-resposta--indefinida">${c.g.converter(
                        t.valor.principal
                      )}</span> + <span class="gm-resposta--indefinida">${c.g.converter(
                        t.valor.juros
                      )}</span> = <span class="gm-resposta--indefinida">${c.g.converter(
                        t.valor.total
                      )}</span> em <span class="gm-resposta--indefinida">${c.f.converter(
                        t.dataBase
                      )}</span></p>`,
                    ].join('\n')
                  );
              });
        });
      }
      onBotaoTelaIntimacaoClicado(t) {
        t.preventDefault(), t.stopPropagation();
        const e = this.getWindow().opener;
        this.obterRequisicao()
          .then(t => {
            this.enviarSolicitacaoEditarRequisicao(e, t.numero);
          })
          .catch(t => console.error(t));
      }
      onLinkDocumentoClicado(t) {
        t.preventDefault();
        const e = t.target,
          n = Number(e.dataset.evento),
          r = Number(e.dataset.documento),
          o = this.getWindow();
        this.enviarSolicitacaoAberturaDocumento(o.opener, n, r);
      }
      onMensagemRecebida(t) {
        if (
          (console.info('Mensagem recebida', t),
          t.origin === this.getLocation().origin)
        ) {
          const e = JSON.parse(t.data);
          e.acao === o.a.RESPOSTA_DADOS &&
            (() =>
              r.a(this, void 0, void 0, function* () {
                console.log(
                  'Dados da requisicação:',
                  yield this.obterRequisicao()
                ),
                  yield this.validarDadosRequisicao(),
                  yield this.exibirValoresCalculados(),
                  yield this.adicionarAreaDocumentosProcesso(),
                  yield this.adicionarBotaoTelaIntimacao(),
                  this.analisarDadosProcesso(e.dados);
              }))().catch(t => console.error(t));
        }
      }
      validarDadosProcesso(t) {
        return r.a(this, void 0, void 0, function* () {
          const e = yield this.obterRequisicao();
          this.validarElemento(
            '.gm-requisicao__dados__codigoAssunto',
            t.assuntos.indexOf(e.codigoAssunto) > -1
          );
          const n = c.c.converter(new Date(t.autuacao));
          this.validarElemento(
            '.gm-requisicao__dados__dataAjuizamento',
            n === c.c.converter(e.dataAjuizamento) || void 0
          ),
            this.validarElemento(
              '.gm-requisicao__dados__dataTransitoConhecimento',
              '' === e.dataTransitoConhecimento || void 0
            );
          let r = c.c.converter(new Date(t.transito.dataTransito || 0)),
            o = c.c.converter(new Date(t.transito.dataEvento || 0)),
            a = c.c.converter(new Date(t.transito.dataDecurso || 0)),
            i = c.c.converter(new Date(t.transito.dataFechamento || 0)),
            s = c.c.converter(e.dataTransitoSentenca),
            u = r === s || a === s,
            l = o === s || i === s;
          this.validarElemento(
            '.gm-requisicao__dados__dataTransitoSentenca',
            !!u || (!!l && void 0)
          ),
            this.validarElemento(
              '.gm-requisicao__dados__requerido',
              t.reus.indexOf(e.requerido) > -1 &&
                (1 === t.reus.length || void 0)
            ),
            e.beneficiarios.forEach((e, n) => {
              const r = `gm-requisicao__beneficiario--${n}`,
                o = t.autores.filter(
                  t => t.cpfCnpj === e.cpfCnpj.replace(/[.\/-]/g, '')
                );
              this.validarElemento(`.${r}__cpfCnpj`, 1 === o.length);
            });
          const d = t.autores.reduce(
            (t, e) => (e.advogados.forEach(e => t.add(e.toUpperCase())), t),
            new Set()
          );
          e.honorarios.forEach((e, n) => {
            const r = `gm-requisicao__honorario--${n}`;
            if ('Honorários Contratuais' === e.tipoHonorario) {
              const n = t.autores.find(
                t => t.nome.toUpperCase() === e.beneficiario
              );
              if (n) {
                const t = n.advogados.filter(
                  t => t.toUpperCase() === e.nome.toUpperCase()
                );
                this.validarElemento(`.${r}__nome`, 1 === t.length);
              } else this.validarElemento(`.${r}__nome`, !1);
            } else
              'Honorários de Sucumbência' === e.tipoHonorario &&
                this.validarElemento(
                  `.${r}__nome`,
                  d.has(e.nome.toUpperCase())
                );
          });
        });
      }
      validarDadosRequisicao() {
        return r.a(this, void 0, void 0, function* () {
          const t = yield this.obterRequisicao();
          this.validarElemento(
            '.gm-requisicao__dados__status',
            'Finalizada' === t.status
          ),
            this.validarElemento('.gm-requisicao__dados__originarioJEF', !0),
            this.validarElemento(
              '.gm-requisicao__dados__extraorcamentaria',
              !0
            ),
            this.validarElemento(
              '.gm-requisicao__dados__processoEletronico',
              !0
            ),
            this.validarElemento('.gm-requisicao__dados__juizo', !0),
            this.validarElemento('.gm-requisicao__dados__acaoDeExecucao', !0),
            this.validarElemento('.gm-requisicao__dados__acaoOriginaria', !0),
            this.validarElemento('.gm-requisicao__dados__advogado', !0);
          const e = null !== t.codigoAssunto.match(/^04/),
            n = null !== t.codigoAssunto.match(/^011[012]/),
            r = null !== t.codigoAssunto.match(/^0106/),
            o = null !== t.codigoAssunto.match(/^03/);
          let a = void 0;
          const i = [
              t.beneficiarios.map((e, n) => ({
                tipo: 'beneficiario',
                ordinal: n,
                pagamento: Object.assign({}, e, {
                  valor: Object.assign({}, e.valor),
                  ordinaisContratuais: t.honorarios
                    .map((t, e) => ({ honorario: t, ordinal: e }))
                    .filter(
                      ({ honorario: { tipoHonorario: t } }) =>
                        'Honorários Contratuais' === t
                    )
                    .filter(
                      ({ honorario: { beneficiario: t } }) =>
                        t.toUpperCase() === e.nome.toUpperCase()
                    )
                    .map(({ ordinal: t }) => t),
                }),
                prefixo: `gm-requisicao__beneficiario--${n}`,
              })),
              t.honorarios
                .map((t, e) => ({ honorario: t, ordinal: e }))
                .filter(
                  ({ honorario: { tipoHonorario: t } }) =>
                    'Honorários Contratuais' === t
                )
                .map(({ honorario: e, ordinal: n }) => ({
                  tipo: 'honorario',
                  ordinal: n,
                  pagamento: Object.assign({}, e, {
                    valor: Object.assign({}, e.valor),
                    maybeOrdinalBeneficiario: t.beneficiarios
                      .map((t, e) => ({ beneficiario: t, ordinal: e }))
                      .filter(
                        ({ beneficiario: { nome: t } }) =>
                          t.toUpperCase() === e.beneficiario.toUpperCase()
                      )
                      .map(({ ordinal: t }) => t),
                  }),
                  prefixo: `gm-requisicao__honorario--${n}`,
                })),
              t.honorarios
                .map((t, e) => ({ honorario: t, ordinal: e }))
                .filter(
                  ({ honorario: { tipoHonorario: t } }) =>
                    'Honorários Contratuais' !== t
                )
                .map(({ honorario: t, ordinal: e }) => ({
                  tipo: 'honorario',
                  ordinal: e,
                  pagamento: Object.assign({}, t, {
                    valor: Object.assign({}, t.valor),
                    maybeOrdinalBeneficiario: [],
                  }),
                  prefixo: `gm-requisicao__honorario--${e}`,
                })),
            ].reduce((t, e) => t.concat(e), []),
            c = 60 * s.a,
            u = i.reduce((t, { pagamento: e }) => t + e.valor.total, 0);
          this.validarElemento(
            '.gm-requisicao__dados__valorTotalRequisitado',
            t.valorTotalRequisitado === p.b(u, 2) &&
              (!(t.valorTotalRequisitado > c) || void 0)
          ),
            i.forEach(i => {
              const s =
                !i.pagamento.bloqueado &&
                'honorario' === i.tipo &&
                [
                  'Devolução à Seção Judiciária',
                  'Honorários Periciais',
                  'Honorários de Sucumbência',
                  'Honorários Contratuais',
                ].some(t => t === i.pagamento.tipoHonorario);
              this.validarElemento(`.${i.prefixo}__bloqueado`, s || void 0),
                'tipoJuros' in i.pagamento &&
                  this.validarElemento(
                    `.${i.prefixo}__tipoJuros`,
                    ('honorario' === i.tipo &&
                      ('Devolução à Seção Judiciária' ===
                        i.pagamento.tipoHonorario ||
                        'Honorários Periciais' === i.pagamento.tipoHonorario) &&
                      'Não incidem' === i.pagamento.tipoJuros) ||
                      (e && 'Poupança' === i.pagamento.tipoJuros) ||
                      void 0
                  );
              const u =
                o &&
                ('beneficiario' === i.tipo ||
                  'Honorários Contratuais' === i.pagamento.tipoHonorario);
              if ('naturezaTributaria' in i.pagamento)
                this.validarElemento(
                  `.${i.prefixo}__naturezaTributaria`,
                  i.pagamento.naturezaTributaria === u
                );
              else {
                const t =
                  u !==
                  ('IPCA-E mais Juros de Mora Fix.no Tít. Executivo' ===
                    i.pagamento.atualizacao);
                this.validarElemento(`.${i.prefixo}__atualizacao`, t);
              }
              switch (
                ('situacaoServidor' in i.pagamento &&
                  this.validarElemento(`.${i.prefixo}__situacaoServidor`),
                'orgaoLotacaoServidor' in i.pagamento &&
                  this.validarElemento(`.${i.prefixo}__orgaoLotacaoServidor`),
                'pss' in i.pagamento &&
                  this.validarElemento(`.${i.prefixo}__pss`),
                i.pagamento.codigoTipoDespesa)
              ) {
                case '11':
                  a =
                    n ||
                    ('honorario' === i.tipo &&
                      'Honorários de Sucumbência' ===
                        i.pagamento.tipoHonorario) ||
                    void 0;
                  break;
                case '12':
                  a = e;
                  break;
                case '31':
                case '39':
                  a = r;
                  break;
                case '21':
                  a =
                    o ||
                    ('honorario' === i.tipo &&
                      'Devolução à Seção Judiciária' ===
                        i.pagamento.tipoHonorario) ||
                    void 0;
              }
              if (
                (this.validarElemento(`.${i.prefixo}__codigoTipoDespesa`, a),
                /^RPV/.test(i.pagamento.especie) ||
                  this.validarElemento(`.${i.prefixo}__doencaGrave`, void 0),
                'beneficiario' === i.tipo)
              ) {
                if (i.pagamento.irpf) {
                  let t = 0;
                  i.pagamento.valorAnterior && (t += i.pagamento.valorAnterior),
                    i.pagamento.valorCorrente &&
                      (t += i.pagamento.valorCorrente);
                  const e = p.b(t, 2) === i.pagamento.valor.total;
                  this.validarElemento(`.${i.prefixo}__valorCorrente`, e),
                    this.validarElemento(`.${i.prefixo}__valorAnterior`, e);
                }
                const e = [i.pagamento.valor.total]
                    .concat(
                      ...i.pagamento.ordinaisContratuais
                        .map(e => t.honorarios[e])
                        .map(t => t.valor.total)
                    )
                    .reduce((t, e) => t + e, 0),
                  n = Math.round(100 * e) - 100 * c;
                null !== i.pagamento.especie.match(/^RPV/)
                  ? (this.validarElemento(
                      `.${i.prefixo}__renunciaValor`,
                      i.pagamento.renunciaValor === (0 === n)
                    ),
                    this.validarElemento(`.${i.prefixo}__especie`, n <= 0))
                  : this.validarElemento(
                      `.${i.prefixo}__especie`,
                      n > 0 || void 0
                    ),
                  this.validarElemento(
                    `.${i.prefixo}__destaqueHonorariosContratuais`,
                    i.pagamento.destaqueHonorariosContratuais ===
                      i.pagamento.ordinaisContratuais.length > 0
                  );
              } else if ('honorario' === i.tipo)
                if ('Honorários Contratuais' === i.pagamento.tipoHonorario) {
                  this.validarElemento(
                    `.${i.prefixo}__beneficiario`,
                    1 === i.pagamento.maybeOrdinalBeneficiario.length
                  ),
                    i.pagamento.maybeOrdinalBeneficiario
                      .map(e => t.beneficiarios[e])
                      .forEach(t => {
                        this.validarElemento(
                          `.${i.prefixo}__dataBase`,
                          t.dataBase.getTime() ===
                            i.pagamento.dataBase.getTime()
                        );
                        const { principal: e, total: n } = t.valor,
                          { principal: r, total: o } = i.pagamento.valor,
                          a = (e * o) / (n * r);
                        this.validarElemento(
                          `.${i.prefixo}__valor`,
                          Math.abs(a - 1) < 0.005
                        );
                      });
                  const e = [i.pagamento.valor.total]
                      .concat(
                        ...i.pagamento.maybeOrdinalBeneficiario
                          .map(e => t.beneficiarios[e])
                          .map(t => t.valor.total)
                      )
                      .reduce((t, e) => t + e, 0),
                    n = Math.round(100 * e) - 100 * c;
                  null !== i.pagamento.especie.match(/^RPV/)
                    ? (this.validarElemento(
                        `.${i.prefixo}__renunciaValor`,
                        i.pagamento.renunciaValor === (0 === n)
                      ),
                      this.validarElemento(`.${i.prefixo}__especie`, n <= 0))
                    : this.validarElemento(
                        `.${i.prefixo}__especie`,
                        n > 0 || void 0
                      );
                } else {
                  const t = i.pagamento.valor.total / c > 0.99;
                  null !== i.pagamento.especie.match(/^RPV/)
                    ? (this.validarElemento(
                        `.${i.prefixo}__renunciaValor`,
                        i.pagamento.renunciaValor === t
                      ),
                      this.validarElemento(`.${i.prefixo}__especie`, !t))
                    : this.validarElemento(
                        `.${i.prefixo}__especie`,
                        t || void 0
                      );
                }
            });
        });
      }
    }
  },
  function (t, e, n) {
    'use strict';
    n.d(e, 'a', function () {
      return r;
    });
    class r {
      constructor(...t) {
        (this.conversores = {}), (this.padroes = t);
      }
      analisar(t) {
        return this.analisarInto(t, {});
      }
      analisarInto(t, e) {
        this.prefixo && t.classList.add(`${this.prefixo}__tabela`);
        const n = {};
        return (
          Array.from(t.rows).forEach(t => {
            const e = t.cells[0].innerHTML.trim();
            this.padroes.forEach(r => {
              const o = r.matchInto(e, n);
              if (this.prefixo && o)
                for (let e in o) t.classList.add(`${this.prefixo}__${e}`);
            });
          }),
          this.aplicarConversores(n),
          Object.assign(e, n),
          e
        );
      }
      aplicarConversores(t) {
        for (let e in this.conversores) {
          if (!t.hasOwnProperty(e)) continue;
          let n = this.conversores[e];
          t[e] = n.analisar(t[e]);
        }
      }
      definirConversores(t) {
        this.conversores = t;
      }
    }
  },
  function (t, e, n) {
    'use strict';
    n.d(e, 'a', function () {
      return r;
    });
    const r = 954;
  },
  function (t, e, n) {
    'use strict';
    n.d(e, 'a', function () {
      return r;
    });
    class r {
      constructor(t, ...e) {
        (this.regularExpression = t), (this.properties = e);
      }
      match(t) {
        const e = {};
        return this.matchInto(t, e), e;
      }
      matchInto(t, e) {
        const n = {},
          r = t.match(this.regularExpression);
        if (r) {
          const t = r.slice(1);
          return (
            this.properties.forEach((e, r) => {
              const o = t[r];
              n[e] = o;
            }),
            Object.assign(e, n),
            n
          );
        }
        return null;
      }
    }
  },
  function (t, e, n) {
    'use strict';
    var r = n(45);
    n.d(e, 'a', function () {
      return r.a;
    });
  },
  function (t, e, n) {
    'use strict';
    n.d(e, 'a', function () {
      return r;
    });
    class r {
      constructor() {
        (this.beneficiarios = []), (this.honorarios = []);
      }
      get isPrecatorio() {
        if (void 0 === this.especie)
          throw new Error('Espécie de requisição não definida');
        return null !== this.especie.match(/^Precatório/);
      }
    }
  },
  function (t, e) {
    t.exports =
      "table a {\r\n\tfont-size: 1em;\r\n}\r\n.gm-requisicao__tabela tr::before {\r\n\tcontent: '';\r\n\tfont-size: 1.2em;\r\n\tfont-weight: bold;\r\n}\r\n.gm-requisicao__tabela .gm-resposta--correta td,\r\n.gm-requisicao__tabela .gm-resposta--correta span {\r\n\tcolor: hsl(240, 10%, 65%);\r\n}\r\n.gm-requisicao__tabela .gm-resposta--correta::before {\r\n\tcontent: '✓';\r\n\tcolor: hsl(120, 25%, 65%);\r\n}\r\n\r\n.gm-requisicao__tabela .gm-resposta--incorreta td,\r\n.gm-requisicao__tabela .gm-resposta--incorreta span {\r\n\tcolor: hsl(0, 100%, 40%);\r\n}\r\n.gm-requisicao__tabela .gm-resposta--incorreta::before {\r\n\tcontent: '✗';\r\n\tcolor: hsl(0, 100%, 40%);\r\n\ttext-shadow: none;\r\n}\r\n\r\n.gm-requisicao__tabela .gm-resposta--indefinida td,\r\n.gm-requisicao__tabela .gm-resposta--indefinida span {\r\n\tcolor: hsl(30, 100%, 40%);\r\n}\r\n.gm-requisicao__tabela .gm-resposta--indefinida::before {\r\n\tcontent: '?';\r\n\tcolor: hsl(30, 100%, 40%);\r\n\ttext-shadow: none;\r\n}\r\n\r\np.gm-resposta {\r\n\tfont-size: 1.2em;\r\n\tmargin: 1em 0 0;\r\n}\r\n.gm-resposta--correta {\r\n\tcolor: hsl(120, 25%, 75%);\r\n}\r\n.gm-resposta--incorreta {\r\n\tcolor: hsl(0, 100%, 40%);\r\n\ttext-shadow: 0 2px 2px hsl(0, 75%, 60%);\r\n}\r\n.gm-resposta--indefinida {\r\n\tcolor: hsl(30, 100%, 40%);\r\n\ttext-shadow: 0 2px 3px hsl(30, 75%, 60%);\r\n}\r\n\r\np.gm-dados-adicionais {\r\n\tmargin-top: 0;\r\n\tmargin-left: 2ex;\r\n}\r\n.gm-botoes {\r\n\tmargin: 4em 0;\r\n\tdisplay: flex;\r\n\tjustify-content: space-around;\r\n}\r\ntable.gm-tabela-eventos td {\r\n\tpadding: 0 0.5ex;\r\n}\r\n";
  },
  function (t, e, n) {
    'use strict';
    n.d(e, 'a', function () {
      return u;
    });
    var r = n(1),
      o = n(5),
      a = n(19),
      i = n(23),
      s = n(6);
    const c = n(48);
    class u extends s.a {
      constructor() {
        super(...arguments),
          (this._isLoadingPages = !1),
          (this._isLoadingDates = !1);
      }
      adicionarAlteracoes() {
        return r.a(this, void 0, void 0, function* () {
          GM_addStyle(c);
          const t = yield this.query('#divInfraBarraComandosSuperior'),
            e = this.doc.createDocumentFragment();
          yield this.adicionarBotaoCarregarPaginas().then(
            t => {
              e.appendChild(t), t.insertAdjacentHTML('afterend', '&nbsp;\n');
            },
            t => {
              if (!(t instanceof d)) throw t;
            }
          );
          const n = this.adicionarBotaoOrdenar();
          e.appendChild(n), n.insertAdjacentHTML('afterend', '&nbsp;\n');
          const r = this.adicionarBotaoLimparCache();
          e.appendChild(r),
            r.insertAdjacentHTML('afterend', '&nbsp;\n'),
            t.insertBefore(e, t.firstChild),
            this.observarUltimoLinkClicado();
        });
      }
      adicionarBotaoCarregarPaginas() {
        return r.a(this, void 0, void 0, function* () {
          const t = yield this.obterDadosPaginacao();
          return o.a.criar(
            'Carregar todas as páginas',
            this.onBotaoCarregarPaginasClicked.bind(this, t)
          );
        });
      }
      adicionarBotaoLimparCache() {
        return o.a.criar('Excluir dados armazenados localmente', t => {
          t.preventDefault(),
            localStorage.removeItem('datas-transito'),
            this.getWindow().alert('Dados locais excluídos.');
        });
      }
      adicionarBotaoOrdenar() {
        return o.a.criar(
          'Ordenar por data de trânsito',
          this.onBotaoOrdenarClicked.bind(this)
        );
      }
      obterDadosPaginacao() {
        return r.a(this, void 0, void 0, function* () {
          const t = yield this.query('#hdnInfraPaginaAtual');
          if (0 !== Number(t.value)) throw new d();
          yield this.query('#lnkInfraProximaPaginaSuperior').catch(() =>
            Promise.reject(new d())
          );
          const e = this.doc.querySelector('#selInfraPaginacaoSuperior'),
            n = null === e ? 2 : e.options.length,
            r = yield this.query('#divInfraAreaTabela > table'),
            o = yield this.query('caption', r),
            a = (o.textContent || '').match(
              /Lista de  \((\d+) registros - \d+ a \d+\):/
            );
          if (!a)
            throw new Error('Descrição do número de elementos desconhecida.');
          return {
            tBody: yield this.query('tbody'),
            caption: o,
            registros: Number(a[1]),
            form: yield p(r, 'form'),
            paginacaoSuperior: yield this.query(
              '#divInfraAreaPaginacaoSuperior'
            ),
            paginacaoInferior: yield this.query(
              '#divInfraAreaPaginacaoInferior'
            ),
            paginaAtual: t,
            paginas: n,
          };
        });
      }
      obterDadosOficios() {
        return r.a(this, void 0, void 0, function* () {
          const t = yield Promise.all(
            this.queryAll('img[src$="infra_css/imagens/lupa.gif"]').map(t =>
              p(t, 'a[href]')
            )
          );
          if (0 === t.length)
            throw new Error('Não foram encontrados ofícios requisitórios.');
          const e = this.getLocation().href,
            n = t
              .map(t => t.getAttribute('onclick') || '')
              .map(t => t.match(/window\.open\('([^']+)'/))
              .filter(t => null !== t)
              .map(t => new URL(t[1], e).href);
          if (n.length !== t.length)
            throw new Error(
              'Não foi possível obter a URL de todos os ofícios.'
            );
          const r = yield Promise.all(t.map(t => p(t, 'tr')));
          return { linhas: r, tabela: yield p(r[0], 'table'), urls: n };
        });
      }
      observarUltimoLinkClicado() {
        const t = this.queryAll(
          '#divInfraAreaTabela > table > tbody > tr > td:nth-child(3) > a[href="#None"]'
        );
        0 !== t.length
          ? t.forEach(t => {
              t.classList.add('extraLinkOficioRequisitorio');
            })
          : console.log('Sem links a analisar.');
      }
      onBotaoCarregarPaginasClicked(t, e) {
        if ((e.preventDefault(), this._isLoadingPages)) return;
        const {
            caption: n,
            form: r,
            paginas: o,
            paginacaoSuperior: a,
            paginacaoInferior: i,
            registros: s,
            tBody: c,
          } = t,
          u = e.target,
          d = u.textContent,
          p = new FormData(r);
        return (
          (this._isLoadingPages = !0),
          l(
            1,
            t => {
              const e = 50 * t + 1,
                n = Math.min(s, e + 49);
              return (
                (u.textContent = `Carregando ofícios ${e} a ${n}...`),
                p.set('hdnInfraPaginaAtual', t.toString()),
                f('POST', this.getLocation().href, p).then(t =>
                  Array.from(
                    t.querySelectorAll(
                      '#divInfraAreaTabela > table > tbody > tr:nth-child(n + 2)'
                    )
                  )
                )
              );
            },
            Array.from({ length: o - 1 }, (t, e) => e + 1)
          )
            .then(t =>
              t
                .reduce((t, e) => t.concat(e))
                .reduce((t, e, n) => {
                  t.appendChild(e);
                  const r = String(50 + n);
                  e.id = `tr_${r}`;
                  const o = e.cells[0].querySelector('input[type=checkbox]');
                  return (
                    o &&
                      ((o.id = `chklinha_${r}`),
                      o.setAttribute('onclick', `marcaDesmarcaLinha(${r})`)),
                    t
                  );
                }, this.doc.createDocumentFragment())
            )
            .then(t => {
              Array.from(c.rows).forEach(t => {
                (t.onmouseover = null),
                  (t.onmouseout = null),
                  t.classList.remove('infraTrSelecionada');
              }),
                c.classList.add('gm-conferir-rpv__tbody'),
                c.appendChild(t),
                (n.textContent = `Lista de ${s} registros:`),
                [a, i, u].forEach(t => {
                  t.style.display = 'none';
                });
            })
            .then(
              t => console.log('Resultado:', t),
              t => console.error(t)
            )
            .then(() => {
              (u.textContent = d), (this._isLoadingPages = !1);
            })
            .then(() => this.observarUltimoLinkClicado())
        );
      }
      onBotaoOrdenarClicked(t) {
        if ((t.preventDefault(), this._isLoadingDates)) return;
        this._isLoadingDates = !0;
        const e = t.target,
          n = e.textContent;
        this.obterDadosOficios().then(t => {
          !(function () {
            const t = JSON.parse(
              localStorage.getItem('datas-transito') || '[]'
            );
            m = new Map(
              t.reduce(
                ({ last: [t, e], arr: n }, [r, o]) => ({
                  last: [t + r, e + o],
                  arr: n.concat([[t + r, new Date(36e5 * (e + o))]]),
                }),
                { last: [0, 0], arr: [] }
              ).arr
            );
          })();
          const { linhas: r, tabela: o, urls: s } = t;
          let c = 0;
          const u = 1 / s.length;
          return l(
            4,
            t => {
              const n = a.h.converter(Math.round(100 * c) / 100);
              return (
                (e.textContent = `Carregando dados... ${n}`),
                (function (t) {
                  const e = new URL(t).searchParams,
                    n = Number(e.get('txtNumRequisicao'));
                  if (!isNaN(n) && m.has(n)) return Promise.resolve(m.get(n));
                  return f('GET', t, null, 'text')
                    .then(
                      t =>
                        t.match(
                          /<td><span class="titBold">Data do trânsito em julgado da sentença ou acórdão\(JEF\):<\/span> (\d{2}\/\d{2}\/\d{4})<\/td>/
                        ) ||
                        (console.log('Data do trânsito não encontrada:', t),
                        Promise.reject(
                          new Error('Data do trânsito não encontrada')
                        ))
                    )
                    .then(t => t[1])
                    .then(a.c.analisar)
                    .then(t => (isNaN(n) || m.set(n, t), t));
                })(t).then(t => {
                  c += u;
                  const n = a.h.converter(Math.round(100 * c) / 100);
                  return (e.textContent = `Carregando dados... ${n}`), t;
                })
              );
            },
            s
          )
            .then(t => t.map((t, e) => ({ data: t, linha: r[e] })))
            .then(t => {
              const e = this.doc.createElement('th');
              e.classList.add('infraTh'),
                (e.textContent = 'Trânsito'),
                o.rows[0].appendChild(e),
                t.sort((t, e) => {
                  const n = t.data,
                    r = e.data;
                  return n < r ? -1 : n > r ? 1 : 0;
                }),
                o.appendChild(
                  t.reduce((t, { data: e, linha: n }, r) => {
                    return (
                      t.appendChild(n),
                      n.cells[0].insertAdjacentHTML(
                        'afterbegin',
                        Object(i.a)(String(r + 1), 3, '0')
                      ),
                      (n.insertCell(n.cells.length).textContent =
                        a.c.converter(e)),
                      t
                    );
                  }, this.doc.createDocumentFragment())
                );
            })
            .then(() => (e.style.display = 'none'))
            .then(
              t => console.log('Resultado:', t),
              t => console.error(t)
            )
            .then(() => {
              localStorage.setItem(
                'datas-transito',
                JSON.stringify(
                  Array.from(m)
                    .sort(([t], [e]) => t - e)
                    .reduce(
                      ({ last: [t, e], arr: n }, [r, o]) => {
                        const a = Math.round(o.getTime() / 36e5);
                        return {
                          last: [r, a],
                          arr: n.concat([[r - t, a - e]]),
                        };
                      },
                      { last: [0, 0], arr: [] }
                    ).arr
                )
              ),
                (e.textContent = n),
                (this._isLoadingDates = !1);
            });
        });
      }
    }
    function l(t, e, n) {
      const r = n.slice();
      return new Promise((n, o) => {
        const a = [];
        let i = !1,
          s = 0;
        const c = () => {
          if (!(i || s >= t))
            if (r.length) {
              const t = r.shift();
              a.push(
                e(t).then(
                  t => (s--, setTimeout(c, 0), t),
                  t => {
                    i || ((i = !0), o(t));
                  }
                )
              ),
                s++,
                setTimeout(c, 0);
            } else n(Promise.all(a));
        };
        c();
      });
    }
    class d extends Error {}
    function p(t, e) {
      let n = t.parentElement;
      for (; null !== n; ) {
        if (n.matches(e)) return Promise.resolve(n);
        n = n.parentElement;
      }
      return Promise.reject(new Error('Ancestral não encontrado.'));
    }
    function f(t, e, n = null, r = 'document') {
      return new Promise((o, a) => {
        const i = new XMLHttpRequest();
        i.open(t, e),
          (i.responseType = r),
          i.addEventListener('load', () => {
            o('text' === r ? i.responseText : i.response);
          }),
          i.addEventListener('error', a),
          i.send(n);
      });
    }
    let m = new Map();
  },
  function (t, e) {
    t.exports =
      '.extraLinkOficioRequisitorio:active,\r\n.extraLinkOficioRequisitorio:focus {\r\n\tborder: 1px dotted;\r\n\tbackground: yellow;\r\n}\r\n';
  },
  function (t, e) {
    t.exports =
      '.gm-conferir-rpv__tbody > tr:hover {\r\n\tbackground-color: #ccc;\r\n}\r\n';
  },
]);
