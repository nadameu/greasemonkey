// ==UserScript==
// @name         separar-em-blocos
// @version      1.0.0
// @author       nadameu
// @name:pt-BR   Separar em blocos
// @namespace    http://nadameu.com.br
// @match        https://eproc.jfsc.jus.br/eprocV2/controlador.php?acao=processo_selecionar&*
// @match        https://eproc.jfsc.jus.br/eprocV2/controlador.php?acao=localizador_processos_lista&*
// @match        https://eproc.jfsc.jus.br/eprocV2/controlador.php?acao=relatorio_geral_consultar&*
// @grant        none
// @description  Permite a separação de processos em blocos para movimentação separada
// ==/UserScript==
var __defProp = Object.defineProperty;
var __markAsModule = target => __defProp(target, '__esModule', { value: true });
var __export = (target, all) => {
  __markAsModule(target);
  for (var name in all) __defProp(target, name, { get: all[name], enumerable: true });
};

// src/lib/predicates.ts
var AssertionError = class extends Error {
  name = 'AssertionError';
  constructor(message) {
    super(message);
  }
};
function assert(condition, message) {
  if (!condition) throw new AssertionError(message);
}
function isOfType(typeRepresentation) {
  return value => typeof value === typeRepresentation;
}
var isBoolean = /* @__PURE__ */ isOfType('boolean');
var isNumber = /* @__PURE__ */ isOfType('number');
var isOfTypeObject = /* @__PURE__ */ isOfType('object');
var isString = /* @__PURE__ */ isOfType('string');
function isLiteral(literal) {
  return value => value === literal;
}
var isUndefined = /* @__PURE__ */ isLiteral(void 0);
var isNull = /* @__PURE__ */ isLiteral(null);
function negate(predicate) {
  return value => !predicate(value);
}
var isNotNull = /* @__PURE__ */ negate(isNull);
function refine(...predicates) {
  return value => predicates.every(p7 => p7(value));
}
var isObject = /* @__PURE__ */ refine(isOfTypeObject, isNotNull);
var isInteger = /* @__PURE__ */ refine(isNumber, x3 => Number.isInteger(x3));
var isNatural = /* @__PURE__ */ refine(isInteger, x3 => x3 > 0);
var isNonNegativeInteger = /* @__PURE__ */ isAnyOf(isLiteral(0), isNatural);
var isNonEmptyString = /* @__PURE__ */ refine(isString, x3 => x3.trim().length > 0);
function isAnyOf(...predicates) {
  return value => predicates.some(p7 => p7(value));
}
var isNullish = /* @__PURE__ */ isAnyOf(isNull, isUndefined);
var isNotNullish = /* @__PURE__ */ negate(isNullish);
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
      refine(hasShape({ [tagName]: isLiteral(tag) }), hasShape(extraProperties))
    )
  );
}

