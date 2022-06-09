// ==UserScript==
// @name        Achei
// @namespace   http://nadameu.com.br/achei
// @description Link para informações da Intra na página do Achei!
// @include     http://centralrh.trf4.gov.br/achei/pesquisar.php?acao=pesquisar
// @include     http://centralrh.trf4.gov.br/achei/pesquisar.php?acao=pesquisar&*
// @include     https://centralrh.trf4.gov.br/achei/pesquisar.php?acao=pesquisar
// @include     https://centralrh.trf4.gov.br/achei/pesquisar.php?acao=pesquisar&*
// @include     http://serh.trf4.jus.br/achei/pesquisar.php?acao=pesquisar
// @include     http://serh.trf4.jus.br/achei/pesquisar.php?acao=pesquisar&*
// @include     https://serh.trf4.jus.br/achei/pesquisar.php?acao=pesquisar
// @include     https://serh.trf4.jus.br/achei/pesquisar.php?acao=pesquisar&*
// @version     15.2.0
// @grant       none
// ==/UserScript==

function Fail(history) {
  const returnThis = () => _this;
  const _this = {
    tag: 'Fail',
    history,
    *[Symbol.iterator]() {},
    chain: returnThis,
    map: returnThis,
    mapIterable: returnThis,
    one: returnThis,
    query: returnThis,
    safeMap: returnThis,
  };
  return _this;
}
const ensureExhaustive = x => {
  throw new Error(`Unhandled case: ${x}.`);
};
function One(value, history) {
  return {
    tag: 'One',
    value,
    history,
    *[Symbol.iterator]() {
      yield value;
    },
    chain,
    map: f => One(f(value), [...history, 'map(f)']),
    mapIterable: f =>
      _mapHistory(
        chain(x => fromIterable(f(x))),
        () => [...history, 'mapIterable(f)']
      ),
    one: () => One(value, [...history, 'one()']),
    query: selector => {
      const newHistory = [...history, `query(\`${selector}\`)`];
      const result = value.querySelectorAll(selector);
      if (result.length === 0) return Fail(newHistory);
      if (result.length === 1) return One(result[0], newHistory);
      return Many(Array.from(result), newHistory);
    },
    safeMap: f => {
      const newHistory = [...history, 'safeMap(f)'];
      const result = f(value);
      if (result == null) return Fail(newHistory);
      return One(result, newHistory);
    },
  };
  function chain(f) {
    const newHistory = [...history, 'chain(f)'];
    const result = f(value);
    switch (result.tag) {
      case 'Fail':
        return Fail(newHistory);
      case 'One':
        return One(result.value, newHistory);
      case 'Many':
        return Many(result.values, newHistory);
      default:
        return ensureExhaustive(result);
    }
  }
}
function Many(values, history) {
  return {
    tag: 'Many',
    values,
    history,
    *[Symbol.iterator]() {
      yield* values;
    },
    chain,
    map: f =>
      Many(
        values.map(x => f(x)),
        [...history, 'map(f)']
      ),
    mapIterable: f =>
      _mapHistory(
        chain(x => fromIterable(f(x))),
        () => [...history, 'mapIterable(f)']
      ),
    one: () => Fail([...history, 'one()']),
    safeMap: f => {
      const newHistory = [...history, 'safeMap(f)'];
      const results = [];
      for (const value of values) {
        const result = f(value);
        if (result == null) return Fail(newHistory);
        results.push(result);
      }
      return Many(results, newHistory);
    },
  };
  function chain(f) {
    const newHistory = [...history, 'chain(f)'];
    const results = [];
    for (const value of values) {
      const result = f(value);
      if (result.tag === 'Fail') return Fail(newHistory);
      if (result.tag === 'One') results.push(result.value);
      else results.push(...result.values);
    }
    return Many(results, newHistory);
  }
}
const of = value => One(value, ['of(value)']);
function lift2(fx, fy, f) {
  if (fx.tag === 'Fail') return fx;
  if (fy.tag === 'Fail') return fy;
  const newHistory = [`lift2(${fx.history.join('.')}, ${fy.history.join('.')}, f)`];
  if (fx.tag === 'One' && fy.tag === 'One') return One(f(fx.value, fy.value), newHistory);
  const xs = fx.tag === 'One' ? [fx.value] : fx.values;
  const ys = fy.tag === 'One' ? [fy.value] : fy.values;
  return Many(
    xs.flatMap(x => ys.map(y => f(x, y))),
    newHistory
  );
}
function unfold(seed, f) {
  let results = [];
  let result;
  let currentSeed = seed;
  let value;
  while ((result = f(currentSeed))) {
    [value, currentSeed] = result;
    results.push(value);
  }
  const newHistory = ['unfold(seed, f)'];
  if (results.length === 0) return Fail(newHistory);
  if (results.length === 1) return One(results[0], newHistory);
  return Many(results, newHistory);
}
const fromIterable = iterable =>
  _mapHistory(
    unfold(iterable[Symbol.iterator](), (iter, result = iter.next()) =>
      result.done ? null : [result.value, iter]
    ),
    () => ['fromIterable(iterable)']
  );
