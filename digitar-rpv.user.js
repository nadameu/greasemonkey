// ==UserScript==
// @name digitar-rpv
// @description Auxilia a conferência de RPVs e precatórios.
// @version 1.0.0
// @author nadameu
// @namespace http://nadameu.com.br/
// @include /^https:\/\/eproc\.(jf(pr|rs|sc)|trf4)\.jus\.br\/eproc(V2|2trf4)\/controlador\.php\?acao=oficio_requisitorio_beneficiarioshonorarios_editar&/
// @grant none
// @run-at document-start
// ==/UserScript==

!(function(t) {
  var e = {};
  function r(n) {
    if (e[n]) return e[n].exports;
    var o = (e[n] = { i: n, l: !1, exports: {} });
    return t[n].call(o.exports, o, o.exports, r), (o.l = !0), o.exports;
  }
  (r.m = t),
    (r.c = e),
    (r.d = function(t, e, n) {
      r.o(t, e) || Object.defineProperty(t, e, { configurable: !1, enumerable: !0, get: n });
    }),
    (r.r = function(t) {
      Object.defineProperty(t, '__esModule', { value: !0 });
    }),
    (r.n = function(t) {
      var e =
        t && t.__esModule
          ? function() {
              return t.default;
            }
          : function() {
              return t;
            };
      return r.d(e, 'a', e), e;
    }),
    (r.o = function(t, e) {
      return Object.prototype.hasOwnProperty.call(t, e);
    }),
    (r.p = '/'),
    r((r.s = 15));
})([
  function(t, e, r) {
    'use strict';
    Object.defineProperty(e, '__esModule', { value: !0 }),
      (e.parseMoeda = function(t) {
        return Number(
          String(t)
            .replace(/\./g, '')
            .replace(',', '.')
        );
      }),
      (e.arredondarMoeda = function(t) {
        return Math.round(100 * Number(t)) / 100;
      }),
      (e.formatarMoeda = function(t) {
        return n.format(t);
      });
    var n = Intl.NumberFormat('pt-BR', {
      style: 'decimal',
      useGrouping: !0,
      minimumIntegerDigits: 1,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  },
  function(t, e, r) {
    'use strict';
    Object.defineProperty(e, '__esModule', { value: !0 }), (e.default = void 0);
    var n = r(0),
      o = function(t) {
        return (0, n.parseMoeda)(t.value);
      },
      i = function(t) {
        return t.map(o);
      };
    e.default = i;
  },
  function(t, e, r) {
    'use strict';
    Object.defineProperty(e, '__esModule', { value: !0 }), (e.default = void 0);
    var n = function(t) {
      return function(e) {
        return new Promise(function(r) {
          var n = setInterval(function() {
            t(e).then(
              function(t) {
                clearInterval(n), r(t);
              },
              function() {}
            );
          }, 100);
        });
      };
    };
    e.default = n;
  },
  function(t, e, r) {
    'use strict';
    Object.defineProperty(e, '__esModule', { value: !0 }), (e.default = void 0);
    var n = function(t) {
      return function(e) {
        return new Promise(function(r) {
          t(e).then(
            function(t) {
              var e = setInterval(function() {
                t.every(function(t) {
                  return '' !== t.value;
                }) && (clearInterval(e), r(t));
              }, 100);
            },
            function() {}
          );
        });
      };
    };
    e.default = n;
  },
  function(t, e, r) {
    'use strict';
    Object.defineProperty(e, '__esModule', { value: !0 }), (e.default = void 0);
    var n = function(t) {
      var e = function(e) {
        var r = t.getElementById(e);
        return r ? Promise.resolve(r) : Promise.reject(e);
      };
      return function(t) {
        return Promise.all(t.map(e));
      };
    };
    e.default = n;
  },
  function(t, e, r) {
    'use strict';
    Object.defineProperty(e, '__esModule', { value: !0 }),
      (e.default = function(t) {
        return function() {
          Array.from(t.querySelectorAll('[tabindex]')).forEach(function(t) {
            t.tabIndex = 0;
          });
        };
      });
  },
  function(t, e, r) {
    'use strict';
    Object.defineProperty(e, '__esModule', { value: !0 }), (e.default = void 0);
    var n,
      o = r(0),
      i = (n = r(1)) && n.__esModule ? n : { default: n };
    function a(t, e) {
      return (
        (function(t) {
          if (Array.isArray(t)) return t;
        })(t) ||
        (function(t, e) {
          var r = [],
            n = !0,
            o = !1,
            i = void 0;
          try {
            for (
              var a, u = t[Symbol.iterator]();
              !(n = (a = u.next()).done) && (r.push(a.value), !e || r.length !== e);
              n = !0
            );
          } catch (t) {
            (o = !0), (i = t);
          } finally {
            try {
              n || null == u.return || u.return();
            } finally {
              if (o) throw i;
            }
          }
          return r;
        })(t, e) ||
        (function() {
          throw new TypeError('Invalid attempt to destructure non-iterable instance');
        })()
      );
    }
    var u = function(t, e, r) {
      var n = a(e, 2),
        u = n[0],
        l = n[1],
        c = a(r, 2),
        f = c[0],
        s = c[1],
        d = a((0, i.default)([t, u, l]), 3),
        p = d[0],
        v = d[1],
        m = d[2],
        h = p / (v + m);
      (f.value = (0, o.formatarMoeda)((0, o.arredondarMoeda)(v * h))),
        (s.value = (0, o.formatarMoeda)((0, o.arredondarMoeda)(m * h)));
    };
    e.default = u;
  },
  function(t, e, r) {
    'use strict';
    Object.defineProperty(e, '__esModule', { value: !0 }), (e.default = void 0);
    var n,
      o = r(0),
      i = (n = r(1)) && n.__esModule ? n : { default: n };
    function a(t, e) {
      return (
        (function(t) {
          if (Array.isArray(t)) return t;
        })(t) ||
        (function(t, e) {
          var r = [],
            n = !0,
            o = !1,
            i = void 0;
          try {
            for (
              var a, u = t[Symbol.iterator]();
              !(n = (a = u.next()).done) && (r.push(a.value), !e || r.length !== e);
              n = !0
            );
          } catch (t) {
            (o = !0), (i = t);
          } finally {
            try {
              n || null == u.return || u.return();
            } finally {
              if (o) throw i;
            }
          }
          return r;
        })(t, e) ||
        (function() {
          throw new TypeError('Invalid attempt to destructure non-iterable instance');
        })()
      );
    }
    var u = function(t, e, r) {
      var n = function() {
          return (0, i.default)([t, e, r]);
        },
        u = function() {
          var t = a(n(), 3),
            r = t[0],
            i = t[1],
            u = t[2];
          (0, o.arredondarMoeda)(r + i) !== u
            ? e.classList.add('gm-digitar-rpv__input_error')
            : e.classList.remove('gm-digitar-rpv__input_error');
        };
      [t, e, r].forEach(function(r) {
        return r.addEventListener('blur', function() {
          var r, i, l, c;
          (r = a(n(), 3)),
            (i = r[0]),
            (l = r[1]),
            (c = r[2]) && !i
              ? (t.value = (0, o.formatarMoeda)((0, o.arredondarMoeda)(c - l)))
              : c && !l && (e.value = (0, o.formatarMoeda)((0, o.arredondarMoeda)(c - i))),
            u();
        });
      }),
        u();
    };
    e.default = u;
  },
  function(t, e) {
    t.exports =
      '<div class="gm-digitar-rpv">\r\n\t<label for="gm-digitar-rpv__ex-corrente" class="gm-digitar-rpv__label infraLabelObrigatorio">Vl. Ex. Corr.:</label>\r\n\t<input id="gm-digitar-rpv__ex-corrente" class="gm-digitar-rpv__input" onkeypress="return infraMascaraDinheiro(this, event, 2, 18);"\r\n\t value="0,00" />\r\n\t<label for="gm-digitar-rpv__ex-anterior" class="gm-digitar-rpv__label infraLabelObrigatorio">Vl. Ex. Ant.:</label>\r\n\t<input id="gm-digitar-rpv__ex-anterior" class="gm-digitar-rpv__input" onkeypress="return infraMascaraDinheiro(this, event, 2, 18);"\r\n\t value="0,00" />\r\n</div>';
  },
  function(t, e, r) {
    'use strict';
    Object.defineProperty(e, '__esModule', { value: !0 }), (e.default = void 0);
    var n = a(r(8)),
      o = a(r(7)),
      i = a(r(6));
    function a(t) {
      return t && t.__esModule ? t : { default: t };
    }
    function u(t, e) {
      return (
        (function(t) {
          if (Array.isArray(t)) return t;
        })(t) ||
        (function(t, e) {
          var r = [],
            n = !0,
            o = !1,
            i = void 0;
          try {
            for (
              var a, u = t[Symbol.iterator]();
              !(n = (a = u.next()).done) && (r.push(a.value), !e || r.length !== e);
              n = !0
            );
          } catch (t) {
            (o = !0), (i = t);
          } finally {
            try {
              n || null == u.return || u.return();
            } finally {
              if (o) throw i;
            }
          }
          return r;
        })(t, e) ||
        (function() {
          throw new TypeError('Invalid attempt to destructure non-iterable instance');
        })()
      );
    }
    var l = ['divCalcValsBrutos'],
      c = [
        'txtValorBruto',
        'txtValorBrutoPrincipal',
        'txtValorBrutoJurosSelic',
        'gm-digitar-rpv__ex-corrente',
        'gm-digitar-rpv__ex-anterior',
        'txtValorTotal',
        'txtValorPrincipal',
        'txtValorJuros',
        'txtValorExCorrente',
        'txtValorExAnterior',
      ],
      f = ['btnAplicarCalcValsBrutos'],
      s = function(t, e, r) {
        return function() {
          return e(l).then(function(a) {
            return (
              u(a, 1)[0].insertAdjacentHTML('beforeend', n.default),
              Promise.all([e(f), r(c)]).then(function(e) {
                var r = u(e, 2),
                  n = r[0],
                  a = r[1],
                  l = u(n, 1)[0],
                  c = u(a, 10),
                  f = c[0],
                  s = c[1],
                  d = c[2],
                  p = c[3],
                  v = c[4],
                  m = c[5],
                  h = c[6],
                  b = c[7],
                  g = c[8],
                  y = c[9];
                t(),
                  (0, o.default)(s, d, f),
                  (0, o.default)(h, b, m),
                  (0, i.default)(f, [g, y], [p, v]),
                  l.addEventListener('click', function() {
                    (0, i.default)(m, [p, v], [g, y]);
                  });
              })
            );
          });
        };
      };
    e.default = s;
  },
  function(t, e) {
    t.exports = function(t) {
      var e = 'undefined' != typeof window && window.location;
      if (!e) throw new Error('fixUrls requires window.location');
      if (!t || 'string' != typeof t) return t;
      var r = e.protocol + '//' + e.host,
        n = r + e.pathname.replace(/\/[^\/]*$/, '/');
      return t.replace(/url\s*\(((?:[^)(]|\((?:[^)(]+|\([^)(]*\))*\))*)\)/gi, function(t, e) {
        var o,
          i = e
            .trim()
            .replace(/^"(.*)"$/, function(t, e) {
              return e;
            })
            .replace(/^'(.*)'$/, function(t, e) {
              return e;
            });
        return /^(#|data:|http:\/\/|https:\/\/|file:\/\/\/|\s*$)/i.test(i)
          ? t
          : ((o =
              0 === i.indexOf('//')
                ? i
                : 0 === i.indexOf('/')
                ? r + i
                : n + i.replace(/^\.\//, '')),
            'url(' + JSON.stringify(o) + ')');
      });
    };
  },
  function(t, e, r) {
    var n,
      o,
      i = {},
      a =
        ((n = function() {
          return window && document && document.all && !window.atob;
        }),
        function() {
          return void 0 === o && (o = n.apply(this, arguments)), o;
        }),
      u = (function(t) {
        var e = {};
        return function(t) {
          if ('function' == typeof t) return t();
          if (void 0 === e[t]) {
            var r = function(t) {
              return document.querySelector(t);
            }.call(this, t);
            if (window.HTMLIFrameElement && r instanceof window.HTMLIFrameElement)
              try {
                r = r.contentDocument.head;
              } catch (t) {
                r = null;
              }
            e[t] = r;
          }
          return e[t];
        };
      })(),
      l = null,
      c = 0,
      f = [],
      s = r(10);
    function d(t, e) {
      for (var r = 0; r < t.length; r++) {
        var n = t[r],
          o = i[n.id];
        if (o) {
          o.refs++;
          for (var a = 0; a < o.parts.length; a++) o.parts[a](n.parts[a]);
          for (; a < n.parts.length; a++) o.parts.push(g(n.parts[a], e));
        } else {
          var u = [];
          for (a = 0; a < n.parts.length; a++) u.push(g(n.parts[a], e));
          i[n.id] = { id: n.id, refs: 1, parts: u };
        }
      }
    }
    function p(t, e) {
      for (var r = [], n = {}, o = 0; o < t.length; o++) {
        var i = t[o],
          a = e.base ? i[0] + e.base : i[0],
          u = { css: i[1], media: i[2], sourceMap: i[3] };
        n[a] ? n[a].parts.push(u) : r.push((n[a] = { id: a, parts: [u] }));
      }
      return r;
    }
    function v(t, e) {
      var r = u(t.insertInto);
      if (!r)
        throw new Error(
          "Couldn't find a style target. This probably means that the value for the 'insertInto' parameter is invalid."
        );
      var n = f[f.length - 1];
      if ('top' === t.insertAt)
        n
          ? n.nextSibling
            ? r.insertBefore(e, n.nextSibling)
            : r.appendChild(e)
          : r.insertBefore(e, r.firstChild),
          f.push(e);
      else if ('bottom' === t.insertAt) r.appendChild(e);
      else {
        if ('object' != typeof t.insertAt || !t.insertAt.before)
          throw new Error(
            "[Style Loader]\n\n Invalid value for parameter 'insertAt' ('options.insertAt') found.\n Must be 'top', 'bottom', or Object.\n (https://github.com/webpack-contrib/style-loader#insertat)\n"
          );
        var o = u(t.insertInto + ' ' + t.insertAt.before);
        r.insertBefore(e, o);
      }
    }
    function m(t) {
      if (null === t.parentNode) return !1;
      t.parentNode.removeChild(t);
      var e = f.indexOf(t);
      e >= 0 && f.splice(e, 1);
    }
    function h(t) {
      var e = document.createElement('style');
      return (t.attrs.type = 'text/css'), b(e, t.attrs), v(t, e), e;
    }
    function b(t, e) {
      Object.keys(e).forEach(function(r) {
        t.setAttribute(r, e[r]);
      });
    }
    function g(t, e) {
      var r, n, o, i;
      if (e.transform && t.css) {
        if (!(i = e.transform(t.css))) return function() {};
        t.css = i;
      }
      if (e.singleton) {
        var a = c++;
        (r = l || (l = h(e))), (n = x.bind(null, r, a, !1)), (o = x.bind(null, r, a, !0));
      } else
        t.sourceMap &&
        'function' == typeof URL &&
        'function' == typeof URL.createObjectURL &&
        'function' == typeof URL.revokeObjectURL &&
        'function' == typeof Blob &&
        'function' == typeof btoa
          ? ((r = (function(t) {
              var e = document.createElement('link');
              return (
                (t.attrs.type = 'text/css'), (t.attrs.rel = 'stylesheet'), b(e, t.attrs), v(t, e), e
              );
            })(e)),
            (n = function(t, e, r) {
              var n = r.css,
                o = r.sourceMap,
                i = void 0 === e.convertToAbsoluteUrls && o;
              (e.convertToAbsoluteUrls || i) && (n = s(n));
              o &&
                (n +=
                  '\n/*# sourceMappingURL=data:application/json;base64,' +
                  btoa(unescape(encodeURIComponent(JSON.stringify(o)))) +
                  ' */');
              var a = new Blob([n], { type: 'text/css' }),
                u = t.href;
              (t.href = URL.createObjectURL(a)), u && URL.revokeObjectURL(u);
            }.bind(null, r, e)),
            (o = function() {
              m(r), r.href && URL.revokeObjectURL(r.href);
            }))
          : ((r = h(e)),
            (n = function(t, e) {
              var r = e.css,
                n = e.media;
              n && t.setAttribute('media', n);
              if (t.styleSheet) t.styleSheet.cssText = r;
              else {
                for (; t.firstChild; ) t.removeChild(t.firstChild);
                t.appendChild(document.createTextNode(r));
              }
            }.bind(null, r)),
            (o = function() {
              m(r);
            }));
      return (
        n(t),
        function(e) {
          if (e) {
            if (e.css === t.css && e.media === t.media && e.sourceMap === t.sourceMap) return;
            n((t = e));
          } else o();
        }
      );
    }
    t.exports = function(t, e) {
      if ('undefined' != typeof DEBUG && DEBUG && 'object' != typeof document)
        throw new Error('The style-loader cannot be used in a non-browser environment');
      ((e = e || {}).attrs = 'object' == typeof e.attrs ? e.attrs : {}),
        e.singleton || 'boolean' == typeof e.singleton || (e.singleton = a()),
        e.insertInto || (e.insertInto = 'head'),
        e.insertAt || (e.insertAt = 'bottom');
      var r = p(t, e);
      return (
        d(r, e),
        function(t) {
          for (var n = [], o = 0; o < r.length; o++) {
            var a = r[o];
            (u = i[a.id]).refs--, n.push(u);
          }
          t && d(p(t, e), e);
          for (o = 0; o < n.length; o++) {
            var u;
            if (0 === (u = n[o]).refs) {
              for (var l = 0; l < u.parts.length; l++) u.parts[l]();
              delete i[u.id];
            }
          }
        }
      );
    };
    var y,
      _ =
        ((y = []),
        function(t, e) {
          return (y[t] = e), y.filter(Boolean).join('\n');
        });
    function x(t, e, r, n) {
      var o = r ? '' : n.css;
      if (t.styleSheet) t.styleSheet.cssText = _(e, o);
      else {
        var i = document.createTextNode(o),
          a = t.childNodes;
        a[e] && t.removeChild(a[e]), a.length ? t.insertBefore(i, a[e]) : t.appendChild(i);
      }
    }
  },
  function(t, e) {
    t.exports = function(t) {
      var e = [];
      return (
        (e.toString = function() {
          return this.map(function(e) {
            var r = (function(t, e) {
              var r = t[1] || '',
                n = t[3];
              if (!n) return r;
              if (e && 'function' == typeof btoa) {
                var o =
                    ((a = n),
                    '/*# sourceMappingURL=data:application/json;charset=utf-8;base64,' +
                      btoa(unescape(encodeURIComponent(JSON.stringify(a)))) +
                      ' */'),
                  i = n.sources.map(function(t) {
                    return '/*# sourceURL=' + n.sourceRoot + t + ' */';
                  });
                return [r]
                  .concat(i)
                  .concat([o])
                  .join('\n');
              }
              var a;
              return [r].join('\n');
            })(e, t);
            return e[2] ? '@media ' + e[2] + '{' + r + '}' : r;
          }).join('');
        }),
        (e.i = function(t, r) {
          'string' == typeof t && (t = [[null, t, '']]);
          for (var n = {}, o = 0; o < this.length; o++) {
            var i = this[o][0];
            'number' == typeof i && (n[i] = !0);
          }
          for (o = 0; o < t.length; o++) {
            var a = t[o];
            ('number' == typeof a[0] && n[a[0]]) ||
              (r && !a[2] ? (a[2] = r) : r && (a[2] = '(' + a[2] + ') and (' + r + ')'), e.push(a));
          }
        }),
        e
      );
    };
  },
  function(t, e, r) {
    (t.exports = r(12)(!1)).push([
      t.i,
      'input:disabled {\n  background: #ccc;\n  color: #888; }\n\n.gm-digitar-rpv {\n  position: absolute;\n  top: 38px;\n  left: 10px;\n  display: grid;\n  grid-template-rows: 18px 21px;\n  grid-auto-flow: column;\n  grid-column-gap: 16px; }\n\nlabel.gm-digitar-rpv__label {\n  width: 80px; }\n\n.gm-digitar-rpv__input {\n  width: 80px; }\n\n.gm-digitar-rpv__input_error,\ninput:focus.gm-digitar-rpv__input_error {\n  background: #f88; }\n',
      '',
    ]);
  },
  function(t, e, r) {
    var n = r(13);
    'string' == typeof n && (n = [[t.i, n, '']]);
    var o = { hmr: !0, transform: void 0, insertInto: void 0 };
    r(11)(n, o);
    n.locals && (t.exports = n.locals);
  },
  function(t, e, r) {
    'use strict';
    r(14);
    var n = l(r(9)),
      o = l(r(5)),
      i = l(r(4)),
      a = l(r(3)),
      u = l(r(2));
    function l(t) {
      return t && t.__esModule ? t : { default: t };
    }
    var c = (0, o.default)(document),
      f = (0, i.default)(document),
      s = (0, u.default)(f),
      d = (0, a.default)(s);
    (0, n.default)(c, s, d)().catch(function(t) {
      return console.error(t);
    });
  },
]);