// node_modules/.pnpm/preact@10.5.15/node_modules/preact/dist/preact.module.js
var n;
var l;
var u;
var i;
var t;
var r;
var o;
var f;
var e = {};
var c = [];
var s = /acit|ex(?:s|g|n|p|$)|rph|grid|ows|mnc|ntw|ine[ch]|zoo|^ord|itera/i;
function a(n2, l3) {
  for (var u3 in l3) n2[u3] = l3[u3];
  return n2;
}
function h(n2) {
  var l3 = n2.parentNode;
  l3 && l3.removeChild(n2);
}
function v(l3, u3, i3) {
  var t3,
    r3,
    o3,
    f3 = {};
  for (o3 in u3) o3 == 'key' ? (t3 = u3[o3]) : o3 == 'ref' ? (r3 = u3[o3]) : (f3[o3] = u3[o3]);
  if (
    (arguments.length > 2 && (f3.children = arguments.length > 3 ? n.call(arguments, 2) : i3),
    typeof l3 == 'function' && l3.defaultProps != null)
  )
    for (o3 in l3.defaultProps) f3[o3] === void 0 && (f3[o3] = l3.defaultProps[o3]);
  return y(l3, f3, t3, r3, null);
}
function y(n2, i3, t3, r3, o3) {
  var f3 = {
    type: n2,
    props: i3,
    key: t3,
    ref: r3,
    __k: null,
    __: null,
    __b: 0,
    __e: null,
    __d: void 0,
    __c: null,
    __h: null,
    constructor: void 0,
    __v: o3 == null ? ++u : o3,
  };
  return o3 == null && l.vnode != null && l.vnode(f3), f3;
}
function p() {
  return { current: null };
}
function d(n2) {
  return n2.children;
}
function _(n2, l3) {
  (this.props = n2), (this.context = l3);
}
function k(n2, l3) {
  if (l3 == null) return n2.__ ? k(n2.__, n2.__.__k.indexOf(n2) + 1) : null;
  for (var u3; l3 < n2.__k.length; l3++)
    if ((u3 = n2.__k[l3]) != null && u3.__e != null) return u3.__e;
  return typeof n2.type == 'function' ? k(n2) : null;
}
function b(n2) {
  var l3, u3;
  if ((n2 = n2.__) != null && n2.__c != null) {
    for (n2.__e = n2.__c.base = null, l3 = 0; l3 < n2.__k.length; l3++)
      if ((u3 = n2.__k[l3]) != null && u3.__e != null) {
        n2.__e = n2.__c.base = u3.__e;
        break;
      }
    return b(n2);
  }
}
function m(n2) {
  ((!n2.__d && (n2.__d = true) && t.push(n2) && !g.__r++) || o !== l.debounceRendering) &&
    ((o = l.debounceRendering) || r)(g);
}
function g() {
  for (var n2; (g.__r = t.length); )
    (n2 = t.sort(function (n3, l3) {
      return n3.__v.__b - l3.__v.__b;
    })),
      (t = []),
      n2.some(function (n3) {
        var l3, u3, i3, t3, r3, o3;
        n3.__d &&
          ((r3 = (t3 = (l3 = n3).__v).__e),
          (o3 = l3.__P) &&
            ((u3 = []),
            ((i3 = a({}, t3)).__v = t3.__v + 1),
            j(
              o3,
              t3,
              i3,
              l3.__n,
              o3.ownerSVGElement !== void 0,
              t3.__h != null ? [r3] : null,
              u3,
              r3 == null ? k(t3) : r3,
              t3.__h
            ),
            z(u3, t3),
            t3.__e != r3 && b(t3)));
      });
}
function w(n2, l3, u3, i3, t3, r3, o3, f3, s2, a3) {
  var h3,
    v3,
    p7,
    _2,
    b3,
    m3,
    g3,
    w3 = (i3 && i3.__k) || c,
    A2 = w3.length;
  for (u3.__k = [], h3 = 0; h3 < l3.length; h3++)
    if (
      (_2 = u3.__k[h3] =
        (_2 = l3[h3]) == null || typeof _2 == 'boolean'
          ? null
          : typeof _2 == 'string' || typeof _2 == 'number' || typeof _2 == 'bigint'
          ? y(null, _2, null, null, _2)
          : Array.isArray(_2)
          ? y(d, { children: _2 }, null, null, null)
          : _2.__b > 0
          ? y(_2.type, _2.props, _2.key, null, _2.__v)
          : _2) != null
    ) {
      if (
        ((_2.__ = u3),
        (_2.__b = u3.__b + 1),
        (p7 = w3[h3]) === null || (p7 && _2.key == p7.key && _2.type === p7.type))
      )
        w3[h3] = void 0;
      else
        for (v3 = 0; v3 < A2; v3++) {
          if ((p7 = w3[v3]) && _2.key == p7.key && _2.type === p7.type) {
            w3[v3] = void 0;
            break;
          }
          p7 = null;
        }
      j(n2, _2, (p7 = p7 || e), t3, r3, o3, f3, s2, a3),
        (b3 = _2.__e),
        (v3 = _2.ref) &&
          p7.ref != v3 &&
          (g3 || (g3 = []), p7.ref && g3.push(p7.ref, null, _2), g3.push(v3, _2.__c || b3, _2)),
        b3 != null
          ? (m3 == null && (m3 = b3),
            typeof _2.type == 'function' && _2.__k === p7.__k
              ? (_2.__d = s2 = x(_2, s2, n2))
              : (s2 = P(n2, _2, p7, w3, b3, s2)),
            typeof u3.type == 'function' && (u3.__d = s2))
          : s2 && p7.__e == s2 && s2.parentNode != n2 && (s2 = k(p7));
    }
  for (u3.__e = m3, h3 = A2; h3--; )
    w3[h3] != null &&
      (typeof u3.type == 'function' &&
        w3[h3].__e != null &&
        w3[h3].__e == u3.__d &&
        (u3.__d = k(i3, h3 + 1)),
      N(w3[h3], w3[h3]));
  if (g3) for (h3 = 0; h3 < g3.length; h3++) M(g3[h3], g3[++h3], g3[++h3]);
}
function x(n2, l3, u3) {
  for (var i3, t3 = n2.__k, r3 = 0; t3 && r3 < t3.length; r3++)
    (i3 = t3[r3]) &&
      ((i3.__ = n2),
      (l3 = typeof i3.type == 'function' ? x(i3, l3, u3) : P(u3, i3, i3, t3, i3.__e, l3)));
  return l3;
}
function P(n2, l3, u3, i3, t3, r3) {
  var o3, f3, e3;
  if (l3.__d !== void 0) (o3 = l3.__d), (l3.__d = void 0);
  else if (u3 == null || t3 != r3 || t3.parentNode == null)
    n: if (r3 == null || r3.parentNode !== n2) n2.appendChild(t3), (o3 = null);
    else {
      for (f3 = r3, e3 = 0; (f3 = f3.nextSibling) && e3 < i3.length; e3 += 2) if (f3 == t3) break n;
      n2.insertBefore(t3, r3), (o3 = r3);
    }
  return o3 !== void 0 ? o3 : t3.nextSibling;
}
function C(n2, l3, u3, i3, t3) {
  var r3;
  for (r3 in u3) r3 === 'children' || r3 === 'key' || r3 in l3 || H(n2, r3, null, u3[r3], i3);
  for (r3 in l3)
    (t3 && typeof l3[r3] != 'function') ||
      r3 === 'children' ||
      r3 === 'key' ||
      r3 === 'value' ||
      r3 === 'checked' ||
      u3[r3] === l3[r3] ||
      H(n2, r3, l3[r3], u3[r3], i3);
}
function $(n2, l3, u3) {
  l3[0] === '-'
    ? n2.setProperty(l3, u3)
    : (n2[l3] = u3 == null ? '' : typeof u3 != 'number' || s.test(l3) ? u3 : u3 + 'px');
}
function H(n2, l3, u3, i3, t3) {
  var r3;
  n: if (l3 === 'style')
    if (typeof u3 == 'string') n2.style.cssText = u3;
    else {
      if ((typeof i3 == 'string' && (n2.style.cssText = i3 = ''), i3))
        for (l3 in i3) (u3 && l3 in u3) || $(n2.style, l3, '');
      if (u3) for (l3 in u3) (i3 && u3[l3] === i3[l3]) || $(n2.style, l3, u3[l3]);
    }
  else if (l3[0] === 'o' && l3[1] === 'n')
    (r3 = l3 !== (l3 = l3.replace(/Capture$/, ''))),
      (l3 = l3.toLowerCase() in n2 ? l3.toLowerCase().slice(2) : l3.slice(2)),
      n2.l || (n2.l = {}),
      (n2.l[l3 + r3] = u3),
      u3
        ? i3 || n2.addEventListener(l3, r3 ? T : I, r3)
        : n2.removeEventListener(l3, r3 ? T : I, r3);
  else if (l3 !== 'dangerouslySetInnerHTML') {
    if (t3) l3 = l3.replace(/xlink[H:h]/, 'h').replace(/sName$/, 's');
    else if (
      l3 !== 'href' &&
      l3 !== 'list' &&
      l3 !== 'form' &&
      l3 !== 'tabIndex' &&
      l3 !== 'download' &&
      l3 in n2
    )
      try {
        n2[l3] = u3 == null ? '' : u3;
        break n;
      } catch (n3) {}
    typeof u3 == 'function' ||
      (u3 != null && (u3 !== false || (l3[0] === 'a' && l3[1] === 'r'))
        ? n2.setAttribute(l3, u3)
        : n2.removeAttribute(l3));
  }
}
function I(n2) {
  this.l[n2.type + false](l.event ? l.event(n2) : n2);
}
function T(n2) {
  this.l[n2.type + true](l.event ? l.event(n2) : n2);
}
function j(n2, u3, i3, t3, r3, o3, f3, e3, c3) {
  var s2,
    h3,
    v3,
    y3,
    p7,
    k3,
    b3,
    m3,
    g3,
    x3,
    A2,
    P2 = u3.type;
  if (u3.constructor !== void 0) return null;
  i3.__h != null && ((c3 = i3.__h), (e3 = u3.__e = i3.__e), (u3.__h = null), (o3 = [e3])),
    (s2 = l.__b) && s2(u3);
  try {
    n: if (typeof P2 == 'function') {
      if (
        ((m3 = u3.props),
        (g3 = (s2 = P2.contextType) && t3[s2.__c]),
        (x3 = s2 ? (g3 ? g3.props.value : s2.__) : t3),
        i3.__c
          ? (b3 = (h3 = u3.__c = i3.__c).__ = h3.__E)
          : ('prototype' in P2 && P2.prototype.render
              ? (u3.__c = h3 = new P2(m3, x3))
              : ((u3.__c = h3 = new _(m3, x3)), (h3.constructor = P2), (h3.render = O)),
            g3 && g3.sub(h3),
            (h3.props = m3),
            h3.state || (h3.state = {}),
            (h3.context = x3),
            (h3.__n = t3),
            (v3 = h3.__d = true),
            (h3.__h = [])),
        h3.__s == null && (h3.__s = h3.state),
        P2.getDerivedStateFromProps != null &&
          (h3.__s == h3.state && (h3.__s = a({}, h3.__s)),
          a(h3.__s, P2.getDerivedStateFromProps(m3, h3.__s))),
        (y3 = h3.props),
        (p7 = h3.state),
        v3)
      )
        P2.getDerivedStateFromProps == null &&
          h3.componentWillMount != null &&
          h3.componentWillMount(),
          h3.componentDidMount != null && h3.__h.push(h3.componentDidMount);
      else {
        if (
          (P2.getDerivedStateFromProps == null &&
            m3 !== y3 &&
            h3.componentWillReceiveProps != null &&
            h3.componentWillReceiveProps(m3, x3),
          (!h3.__e &&
            h3.shouldComponentUpdate != null &&
            h3.shouldComponentUpdate(m3, h3.__s, x3) === false) ||
            u3.__v === i3.__v)
        ) {
          (h3.props = m3),
            (h3.state = h3.__s),
            u3.__v !== i3.__v && (h3.__d = false),
            (h3.__v = u3),
            (u3.__e = i3.__e),
            (u3.__k = i3.__k),
            u3.__k.forEach(function (n3) {
              n3 && (n3.__ = u3);
            }),
            h3.__h.length && f3.push(h3);
          break n;
        }
        h3.componentWillUpdate != null && h3.componentWillUpdate(m3, h3.__s, x3),
          h3.componentDidUpdate != null &&
            h3.__h.push(function () {
              h3.componentDidUpdate(y3, p7, k3);
            });
      }
      (h3.context = x3),
        (h3.props = m3),
        (h3.state = h3.__s),
        (s2 = l.__r) && s2(u3),
        (h3.__d = false),
        (h3.__v = u3),
        (h3.__P = n2),
        (s2 = h3.render(h3.props, h3.state, h3.context)),
        (h3.state = h3.__s),
        h3.getChildContext != null && (t3 = a(a({}, t3), h3.getChildContext())),
        v3 || h3.getSnapshotBeforeUpdate == null || (k3 = h3.getSnapshotBeforeUpdate(y3, p7)),
        (A2 = s2 != null && s2.type === d && s2.key == null ? s2.props.children : s2),
        w(n2, Array.isArray(A2) ? A2 : [A2], u3, i3, t3, r3, o3, f3, e3, c3),
        (h3.base = u3.__e),
        (u3.__h = null),
        h3.__h.length && f3.push(h3),
        b3 && (h3.__E = h3.__ = null),
        (h3.__e = false);
    } else
      o3 == null && u3.__v === i3.__v
        ? ((u3.__k = i3.__k), (u3.__e = i3.__e))
        : (u3.__e = L(i3.__e, u3, i3, t3, r3, o3, f3, c3));
    (s2 = l.diffed) && s2(u3);
  } catch (n3) {
    (u3.__v = null),
      (c3 || o3 != null) && ((u3.__e = e3), (u3.__h = !!c3), (o3[o3.indexOf(e3)] = null)),
      l.__e(n3, u3, i3);
  }
}
function z(n2, u3) {
  l.__c && l.__c(u3, n2),
    n2.some(function (u4) {
      try {
        (n2 = u4.__h),
          (u4.__h = []),
          n2.some(function (n3) {
            n3.call(u4);
          });
      } catch (n3) {
        l.__e(n3, u4.__v);
      }
    });
}
function L(l3, u3, i3, t3, r3, o3, f3, c3) {
  var s2,
    a3,
    v3,
    y3 = i3.props,
    p7 = u3.props,
    d2 = u3.type,
    _2 = 0;
  if ((d2 === 'svg' && (r3 = true), o3 != null)) {
    for (; _2 < o3.length; _2++)
      if ((s2 = o3[_2]) && (s2 === l3 || (d2 ? s2.localName == d2 : s2.nodeType == 3))) {
        (l3 = s2), (o3[_2] = null);
        break;
      }
  }
  if (l3 == null) {
    if (d2 === null) return document.createTextNode(p7);
    (l3 = r3
      ? document.createElementNS('http://www.w3.org/2000/svg', d2)
      : document.createElement(d2, p7.is && p7)),
      (o3 = null),
      (c3 = false);
  }
  if (d2 === null) y3 === p7 || (c3 && l3.data === p7) || (l3.data = p7);
  else {
    if (
      ((o3 = o3 && n.call(l3.childNodes)),
      (a3 = (y3 = i3.props || e).dangerouslySetInnerHTML),
      (v3 = p7.dangerouslySetInnerHTML),
      !c3)
    ) {
      if (o3 != null)
        for (y3 = {}, _2 = 0; _2 < l3.attributes.length; _2++)
          y3[l3.attributes[_2].name] = l3.attributes[_2].value;
      (v3 || a3) &&
        ((v3 && ((a3 && v3.__html == a3.__html) || v3.__html === l3.innerHTML)) ||
          (l3.innerHTML = (v3 && v3.__html) || ''));
    }
    if ((C(l3, p7, y3, r3, c3), v3)) u3.__k = [];
    else if (
      ((_2 = u3.props.children),
      w(
        l3,
        Array.isArray(_2) ? _2 : [_2],
        u3,
        i3,
        t3,
        r3 && d2 !== 'foreignObject',
        o3,
        f3,
        o3 ? o3[0] : i3.__k && k(i3, 0),
        c3
      ),
      o3 != null)
    )
      for (_2 = o3.length; _2--; ) o3[_2] != null && h(o3[_2]);
    c3 ||
      ('value' in p7 &&
        (_2 = p7.value) !== void 0 &&
        (_2 !== l3.value || (d2 === 'progress' && !_2)) &&
        H(l3, 'value', _2, y3.value, false),
      'checked' in p7 &&
        (_2 = p7.checked) !== void 0 &&
        _2 !== l3.checked &&
        H(l3, 'checked', _2, y3.checked, false));
  }
  return l3;
}
function M(n2, u3, i3) {
  try {
    typeof n2 == 'function' ? n2(u3) : (n2.current = u3);
  } catch (n3) {
    l.__e(n3, i3);
  }
}
function N(n2, u3, i3) {
  var t3, r3;
  if (
    (l.unmount && l.unmount(n2),
    (t3 = n2.ref) && ((t3.current && t3.current !== n2.__e) || M(t3, null, u3)),
    (t3 = n2.__c) != null)
  ) {
    if (t3.componentWillUnmount)
      try {
        t3.componentWillUnmount();
      } catch (n3) {
        l.__e(n3, u3);
      }
    t3.base = t3.__P = null;
  }
  if ((t3 = n2.__k))
    for (r3 = 0; r3 < t3.length; r3++) t3[r3] && N(t3[r3], u3, typeof n2.type != 'function');
  i3 || n2.__e == null || h(n2.__e), (n2.__e = n2.__d = void 0);
}
function O(n2, l3, u3) {
  return this.constructor(n2, u3);
}
function S(u3, i3, t3) {
  var r3, o3, f3;
  l.__ && l.__(u3, i3),
    (o3 = (r3 = typeof t3 == 'function') ? null : (t3 && t3.__k) || i3.__k),
    (f3 = []),
    j(
      i3,
      (u3 = ((!r3 && t3) || i3).__k = v(d, null, [u3])),
      o3 || e,
      e,
      i3.ownerSVGElement !== void 0,
      !r3 && t3 ? [t3] : o3 ? null : i3.firstChild ? n.call(i3.childNodes) : null,
      f3,
      !r3 && t3 ? t3 : o3 ? o3.__e : i3.firstChild,
      r3
    ),
    z(f3, u3);
}
(n = c.slice),
  (l = {
    __e: function (n2, l3) {
      for (var u3, i3, t3; (l3 = l3.__); )
        if ((u3 = l3.__c) && !u3.__)
          try {
            if (
              ((i3 = u3.constructor) &&
                i3.getDerivedStateFromError != null &&
                (u3.setState(i3.getDerivedStateFromError(n2)), (t3 = u3.__d)),
              u3.componentDidCatch != null && (u3.componentDidCatch(n2), (t3 = u3.__d)),
              t3)
            )
              return (u3.__E = u3);
          } catch (l4) {
            n2 = l4;
          }
      throw n2;
    },
  }),
  (u = 0),
  (i = function (n2) {
    return n2 != null && n2.constructor === void 0;
  }),
  (_.prototype.setState = function (n2, l3) {
    var u3;
    (u3 = this.__s != null && this.__s !== this.state ? this.__s : (this.__s = a({}, this.state))),
      typeof n2 == 'function' && (n2 = n2(a({}, u3), this.props)),
      n2 && a(u3, n2),
      n2 != null && this.__v && (l3 && this.__h.push(l3), m(this));
  }),
  (_.prototype.forceUpdate = function (n2) {
    this.__v && ((this.__e = true), n2 && this.__h.push(n2), m(this));
  }),
  (_.prototype.render = d),
  (t = []),
  (r = typeof Promise == 'function' ? Promise.prototype.then.bind(Promise.resolve()) : setTimeout),
  (g.__r = 0),
  (f = 0);

