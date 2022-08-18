// ==UserScript==
// @name        atualizar-saldos
// @name:pt-BR  Atualizar saldos
// @namespace   http://nadameu.com.br
// @match       https://eproc.jfpr.jus.br/eprocV2/controlador.php?acao=processo_precatorio_rpv&*
// @match       https://eproc.jfrs.jus.br/eprocV2/controlador.php?acao=processo_precatorio_rpv&*
// @match       https://eproc.jfsc.jus.br/eprocV2/controlador.php?acao=processo_precatorio_rpv&*
// @match       https://eproc.trf4.jus.br/eproc2trf4/controlador.php?acao=processo_precatorio_rpv&*
// @match       https://eproc.jfpr.jus.br/eprocV2/controlador.php?acao=processo_selecionar&*
// @match       https://eproc.jfrs.jus.br/eprocV2/controlador.php?acao=processo_selecionar&*
// @match       https://eproc.jfsc.jus.br/eprocV2/controlador.php?acao=processo_selecionar&*
// @match       https://eproc.trf4.jus.br/eproc2trf4/controlador.php?acao=processo_selecionar&*
// @grant       none
// @version     2.0.0
// @author      nadameu
// @description Atualiza o saldo de contas judiciais
// ==/UserScript==

// ../../lib/predicates/index.ts
var AssertionError = class extends Error {
  constructor(message) {
    super(message);
    this.name = "AssertionError";
  }
};
function assert(condition, message) {
  if (!condition)
    throw new AssertionError(message);
}
function check(predicate, value, message) {
  assert(predicate(value), message);
  return value;
}
function isOfType(typeRepresentation) {
  return (value) => typeof value === typeRepresentation;
}
var isNumber = /* @__PURE__ */ isOfType("number");
var isOfTypeObject = /* @__PURE__ */ isOfType("object");
var isString = /* @__PURE__ */ isOfType("string");
function isLiteral(literal) {
  return (value) => value === literal;
}
var isNull = /* @__PURE__ */ isLiteral(null);
function negate(predicate) {
  return (value) => !predicate(value);
}
var isNotNull = /* @__PURE__ */ negate(isNull);
function refine(...predicates) {
  return (value) => predicates.every((p) => p(value));
}
var isObject = /* @__PURE__ */ refine(isOfTypeObject, isNotNull);
var isInteger = /* @__PURE__ */ refine(isNumber, (x) => Number.isInteger(x));
var isNatural = /* @__PURE__ */ refine(isInteger, (x) => x > 0);
var isNonNegativeInteger = /* @__PURE__ */ isAnyOf(
  isLiteral(0),
  isNatural
);
function isAnyOf(...predicates) {
  return (value) => predicates.some((p) => p(value));
}
function isArray(predicate) {
  return refine(
    (value) => Array.isArray(value),
    (xs) => xs.every(predicate)
  );
}
function hasKeys(...keys) {
  return refine(
    isObject,
    (obj) => keys.every((key) => key in obj)
  );
}
function hasShape(predicates) {
  const keys = Object.entries(predicates).map(
    ([key, predicate]) => [
      predicate.optional === true,
      key
    ]
  );
  const optional = keys.filter(([optional2]) => optional2).map(([, key]) => key);
  const required = keys.filter(([optional2]) => !optional2).map(([, key]) => key);
  return refine(
    hasKeys(...required),
    (obj) => required.every((key) => predicates[key](obj[key])) && optional.every((key) => key in obj ? predicates[key](obj[key]) : true)
  );
}

// ../../lib/expect-unreachable/index.ts
function expectUnreachable(value) {
  throw new Error("Unexpected.");
}

// src/NumProc.ts
var isNumproc = refine(isString, (x) => /^\d{20}$/.test(x));

// src/processosAguardando.ts
var STORAGE_KEY = "gm-atualizar-saldo-rpv";
function obterProcessosAguardando() {
  try {
    return check(isArray(isNumproc), JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]"));
  } catch (_) {
    return [];
  }
}
function adicionarProcessoAguardando(numproc) {
  salvarProcessosAguardando(obterProcessosAguardando().concat([numproc]));
}
function removerProcessoAguardando(numproc) {
  salvarProcessosAguardando(obterProcessosAguardando().filter((p) => p !== numproc));
}
function salvarProcessosAguardando(processos) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(processos));
}

