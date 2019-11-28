// ==UserScript==
// @name baixa-acordo-inss
// @version 0.4.0
// @description 3DIR Baixa - acordo INSS
// @namespace http://nadameu.com.br/baixa-acordo-inss
// @match https://eproc.jfsc.jus.br/eprocV2/controlador.php?acao=processo_selecionar&*
// @grant none
// ==/UserScript==

const localizadores = queryAll('[id="AbreLocalizadores"]').map(textContent);
if (localizadores.length !== 1) return console.log('Mais de um localizador.');
if (localizadores[0] !== '3DIR Baixa demonstr') return console.log('Localizador não é 3DIR Baixa demonstr')

const autores = queryAll('a[data-parte="AUTOR"]').map(textContent);
if (autores.length < 1) return console.log('Não há autores.');

const peritos = queryAll('a[data-parte="PERITO"]').map(textContent);
// if (peritos.length < 1) return console.log('Não há peritos.');

const eventos = parseEventos(queryAll('td.infraEventoDescricao').map(celula => celula.closest('tr')));

if (! eventos.some(({ descricao }) => descricao.match(/Trânsito em Julgado/))) return console.log('Não há trânsito em julgado.');

const sentenca = eventos.find(({ descricao, memos }) =>
  descricao.match(/Sentença com Resolução de Mérito - Conciliação\/Transação Homologada /) &&
  memos.match(/HOMOLOGO, por sentença, a transação realizada entre as partes/) &&
  memos.match(/Caberá ao INSS o pagamento dos honorários periciais/)
) || eventos.find(({ descricao, memos }) =>
  descricao.match(/Sentença com Resolução de Mérito - Pedido Procedente/) &&
  memos.match(/ACOLHO(, em parte,)? o pedido formulado na ação.*para condenar o INSS/)
);
if (! sentenca) return console.log('Não há sentença de acordo ou procedência.');

const intimacaoAPSSentenca = eventos.find(({ descricao, referente, ordinal }) =>
  descricao.match(/Intimação Eletrônica - Expedida\/Certificada - Requisição/) &&
  descricao.match(/AGÊNCIA DA PREVIDÊNCIA SOCIAL  -  APS DE ATENDIMENTO DEMANDAS JUDICIAIS FLORIANÓPOLIS/) &&
  (referente.some(ref => ref >= sentenca.ordinal) || ordinal === sentenca.ordinal + 1)
);
if (! intimacaoAPSSentenca) return console.log('APSADJ não foi intimada da sentença.');

let resposta = eventos.find(({ descricao, referente }) =>
  descricao.match(/RESPOSTA/) &&
  referente.some(ref => ref === intimacaoAPSSentenca.ordinal)
);
if (resposta) {
  resposta = eventos.find(({ descricao, ordinal }) =>
    descricao.match(/RESPOSTA/) &&
    ordinal >= resposta.ordinal
  );
} else {
  resposta = eventos.find(({ descricao, ordinal }) =>
    descricao.match(/RESPOSTA/) &&
    ordinal >= intimacaoAPSSentenca.ordinal
  );
}
if (! resposta) return console.log('APSADJ não juntou resposta.')

const intimacaoAutorResposta = eventos.find(({ descricao, referente }) =>
  descricao.match(/Intimação Eletrônica - Expedida\/Certificada/) &&
  descricao.match(/AUTOR|REQUERENTE/) &&
  referente.some(ref => ref === resposta.ordinal)
);
if (! intimacaoAutorResposta) return console.log('Autor não foi intimado da última resposta.', resposta);

if (! houveDecursoOuCiencia(eventos, intimacaoAutorResposta.ordinal)) return console.log('Não houve decurso ou ciência da resposta pelo autor.');

for (const autor of autores) {
  const pagamento = eventos.find(({ descricao }) =>
    descricao.match(new RegExp(`Requisição de Pagamento - Pequeno Valor - Paga - Liberada .*\\(${autor}\\)`, 'i'))
  );
  if (! pagamento) return console.log(`Não houve pagamento do autor ${autor}.`);
  const atoIntimacao = eventos
    .filter(({ ordinal: o }) => o > pagamento.ordinal)
    .find(({ memos }) => memos.match(/concede o prazo de 05 \(cinco\) dias para que a parte autora\/advogado\(a\)\/perito\(a\) efetue o saque do valor depositado em conta aberta em seu nome/));
  if (! atoIntimacao) return console.log(`Não houve ato de intimação do autor ${autor} acerca do pagamento.`);
  const intimacao = eventos.find(({ descricao, referente }) =>
    descricao.match(/Intimação Eletrônica - Expedida\/Certificada/) &&
    descricao.match(new RegExp(`(AUTOR|REQUERENTE) -  ${autor}`, 'i')) &&
    referente.some(ref => ref === atoIntimacao.ordinal)
  );
  if (! intimacao) return console.log(`Não houve intimação do autor ${autor} acerca do pagamento.`);
  if (! houveDecursoOuCiencia(eventos, intimacao.ordinal)) return console.log(`Não houve decurso ou ciência do autor ${autor} acerca do pagamento.`);
}

for (const perito of peritos) {
  const pagamento = eventos.find(({ descricao }) =>
    descricao.match(new RegExp(`Requisição de Pagamento - Pequeno Valor - Paga - Liberada .*\\(${perito}\\)`, 'i'))
  );
  if (! pagamento) return console.log(`Não houve pagamento do perito ${perito}.`);
  const atoIntimacao = eventos
    .filter(({ ordinal: o }) => o > pagamento.ordinal)
    .find(({ memos }) => memos.match(/concede o prazo de 05 \(cinco\) dias para que a parte autora\/advogado\(a\)\/perito\(a\) efetue o saque do valor depositado em conta aberta em seu nome/));
  if (! atoIntimacao) return console.log(`Não houve ato de intimação do perito ${perito} acerca do pagamento.`);
  const intimacao = eventos.find(({ descricao, referente }) =>
    descricao.match(/Intimação Eletrônica - Expedida\/Certificada/) &&
    descricao.match(new RegExp(`PERITO -  ${perito}`, 'i')) &&
    referente.some(ref => ref === atoIntimacao.ordinal)
  );
  if (! intimacao) return console.log(`Não houve intimação do perito ${perito} acerca do pagamento.`);
  if (! houveDecursoOuCiencia(eventos, intimacao.ordinal)) return console.log(`Não houve decurso ou ciência do perito ${perito} acerca do pagamento.`);
}

const capa = document.getElementById('fldCapa');
if (! capa) return;

capa.insertAdjacentHTML('beforebegin', `<div style="display: inline-block; padding: 4px; border-radius: 4px; font-size: 1.25em; font-weight: bold; background: #848; color: #fff;">Baixar motivo ${peritos.length > 0 ? 4 : 1}</div>`)

function houveDecursoOuCiencia(eventos, ordinal) {
  return eventos
    .filter(({ ordinal: o }) => o > ordinal)
    .find(({ descricao, referente }) =>
      (
        descricao.match(/Decurso de Prazo/) ||
        descricao.match(/RENÚNCIA AO PRAZO/)
      ) &&
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
    return { ordinal, descricao, referente, memos };
  });
}

function queryAll(selector) {
  return Array.from(document.querySelectorAll(selector));
}

function textContent(node) {
  return (node.textContent || '').trim();
}