// node_modules/.pnpm/preact@10.5.15/node_modules/preact/hooks/dist/hooks.module.js
var t2;
var u2;
var r2;
var o2 = 0;
var i2 = [];
var c2 = l.__b;
var f2 = l.__r;
var e2 = l.diffed;
var a2 = l.__c;
var v2 = l.unmount;
function m2(t3, r3) {
  l.__h && l.__h(u2, t3, o2 || r3), (o2 = 0);
  var i3 = u2.__H || (u2.__H = { __: [], __h: [] });
  return t3 >= i3.__.length && i3.__.push({}), i3.__[t3];
}
function l2(n2) {
  return (o2 = 1), p2(w2, n2);
}
function p2(n2, r3, o3) {
  var i3 = m2(t2++, 2);
  return (
    (i3.t = n2),
    i3.__c ||
      ((i3.__ = [
        o3 ? o3(r3) : w2(void 0, r3),
        function (n3) {
          var t3 = i3.t(i3.__[0], n3);
          i3.__[0] !== t3 && ((i3.__ = [t3, i3.__[1]]), i3.__c.setState({}));
        },
      ]),
      (i3.__c = u2)),
    i3.__
  );
}
function y2(r3, o3) {
  var i3 = m2(t2++, 3);
  !l.__s && k2(i3.__H, o3) && ((i3.__ = r3), (i3.__H = o3), u2.__H.__h.push(i3));
}
function h2(r3, o3) {
  var i3 = m2(t2++, 4);
  !l.__s && k2(i3.__H, o3) && ((i3.__ = r3), (i3.__H = o3), u2.__h.push(i3));
}
function A(n2, u3) {
  var r3 = m2(t2++, 7);
  return k2(r3.__H, u3) && ((r3.__ = n2()), (r3.__H = u3), (r3.__h = n2)), r3.__;
}
function F(n2, t3) {
  return (
    (o2 = 8),
    A(function () {
      return n2;
    }, t3)
  );
}
function x2() {
  i2.forEach(function (t3) {
    if (t3.__P)
      try {
        t3.__H.__h.forEach(g2), t3.__H.__h.forEach(j2), (t3.__H.__h = []);
      } catch (u3) {
        (t3.__H.__h = []), l.__e(u3, t3.__v);
      }
  }),
    (i2 = []);
}
(l.__b = function (n2) {
  (u2 = null), c2 && c2(n2);
}),
  (l.__r = function (n2) {
    f2 && f2(n2), (t2 = 0);
    var r3 = (u2 = n2.__c).__H;
    r3 && (r3.__h.forEach(g2), r3.__h.forEach(j2), (r3.__h = []));
  }),
  (l.diffed = function (t3) {
    e2 && e2(t3);
    var o3 = t3.__c;
    o3 &&
      o3.__H &&
      o3.__H.__h.length &&
      ((i2.push(o3) !== 1 && r2 === l.requestAnimationFrame) ||
        (
          (r2 = l.requestAnimationFrame) ||
          function (n2) {
            var t4,
              u3 = function () {
                clearTimeout(r3), b2 && cancelAnimationFrame(t4), setTimeout(n2);
              },
              r3 = setTimeout(u3, 100);
            b2 && (t4 = requestAnimationFrame(u3));
          }
        )(x2)),
      (u2 = null);
  }),
  (l.__c = function (t3, u3) {
    u3.some(function (t4) {
      try {
        t4.__h.forEach(g2),
          (t4.__h = t4.__h.filter(function (n2) {
            return !n2.__ || j2(n2);
          }));
      } catch (r3) {
        u3.some(function (n2) {
          n2.__h && (n2.__h = []);
        }),
          (u3 = []),
          l.__e(r3, t4.__v);
      }
    }),
      a2 && a2(t3, u3);
  }),
  (l.unmount = function (t3) {
    v2 && v2(t3);
    var u3 = t3.__c;
    if (u3 && u3.__H)
      try {
        u3.__H.__.forEach(g2);
      } catch (t4) {
        l.__e(t4, u3.__v);
      }
  });