// src/paginaProcesso.ts
async function paginaProcesso(numproc) {
  const capa = check(isNotNull, document.getElementById("fldCapa"), "Capa não encontrada.");
  const linkContas = check(
    isNotNull,
    document.querySelector("a#labelPrecatorios"),
    "Link não encontrado."
  );
  const url = linkContas.href;
  await modificarPaginaProcesso({ capa, numproc, url });
}
async function modificarPaginaProcesso({
  capa,
  numproc,
  url
}) {
  const botao = document.createElement("button");
  botao.type = "button";
  botao.textContent = "Atualizar saldo RPV";
  botao.addEventListener("click", makeOnBotaoClick({ botao, numproc, url }));
  capa.insertAdjacentElement("beforebegin", botao);
}
function makeOnBotaoClick({
  botao,
  numproc,
  url
}) {
  return function onBotaoClick(evt) {
    evt.preventDefault();
    adicionarProcessoAguardando(numproc);
    window.open(url);
  };
}

// src/paginaContas.ts
var PREFIXO_MSG = "<Atualizar saldo RPV>: ";
var PREFIXO_MSG_HTML = PREFIXO_MSG.replace("<", "&lt;").replace(">", "&gt;");
var estados = {
  ATUALIZANDO_BLOQUEIOS: "atualizando-bloqueios",
  ATUALIZANDO_SALDO: "atualizando-saldo",
  CONTAS_ATUALIZADAS: "contas-atualizadas",
  ERRO: "erro",
  OBTER_CONTAS: "obter-contas"
};
async function paginaContas(numproc) {
  if (!obterProcessosAguardando().includes(numproc))
    return;
  removerProcessoAguardando(numproc);
  const barra = document.getElementById("divInfraBarraLocalizacao");
  if (!barra) {
    const msg = "Não foi possível obter um local para exibir o resultado.";
    window.alert(`${PREFIXO_MSG}${msg}`);
    throw new Error(msg);
  }
  const output = barra.parentNode.insertBefore(
    document.createElement("output"),
    barra.nextSibling
  );
  const render = (estado) => {
    output.innerHTML = obterHtml(estado);
    function obterHtml(estado2) {
      switch (estado2.tipo) {
        case estados.ATUALIZANDO_BLOQUEIOS:
          return mensagem(`Atualizando bloqueios da conta ${estado2.conta + 1}...`);
        case estados.ATUALIZANDO_SALDO:
          return mensagem(`Atualizando saldo da conta ${estado2.conta + 1}...`);
        case estados.CONTAS_ATUALIZADAS:
          if (estado2.qtd === 0) {
            return mensagem(`Não é possível atualizar o saldo das contas.`, "erro");
          } else {
            const s = estado2.qtd > 1 ? "s" : "";
            return mensagem(`${estado2.qtd} conta${s} atualizada${s}.`, "fim");
          }
        case estados.ERRO:
          return mensagem(estado2.erro.message, "erro");
        case estados.OBTER_CONTAS:
          return mensagem(`Obtendo dados sobre as contas...`);
        default:
          return expectUnreachable(estado2);
      }
    }
    function mensagem(texto, estilo) {
      const style = estilo === "fim" ? "color: darkgreen;" : estilo === "erro" ? "color: red; font-weight: bold;" : null;
      if (style)
        return `<span style="${style}">${PREFIXO_MSG_HTML}${texto}</span>`;
      else
        return `${PREFIXO_MSG_HTML}${texto}`;
    }
  };
  const dispatch = (() => {
    let estado = { tipo: estados.OBTER_CONTAS };
    render(estado);
    return (f) => {
      const proximo = f(estado, dispatch);
      if (proximo !== estado) {
        estado = proximo;
        render(estado);
      }
    };
  })();
  const estadoErro = (msg) => ({ tipo: estados.ERRO, erro: new Error(msg) });
  const acoes = {
    bloqueiosAtualizados: () => (estado) => {
      if (estado.tipo !== estados.ATUALIZANDO_BLOQUEIOS)
        return estadoErro(`Estado inválido: ${JSON.stringify(estado)}`);
      const proxima = estado.conta + 1;
      if (proxima >= estado.fns.length) {
        return { tipo: estados.CONTAS_ATUALIZADAS, qtd: estado.fns.length };
      } else {
        estado.fns[proxima]();
        return { tipo: estados.ATUALIZANDO_SALDO, fns: estado.fns, conta: proxima };
      }
    },
    contasObtidas: (fns) => (estado, dispatch2) => {
      if (estado.tipo !== estados.OBTER_CONTAS)
        return estadoErro(`Estado inválido: ${JSON.stringify(estado)}`);
      if (fns.length === 0)
        return { tipo: estados.CONTAS_ATUALIZADAS, qtd: 0 };
      ouvirXHR(makeHandler(dispatch2));
      fns[0]();
      return { tipo: estados.ATUALIZANDO_SALDO, fns, conta: 0 };
    },
    erroAtualizacao: (texto) => (estado) => {
      switch (estado.tipo) {
        case estados.ATUALIZANDO_SALDO:
          return estadoErro(`Erro atualizando saldo da conta ${estado.conta + 1}.`);
        case estados.ATUALIZANDO_BLOQUEIOS:
          return estadoErro(`Erro atualizando os bloqueios da conta ${estado.conta + 1}.`);
        default:
          return estadoErro(`Estado inválido: ${JSON.stringify(estado)}`);
      }
    },
    saldoAtualizado: () => (estado) => {
      if (estado.tipo !== estados.ATUALIZANDO_SALDO)
        return estadoErro(`Estado inválido: ${JSON.stringify(estado)}`);
      return { tipo: estados.ATUALIZANDO_BLOQUEIOS, fns: estado.fns, conta: estado.conta };
    }
  };
  obterContas();
  return;
  function obterContas() {
    const linksAtualizar = document.querySelectorAll(
      'a[href^="javascript:atualizarSaldo("]'
    );
    if (linksAtualizar.length === 0)
      return dispatch(acoes.contasObtidas([]));
    const jsLinkRE = /^javascript:atualizarSaldo\('(?<numProcessoOriginario>\d{20})','(?<agencia>\d{4})',(?<conta>\d+),'(?<idProcesso>\d+)','(?<numProcesso>\d{20})',(?<numBanco>\d{3}),'(?<idRequisicaoBeneficiarioPagamento>\d+)',(?<qtdMovimentos>\d+)\)$/;
    const temCamposObrigatorios = hasShape({
      numProcessoOriginario: isString,
      agencia: isString,
      conta: isString,
      idProcesso: isString,
      numProcesso: isString,
      numBanco: isString,
      idRequisicaoBeneficiarioPagamento: isString,
      qtdMovimentos: isString
    });
    const fnsAtualizacao = Array.from(
      linksAtualizar,
      (link) => check(
        temCamposObrigatorios,
        link.href.match(jsLinkRE)?.groups,
        "Link de atualização desconhecido."
      )
    ).map((groups) => {
      const {
        numProcessoOriginario,
        agencia,
        conta: strConta,
        idProcesso,
        numProcesso,
        numBanco: strBanco,
        idRequisicaoBeneficiarioPagamento,
        qtdMovimentos: strQtdMovimentos
      } = groups;
      const [conta, numBanco, qtdMovimentos] = [
        Number(strConta),
        Number(strBanco),
        Number(strQtdMovimentos)
      ];
      return () => atualizarSaldo(
        numProcessoOriginario,
        agencia,
        conta,
        idProcesso,
        numProcesso,
        numBanco,
        idRequisicaoBeneficiarioPagamento,
        qtdMovimentos
      );
    });
    dispatch(acoes.contasObtidas(fnsAtualizacao));
  }
  function ouvirXHR(handler) {
    $.ajaxSetup({
      complete(xhr, resultado) {
        handler({ resultado, texto: xhr.responseText });
      }
    });
  }
  function makeHandler(dispatch2) {
    return ({ resultado, texto }) => {
      console.debug({ resultado, texto });
      if (resultado !== "success") {
        dispatch2(acoes.erroAtualizacao(texto));
      } else if (texto.match(/"saldo_valor_disponivel"/)) {
        dispatch2(acoes.saldoAtualizado());
      } else if (texto.match(/"htmlBloqueiosConta"/)) {
        dispatch2(acoes.bloqueiosAtualizados());
      }
    };
  }
}

// src/main.ts
var isAcaoReconhecida = isAnyOf(
  isLiteral("processo_selecionar"),
  isLiteral("processo_precatorio_rpv")
);
async function main() {
  const acao = new URL(document.location.href).searchParams.get("acao");
  assert(isNotNull(acao), "Página desconhecida.");
  assert(isAcaoReconhecida(acao), `Ação desconhecida: "${acao}".`);
  const numproc = new URL(document.location.href).searchParams.get("num_processo");
  assert(isNotNull(numproc), "Número do processo não encontrado.");
  assert(isNumproc(numproc), `Número de processo inválido: "${numproc}".`);
  switch (acao) {
    case "processo_selecionar":
      return paginaProcesso(numproc);
    case "processo_precatorio_rpv":
      return paginaContas(numproc);
    default:
      expectUnreachable(acao);
  }
}

// src/index.ts
main().catch((err) => {
  console.error(err);
});
