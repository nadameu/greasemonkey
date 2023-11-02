import * as RE from 'descriptive-regexp';
import { obterReferencias } from './referentes';
import { Invalido, Ok, resultado as R, Resultado } from './Resultado';
import { safePipe } from './safePipe';

main();

function main() {
  const eventos = obterEventos();

  const resultadosTerminativos = R.sequenceObj({
    localizadores: verificarLocalizadores(),
    sentenca: verificarSentenca(eventos),
    autores: verificarAutores(),
  });

  if (!resultadosTerminativos.isValido) {
    for (const erro of resultadosTerminativos.razoes) {
      console.log('<baixa-acordo-inss>', erro);
    }
    return;
  }

  const { sentenca, autores } = resultadosTerminativos.valor;
  const {
    verificarTransito,
    verificarCumprimentoObricacaoFazer,
    verificarPagamentoAutor,
    verificarPagamentoPerito,
  } = comEventos(eventos);

  const peritos = queryAll('a[data-parte="PERITO"]').map(textContent);

  const resultadoInterno = R.sequenceObj({
    transito: verificarTransito(sentenca),
    cumprimentoObrigacaoFazer: verificarCumprimentoObricacaoFazer(sentenca),
    autores: R.traverse(autores, verificarPagamentoAutor),
    peritos: R.traverse(peritos, verificarPagamentoPerito),
  });

  adicionarEstilos();

  if (!resultadoInterno.isValido) {
    for (const erro of resultadoInterno.razoes) {
      rejeitarMotivo(erro);
    }
    return;
  }
  baixarMotivo(peritos.length > 0 ? 4 : 1);
}

