import * as RE from 'descriptive-regexp';
import { Invalido, Ok, resultado as R, Resultado } from './Resultado';
import { safePipe } from './safePipe';

main();

function main() {
  const eventos = obterEventos();

  const resTerminativos = R.sequenceObj({
    localizadores: verificarLocalizadores(),
    eventos: Ok(eventos),
    sentenca: verificarSentenca(eventos),
    autores: verificarAutores(),
  });

  const resTotal = R.map(resTerminativos, ({ eventos, sentenca, autores }) => {
    const {
      verificarTransito,
      verificarCumprimentoObricacaoFazer,
      verificarPagamentoAutor,
      verificarPagamentoPerito,
    } = comEventos(eventos);

    const peritos = queryAll('a[data-parte="PERITO"]').map(textContent);

    return R.sequenceObj({
      transito: verificarTransito(sentenca),
      cumprimentoObrigacaoFazer: verificarCumprimentoObricacaoFazer(sentenca),
      autores: R.traverse(autores, verificarPagamentoAutor),
      peritos: R.traverse(peritos, verificarPagamentoPerito),
    });
  });

  R.matchWith(resTotal, {
    Invalido(erros) {
      for (const erro of erros) {
        console.log('<baixa-acordo-inss>', erro);
      }
    },
    Ok(resInterno) {
      adicionarEstilos();
      R.matchWith(resInterno, {
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
  return parseEventos(queryAll('td.infraEventoDescricao').map(celula => celula.closest('tr')!));
}

function verificarLocalizadores(): Resultado<string[]> {
  const localizadores = queryAll('[id="AbreLocalizadores"]').map(textContent);
  if (localizadores.length !== 1) return Invalido(['Mais de um localizador.']);
  if (localizadores[0] !== '3DIR Baixa demonstr')
    return Invalido(['Localizador não é 3DIR Baixa demonstr']);
  return Ok(localizadores);
}

function verificarAutores(): Resultado<string[]> {
  const autores = queryAll('a[data-parte="AUTOR"]').map(textContent);
  if (autores.length < 1) return Invalido(['Não há autores.']);
  return Ok(autores);
}

function verificarSentenca(eventos: Evento[]): Resultado<Evento> {
  const sentenca =
    eventos.find(({ descricao, memos }) =>
      any(
        all(
          RE.test(
            descricao,
            RE.oneOf(
              'Sentença com Resolução de Mérito - Conciliação/Transação Homologada ',
              'Homologada a Transação'
            )
          ),
          RE.test(
            memos,
            RE.oneOf(
              'HOMOLOGO, por sentença, a transação realizada entre as partes',
              'Homologo o acordo, resolvendo o mérito'
            )
          ),
          RE.test(memos, 'Caberá ao INSS o pagamento dos honorários periciais')
        )
      )
    ) ||
    eventos.find(({ descricao, memos }) =>
      all(
        RE.test(descricao, 'Sentença com Resolução de Mérito - Pedido Procedente'),
        RE.test(memos, /ACOLHO(,?\s+em\s+parte,?)?\s+os?\s+pedidos?.*condenar\s+o\s+INSS/i)
      )
    );
  if (!sentenca) return Invalido(['Não há sentença de acordo ou procedência.']);
  return Ok(sentenca);
}

function comEventos(eventos: Evento[]) {
  return {
    verificarTransito,
    verificarCumprimentoObricacaoFazer,
    verificarPagamentoAutor,
    verificarPagamentoPerito,
  };

  function verificarTransito(sentenca: Evento): Resultado<Evento> {
    const transito = eventos
      .filter(({ ordinal }) => ordinal > sentenca.ordinal)
      .find(({ descricao }) =>
        RE.test(descricao, RE.oneOf('Trânsito em Julgado', 'Transitado em Julgado'))
      );
    if (!transito) return Invalido(['Não há trânsito em julgado.']);
    return Ok(transito);
  }

  function verificarCumprimentoObricacaoFazer(sentenca: Evento): Resultado<Evento> {
    const intimacaoAPSSentenca = eventos.find(({ descricao, referente, ordinal }) =>
      all(
        RE.test(
          descricao,
          RE.oneOf(
            'Intimação Eletrônica - Expedida/Certificada - Requisição',
            'Expedida/certificada a intimação eletrônica'
          )
        ),
        RE.test(descricao, 'AGÊNCIA DA PREVIDÊNCIA SOCIAL'),
        referente.some(ref => ref >= sentenca.ordinal) || ordinal === sentenca.ordinal + 1
      )
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

    const intimacaoAutorResposta = houveIntimacao(
      eventos,
      ultimaResposta.ordinal,
      RE.oneOf('AUTOR', 'REQUERENTE')
    );
    if (!intimacaoAutorResposta)
      return Invalido([
        `Autor não foi intimado da última resposta (evento ${ultimaResposta.ordinal}).`,
      ]);

    if (!houveDecursoOuCiencia(eventos, intimacaoAutorResposta.ordinal)) {
      const peticaoAposResposta = eventos.find(
        ({ descricao, referente }) =>
          RE.test(descricao, 'PETIÇÃO') &&
          referente.some(ref => ref === intimacaoAutorResposta.ordinal)
      );
      if (peticaoAposResposta) {
        const despachoAposPeticao = eventos.find(
          ({ memos, ordinal: o }) => o > peticaoAposResposta.ordinal && RE.test(memos, /^DESPADEC1/)
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

  function verificarPagamentoAutor(autor: string) {
    const pagamento = houvePagamentoLiberado(eventos, autor);
    if (!pagamento) return Invalido([`Não houve pagamento do autor ${autor}.`]);
    const certidaoProcuracao = eventos
      .filter(({ ordinal: o }) => o > pagamento.ordinal)
      .find(({ memos }) =>
        RE.test(
          memos,
          RE.concat(
            ...intercalate<string | RegExp>(/.*/, [
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
    const pedidoTED = eventos
      .filter(({ ordinal: o }) => o > pagamento.ordinal)
      .find(({ descricao }) => RE.test(descricao, 'PETIÇÃO - PEDIDO DE TED'));
    if (pedidoTED) {
      const despachoTED = eventos
        .filter(({ ordinal: o }) => o > pedidoTED.ordinal)
        .find(
          ({ descricao, memos }) =>
            RE.test(descricao, /Despacho/i) &&
            RE.test(
              memos,
              RE.concat(
                'oficie-se à Agência ',
                /.*/,
                ' para que proceda à transferência dos valores depositados'
              )
            )
        );
      if (despachoTED) {
        const intimacaoAgencia = eventos
          .filter(({ ordinal: o }) => o > despachoTED.ordinal)
          .find(
            ({ descricao, referente }) =>
              RE.test(
                descricao,
                RE.withFlags(
                  RE.concat('Intimação Eletrônica', /.*/, '(UNIDADE EXTERNA - Agência'),
                  'i'
                )
              ) && referente.some(ref => ref === despachoTED.ordinal)
          );
        if (intimacaoAgencia) {
          const respostaAgencia = eventos
            .filter(({ ordinal: o }) => o > intimacaoAgencia.ordinal)
            .find(({ referente }) => referente.some(ref => ref === intimacaoAgencia.ordinal));
          if (respostaAgencia) {
            if (houveDecursoOuCiencia(eventos, respostaAgencia.ordinal)) {
              return Ok(autor);
            }
          }
        }
      }
    }
    const atosIntimacao = houveAtosIntimacaoPagamento(eventos, pagamento.ordinal);
    if (atosIntimacao.length === 0) {
      return Invalido([`Não houve ato de intimação do autor ${autor} acerca do pagamento.`]);
    }
    const matcher = RE.withFlags(RE.concat(RE.oneOf('AUTOR', 'REQUERENTE'), ' -  ', autor), 'i');
    const intimacao = atosIntimacao.find(({ ordinal }) =>
      houveIntimacao(eventos, ordinal, matcher)
    );
    if (!intimacao) return Invalido([`Não houve intimação do autor ${autor} acerca do pagamento.`]);
    if (!houveDecursoOuCiencia(eventos, intimacao.ordinal))
      return Invalido([`Não houve decurso ou ciência do autor ${autor} acerca do pagamento.`]);
    return Ok(autor);
  }

  function verificarPagamentoPerito(perito: string): Resultado<string> {
    const pagamento = houvePagamentoLiberado(eventos, perito);
    if (!pagamento) {
      const pagamentoAJG = eventos.find(
        ({ descricao, memos }) =>
          RE.test(descricao, 'Expedida Requisição Honorários Perito/Dativo') &&
          RE.test(
            memos,
            RE.withFlags(
              RE.concat(/^/, 'PGTOPERITO1Perito: ', perito, '. Documento gerado pelo sistema AJG'),
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
    const matcher = RE.withFlags(RE.concat('PERITO -  ', perito), 'i');
    const intimacao = atosIntimacao.find(({ ordinal }) =>
      houveIntimacao(eventos, ordinal, matcher)
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

function baixarMotivo(motivo: number) {
  inserirAntesDaCapa(`<div class="gm-aviso gm-aviso--baixar">Baixar motivo ${motivo}</div>`);
}

function rejeitarMotivo(motivo: string) {
  inserirAntesDaCapa(`<div class="gm-aviso gm-aviso--rejeitar">${motivo}</div>`);
}

function inserirAntesDaCapa(html: string) {
  const capa = document.getElementById('fldCapa');
  if (!capa) return;

  capa.insertAdjacentHTML('beforebegin', html);
}

function houveIntimacao(
  eventos: Evento[],
  ordinal: number,
  matcherParte: string | RegExp
): Evento | undefined {
  return eventos.find(({ descricao, ordinal: o, referente }) =>
    all(
      o > ordinal,
      referente.some(ref => ref === ordinal),
      RE.test(
        descricao,
        RE.oneOf(
          'Intimação Eletrônica - Expedida/Certificada',
          'Expedida/certificada a intimação eletrônica'
        )
      ),
      RE.test(descricao, matcherParte)
    )
  );
}

function houveDecursoOuCiencia(eventos: Evento[], ordinal: number) {
  return eventos
    .filter(({ ordinal: o }) => o > ordinal)
    .find(
      ({ descricao, referente }) =>
        RE.test(descricao, RE.oneOf('Decurso de Prazo', 'Decorrido prazo', 'RENÚNCIA AO PRAZO')) &&
        referente.some(ref => ref === ordinal)
    );
}

interface Evento {
  ordinal: number;
  descricao: string;
  referente: number[];
  memos: string;
  aps: boolean;
}

function parseEventos(eventos: HTMLTableRowElement[]): Evento[] {
  return eventos.map(linha => {
    const ordinal = Number(textContent(linha.cells[1]));
    const descricao = textContent(linha.cells[3]);
    let referente: number[] = [];
    const ref1 = RE.match(descricao, RE.concat('Refer. ao Evento: ', RE.capture(/\d+/)));
    if (ref1) {
      referente = [Number(ref1[1])];
    }
    const refN = RE.match(descricao, RE.concat('Refer. aos Eventos: ', RE.capture(/\d[\d, e]+\d/)));
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
        a => RE.match(a, 'AG. PREV. SOCIAL')
      ) != null;
    return { ordinal, descricao, referente, memos, aps };
  });
}

function queryAll(selector: string) {
  return Array.from(document.querySelectorAll(selector));
}

function textContent(node: Node) {
  return (node.textContent || '').trim();
}

function intercalate<T>(separator: T, elements: T[]): T[] {
  const result: T[] = [];
  for (const elem of elements) {
    result.push(elem);
    result.push(separator);
  }
  result.pop();
  return result;
}

function all(...bools: boolean[]) {
  for (const x of bools) if (!x) return false;
  return true;
}

function any(...bools: boolean[]) {
  for (const x of bools) if (x) return true;
  return false;
}

function houvePagamentoLiberado(eventos: Evento[], nome: string) {
  return eventos.find(({ descricao }) =>
    RE.test(
      descricao,
      RE.withFlags(
        RE.concat(
          'Requisição de Pagamento ',
          RE.oneOf('-', 'de'),
          RE.oneOf(' Pequeno Valor', ' Precatório'),
          RE.oneOf(' - ', ' '),
          'Paga - Liberada ',
          /.*/,
          `(${nome})`
        ),
        'i'
      )
    )
  );
}

function houveAtosIntimacaoPagamento(eventos: Evento[], ordinalPagamento: number) {
  return eventos
    .filter(({ ordinal: o }) => o > ordinalPagamento)
    .filter(({ memos }) =>
      RE.test(
        memos,
        'concede o prazo de 05 (cinco) dias para que a parte autora/advogado(a)/perito(a) efetue o saque do valor depositado em conta aberta em seu nome'
      )
    );
}