var b2 = typeof requestAnimationFrame == 'function';
function g2(n2) {
  var t3 = u2;
  typeof n2.__c == 'function' && n2.__c(), (u2 = t3);
}
function j2(n2) {
  var t3 = u2;
  (n2.__c = n2.__()), (u2 = t3);
}
function k2(n2, t3) {
  return (
    !n2 ||
    n2.length !== t3.length ||
    t3.some(function (t4, u3) {
      return t4 !== n2[u3];
    })
  );
}
function w2(n2, t3) {
  return typeof t3 == 'function' ? t3(n2) : t3;
}

// src/types/NumProc.ts
var numprocRE = /^5\d{8}20\d{2}404(?:00|7(?:0|1|2)|99)\d{2}$/;
var isNumProc = /* @__PURE__ */ refine(isString, x3 => numprocRE.test(x3));

// src/types/Bloco.ts
var isIdBloco = isNonNegativeInteger;
var isNomeBloco = isNonEmptyString;
var isBloco = /* @__PURE__ */ hasShape({
  id: isIdBloco,
  nome: isNomeBloco,
  processos: isArray(isNumProc),
});
var isBlocoProcesso = /* @__PURE__ */ hasShape({
  id: isIdBloco,
  nome: isNomeBloco,
  inserido: isBoolean,
});