const concat = (fx, fy) => {
  const newHistory = [`concat(${fx.history.join('.')}, ${fy.history.join('.')})`];
  const k = () => newHistory;
  if (fy.tag === 'Fail') return _mapHistory(fx, k);
  if (fx.tag === 'Fail') return _mapHistory(fy, k);
  return _mapHistory(fromIterable(Array.from(fx).concat(Array.from(fy))), k);
};
function _mapHistory(fx, f) {
  const newHistory = f(fx.history);
  if (fx.tag === 'Fail') return Fail(newHistory);
  if (fx.tag === 'One') return One(fx.value, newHistory);
  return Many(fx.values, newHistory);
}

function main(doc) {
  const result = lift2(
    getDominio(doc),
    getFormulario(doc).map(getNodeInfo),
    (dominio, nodeInfo) => {
      criarLinks(doc, dominio, nodeInfo);
      const qtd = nodeInfo.length;
      const s = qtd > 1 ? 's' : '';
      console.log(`${qtd} link${s} criado${s}`);
    }
  );
  if (result.tag === 'Fail') {
    console.error(result.history.join('.'));
  }
}
const dominios = {
  1: 'trf4',
  2: 'jfrs',
  3: 'jfsc',
  4: 'jfpr',
};
const getDominio = doc =>
  of(doc)
    .query('input[name="local"]:checked')
    .one()
    .map(x => x.value)
    .safeMap(x => ((k => k in dominios)(x) ? dominios[x] : null));
const getFormulario = doc => of(doc).query('form[name="formulario"]').one();
const getNodeInfo = formulario => Array.from(parseFormulario(formulario));
function parseFormulario(formulario) {
  return siblings(formulario).chain(flattenTabela).chain(getNodeSigla);
}
function siblings(node) {
  return unfold(node.nextSibling, s => (s === null ? null : [s, s.nextSibling]));
}
function flattenTabela(node) {
  const qn = of(node);
  if (node instanceof HTMLTableElement)
    return concat(
      of(node)
        .query('td:nth-child(2)')
        .one()
        .mapIterable(celula => celula.childNodes),
      qn
    );
  return qn;
}
const getNodeSigla = node =>
  of(node)
    .safeMap(x => x.textContent)
    .chain(siglaFromText)
    .map(sigla => ({ node, sigla }));
const reSigla = /^\s*Sigla:\s*(\S+)\s*(\(antiga:\s*\S+\s*\))?\s*$/;
const siglaFromText = text =>
  of(text)
    .safeMap(x => x.match(reSigla))
    .map(match => {
      if (match[2]) {
        // Possui sigla antiga e nova
        return match[1];
      } else {
        // Possui somente sigla nova
        return match[1].toLowerCase();
      }
    });
function criarLinks(doc, dominio, nodeInfo) {
  const template = doc.createElement('template');
  template.innerHTML = ' [ <a href="" target="_blank">Abrir na Intra</a> ]';
  const content = template.content;
  const link = content.querySelector('a');
  for (const { node, sigla } of nodeInfo) {
    link.href = `https://intra.trf4.jus.br/membros/${sigla}${dominio}-jus-br`;
    const fragment = doc.importNode(content, true);
    node.parentNode.insertBefore(fragment, node.nextSibling);
  }
}
main(document);