function obterEventos() {
  return queryAll('td.infraEventoDescricao')
    .map(celula => celula.closest('tr')!)
    .map(parseEvento);
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
        RE.test(
          memos,
          RE.concat(
            'Caberá ao INSS o ',
            RE.oneOf('pagamento', 'ressarcimento'),
            ' dos honorários periciais'
          )
        )
      )
    ) ??
    eventos.find(({ descricao, memos }) =>
      all(
        RE.test(
          descricao,
          RE.oneOf(
            'Sentença com Resolução de Mérito - Pedido Procedente',
            'Julgado procedente o pedido',
            'Julgado procedente em parte o pedido'
          )
        ),
        RE.test(
          memos,
          /ACOLHO(,?\s+em\s+parte,?)?\s+os?\s+(demais\s+)?pedidos?.*condena(r|ndo)\s+o\s+INSS/i
        )
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
    const transito = encontrarEventoPosterior(sentenca, ({ descricao }) =>
      RE.test(
        descricao,
        RE.oneOf('Trânsito em Julgado', 'Transitado em Julgado')
      )
    );
    if (!transito) return Invalido(['Não há trânsito em julgado.']);
    return Ok(transito);
  }

  function verificarCumprimentoObricacaoFazer(
    sentenca: Evento
  ): Resultado<Evento> {
    const intimacaoAPSSentenca = eventos.find(
      ({ descricao, referenciados, ordinal }) =>
        all(
          RE.test(
            descricao,
            RE.oneOf(
              'Intimação Eletrônica - Expedida/Certificada - Requisição',
              'Expedida/certificada a intimação eletrônica - Requisição'
            )
          ),
          RE.test(descricao, 'AGÊNCIA DA PREVIDÊNCIA SOCIAL'),
          referenciados.some(ref => ref >= sentenca.ordinal) ||
            ordinal === sentenca.ordinal + 1
        )
    );
    if (!intimacaoAPSSentenca)
      return Invalido(['CEAB não foi intimada da sentença.']);

    const eventosAPS = eventos.filter(({ aps }) => aps);

    const respostaOriginal = eventosAPS.find(({ referenciados }) =>
      referenciados.some(ref => ref === intimacaoAPSSentenca.ordinal)
    );
    const ultimaResposta = respostaOriginal
      ? eventosAPS.find(({ ordinal }) => ordinal >= respostaOriginal.ordinal)
      : eventosAPS.find(
          ({ ordinal }) => ordinal > intimacaoAPSSentenca.ordinal
        );
    if (!ultimaResposta) return Invalido(['CEAB não juntou resposta.']);

    const intimacaoAutorResposta = houveIntimacao(
      ultimaResposta.ordinal,
      RE.oneOf('AUTOR', 'REQUERENTE', 'EXEQUENTE')
    );
    if (!intimacaoAutorResposta)
      return Invalido([
        `Autor não foi intimado da última resposta (evento ${ultimaResposta.ordinal}).`,
      ]);

    if (!houveDecursoOuCiencia(intimacaoAutorResposta.ordinal)) {
      const peticaoAposResposta = eventos.find(
        ({ descricao, referenciados }) =>
          RE.test(descricao, 'PETIÇÃO') &&
          referenciados.some(ref => ref === intimacaoAutorResposta.ordinal)
      );
      if (peticaoAposResposta) {
        const despachoAposPeticao = eventos.find(
          ({ memos, ordinal: o }) =>
            o > peticaoAposResposta.ordinal && RE.test(memos, /^DESPADEC1/)
        );
        if (despachoAposPeticao) {
          return Ok(intimacaoAutorResposta);
        } else {
          return Invalido([
            `Analisar petição do autor (evento ${peticaoAposResposta.ordinal}).`,
          ]);
        }
      }
      return Invalido([
        `Não houve decurso ou ciência da resposta (evento ${ultimaResposta.ordinal}) pelo autor.`,
      ]);
    }
    return Ok(intimacaoAutorResposta);
  }

  function verificarPagamentoAutor(autor: string) {
    const pagamento = houvePagamentoLiberado(autor);
    if (!pagamento) return Invalido([`Não houve pagamento do autor ${autor}.`]);
    const certidaoProcuracao = encontrarEventoPosterior(
      pagamento,
      ({ memos }) =>
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

    const pedidoTED = encontrarEventoPosterior(pagamento, ({ descricao }) =>
      RE.test(descricao, 'PETIÇÃO - PEDIDO DE TED')
    );
    if (pedidoTED) {
      const despachoTED = encontrarEventoPosterior(
        pedidoTED,
        ({ descricao, memos }) =>
          RE.test(descricao, /Despacho/i) &&
          RE.test(
            memos,
            RE.concat(
              /[Oo]/,
              'ficie-se à Agência ',
              /.*/,
              ' para que proceda à transferência dos valores depositados'
            )
          )
      );
      const intimacaoAgencia = [pedidoTED, despachoTED]
        .filter((x): x is Evento => x !== undefined)
        .map(ref =>
          encontrarEventoReferente(ref, ({ descricao }) =>
            RE.test(
              descricao,
              RE.withFlags(
                RE.concat(
                  'Intimação Eletrônica',
                  /.*/,
                  '(UNIDADE EXTERNA - Agência'
                ),
                'i'
              )
            )
          )
        )
        .find((x): x is Evento => x !== undefined);
      if (!intimacaoAgencia)
        if (!despachoTED)
          return Invalido([
            `Há pedido de TED sem despacho (evento ${pedidoTED.ordinal}).`,
          ]);
        else
          return Invalido([
            `Não houve intimação da agência (evento ${despachoTED.ordinal}).`,
          ]);

      const respostaAgencia = encontrarEventoReferente(intimacaoAgencia);
      if (respostaAgencia) {
        if (houveDecursoOuCiencia(respostaAgencia.ordinal)) return Ok(autor);
        const ultimaResposta = encontrarEventoPosterior(
          respostaAgencia,
          ({ descricao, sigla }) =>
            all(
              RE.test(descricao, /^(?:RESPOSTA|OFÍCIO)(?: - Refer\.)?/),
              RE.test(sigla, /^UEX\d{11}$/)
            )
        );
        if (!ultimaResposta)
          return Invalido([
            `Não houve decurso ou ciência sobre a resposta da agência bancária (evento ${respostaAgencia.ordinal}).`,
          ]);
        if (houveDecursoOuCiencia(ultimaResposta.ordinal)) return Ok(autor);
        return Invalido([
          `Não houve decurso ou ciência sobre a resposta da agência bancária (evento ${ultimaResposta.ordinal}).`,
        ]);
      }
    }
    const atosIntimacao = houveAtosIntimacaoPagamento(pagamento.ordinal);
    if (atosIntimacao.length === 0) {
      return Invalido([
        `Não houve ato de intimação do autor ${autor} acerca do pagamento.`,
      ]);
    }
    const matcher = RE.withFlags(
      RE.concat(RE.oneOf('AUTOR', 'REQUERENTE', 'EXEQUENTE'), ' -  ', autor),
      'i'
    );
    const intimacoes = atosIntimacao.flatMap(intimacoesParte(matcher));
    if (!intimacoes.length)
      return Invalido([
        `Não houve intimação do autor ${autor} acerca do pagamento.`,
      ]);
    const decursoOuCiencia = intimacoes.find(({ ordinal }) =>
      houveDecursoOuCiencia(ordinal)
    );
    if (!decursoOuCiencia)
      return Invalido([
        `Não houve decurso ou ciência do autor ${autor} acerca do pagamento.`,
      ]);
    return Ok(autor);
  }

  function verificarPagamentoPerito(perito: string): Resultado<string> {
    const pagamento = houvePagamentoLiberado(perito);
    if (!pagamento) {
      const pagamentoAJG = eventos.find(
        ({ descricao, memos }) =>
          RE.test(
            descricao,
            RE.concat(
              RE.oneOf('Expedida Requisição', 'Expedição de Requisição'),
              ' Honorários Perito/Dativo'
            )
          ) &&
          RE.test(
            memos,
            RE.withFlags(
              RE.concat(
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
      const pagamentoNaoIdentificado = eventos.find(
        ({ descricao, memos }) =>
          RE.test(
            descricao,
            RE.concat(
              RE.oneOf('Expedida Requisição', 'Expedição de Requisição'),
              ' Honorários Perito/Dativo'
            )
          ) && RE.test(memos, /SOL_PGTO_HON1$/)
      );
      if (pagamentoNaoIdentificado)
        return Invalido([
          `Não houve pagamento do perito ${perito}. Há pagamento sem identificação no evento ${pagamentoNaoIdentificado.ordinal}.`,
        ]);
      return Invalido([`Não houve pagamento do perito ${perito}.`]);
    }
    const atosIntimacao = houveAtosIntimacaoPagamento(pagamento.ordinal);
    if (atosIntimacao.length === 0)
      return Invalido([
        `Não houve ato de intimação do perito ${perito} acerca do pagamento.`,
      ]);
    const matcher = RE.withFlags(RE.concat('PERITO -  ', perito), 'i');
    const intimacoes = atosIntimacao.flatMap(intimacoesParte(matcher));
    if (!intimacoes.length)
      return Invalido([
        `Não houve intimação do perito ${perito} acerca do pagamento.`,
      ]);
    const decursoOuCiencia = intimacoes.find(({ ordinal }) =>
      houveDecursoOuCiencia(ordinal)
    );
    if (!decursoOuCiencia)
      return Invalido([
        `Não houve decurso ou ciência do perito ${perito} acerca do pagamento.`,
      ]);
    return Ok(perito);
  }

  function filtrarEventosPosteriores(
    referencia: Evento,
    predicado?: (evento: Evento) => boolean
  ): Evento[] {
    const eventosPosteriores = eventos.filter(
      ({ ordinal: o }) => o > referencia.ordinal
    );
    if (predicado) return eventosPosteriores.filter(predicado);
    return eventosPosteriores;
  }

  function encontrarEventoPosterior(
    referencia: Evento,
    predicado: (evento: Evento) => boolean = () => true
  ): Evento | undefined {
    return filtrarEventosPosteriores(referencia).find(predicado);
  }

  function filtrarEventosReferentes(
    referencia: Evento,
    predicado?: (evento: Evento) => boolean
  ): Evento[] {
    const eventosReferentes = filtrarEventosPosteriores(
      referencia,
      ({ referenciados }) =>
        referenciados.some(ref => ref === referencia.ordinal)
    );
    if (predicado) return eventosReferentes.filter(predicado);
    return eventosReferentes;
  }

  function encontrarEventoReferente(
    referencia: Evento,
    predicado: (evento: Evento) => boolean = () => true
  ): Evento | undefined {
    return filtrarEventosReferentes(referencia).find(predicado);
  }

  function houveIntimacao(
    ordinal: number,
    matcherParte: string | RegExp
  ): Evento | undefined {
    return encontrarEventoReferente({ ordinal } as Evento, ({ descricao }) =>
      all(ehIntimacao(descricao), RE.test(descricao, matcherParte))
    );
  }

  function intimacoesParte(
    matcherParte: string | RegExp
  ): (evento: Evento) => Evento[] {
    return evento =>
      filtrarEventosReferentes(evento, ({ descricao }) =>
        all(ehIntimacao(descricao), RE.test(descricao, matcherParte))
      );
  }

  function houveDecursoOuCiencia(ordinal: number) {
    return encontrarEventoReferente({ ordinal } as Evento, ({ descricao }) =>
      RE.test(
        descricao,
        RE.oneOf('Decurso de Prazo', 'Decorrido prazo', 'RENÚNCIA AO PRAZO')
      )
    );
  }

  function houvePagamentoLiberado(nome: string) {
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

  function houveAtosIntimacaoPagamento(ordinalPagamento: number) {
    return eventos
      .filter(({ ordinal: o }) => o > ordinalPagamento)
      .filter(({ memos }) =>
        RE.test(
          memos,
          'concede o prazo de 05 (cinco) dias para que a parte autora/advogado(a)/perito(a) efetue o saque do valor depositado em conta aberta em seu nome'
        )
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

function baixarMotivo(motivo: number) {
  inserirAntesDaCapa(
    `<div class="gm-aviso gm-aviso--baixar">Baixar motivo ${motivo}</div>`
  );
}

function rejeitarMotivo(motivo: string) {
  inserirAntesDaCapa(
    `<div class="gm-aviso gm-aviso--rejeitar">${motivo}</div>`
  );
}

function inserirAntesDaCapa(html: string) {
  const capa = document.getElementById('fldCapa');
  if (!capa) return;

  capa.insertAdjacentHTML('beforebegin', html);
}

interface Evento {
  ordinal: number;
  descricao: string;
  referenciados: number[];
  memos: string;
  aps: boolean;
  despSent: boolean;
  sigla: string;
}

function parseEvento(linha: HTMLTableRowElement): Evento {
  const ordinal = Number(textContent(linha.cells[1]));
  const lupa =
    linha.cells[1]
      ?.querySelector('a[onmouseover]')
      ?.getAttribute('onmouseover') ?? '';
  const despSent = RE.test(lupa, 'Magistrado(s):');
  const descricao = textContent(linha.cells[3]);
  const referenciados = obterReferencias(descricao);
  const sigla = textContent(linha.cells[4]);
  const memos = textContent(linha.cells[5]);
  const aps =
    safePipe(
      linha.cells[4],
      c => c.querySelector('label'),
      l => l.getAttribute('onmouseover'),
      a => RE.match(a, RE.oneOf('AG. PREV. SOCIAL', 'CEAB-DJ-INSS-SR3'))
    ) != null;
  return { ordinal, descricao, referenciados, sigla, memos, aps, despSent };
}

function queryAll(selector: string) {
  return Array.from(document.querySelectorAll(selector));
}

function textContent(node?: Node | null) {
  return (node?.textContent ?? '').trim();
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
  return bools.every(x => x);
}

function any(...bools: boolean[]) {
  return bools.some(x => x);
}

/*
type Arvore = DadosEvento[];
interface DadosEvento {
  ordinal: number;
  descricao: string;
  referentes: DadosEvento[];
}

function construirArvore(eventos: Evento[]): Arvore {
  const eventosOrdenados = Object.freeze(eventos.slice().sort(compareBy(x => x.ordinal)));
  const dados: { [key: number]: DadosEvento } = {};
  const arvore: Arvore = [];
  let situacao: 'MOVIMENTO' | 'DESPACHO' | 'SENTENÇA' = 'MOVIMENTO';
  let ordinalMudancaSituacao = 0;
  for (const { ordinal, descricao, referenciados: orig, despSent } of eventosOrdenados) {
    let referenciados = orig;
    const dadosEvento = { descricao, ordinal, referentes: [] };
    dados[ordinal] = dadosEvento;
    if (despSent) {
      if (ehConclusaoParaDespacho(descricao)) {
        switch (situacao) {
          case 'MOVIMENTO':
            situacao = 'DESPACHO';
            ordinalMudancaSituacao = ordinal;
            break;

          default:
            throw new Error(`Evento de conclusão na situação errada (evento ${ordinal}).`);
        }
      } else if (ehConclusaoParaSentenca(descricao)) {
        switch (situacao) {
          case 'MOVIMENTO':
            situacao = 'SENTENÇA';
            ordinalMudancaSituacao = ordinal;
            break;

          default:
            throw new Error(`Evento de conclusão na situação errada (evento ${ordinal}).`);
        }
      } else {
        situacao = 'MOVIMENTO';
        if (referenciados.length === 0) {
          referenciados = [ordinalMudancaSituacao];
        }
        ordinalMudancaSituacao = ordinal;
      }
    }
    let vezesAdicionado = 0;
    if (referenciados.length > 0) {
      for (const referenciado of referenciados) {
        if (dados[referenciado]) {
          dados[referenciado].referentes.push(dadosEvento);
          vezesAdicionado++;
        }
      }
    }
    if (vezesAdicionado === 0) {
      arvore.push(dados[ordinal]);
    }
  }
  return arvore;
}

function ehConclusaoParaDespacho(descricao: string) {
  return RE.test(
    descricao,
    RE.exactly(RE.oneOf('Autos com Juiz para Despacho/Decisão', 'Conclusos para decisão/despacho'))
  );
}
  
function ehConclusaoParaSentenca(descricao: string) {
  return RE.test(
    descricao,
    RE.exactly(RE.oneOf('Autos com Juiz para Sentença', 'Conclusos para julgamento'))
  );
}
*/
function ehIntimacao(descricao: string) {
  return RE.test(
    descricao,
    RE.oneOf(
      'Intimação Eletrônica - Expedida/Certificada',
      'Expedida/certificada a intimação eletrônica'
    )
  );
}