// src/types/Action.ts
var isServerMessage = /* @__PURE__ */ isTaggedUnion('type', {
  FornecerBlocosProcesso: {
    blocos: isArray(isBlocoProcesso),
  },
});
var isServerLoadingAction = /* @__PURE__ */ isTaggedUnion('type', {
  AtualizarBlocos: { blocos: isArray(isBloco) },
  DadosInvalidos: { motivo: isString },
  Erro: { motivo: isString },
  ObterDados: {},
});
var isServerLoadedAction = /* @__PURE__ */ isTaggedUnion('type', {
  AtualizacaoExterna: { blocos: isArray(isBloco) },
  CriarBloco: { nome: isNomeBloco },
  Erro: { motivo: isString },
  ExcluirBloco: { bloco: isIdBloco },
  RenomearBloco: { bloco: isIdBloco, nome: isNomeBloco },
  SelecionarProcessos: { bloco: isIdBloco },
});
var isBroadcastMessage = /* @__PURE__ */ isTaggedUnion('type', {
  Blocos: { blocos: isArray(isBloco) },
  NoOp: {},
});

// src/createBroadcastService.ts
function createBroadcastService({ debug = false } = {}) {
  const handlers = new Set();
  const bc = new BroadcastChannel('gm-blocos');
  bc.addEventListener('message', listener);
  return { publish, subscribe, destroy };
  function destroy() {
    bc.removeEventListener('message', listener);
    handlers.clear();
    bc.close();
  }
  function listener(evt) {
    if (debug) {
      console.debug(evt);
    }
    if (isBroadcastMessage(evt.data)) for (const handler of handlers) handler(evt.data);
  }
  function publish(message) {
    if (debug) {
      console.debug(message);
    }
    bc.postMessage(message);
  }
  function subscribe(handler) {
    handlers.add(handler);
    return () => handlers.delete(handler);
  }
}

