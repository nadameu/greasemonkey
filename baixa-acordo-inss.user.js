// ==UserScript==
// @name baixa-acordo-inss
// @version 0.8.0
// @description 3DIR Baixa - acordo INSS
// @namespace http://nadameu.com.br/baixa-acordo-inss
// @match https://eproc.jfsc.jus.br/eprocV2/controlador.php?acao=processo_selecionar&*
// @grant none
// ==/UserScript==

var escapeStringRegexp = string => {
  if (typeof string !== 'string') {
    throw new TypeError('Expected a string');
  }

  // Escape characters with special meaning either inside or outside character sets.
  // Use a simple backslash escape when it’s always valid, and a \unnnn escape when the simpler form would be disallowed by Unicode patterns’ stricter grammar.
  return string.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&').replace(/-/g, '\\x2d');
};

function concat() {
  for (var _len = arguments.length, exprs = new Array(_len), _key = 0; _key < _len; _key++) {
    exprs[_key] = arguments[_key];
  }

  return RegExp(exprs.map(toSource).join(''));
}
function fromExpr(expr) {
  return typeof expr === 'string' ? literal(expr) : expr;
}
function toSource(expr) {
  return fromExpr(expr).source;
}
function literal(text) {
  return RegExp(escapeStringRegexp(text));
}
function oneOf() {
  for (var _len2 = arguments.length, exprs = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
    exprs[_key2] = arguments[_key2];
  }

  return RegExp('(?:' + exprs.map(toSource).join('|') + ')');
}
function withFlags(expr, flags) {
  return RegExp(toSource(expr), flags);
}
function capture(expr) {
  return RegExp('(' + toSource(expr) + ')');
}
function test(text, expr) {
  return fromExpr(expr).test(text);
}
function match(text, expr) {
  return text.match(fromExpr(expr));
}

function Ok(valor) {
  return { isValido: true, valor };
}
function Invalido(razoes) {
  return { isValido: false, razoes };
}

function matchWith(resultado, matchers) {
  if (resultado.isValido) return matchers.Ok(resultado.valor);
  return matchers.Invalido(resultado.razoes);
}
function map(fx, f) {
  return fx.isValido ? Ok(f(fx.valor)) : fx;
}
function traverse(xs, f) {
  return _traverseEntries(xs.entries(), f, []);
}
function traverseObj(obj, f) {
  return _traverseEntries(Object.entries(obj), f);
}
function _traverseEntries(entries, f, resultado = {}) {
  const razoess = [];
  let valido = true;
  for (const [k, v] of entries) {
    const y = f(v);
    if (!y.isValido) {
      if (valido) valido = false;
      razoess.push(y.razoes);
    } else if (valido) resultado[k] = y.valor;
  }
  if (razoess.length > 0) return Invalido(razoess.flat());
  return Ok(resultado);
}
function sequenceObj(obj) {
  return traverseObj(obj, x => x);
}

function safePipe(a, ...fs) {
  return fs.reduce((a, f) => (a == null ? a : f(a)), a);
}

