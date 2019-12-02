// ==UserScript==
// @name baixa-acordo-inss
// @version 0.6.0
// @description 3DIR Baixa - acordo INSS
// @namespace http://nadameu.com.br/baixa-acordo-inss
// @match https://eproc.jfsc.jus.br/eprocV2/controlador.php?acao=processo_selecionar&*
// @grant none
// ==/UserScript==

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
function chain(fx, f) {
  return fx.isValido ? f(fx.valor) : fx;
}
function map(fx, f) {
  return chain(fx, x => Ok(f(x)));
}
function lift2(fa, fb, f) {
  if (fa.isValido)
    if (fb.isValido) return Ok(f(fa.valor, fb.valor));
    else return fb;
  if (fb.isValido) return fa;
  return Invalido(fa.razoes.concat(fb.razoes));
}
function traverse(xs, f) {
  return xs.reduce(
    (fys, x) =>
      lift2(fys, f(x), (ys, y) => {
        ys.push(y);
        return ys;
      }),
    Ok([])
  );
}
function traverseObj(obj, f) {
  return Object.entries(obj).reduce(
    (resultado, [key, x]) =>
      lift2(resultado, f(x), (target, y) => {
        target[key] = y;
        return target;
      }),
    Ok({})
  );
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
        console.log(erro);
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
  return parseEventos(queryAll('td.infraEventoDescricao').map(celula => celula.closest('tr')));
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
    eventos.find(
      ({ descricao, memos }) =>
        descricao.match(/Sentença com Resolução de Mérito - Conciliação\/Transação Homologada /) &&
        memos.match(/HOMOLOGO, por sentença, a transação realizada entre as partes/) &&
        memos.match(/Caberá ao INSS o pagamento dos honorários periciais/)
    ) ||
    eventos.find(
      ({ descricao, memos }) =>
        descricao.match(/Sentença com Resolução de Mérito - Pedido Procedente/) &&
        memos.match(/ACOLHO(,?\s+em\s+parte,?)?\s+os?\s+pedidos?.*condenar\s+o\s+INSS/i)
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
    const transito = eventos.find(({ descricao }) => descricao.match(/Trânsito em Julgado/));
    if (!transito || transito.ordinal < sentenca.ordinal)
      return Invalido(['Não há trânsito em julgado.']);
    return Ok(transito);
  }
  function verificarCumprimentoObricacaoFazer(sentenca) {
    const intimacaoAPSSentenca = eventos.find(
      ({ descricao, referente, ordinal }) =>
        descricao.match(/Intimação Eletrônica - Expedida\/Certificada - Requisição/) &&
        descricao.match(/AGÊNCIA DA PREVIDÊNCIA SOCIAL/) &&
        (referente.some(ref => ref >= sentenca.ordinal) || ordinal === sentenca.ordinal + 1)
    );
    if (!intimacaoAPSSentenca) return Invalido(['APSADJ não foi intimada da sentença.']);
    const eventosAPS = eventos.filter(({ aps }) => aps);
    const respostaOriginal = eventosAPS.find(({ referente }) =>
      referente.some(ref => ref === intimacaoAPSSentenca.ordinal)
    );
    const ultimaResposta = respostaOriginal
      ? eventosAPS.find(({ ordinal }) => ordinal >= respostaOriginal.ordinal)
      : eventosAPS.find(({ ordinal }) => ordinal > intimacaoAPSSentenca.ordinal);
    if (!ultimaResposta) return Invalido(['APSADJ não juntou resposta.']);
    const intimacaoAutorResposta = eventos.find(
      ({ descricao, referente }) =>
        descricao.match(/Intimação Eletrônica - Expedida\/Certificada/) &&
        descricao.match(/AUTOR|REQUERENTE/) &&
        referente.some(ref => ref === ultimaResposta.ordinal)
    );
    if (!intimacaoAutorResposta)
      return Invalido([
        `Autor não foi intimado da última resposta (evento ${ultimaResposta.ordinal}).`,
      ]);
    if (!houveDecursoOuCiencia(eventos, intimacaoAutorResposta.ordinal))
      return Invalido([
        `Não houve decurso ou ciência da resposta (evento ${ultimaResposta.ordinal}) pelo autor.`,
      ]);
    return Ok(intimacaoAutorResposta);
  }
  function verificarPagamentoAutor(autor) {
    const pagamento = eventos.find(({ descricao }) =>
      descricao.match(
        new RegExp(
          `Requisição de Pagamento - Pequeno Valor - Paga - Liberada .*\\(${autor}\\)`,
          'i'
        )
      )
    );
    if (!pagamento) return Invalido([`Não houve pagamento do autor ${autor}.`]);
    const atoIntimacao = eventos
      .filter(({ ordinal: o }) => o > pagamento.ordinal)
      .find(({ memos }) =>
        memos.match(
          /concede o prazo de 05 \(cinco\) dias para que a parte autora\/advogado\(a\)\/perito\(a\) efetue o saque do valor depositado em conta aberta em seu nome/
        )
      );
    if (!atoIntimacao)
      return Invalido([`Não houve ato de intimação do autor ${autor} acerca do pagamento.`]);
    const intimacao = eventos.find(
      ({ descricao, referente }) =>
        descricao.match(/Intimação Eletrônica - Expedida\/Certificada/) &&
        descricao.match(new RegExp(`(AUTOR|REQUERENTE) -  ${autor}`, 'i')) &&
        referente.some(ref => ref === atoIntimacao.ordinal)
    );
    if (!intimacao) return Invalido([`Não houve intimação do autor ${autor} acerca do pagamento.`]);
    if (!houveDecursoOuCiencia(eventos, intimacao.ordinal))
      return Invalido([`Não houve decurso ou ciência do autor ${autor} acerca do pagamento.`]);
    return Ok(autor);
  }
  function verificarPagamentoPerito(perito) {
    const pagamento = eventos.find(({ descricao }) =>
      descricao.match(
        new RegExp(
          `Requisição de Pagamento - Pequeno Valor - Paga - Liberada .*\\(${perito}\\)`,
          'i'
        )
      )
    );
    if (!pagamento) return Invalido([`Não houve pagamento do perito ${perito}.`]);
    const atoIntimacao = eventos
      .filter(({ ordinal: o }) => o > pagamento.ordinal)
      .find(({ memos }) =>
        memos.match(
          /concede o prazo de 05 \(cinco\) dias para que a parte autora\/advogado\(a\)\/perito\(a\) efetue o saque do valor depositado em conta aberta em seu nome/
        )
      );
    if (!atoIntimacao)
      return Invalido([`Não houve ato de intimação do perito ${perito} acerca do pagamento.`]);
    const intimacao = eventos.find(
      ({ descricao, referente }) =>
        descricao.match(/Intimação Eletrônica - Expedida\/Certificada/) &&
        descricao.match(new RegExp(`PERITO -  ${perito}`, 'i')) &&
        referente.some(ref => ref === atoIntimacao.ordinal)
    );
    if (!intimacao)
      return Invalido([`Não houve intimação do perito ${perito} acerca do pagamento.`]);
    if (!houveDecursoOuCiencia(eventos, intimacao.ordinal))
      return Invalido([`Não houve decurso ou ciência do perito ${perito} acerca do pagamento.`]);
    return Ok(perito);
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
function houveDecursoOuCiencia(eventos, ordinal) {
  return eventos
    .filter(({ ordinal: o }) => o > ordinal)
    .find(
      ({ descricao, referente }) =>
        (descricao.match(/Decurso de Prazo/) || descricao.match(/RENÚNCIA AO PRAZO/)) &&
        referente.some(ref => ref === ordinal)
    );
}
function parseEventos(eventos) {
  return eventos.map(linha => {
    const ordinal = Number(textContent(linha.cells[1]));
    const descricao = textContent(linha.cells[3]);
    let referente = [];
    const ref1 = descricao.match(/Refer\. ao Evento: (\d+)/);
    if (ref1) {
      referente = [Number(ref1[1])];
    }
    const refN = descricao.match(/Refer\. aos Eventos: (\d[\d, e]+\d)/);
    if (refN) {
      const [xs, x] = refN[1].split(' e ');
      const ys = xs.split(', ');
      referente = ys.concat([x]).map(Number);
    }
    const memos = textContent(linha.cells[5]);
    const aps =
      safePipe(
        linha.cells[4],
        c => c.querySelector('label'),
        l => l.getAttribute('onmouseover'),
        a => a.match('AG. PREV. SOCIAL')
      ) != null;
    return { ordinal, descricao, referente, memos, aps };
  });
}
function queryAll(selector) {
  return Array.from(document.querySelectorAll(selector));
}
function textContent(node) {
  return (node.textContent || '').trim();
}
