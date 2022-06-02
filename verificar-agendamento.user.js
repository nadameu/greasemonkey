// ==UserScript==
// @name        verificar-agendamento
// @name:pt-BR  Verificar agendamento
// @namespace   http://nadameu.com.br
// @match       https://eproc.jfpr.jus.br/eprocV2/controlador.php?acao=minuta_verificar_agendamento&*
// @match       https://eproc.jfrs.jus.br/eprocV2/controlador.php?acao=minuta_verificar_agendamento&*
// @match       https://eproc.jfsc.jus.br/eprocV2/controlador.php?acao=minuta_verificar_agendamento&*
// @match       https://eproc.trf4.jus.br/eproc2trf4/controlador.php?acao=minuta_verificar_agendamento&*
// @grant       none
// @version     1.1.0
// @author      Paulo R. Maurici Jr.
// @description Fecha a tela de alteração de agendamento quando a minuta foi criada em bloco
// ==/UserScript==

class Query {
  static query(selector, context = document) {
    return Query.of(context).query(selector);
  }
  static of(value) {
    return new QueryOne(value, ['Query', 'of(value)']);
  }
  static sequenceObj(obj) {
    const results = {};
    for (const [key, query] of Object.entries(obj)) {
      if (query instanceof QueryNone) return query;
      if (query instanceof QueryOne) results[key] = query.value;
      else results[key] = query.values;
    }
    return new QueryOne(results, ['Query', `sequenceObj({ ${Object.keys(results).sort().join(', ')} })`]);
  }
}

class QueryNone extends Query {
  constructor(errors) {
    super();
    this.errors = errors;
  }
  
  catch(handler) {
    handler(this.errors);
  }
  filter(p) { return this; }
  flatMap(f) { return this; }
  isEmpty() { return true; }
  isNotEmpty() { return false; }
  map(f) { return this; }
  notEmpty() { return this; }
  one() { return this; }
  query(selector) { return this; }
  safeMap(f) { return this; }
  toArray() { return []; }
}

class QueryOne extends Query {
  constructor(value, messages) {
    super();
    this.value = value;
    this.messages = messages;
  }
  
  catch(handler) {}
  filter(p) {
    const messages = [...this.messages, 'filter(p)'];
    if (p(this.value)) return new QueryOne(this.value, messages);
    return new QueryNone([new Error(`${messages.join('\n\t.')}\nwas false.`)]);
  }
  flatMap(f) {
    const result = f(this.value);
    const messages = [...this.messages, 'flatMap(f)'];
    if (result instanceof QueryNone) return new QueryNone([new Error(`${messages.join('\n\t.')}\nreturned a QueryNone.`), ...result.errors]);
    if (result instanceof QueryOne) return new QueryOne(result.value, messages);
    return new QuerySome(result.values, messages);
  }
  isEmpty() { return false; }
  isNotEmpty() { return true; }
  map(f) {
    return new QueryOne(f(this.value), [...this.messages, 'map(f)']);
  }
  notEmpty() {
    return new QuerySome([this.value], [...this.messages, 'notEmpty()']);
  }
  one() {
    return new QueryOne(this.value, [...this.messages, 'one()']);
  }
  query(selector) {
    return new QuerySome(Array.from(this.value.querySelectorAll(selector)), [...this.messages, `query(\`${selector}\`)`]);
  }
  safeMap(f) {
    const result = f(this.value);
    const messages = [...this.messages, 'safeMap(f)'];
    if (result == null) return new QueryNone([new Error(`${messages.join('\n\t.')}\nreturned null or undefined.`)]);
    return new QueryOne(result, messages);
  }
  toArray() { return [this.value]; }
}

class QuerySome extends Query {
  constructor(values, messages) {
    super();
    this.values = values;
    this.messages = messages;
  }

  catch(handler) {}
  filter(p) {
    if (this.values.length === 0) return this;
    return new QuerySome(this.values.filter(x => p(x)), [...this.messages, 'filter(p)']);
  }
  flatMap(f) {
    if (this.values.length === 0) return this;
    return new QuerySome(this.values.flatMap(x => f(x).toArray()), [...this.messages, 'flatMap(f)']);
  }
  isEmpty() { return this.values.length === 0; }
  isNotEmpty() { return this.values.length !== 0; }
  map(f) {
    if (this.values.length === 0) return this;
    return new QuerySome(this.values.map(x => f(x)), [...this.messages, 'map(f)']);
  }
  notEmpty() {
    if (this.values.length === 0) return new QueryNone([new Error(`${this.messages.join('\n\t.')}\nreturned an empty set.`)]);
    return new QuerySome(this.values, [...this.messages, 'notEmpty()']);
  }
  one() {
    if (this.values.length === 0) return new QueryNone([new Error(`${this.messages.join('\n\t.')}\nreturned an empty set.`)]);
    if (this.values.length === 1) return new QueryOne(this.values[0], [...this.messages, 'one()']);
    return new QueryNone([new Error(`${this.messages.join('\n\t.')}\nreturned a set with ${this.values.length} elements.`)])
  }
  query(selector) {
    if (this.values.length === 0) return this;
    return new QuerySome(this.values.flatMap(context => Array.from(context.querySelectorAll(selector))), [...this.messages, `query(\`${selector}\`)`]);
  }
  safeMap(f) {
    if (this.values.length === 0) return this;
    return new QuerySome(this.values.map(x => f(x)).filter(x => x != null), [...this.messages, 'safeMap(f)']);
  }
  toArray() { return this.values; }
}

const main = () =>
  Query.query("#divInfraBarraLocalizacao h4")
    .safeMap((h4) => h4.textContent?.match(/^Agendamento da Minuta .*(\d+)$/)?.[1])
    .one()
    .flatMap((minuta) =>
      Query.sequenceObj({
        botao: Query.query("#btnManterAgendamento").one(),
        ehLote: Query.of(window.top.document.body)
          .query("#fldMinutas tr")
          .filter((row) => row.cells.length >= 2)
          .filter((row) => RegExp(minuta).test(row.cells[1].textContent))
          .one()
          .map((row) =>
            Query.of(row.cells[row.cells.length - 1])
              .query('#divListaRecursosMinuta > a img[src$="imagens/minuta_editar_lote.gif"]')
              .isNotEmpty()
          ),
      })
    )
    .map(({ botao, ehLote }) => {
      if (ehLote) {
        botao.click();
      }
    })
    .catch((errors) => {
      console.log(errors);
    });

main();