main();
function main() {
  const eventos = obterEventos();
  const resTerminativos = sequenceObj({
    localizadores: verificarLocalizadores(),
    eventos: Ok(eventos),
    sentenca: verificarSentenca(eventos),
    autores: verificarAutores(),
  });
  const resTotal = map(resTerminativos, ({ eventos, sentenca, autores }) => {
    const {
      verificarTransito,
      verificarCumprimentoObricacaoFazer,
      verificarPagamentoAutor,
      verificarPagamentoPerito,
    } = comEventos(eventos);
    const peritos = queryAll('a[data-parte="PERITO"]').map(textContent);
    return sequenceObj({
      transito: verificarTransito(sentenca),
      cumprimentoObrigacaoFazer: verificarCumprimentoObricacaoFazer(sentenca),
      autores: traverse(autores, verificarPagamentoAutor),
      peritos: traverse(peritos, verificarPagamentoPerito),
    });
  });
  matchWith(resTotal, {
    Invalido(erros) {
      for (const erro of erros) {
        console.log('<baixa-acordo-inss>', erro);
      }
    },
    Ok(resInterno) {
      adicionarEstilos();
      matchWith(resInterno, {
        Invalido(erros) {
          for (const erro of erros) {
            rejeitarMotivo(erro);
          }
        },
        Ok({ peritos }) {
          baixarMotivo(peritos.length > 0 ? 4 : 1);
        },
      });
    },
  });
}
function obterEventos() {
  return queryAll('td.infraEventoDescricao')
    .map(celula => celula.closest('tr'))
    .map(parseEvento);
}
function verificarLocalizadores() {
  const localizadores = queryAll('[id="AbreLocalizadores"]').map(textContent);
  if (localizadores.length !== 1) return Invalido(['Mais de um localizador.']);
  if (localizadores[0] !== '3DIR Baixa demonstr')
    return Invalido(['Localizador não é 3DIR Baixa demonstr']);
  return Ok(localizadores);
}
function verificarAutores() {
  const autores = queryAll('a[data-parte="AUTOR"]').map(textContent);
  if (autores.length < 1) return Invalido(['Não há autores.']);
  return Ok(autores);
}
function verificarSentenca(eventos) {
  const sentenca =
    eventos.find(({ descricao, memos }) =>
      all(
        test(
          descricao,
          oneOf(
            'Sentença com Resolução de Mérito - Conciliação/Transação Homologada ',
            'Homologada a Transação'
          )
        ),
        test(
          memos,
          oneOf(
            'HOMOLOGO, por sentença, a transação realizada entre as partes',
            'Homologo o acordo, resolvendo o mérito'
          )
        ),
        test(memos, 'Caberá ao INSS o pagamento dos honorários periciais')
      )
    ) ??
    eventos.find(({ descricao, memos }) =>
      all(
        test(
          descricao,
          oneOf(
            'Sentença com Resolução de Mérito - Pedido Procedente',
            'Julgado procedente em parte o pedido'
          )
        ),
        test(
          memos,
          /ACOLHO(,?\s+em\s+parte,?)?\s+os?\s+(demais\s+)?pedidos?.*condena(r|ndo)\s+o\s+INSS/i
        )
      )
    );
  if (!sentenca) return Invalido(['Não há sentença de acordo ou procedência.']);
  return Ok(sentenca);
}
function comEventos(eventos) {
  return {
    verificarTransito,
    verificarCumprimentoObricacaoFazer,
    verificarPagamentoAutor,
    verificarPagamentoPerito,
  };
  function verificarTransito(sentenca) {
    const transito = encontrarEventoPosterior(sentenca, ({ descricao }) =>
      test(descricao, oneOf('Trânsito em Julgado', 'Transitado em Julgado'))
    );
    if (!transito) return Invalido(['Não há trânsito em julgado.']);
    return Ok(transito);
  }
  function verificarCumprimentoObricacaoFazer(sentenca) {
    const intimacaoAPSSentenca = eventos.find(({ descricao, referenciados, ordinal }) =>
      all(
        test(
          descricao,
          oneOf(
            'Intimação Eletrônica - Expedida/Certificada - Requisição',
            'Expedida/certificada a intimação eletrônica'
          )
        ),
        test(descricao, 'AGÊNCIA DA PREVIDÊNCIA SOCIAL'),
        referenciados.some(ref => ref >= sentenca.ordinal) || ordinal === sentenca.ordinal + 1
      )
    );
    if (!intimacaoAPSSentenca) return Invalido(['CEAB não foi intimada da sentença.']);
    const eventosAPS = eventos.filter(({ aps }) => aps);
    const respostaOriginal = eventosAPS.find(({ referenciados }) =>
      referenciados.some(ref => ref === intimacaoAPSSentenca.ordinal)
    );
    const ultimaResposta = respostaOriginal
      ? eventosAPS.find(({ ordinal }) => ordinal >= respostaOriginal.ordinal)
      : eventosAPS.find(({ ordinal }) => ordinal > intimacaoAPSSentenca.ordinal);
    if (!ultimaResposta) return Invalido(['CEAB não juntou resposta.']);
    const intimacaoAutorResposta = houveIntimacao(
      ultimaResposta.ordinal,
      oneOf('AUTOR', 'REQUERENTE')
    );
    if (!intimacaoAutorResposta)
      return Invalido([
        `Autor não foi intimado da última resposta (evento ${ultimaResposta.ordinal}).`,
      ]);
    if (!houveDecursoOuCiencia(intimacaoAutorResposta.ordinal)) {
      const peticaoAposResposta = eventos.find(
        ({ descricao, referenciados }) =>
          test(descricao, 'PETIÇÃO') &&
          referenciados.some(ref => ref === intimacaoAutorResposta.ordinal)
      );
      if (peticaoAposResposta) {
        const despachoAposPeticao = eventos.find(
          ({ memos, ordinal: o }) => o > peticaoAposResposta.ordinal && test(memos, /^DESPADEC1/)
        );
        if (despachoAposPeticao) {
          return Ok(intimacaoAutorResposta);
        } else {
          return Invalido([`Analisar petição do autor (evento ${peticaoAposResposta.ordinal}).`]);
        }
      }
      return Invalido([
        `Não houve decurso ou ciência da resposta (evento ${ultimaResposta.ordinal}) pelo autor.`,
      ]);
    }
    return Ok(intimacaoAutorResposta);
  }
  function verificarPagamentoAutor(autor) {
    const pagamento = houvePagamentoLiberado(eventos, autor);
    if (!pagamento) return Invalido([`Não houve pagamento do autor ${autor}.`]);
    const certidaoProcuracao = encontrarEventoPosterior(pagamento, ({ memos }) =>
      test(
        memos,
        concat(
          ...intercalate(/.*/, [
            'Certifico que ',
            ' atua',
            ' como advogad',
            ' da parte autora, constando na procuração poderes expressos para ',
            ' receber',
            ' e dar',
            ' quitação.',
          ])
        )
      )
    );
    if (certidaoProcuracao) return Ok(autor);
    const pedidoTED = encontrarEventoPosterior(pagamento, ({ descricao }) =>
      test(descricao, 'PETIÇÃO - PEDIDO DE TED')
    );
    if (pedidoTED) {
      const despachoTED = encontrarEventoPosterior(
        pedidoTED,
        ({ descricao, memos }) =>
          test(descricao, /Despacho/i) &&
          test(
            memos,
            concat(
              'oficie-se à Agência ',
              /.*/,
              ' para que proceda à transferência dos valores depositados'
            )
          )
      );
      const intimacaoAgencia = [pedidoTED, despachoTED]
        .filter(x => x !== undefined)
        .map(ref =>
          encontrarEventoReferente(ref, ({ descricao }) =>
            test(
              descricao,
              withFlags(concat('Intimação Eletrônica', /.*/, '(UNIDADE EXTERNA - Agência'), 'i')
            )
          )
        )
        .find(x => x !== undefined);
      console.log({ intimacaoAgencia, pedidoTED, despachoTED });
      if (!intimacaoAgencia)
        if (!despachoTED)
          return Invalido([`Há pedido de TED sem despacho (evento ${pedidoTED.ordinal}).`]);
        else return Invalido([`Não houve intimação da agência (evento ${despachoTED.ordinal}).`]);
      const respostaAgencia = encontrarEventoReferente(intimacaoAgencia);
      if (respostaAgencia) {
        if (houveDecursoOuCiencia(respostaAgencia.ordinal)) return Ok(autor);
        const ultimaResposta = encontrarEventoPosterior(respostaAgencia, ({ descricao, sigla }) =>
          all(test(descricao, /^RESPOSTA(?: - Refer\.)?/), test(sigla, /^UEX\d{11}$/))
        );
        if (!ultimaResposta)
          return Invalido([
            `Não houve decurso ou ciência sobre a resposta da agência (evento ${respostaAgencia.ordinal}).`,
          ]);
        if (houveDecursoOuCiencia(ultimaResposta.ordinal)) return Ok(autor);
        return Invalido([
          `Não houve decurso ou ciência sobre a resposta da agência (evento ${ultimaResposta.ordinal}).`,
        ]);
      }
    }
    const atosIntimacao = houveAtosIntimacaoPagamento(eventos, pagamento.ordinal);
    if (atosIntimacao.length === 0) {
      return Invalido([`Não houve ato de intimação do autor ${autor} acerca do pagamento.`]);
    }
    const matcher = withFlags(concat(oneOf('AUTOR', 'REQUERENTE'), ' -  ', autor), 'i');
    const intimacoes = atosIntimacao.flatMap(intimacoesParte(matcher));
    if (!intimacoes.length)
      return Invalido([`Não houve intimação do autor ${autor} acerca do pagamento.`]);
    const decursoOuCiencia = intimacoes.find(({ ordinal }) => houveDecursoOuCiencia(ordinal));
    if (!decursoOuCiencia)
      return Invalido([`Não houve decurso ou ciência do autor ${autor} acerca do pagamento.`]);
    return Ok(autor);
  }
  function verificarPagamentoPerito(perito) {
    const pagamento = houvePagamentoLiberado(eventos, perito);
    if (!pagamento) {
      const pagamentoAJG = eventos.find(
        ({ descricao, memos }) =>
          test(descricao, 'Expedida Requisição Honorários Perito/Dativo') &&
          test(
            memos,
            withFlags(
              concat(
                /^/,
                'PGTOPERITO1Perito: ',
                perito,
                /\s*/,
                '. Documento gerado pelo sistema AJG'
              ),
              'i'
            )
          )
      );
      if (pagamentoAJG) return Ok(perito);
      return Invalido([`Não houve pagamento do perito ${perito}.`]);
    }
    const atosIntimacao = houveAtosIntimacaoPagamento(eventos, pagamento.ordinal);
    if (atosIntimacao.length === 0)
      return Invalido([`Não houve ato de intimação do perito ${perito} acerca do pagamento.`]);
    const matcher = withFlags(concat('PERITO -  ', perito), 'i');
    const intimacoes = atosIntimacao.flatMap(intimacoesParte(matcher));
    if (!intimacoes.length)
      return Invalido([`Não houve intimação do perito ${perito} acerca do pagamento.`]);
    const decursoOuCiencia = intimacoes.find(({ ordinal }) => houveDecursoOuCiencia(ordinal));
    if (!decursoOuCiencia)
      return Invalido([`Não houve decurso ou ciência do perito ${perito} acerca do pagamento.`]);
    return Ok(perito);
  }
  function filtrarEventosPosteriores(referencia, predicado) {
    const eventosPosteriores = eventos.filter(({ ordinal: o }) => o > referencia.ordinal);
    if (predicado) return eventosPosteriores.filter(predicado);
    return eventosPosteriores;
  }
  function encontrarEventoPosterior(referencia, predicado = () => true) {
    return filtrarEventosPosteriores(referencia).find(predicado);
  }
  function filtrarEventosReferentes(referencia, predicado) {
    const eventosReferentes = filtrarEventosPosteriores(referencia, ({ referenciados }) =>
      referenciados.some(ref => ref === referencia.ordinal)
    );
    if (predicado) return eventosReferentes.filter(predicado);
    return eventosReferentes;
  }
  function encontrarEventoReferente(referencia, predicado = () => true) {
    return filtrarEventosReferentes(referencia).find(predicado);
  }
  function houveIntimacao(ordinal, matcherParte) {
    return encontrarEventoReferente({ ordinal }, ({ descricao }) =>
      all(ehIntimacao(descricao), test(descricao, matcherParte))
    );
  }
  function intimacoesParte(matcherParte) {
    return evento =>
      filtrarEventosReferentes(evento, ({ descricao }) =>
        all(ehIntimacao(descricao), test(descricao, matcherParte))
      );
  }
  function houveDecursoOuCiencia(ordinal) {
    return encontrarEventoReferente({ ordinal }, ({ descricao }) =>
      test(descricao, oneOf('Decurso de Prazo', 'Decorrido prazo', 'RENÚNCIA AO PRAZO'))
    );
  }
}
function adicionarEstilos() {
  const style = document.createElement('style');
  style.innerText = /*css*/ `
.infra-styles .gm-aviso {
  display: inline-block;
  margin: 4px;
  margin-left: 0;
  padding: 4px;
  border-radius: 4px;
  font-size: 1.25em;
  color: #fff;
}
.infra-styles :not(.material-icons).gm-aviso--baixar {
  font-weight: bold;
  background: #848;
}
.infra-styles .gm-aviso--rejeitar {
  background: #c72;
}
`;
  document.head.appendChild(style);
}
function baixarMotivo(motivo) {
  inserirAntesDaCapa(`<div class="gm-aviso gm-aviso--baixar">Baixar motivo ${motivo}</div>`);
}
function rejeitarMotivo(motivo) {
  inserirAntesDaCapa(`<div class="gm-aviso gm-aviso--rejeitar">${motivo}</div>`);
}
function inserirAntesDaCapa(html) {
  const capa = document.getElementById('fldCapa');
  if (!capa) return;
  capa.insertAdjacentHTML('beforebegin', html);
}
function parseEvento(linha) {
  const ordinal = Number(textContent(linha.cells[1]));
  const lupa = linha.cells[1].querySelector('a[onmouseover]')?.getAttribute('onmouseover') ?? '';
  const despSent = test(lupa, 'Magistrado(s):');
  const descricao = textContent(linha.cells[3]);
  let referenciados = [];
  const ref1 = match(descricao, concat('Refer. ao Evento: ', capture(/\d+/)));
  if (ref1) {
    referenciados = [Number(ref1[1])];
  }
  const refN = match(descricao, concat('Refer. aos Eventos: ', capture(/\d[\d, e]+\d/)));
  if (refN) {
    const [xs, x] = refN[1].split(' e ');
    const ys = xs.split(', ');
    referenciados = ys.concat([x]).map(Number);
  }
  const sigla = textContent(linha.cells[4]);
  const memos = textContent(linha.cells[5]);
  const aps =
    safePipe(
      linha.cells[4],
      c => c.querySelector('label'),
      l => l.getAttribute('onmouseover'),
      a => match(a, 'AG. PREV. SOCIAL')
    ) != null;
  return { ordinal, descricao, referenciados, sigla, memos, aps, despSent };
}
function queryAll(selector) {
  return Array.from(document.querySelectorAll(selector));
}
function textContent(node) {
  return (node.textContent || '').trim();
}
function intercalate(separator, elements) {
  const result = [];
  for (const elem of elements) {
    result.push(elem);
    result.push(separator);
  }
  result.pop();
  return result;
}
function all(...bools) {
  for (const x of bools) if (!x) return false;
  return true;
}
function houvePagamentoLiberado(eventos, nome) {
  return eventos.find(({ descricao }) =>
    test(
      descricao,
      withFlags(
        concat(
          'Requisição de Pagamento ',
          oneOf('-', 'de'),
          oneOf(' Pequeno Valor', ' Precatório'),
          oneOf(' - ', ' '),
          'Paga - Liberada ',
          /.*/,
          `(${nome})`
        ),
        'i'
      )
    )
  );
}
function houveAtosIntimacaoPagamento(eventos, ordinalPagamento) {
  return eventos
    .filter(({ ordinal: o }) => o > ordinalPagamento)
    .filter(({ memos }) =>
      test(
        memos,
        'concede o prazo de 05 (cinco) dias para que a parte autora/advogado(a)/perito(a) efetue o saque do valor depositado em conta aberta em seu nome'
      )
    );
}
function ehIntimacao(descricao) {
  return test(
    descricao,
    oneOf(
      'Intimação Eletrônica - Expedida/Certificada',
      'Expedida/certificada a intimação eletrônica'
    )
  );
}