// src/database.ts
var database_exports = {};
__export(database_exports, {
  createBloco: () => createBloco,
  deleteBloco: () => deleteBloco,
  deleteBlocos: () => deleteBlocos,
  getBloco: () => getBloco,
  getBlocos: () => getBlocos,
  open: () => open,
  updateBloco: () => updateBloco,
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
var promisifyRequest = /* @__PURE__ */ promisify('success');
var promisifyTransaction = /* @__PURE__ */ promisify('complete');
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
var compararBlocos = /* @__PURE__ */ compareUsing(
  bloco => bloco.nome,
  alt(
    compareUsing(x3 => x3.toLowerCase()),
    compareDefault,
    nome => {
      throw new Error(`H\xE1 dois blocos com o mesmo nome: ${JSON.stringify(nome)}.`);
    }
  )
);
function alt(...fns) {
  return (a3, b3) => {
    for (const fn of fns) {
      const result = fn(a3, b3);
      if (result !== 0) return result;
    }
    return 0;
  };
}
function compareDefault(a3, b3) {
  if (a3 < b3) return -1;
  if (a3 > b3) return 1;
  return 0;
}
function compareUsing(f3, compareFn = compareDefault) {
  return (a3, b3) => compareFn(f3(a3), f3(b3));
}
async function getBloco(id) {
  const [bloco] = await makeTransaction('readonly', store => [store.get(id)]);
  assert(isAnyOf(isBloco, isUndefined)(bloco));
  return bloco;
}
var createBloco = /* @__PURE__ */ writeBloco('add');
async function deleteBloco(id) {
  const [done, blocos] = await makeTransaction('readwrite', store => [
    store.delete(id),
    store.getAll(),
  ]);
  return validarBlocos(blocos);
}
var updateBloco = /* @__PURE__ */ writeBloco('put');
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

// src/lib/expectUnreachable.ts
function expectUnreachable(value) {
  throw new Error('Unreachable code.');
}

// src/lib/fromThunk.ts
function createFromAsyncThunk(onLoading, onError) {
  return asyncThunk => (state, dispatch, extra) => {
    const asyncAction = asyncThunk(state, extra);
    asyncAction.catch(onError).then(dispatch);
    return onLoading(state, dispatch, extra);
  };
}

// src/paginas/LocalizadorProcessoLista.tsx
var fromThunk = createFromAsyncThunk(
  state => state,
  error => () => ({ status: 'error', error })
);
var actions = {
  blocosModificados: blocos => (state, dispatch, extra) => {
    const { bc } = extra;
    bc.publish({ type: 'Blocos', blocos });
    return actions.blocosObtidos(blocos)(state, dispatch, extra);
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
      return { status: 'loaded', blocos: info };
    },
  criarBloco: nome =>
    fromThunk(async (state, { DB }) => {
      const blocos = await DB.getBlocos();
      if (blocos.some(x3 => x3.nome === nome))
        return actions.erroCapturado(`J\xE1 existe um bloco com o nome ${JSON.stringify(nome)}.`);
      const bloco = {
        id: Math.max(-1, ...blocos.map(x3 => x3.id)) + 1,
        nome,
        processos: [],
      };
      return actions.blocosModificados(await DB.createBloco(bloco));
    }),
  erroCapturado: aviso => state => {
    switch (state.status) {
      case 'init':
        return { status: 'error', error: aviso };
      case 'error':
        return state;
      case 'loaded':
        return { ...state, aviso };
    }
    return expectUnreachable(state);
  },
  excluirBD: () =>
    fromThunk(async ({}, { DB }) => {
      await DB.deleteBlocos();
      return actions.obterBlocos();
    }),
  excluirBloco: bloco =>
    fromThunk(async ({}, { DB }) => {
      return actions.blocosModificados(await DB.deleteBloco(bloco));
    }),
  mensagemRecebida: msg => {
    switch (msg.type) {
      case 'Blocos':
        return actions.blocosObtidos(msg.blocos);
      case 'NoOp':
        return actions.noop();
      default:
        return expectUnreachable(msg);
    }
  },
  obterBlocos: () =>
    fromThunk(async ({}, { DB }) => actions.blocosModificados(await DB.getBlocos())),
  noop: () => state => state,
  removerProcessosAusentes: id =>
    fromThunk(async (_2, { DB, mapa }) => {
      const bloco = await DB.getBloco(id);
      if (!bloco) throw new Error(`Bloco n\xE3o encontrado: ${id}.`);
      const processos = bloco.processos.filter(x3 => mapa.has(x3));
      return actions.blocosModificados(await DB.updateBloco({ ...bloco, processos }));
    }),
  renomearBloco: (id, nome) =>
    fromThunk(async ({}, { DB }) => {
      const blocos = await DB.getBlocos();
      const bloco = blocos.find(x3 => x3.id === id);
      if (!bloco) throw new Error(`Bloco n\xE3o encontrado: ${id}.`);
      const others = blocos.filter(x3 => x3.id !== id);
      if (others.some(x3 => x3.nome === nome))
        return actions.erroCapturado(`J\xE1 existe um bloco com o nome ${JSON.stringify(nome)}.`);
      return actions.blocosModificados(await DB.updateBloco({ ...bloco, nome }));
    }),
  selecionarProcessos: id =>
    fromThunk(async ({}, { DB, mapa }) => {
      const bloco = await DB.getBloco(id);
      if (!bloco) throw new Error(`Bloco n\xE3o encontrado: ${id}.`);
      for (const [numproc, { checkbox }] of mapa) {
        if (bloco.processos.includes(numproc)) {
          if (!checkbox.checked) checkbox.click();
        } else {
          if (checkbox.checked) checkbox.click();
        }
      }
      return actions.noop();
    }),
};
function LocalizadorProcessoLista() {
  const tabela = document.querySelector('table#tabelaLocalizadores');
  const linhas = Array.from(tabela?.rows ?? { length: 0 });
  if (linhas.length <= 1) return;
  const mapa = new Map(
    linhas.slice(1).map((linha, i3) => {
      const endereco = linha.cells[1]?.querySelector('a[href]')?.href;
      assert(isNotNullish(endereco), `Link do processo n\xE3o encontrado: linha ${i3}.`);
      const numproc = new URL(endereco).searchParams.get('num_processo');
      assert(isNumProc(numproc), `N\xFAmero de processo desconhecido: ${JSON.stringify(numproc)}.`);
      const checkbox = linha.cells[0]?.querySelector('input[type=checkbox]');
      assert(isNotNullish(checkbox), `Caixa de sele\xE7\xE3o n\xE3o encontrada: linha ${i3}.`);
      return [numproc, { linha, checkbox }];
    })
  );
  const barra = document.getElementById('divInfraBarraLocalizacao');
  assert(isNotNull(barra), 'N\xE3o foi poss\xEDvel inserir os blocos na p\xE1gina.');
  const div = barra.insertAdjacentElement('afterend', document.createElement('div'));
  S(
    /* @__PURE__ */ v(Main, {
      mapa,
    }),
    div
  );
}
function Main(props) {
  const extra = A(() => {
    const DB = database_exports,
      bc = createBroadcastService(),
      { mapa } = props;
    return { DB, bc, mapa };
  }, []);
  const [state, dispatch] = p2((state2, action) => action(state2, dispatch, extra), {
    status: 'init',
  });
  h2(() => {
    extra.bc.subscribe(msg => dispatch(actions.mensagemRecebida(msg)));
    dispatch(actions.obterBlocos());
  }, []);
  switch (state.status) {
    case 'error':
      return /* @__PURE__ */ v(ShowError, {
        reason: state.error,
        dispatch,
      });
    case 'loaded':
      return /* @__PURE__ */ v(Blocos, {
        state,
        dispatch,
      });
    case 'init':
      return /* @__PURE__ */ v(Loading, null);
  }
  return expectUnreachable(state);
}
function Loading() {
  return /* @__PURE__ */ v(d, null, 'Carregando...');
}
function ShowError({ dispatch, reason }) {
  const message =
    reason instanceof Error
      ? reason.message
        ? `Ocorreu um erro: ${reason.message}`
        : 'Ocorreu um erro desconhecido.'
      : `Ocorreu um erro: ${String(reason)}`;
  return /* @__PURE__ */ v(
    d,
    null,
    /* @__PURE__ */ v(
      'span',
      {
        style: 'color:red; font-weight: bold;',
      },
      message
    ),
    /* @__PURE__ */ v('br', null),
    /* @__PURE__ */ v('br', null),
    /* @__PURE__ */ v(
      'button',
      {
        onClick: () => dispatch(actions.obterBlocos()),
      },
      'Tentar carregar dados salvos'
    ),
    /* @__PURE__ */ v(
      'button',
      {
        onClick: () => dispatch(actions.excluirBD()),
      },
      'Apagar os dados locais'
    )
  );
}
function Blocos(props) {
  const [nome, setNome] = l2('');
  const onSubmit = F(
    e3 => {
      e3.preventDefault();
      if (isNonEmptyString(nome)) props.dispatch(actions.criarBloco(nome));
      else props.dispatch(actions.erroCapturado('Nome do bloco n\xE3o pode estar em branco.'));
      setNome('');
    },
    [nome]
  );
  let aviso = null;
  if (props.state.aviso) {
    aviso = /* @__PURE__ */ v(
      d,
      null,
      /* @__PURE__ */ v(
        'span',
        {
          style: 'color:red',
        },
        props.state.aviso
      ),
      /* @__PURE__ */ v(
        'button',
        {
          onClick: () => props.dispatch(actions.obterBlocos()),
        },
        'Recarregar dados'
      )
    );
  }
  return /* @__PURE__ */ v(
    d,
    null,
    /* @__PURE__ */ v('h1', null, 'Blocos'),
    /* @__PURE__ */ v(
      'ul',
      null,
      props.state.blocos.map(bloco =>
        /* @__PURE__ */ v(Bloco2, {
          key: bloco.id,
          ...bloco,
          dispatch: props.dispatch,
        })
      )
    ),
    /* @__PURE__ */ v(
      'form',
      {
        onSubmit,
      },
      /* @__PURE__ */ v('input', {
        value: nome,
        onInput: evt => setNome(evt.currentTarget.value),
      }),
      ' ',
      /* @__PURE__ */ v('button', null, 'Criar')
    ),
    /* @__PURE__ */ v('br', null),
    aviso
  );
}
function Bloco2(props) {
  const [editing, setEditing] = l2(false);
  const input = p();
  y2(() => {
    if (editing && input.current) {
      input.current.select();
      input.current.focus();
    }
  }, [editing]);
  let displayNome = props.nome;
  let botaoRenomear = /* @__PURE__ */ v(
    'button',
    {
      onClick: onRenomearClicked,
    },
    'Renomear'
  );
  let removerAusentes = /* @__PURE__ */ v(
    'button',
    {
      onClick: () => props.dispatch(actions.removerProcessosAusentes(props.id)),
    },
    'Remover processos ausentes'
  );
  if (editing) {
    displayNome = /* @__PURE__ */ v('input', {
      ref: input,
      onKeyUp,
      value: props.nome,
    });
    botaoRenomear = null;
  } else if (props.nestaPagina > 0) {
    displayNome = /* @__PURE__ */ v(
      'button',
      {
        onClick: onSelecionarProcessosClicked,
      },
      props.nome
    );
  }
  if (props.total <= props.nestaPagina) {
    removerAusentes = null;
  }
  return /* @__PURE__ */ v(
    'li',
    null,
    displayNome,
    ' (',
    createAbbr(props.nestaPagina, props.total),
    ') ',
    botaoRenomear,
    ' ',
    /* @__PURE__ */ v(
      'button',
      {
        onClick: onExcluirClicked,
      },
      'Excluir'
    ),
    ' ',
    removerAusentes
  );
  function createAbbr(nestaPagina, total) {
    if (total === 0) return '0 processo';
    if (nestaPagina === total) return `${total} processo${total > 1 ? 's' : ''}`;
    const textoTotal = `${total} processo${total > 1 ? 's' : ''} no bloco`;
    const textoPagina = `${nestaPagina === 0 ? 'nenhum' : nestaPagina} nesta p\xE1gina`;
    const textoResumido = `${nestaPagina}/${total} processo${total > 1 ? 's' : ''}`;
    return /* @__PURE__ */ v(
      'abbr',
      {
        title: `${textoTotal}, ${textoPagina}.`,
      },
      textoResumido
    );
  }
  function onKeyUp(evt) {
    console.log('Key', evt.key);
    if (evt.key === 'Enter') {
      const nome = evt.currentTarget.value;
      setEditing(false);
      if (isNonEmptyString(nome)) {
        props.dispatch(actions.renomearBloco(props.id, nome));
      } else {
        props.dispatch(actions.erroCapturado('Nome do bloco n\xE3o pode estar em branco.'));
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
        `Este bloco possui ${len} processo${len > 1 ? 's' : ''}. Deseja exclu\xED-lo?`
      );
    if (confirmed) props.dispatch(actions.excluirBloco(props.id));
  }
  function onSelecionarProcessosClicked() {
    props.dispatch(actions.selecionarProcessos(props.id));
  }
}

// src/paginas/ProcessoSelecionar.css
var ProcessoSelecionar_default =
  ".menu-dark #gm-blocos,\n.menu-light #gm-blocos {\n  --accent: #41285e;\n  --bg: #494251;\n  --disabled: #5d5863;\n  --disabled-text: #ccc;\n  --shadow: #262c31;\n  --muted-accent: #453557;\n  --text: #fff;\n}\n#gm-blocos {\n  margin: 2px 3px 4px;\n  padding: 4px;\n  border-radius: 4px;\n  background: var(--bg);\n  color: var(--text);\n  box-shadow: 0 3px 3px var(--shadow);\n}\n#gm-blocos h4 {\n  margin: 3px 0;\n  font-size: 1.25rem;\n  font-weight: 300;\n}\n#gm-blocos ul {\n  list-style-type: none;\n  margin: 3px 0 7px;\n  padding: 0;\n}\n#gm-blocos li {\n  position: relative;\n  display: grid;\n  grid-template-columns: auto 1fr auto;\n  grid-gap: 5px;\n  align-items: center;\n  margin: 4px 0;\n  padding: 5px;\n  border-radius: 2px;\n}\n#gm-blocos li::before {\n  content: '';\n  position: absolute;\n  top: 2px;\n  width: 100%;\n  height: 100%;\n  border-bottom: 1px solid #888;\n  pointer-events: none;\n}\n#gm-blocos li:last-of-type::before {\n  content: none;\n}\n#gm-blocos li:hover {\n  background: var(--accent);\n}\n#gm-blocos label {\n  margin: 0;\n  font-size: 0.92rem;\n}\n#gm-blocos .placeholder span {\n  height: 1.38rem;\n  animation: pulse 1s ease-in-out infinite alternate;\n  border-radius: 4px;\n}\n#gm-blocos .placeholder span:first-of-type,\n#gm-blocos .placeholder span:last-of-type {\n  width: 1.38rem;\n}\n@keyframes pulse {\n  from {\n    background-color: var(--disabled);\n  }\n  to {\n    background-color: var(--bg);\n  }\n}\n#gm-blocos button {\n  display: block;\n  margin: 0 auto 7px;\n  padding: 2px 20px;\n  font-size: 0.86rem;\n  border: none;\n  border-radius: 3px;\n  box-shadow: 0 2px 4px var(--shadow);\n  background: var(--muted-accent);\n  color: var(--text);\n}\n#gm-blocos button:hover {\n  transition: background-color 0.1s ease-in;\n  background: var(--accent);\n}\n#gm-blocos button:disabled {\n  background: var(--disabled);\n  color: var(--disabled-text);\n  box-shadow: none;\n}\n#gm-blocos .error {\n  margin: 10px 5%;\n  padding: 4px 5%;\n  border-radius: 4px;\n  font-weight: 500;\n  background: white;\n  color: red;\n}\n";

// src/paginas/ProcessoSelecionar.tsx
var actions2 = {
  blocosModificados:
    (blocos, { fecharJanela = false } = {}) =>
    (state, dispatch, extra) => {
      const { bc } = extra;
      bc.publish({ type: 'Blocos', blocos });
      if (fecharJanela) window.close();
      return actions2.blocosObtidos(blocos)(state, dispatch, extra);
    },
  blocosObtidos: blocos => () => ({ status: 'Success', blocos, inactive: false }),
  carregando: () => state => {
    switch (state.status) {
      case 'Loading':
      case 'Error':
        return { status: 'Loading' };
      case 'Success':
        return { ...state, inactive: true, erro: void 0 };
    }
    return expectUnreachable(state);
  },
  criarBloco: nome =>
    fromThunk2(async ({}, { DB }) => {
      const blocos = await DB.getBlocos();
      if (blocos.some(x3 => x3.nome === nome))
        return actions2.erroCapturado(`J\xE1 existe um bloco com o nome ${JSON.stringify(nome)}.`);
      const bloco = {
        id: Math.max(-1, ...blocos.map(x3 => x3.id)) + 1,
        nome,
        processos: [],
      };
      return actions2.blocosModificados(await DB.createBloco(bloco));
    }),
  erro: reason => () => ({ status: 'Error', reason }),
  erroCapturado: reason => state => {
    switch (state.status) {
      case 'Loading':
        return { status: 'Error', reason };
      case 'Error':
        return state;
      case 'Success':
        return { ...state, inactive: false, erro: reason };
    }
    return expectUnreachable(state);
  },
  inserir: (id, { fecharJanela = false } = {}) =>
    actions2.modificarProcessos(
      id,
      (processos, numproc) => {
        processos.add(numproc);
      },
      { fecharJanela }
    ),
  inserirEFechar: id => actions2.inserir(id, { fecharJanela: true }),
  mensagemRecebida: msg => {
    switch (msg.type) {
      case 'Blocos':
        return actions2.blocosObtidos(msg.blocos);
      case 'NoOp':
        return actions2.noop();
    }
    expectUnreachable(msg);
  },
  modificarProcessos: (id, fn, { fecharJanela = false } = {}) =>
    fromThunk2(async (_2, { DB, numproc }) => {
      const bloco = await DB.getBloco(id);
      if (!bloco) throw new Error(`Bloco n\xE3o encontrado: ${id}.`);
      const processos = new Set(bloco.processos);
      fn(processos, numproc);
      const blocos = await DB.updateBloco({ ...bloco, processos: [...processos] });
      return actions2.blocosModificados(blocos, { fecharJanela });
    }),
  noop: () => state => state,
  obterBlocos: () =>
    fromThunk2(async ({}, { DB }) => actions2.blocosModificados(await DB.getBlocos())),
  remover: id =>
    actions2.modificarProcessos(id, (processos, numproc) => {
      processos.delete(numproc);
    }),
};
var fromThunk2 = /* @__PURE__ */ createFromAsyncThunk(actions2.carregando(), actions2.erro);
function ProcessoSelecionar(numproc) {
  const mainMenu = document.getElementById('main-menu');
  assert(isNotNull(mainMenu));
  const style = document.head.appendChild(document.createElement('style'));
  style.textContent = ProcessoSelecionar_default;
  const div = mainMenu.insertAdjacentElement('beforebegin', document.createElement('div'));
  div.id = 'gm-blocos';
  S(
    /* @__PURE__ */ v(Main2, {
      numproc,
    }),
    div
  );
}
function Main2(props) {
  const extra = A(() => {
    const DB = database_exports,
      bc = createBroadcastService(),
      { numproc } = props;
    return { DB, bc, numproc };
  }, []);
  const [state, dispatch] = p2((state2, action) => action(state2, dispatch, extra), {
    status: 'Loading',
  });
  h2(() => {
    extra.bc.subscribe(msg => dispatch(actions2.mensagemRecebida(msg)));
    dispatch(actions2.obterBlocos());
  }, []);
  switch (state.status) {
    case 'Loading':
      return /* @__PURE__ */ v(Placeholder, null);
    case 'Error':
      return /* @__PURE__ */ v(ShowError2, {
        dispatch,
        reason: state.reason,
      });
    case 'Success':
      return /* @__PURE__ */ v(Blocos2, {
        blocos: state.blocos.map(({ processos, ...rest }) => ({
          ...rest,
          inserido: processos.includes(props.numproc),
        })),
        dispatch,
        disabled: state.inactive,
        erro: state.erro,
      });
  }
  return expectUnreachable(state);
}
function ShowError2({ dispatch, reason }) {
  const message =
    typeof reason === 'object' && reason !== null && reason instanceof Error
      ? reason.message
        ? `Ocorreu um erro: ${reason.message}`
        : 'Ocorreu um erro desconhecido.'
      : `Ocorreu um erro: ${String(reason)}`;
  return /* @__PURE__ */ v(
    d,
    null,
    /* @__PURE__ */ v('h4', null, 'Blocos'),
    /* @__PURE__ */ v(
      'div',
      {
        class: 'error',
      },
      message
    ),
    /* @__PURE__ */ v(
      'button',
      {
        type: 'button',
        onClick: () => dispatch(actions2.obterBlocos()),
      },
      'Recarregar'
    )
  );
}
function Placeholder() {
  const li = /* @__PURE__ */ v(
    'li',
    {
      class: 'placeholder',
    },
    /* @__PURE__ */ v('span', null),
    /* @__PURE__ */ v('span', null),
    /* @__PURE__ */ v('span', null)
  );
  return /* @__PURE__ */ v(
    d,
    null,
    /* @__PURE__ */ v('h4', null, 'Blocos'),
    /* @__PURE__ */ v('ul', null, li, li, li),
    /* @__PURE__ */ v(
      'button',
      {
        type: 'button',
        id: 'gm-novo-bloco',
        disabled: true,
      },
      'Novo'
    )
  );
}
function Blocos2(props) {
  let aviso = null;
  if (props.erro) {
    aviso = /* @__PURE__ */ v(
      'div',
      {
        class: 'error',
      },
      props.erro
    );
  }
  return /* @__PURE__ */ v(
    d,
    null,
    /* @__PURE__ */ v('h4', null, 'Blocos'),
    /* @__PURE__ */ v(
      'ul',
      null,
      props.blocos.map(info =>
        /* @__PURE__ */ v(Bloco3, {
          key: info.id,
          ...info,
          dispatch: props.dispatch,
          disabled: props.disabled,
        })
      )
    ),
    /* @__PURE__ */ v(
      'button',
      {
        type: 'button',
        id: 'gm-novo-bloco',
        onClick: onNovoClicked,
        disabled: props.disabled,
      },
      'Novo'
    ),
    aviso
  );
  function onNovoClicked(evt) {
    evt.preventDefault();
    const nome = prompt('Nome do novo bloco:');
    if (nome === null) return;
    if (isNonEmptyString(nome)) {
      props.dispatch(actions2.criarBloco(nome));
    }
  }
}
function Bloco3(props) {
  const onChange = F(
    evt => {
      if (evt.currentTarget.checked) {
        props.dispatch(actions2.inserir(props.id));
      } else {
        props.dispatch(actions2.remover(props.id));
      }
    },
    [props.dispatch]
  );
  return /* @__PURE__ */ v(
    'li',
    null,
    /* @__PURE__ */ v('input', {
      id: `gm-bloco-${props.id}`,
      type: 'checkbox',
      checked: props.inserido,
      onChange,
      disabled: props.disabled,
    }),
    ' ',
    /* @__PURE__ */ v(
      'label',
      {
        for: `gm-bloco-${props.id}`,
      },
      props.nome
    ),
    props.inserido
      ? /* @__PURE__ */ v('span', null)
      : /* @__PURE__ */ v(
          d,
          null,
          ' ',
          /* @__PURE__ */ v('input', {
            type: 'image',
            src: 'infra_css/imagens/transportar.gif',
            onClick: () => props.dispatch(actions2.inserirEFechar(props.id)),
            disabled: props.disabled,
          })
        )
  );
}

// src/index.ts
async function main() {
  const url = new URL(document.location.href);
  const params = url.searchParams;
  const acao = params.get('acao');
  switch (acao) {
    case 'localizador_processos_lista':
      return LocalizadorProcessoLista();
    case 'processo_selecionar': {
      const numproc = params.get('num_processo');
      assert(
        isNumProc(numproc),
        `N\xE3o foi poss\xEDvel analisar o n\xFAmero do proceso: ${JSON.stringify(numproc)}.`
      );
      return ProcessoSelecionar(numproc);
    }
  }
}
main().catch(e3 => {
  console.error(e3);
});
