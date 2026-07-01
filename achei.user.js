// ==UserScript==
// @name         Achei
// @namespace    http://nadameu.com.br/achei
// @version      18.0.0
// @author       nadameu
// @description  Link para informações da Intra na página do Achei!
// @match        http://centralrh.trf4.gov.br/achei/pesquisar.php?acao=pesquisar
// @match        http://centralrh.trf4.gov.br/achei/pesquisar.php?acao=pesquisar&*
// @match        https://centralrh.trf4.gov.br/achei/pesquisar.php?acao=pesquisar
// @match        https://centralrh.trf4.gov.br/achei/pesquisar.php?acao=pesquisar&*
// @match        http://serh.trf4.jus.br/achei/pesquisar.php?acao=pesquisar
// @match        http://serh.trf4.jus.br/achei/pesquisar.php?acao=pesquisar&*
// @match        https://serh.trf4.jus.br/achei/pesquisar.php?acao=pesquisar
// @match        https://serh.trf4.jus.br/achei/pesquisar.php?acao=pesquisar&*
// ==/UserScript==

(function () {
  'use strict';
  var ResultCommon = class {
    map(f) {
      return this.chain(x => new Ok(f(x)));
    }
    mapErr(f) {
      return this.catch(x => new Err(f(x)));
    }
  };
  var Ok = class extends ResultCommon {
    value;
    ok = true;
    constructor(value) {
      super();
      this.value = value;
    }
    *[Symbol.iterator]() {
      yield this.value;
    }
    catch(_) {
      return this;
    }
    chain(f) {
      return f(this.value);
    }
    toMaybe() {
      return this;
    }
  };
  var ok = value => new Ok(value);
  var Err = class extends ResultCommon {
    reason;
    ok = false;
    constructor(reason) {
      super();
      this.reason = reason;
    }
    *[Symbol.iterator]() {}
    catch(f) {
      return f(this.reason);
    }
    chain(_) {
      return this;
    }
    toMaybe() {
      return nothing();
    }
  };
  var err = reason => new Err(reason);
  var just = ok;
  var Nothing = null;
  var nothing = () => (Nothing ??= err(void 0));
  var Reader = class {
    catch(f) {
      return this.mapReader(res => res.catch(f));
    }
    catchParser(f) {
      return new Chain(
        this,
        res => new Pure(env => res.catch(e => f(e).run(env)))
      );
    }
    chain(f) {
      return this.mapReader(res => res.chain(f));
    }
    chainParser(f) {
      return new Chain(
        this,
        res => new Pure(env => res.chain(a => f(a).run(env)))
      );
    }
    chainReader(f) {
      return new Chain(this, f);
    }
    map(f) {
      return this.mapReader(res => res.map(f));
    }
    mapErr(f) {
      return this.mapReader(res => res.mapErr(f));
    }
    mapReader(f) {
      return new Chain(this, v => new Pure(_ => f(v)));
    }
  };
  var Pure = class Pure extends Reader {
    run;
    pure = true;
    constructor(run) {
      super();
      this.run = run;
    }
    apReader(ff) {
      if (ff.pure) return new Pure(env => ff.run(env)(this.run(env)));
      return new Chain(ff.fa, f0 => this.apReader(ff.f(f0)));
    }
  };
  var reader = run => new Pure(run);
  var Chain = class Chain extends Reader {
    fa;
    f;
    pure = false;
    constructor(fa, f) {
      super();
      this.fa = fa;
      this.f = f;
    }
    apReader(ff) {
      if (ff.pure) return new Chain(this.fa, a0 => this.f(a0).apReader(ff));
      else
        return new Chain(
          this.fa,
          a0 => new Chain(ff.fa, f0 => this.f(a0).apReader(ff.f(f0)))
        );
    }
    _step(env) {
      const prev = this.fa;
      if (prev.pure) return this.f(prev.run(env));
      else return new Chain(prev.fa, v => new Chain(prev.f(v), this.f));
    }
    run(env) {
      let curr = this;
      while (!curr.pure) curr = curr._step(env);
      return curr.run(env);
    }
  };
  var parser = reader;
  var TaggedError = tag =>
    class extends Error {
      _tag = tag;
      name = tag;
      constructor(...args) {
        super();
        if (args.length === 1) this.cause = args[0];
      }
    };
  var ElementNotFound = class extends TaggedError('ElementNotFound') {};
  var ElementNotUnique = class extends TaggedError('ElementNotUnique') {};
  var maybeBool = pred => a => (pred(a) ? just(a) : nothing());
  var maybe = maybeBool(value => value != null);
  var eitherBool =
    (pred, mapErr = x => x) =>
    x =>
      pred(x) ? ok(x) : err(mapErr(x));
  var asks = f => reader(f);
  var askContext = key => asks(env => ok(env[key]));
  var askDocument = askContext('document');
  var askConsole = askContext('console');
  var iterate = f => s => {
    const values = [];
    let value;
    let result = f(s);
    while (result) {
      [value, s] = result;
      values.push(value);
      result = f(s);
    }
    return values;
  };
  var queryUnique = selector => context => {
    const elements = context.querySelectorAll(selector);
    if (elements.length === 1) return ok(elements[0]);
    return err(
      new (elements.length === 0 ? ElementNotFound : ElementNotUnique)({
        selector,
        context,
      })
    );
  };
  var OrphanNode = class extends TaggedError('OrphanNode') {};
  var parseNodeWithDocument = eitherBool(
    node => node.ownerDocument !== null,
    node => new OrphanNode(node)
  );
  var parseNodeWithParent = eitherBool(
    node => node.parentNode !== null,
    node => new OrphanNode(node)
  );
  var ITERATOR = XPathResult.ORDERED_NODE_ITERATOR_TYPE;
  var queryAllX = selector => context =>
    fromXPathResult(
      context.ownerDocument.evaluate(selector, context, null, ITERATOR)
    );
  var fromXPathResult = iterate(iter => {
    const node = iter.iterateNext();
    return node ? [node, iter] : null;
  });
  var combineParsers = parsers =>
    parser(env => {
      const lefts = [];
      const rights = [];
      for (const parser of parsers) {
        const result = parser.run(env);
        if (result.ok) rights.push(result.value);
        else lefts.push(result.reason);
      }
      if (lefts.length > 0) return err(lefts);
      else return ok(rights);
    });
  var LocalDesconhecido = class extends TaggedError('LocalDesconhecido') {};
  var dominios = {
    1: 'trf4',
    2: 'jfrs',
    3: 'jfsc',
    4: 'jfpr',
  };
  var parseDominio = askDocument
    .chain(queryUnique('input[name="local"]:checked'))
    .map(i => i.value)
    .chain(eitherBool(isInDominios, local => new LocalDesconhecido(local)))
    .map(d => dominios[d]);
  function isInDominios(key) {
    return key in dominios;
  }
  var parseFormulario = askDocument
    .chain(queryUnique('form[name="formulario"]'))
    .chain(parseNodeWithDocument);
  var selector = ['', 'table//td[2]/']
    .map(path => `following-sibling::${path}text()`)
    .join('|');
  var parseNodeSiglas = parseFormulario.map(formulario =>
    queryAllX(selector)(formulario)
      .values()
      .flatMap(text => parseNodeWithParent(text).chain(parseNodeSigla))
      .toArray()
  );
  var parseNodeSigla = node =>
    maybe(node.nodeValue)
      .chain(parseSigla)
      .map(sigla => ({
        node,
        sigla,
      }));
  var reSigla = /^\s*Sigla:\s*(\S+)\s*(\(antiga:\s*\S+\s*\))?\s*$/;
  var parseSigla = text =>
    maybe(text.match(reSigla))
      .chain(maybeBool(xs => xs.length === 3))
      .map(match => {
        if (match[2]) return match[1];
        else return match[1].toLowerCase();
      });
  var program = () =>
    combineParsers([
      parseNodeSiglas,
      parseDominio,
      askDocument,
      askConsole,
    ]).map(([nodeSiglas, dominio, doc, { log }]) => {
      const template = doc.createElement('template');
      const link = Object.assign(doc.createElement('a'), {
        href: '',
        target: '_blank',
        textContent: 'Abrir na Intra',
      });
      template.content.append(' [ ', link, ' ]');
      for (const { node, sigla } of nodeSiglas) {
        link.href = `https://intra.trf4.jus.br/membros/${sigla}${dominio}-jus-br`;
        const fragment = doc.importNode(template.content, true);
        node.parentNode.insertBefore(fragment, node.nextSibling);
      }
      const linksCriados = nodeSiglas.length;
      const s = linksCriados > 1 ? 's' : '';
      log(`${linksCriados} link${s} criado${s}.`);
    });
  try {
    program()
      .run({
        document,
        console: { log: console.log.bind(console, '[achei]') },
      })
      .mapErr(err => {
        console.group('[achei]');
        console.error(err);
        console.groupEnd();
      });
  } catch (err) {
    console.group('[achei]');
    console.error(err);
    console.groupEnd();
  }
})();
