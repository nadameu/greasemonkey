// ==UserScript==
// @name Preenchimento dados baixa
// @version 6.0.2
// @author nadameu
// @namespace http://nadameu.com.br/baixa
// @include /^https:\/\/eproc\.(jf(pr|rs|sc)|trf4)\.jus\.br\/eproc(V2|2trf4)\/controlador\.php\?acao=baixa_arquivamento_processo_etapa_(1|3)&/
// @updateUrl https://github.com/nadameu/greasemonkey/raw/master/baixa.meta.js
// @downloadUrl https://github.com/nadameu/greasemonkey/raw/master/baixa.user.js
// @grant window.close
// ==/UserScript==

function adicionarEstilos(estilos) {
  const style = document.createElement('style');
  style.textContent = estilos;
  document.head.appendChild(style);
}

const FECHAR_APOS_BAIXAR = 'fecharJanelasAposBaixar';

function ControladorDigitos(maximo) {
  let array = [];
  return { pushDígito };
  function pushDígito(digito) {
    array.push(digito);
    let valor = obterValor(array);
    while (valor > maximo) {
      array = array.slice(1);
      valor = obterValor(array);
    }
    return valor;
  }
}
function obterValor(array) {
  return array.reduce((acc, x) => acc * 10 + x, 0);
}

function fromString(string) {
  if (/^\d$/.test(string)) return Number(string);
  return null;
}

const estilos$1 =
  '#gmLabel {\n\tborder-color: #faa;\n}\n.bootstrap-styles #gmLabel.gmChecked {\n\tbackground: #fdc;\n}\n#gmFechar {\n\tcursor: pointer;\n}\n#gmLabel label {\n\tcursor: pointer;\n}\n.gmValor {\n\tdisplay: inline-block;\n\twidth: 18px;\n\theight: 18px;\n\tline-height: 18px;\n\tcolor: #333;\n\tbackground: #cea;\n\tborder-radius: 100%;\n\ttext-align: center;\n}\n';

function fromArray$1(array) {
  if (array.length === 0) return null;
  return Object.freeze(array);
}

function fromId(id) {
  const element = document.getElementById(id);
  return element === null ? null : fromElement(element);
}
function fromElement(element) {
  return element.matches('input[type="radio"][name]') && element.name !== ''
    ? element
    : null;
}

function fromIds(ids) {
  // Não pode haver elementos repetidos
  if (new Set(ids).size !== ids.length) return null;
  const radios = ids.map(fromId);
  if (todosNulos(radios)) {
    // Grupos vazios são permitidos
    return [];
  }
  if (nenhumNulo(radios)) {
    // Todos os elementos do grupo devem ser obtidos
    // Todos os elementos devem ter o mesmo atributo "name"
    const names = new Set(radios.map(({ name }) => name));
    if (names.size === 1) return fromArray$1(radios);
  }
  return null;
}
function nenhumNulo(xs) {
  return xs.every(x => x !== null);
}
function todosNulos(xs) {
  return xs.every(x => x === null);
}

function fromArray(array) {
  const gruposNaoVazios = array.filter(grupo => grupo.length > 0);
  const names = new Set();
  for (const grupo of gruposNaoVazios) {
    // Todos os elementos de um grupo terão o mesmo atributo "name"
    const { name } = grupo[0];
    // Elementos com mesmo atributo "name" não podem estar em grupos diferentes
    if (names.has(name)) return null;
    names.add(name);
  }
  return gruposNaoVazios;
}

const debounce = (ms, callback) => {
  let timer;
  return (...args) => {
    window.clearTimeout(timer);
    timer = window.setTimeout(callback, ms, ...args);
  };
};

const estilos =
  '.gmResultado {\n\tposition: fixed;\n\tdisplay: flex;\n\ttop: 0;\n\tright: 0;\n\tbottom: 0;\n\tleft: 0;\n\tpadding: 15%;\n\tfont-family: sans-serif;\n\tbackground: rgba(0, 0, 0, 0.5);\n\talign-items: center;\n\tjustify-content: center;\n\ttext-align: center;\n\tfont-size: 32px;\n\tfont-weight: bold;\n\tcolor: white;\n\tpointer-events: none;\n}\n';

const CARACTERES_POR_SEGUNDO = 15;
const MILISSEGUNDOS_POR_CARACTERE = 1000 / CARACTERES_POR_SEGUNDO;
const ESPERA_MINIMA = 150;
function OSD(mensagemInicial, doc = document, win = doc.defaultView) {
  adicionarEstilos(estilos);
  const div = doc.createElement('div');
  div.className = 'gmResultado';
  doc.body.appendChild(div);
  let mensagemInicialMostrada = false;
  div.addEventListener('transitioncancel', onFimTransição, { once: true });
  div.addEventListener('transitionend', onFimTransição, { once: true });
  alteraTextoAguardaEFade(mensagemInicial);
  return { mostrarTexto, ocultar };
  function mostrarTexto(texto) {
    div.style.transition = '';
    div.style.opacity = '';
    alteraTextoAguardaEFade(texto);
  }
  function ocultar() {
    div.style.display = 'none';
    div.getBoundingClientRect();
    div.style.transition = '';
    div.style.opacity = '0';
    div.style.display = '';
  }
  function onFimTransição() {
    if (mensagemInicialMostrada) return;
    mensagemInicialMostrada = true;
    win.addEventListener('resize', debounce(150, ajustarTamanhoFonte));
    ajustarTamanhoFonte();
  }
  function alteraTextoAguardaEFade(texto) {
    div.textContent = texto;
    div.getBoundingClientRect();
    div.style.transition = `opacity 500ms linear ${calcularEsperaMínima(
      texto
    )}ms`;
    div.style.opacity = '0';
  }
  function ajustarTamanhoFonte() {
    div.style.fontSize = `${(obterAlturaJanela() / 3) | 0}px`;
  }
  function obterAlturaJanela() {
    return doc.documentElement.clientHeight;
  }
  function calcularEsperaMínima(mensagem) {
    return Math.max(
      ESPERA_MINIMA,
      mensagem.length * MILISSEGUNDOS_POR_CARACTERE
    );
  }
}

function multiplicarAnteriores(xs) {
  return xs.map((_, i) => produto(xs.slice(0, i)));
}
function produto(xs) {
  return xs.reduce((a, b) => a * b, 1);
}

const analisarGrupos = grupos => {
  const quantidades = grupos.map(grupo => grupo.length);
  const multiplicadores = multiplicarAnteriores(quantidades);
  const maximos = grupos.map(
    (_, i) => (quantidades[i] - 1) * multiplicadores[i]
  );
  return {
    maximo: maximos.reduce((a, b) => a + b, 0),
    grupos: grupos.map(
      (grupo, g) =>
        Object.freeze(
          grupo.map((elemento, e) => ({
            valor: multiplicadores[g] * e,
            elemento,
          }))
        ),
      []
    ),
  };
};

function Elemento(elemento) {
  return { setSelecionado, adicionarTexto };
  function setSelecionado(selecionado) {
    elemento.checked = selecionado;
  }
  function adicionarTexto(texto) {
    elemento.insertAdjacentHTML(
      'beforebegin',
      `<span class="gmValor">${texto}</span>`
    );
  }
}

function Selecionador(grupos) {
  const { elementos, maximo } = obterElementos(grupos);
  for (const grupo of elementos)
    for (const { valor, elemento } of grupo)
      elemento.adicionarTexto(String(valor));
  return { maximo, setValor };
  function setValor(valor) {
    if (valor > maximo) throw new RangeError(`Valor inválido: ${valor}.`);
    let restante = valor;
    for (const grupo of elementos) {
      let selecionadoGrupo = false;
      for (const { valor, elemento } of grupo) {
        if (valor > 0 && restante >= valor) {
          elemento.setSelecionado(true);
          restante -= valor;
          selecionadoGrupo = true;
        } else if (!selecionadoGrupo && valor === 0) {
          elemento.setSelecionado(true);
        } else {
          elemento.setSelecionado(false);
        }
      }
    }
  }
}
function obterElementos(grupos) {
  const { grupos: radiosComValor, maximo } = analisarGrupos(grupos);
  const elementos = radiosComValor
    .map(grupo =>
      grupo
        .map(({ elemento: radio, valor }) => ({
          elemento: Elemento(radio),
          valor,
        }))
        .sort(valorDecrescente)
    )
    .sort(valoresDecrescentes);
  return { elementos, maximo };
}
function valorDecrescente(a, b) {
  return b.valor - a.valor;
}
function valoresDecrescentes(as, bs) {
  return (
    Math.max(...bs.map(({ valor }) => valor)) -
    Math.max(...as.map(({ valor }) => valor))
  );
}

function etapa1({ baixar, capa }) {
  adicionarEstilos(estilos$1);
  adicionarBotaoFecharAposBaixar(capa);
  const osd = OSD(
    'Digite a soma das opções que deseja selecionar. Pressione ENTER para confirmar.'
  );
  const selecionador = criarSelecionador();
  const controladorDigitos = ControladorDigitos(selecionador.maximo);
  document.addEventListener('click', osd.ocultar);
  document.addEventListener(
    'keypress',
    onKeyPress({
      baixar,
      mostrarTexto: osd.mostrarTexto,
      pushDígito: controladorDigitos.pushDígito,
      setValor: selecionador.setValor,
    })
  );
}
function onKeyPress({ pushDígito, mostrarTexto, setValor, baixar }) {
  return evt => {
    const digito = fromString(evt.key);
    if (digito !== null) {
      const valor = pushDígito(digito);
      mostrarTexto(valor.toString());
      setValor(valor);
    } else if (evt.keyCode === 13) {
      baixar.click();
    }
  };
}
function adicionarBotaoFecharAposBaixar(capa) {
  capa.insertAdjacentHTML(
    'afterend',
    '<label id="gmLabel" class="btn btn-default"><input id="gmFechar" type="checkbox">&nbsp;<label for="gmFechar">Fechar esta janela e a janela/aba do processo após baixar</label></label>'
  );
  const fechar = document.querySelector('#gmFechar');
  const fecharLabel = document.querySelector('#gmLabel');
  fechar.addEventListener('change', onFecharChange);
  if (localStorage.hasOwnProperty(FECHAR_APOS_BAIXAR)) {
    fechar.checked = localStorage.getItem(FECHAR_APOS_BAIXAR) === 'S';
    onFecharChange();
  }
  function onFecharChange() {
    const selecionado = fechar.checked;
    localStorage.setItem(FECHAR_APOS_BAIXAR, selecionado ? 'S' : 'N');
    if (selecionado) {
      fecharLabel.classList.add('gmChecked');
    } else {
      fecharLabel.classList.remove('gmChecked');
    }
  }
}
function criarSelecionador() {
  // Grupos
  const jáTeveBaixaDefinitiva = fromIds(['rdoItem0/1']);
  const condenação = fromIds(['rdoItem1/3', 'rdoItem1/1', 'rdoItem1/2']);
  const honoráriosCustas = fromIds(['rdoItem2/3', 'rdoItem2/1', 'rdoItem2/2']);
  const apensosLEF = fromIds(['rdoItem3/2', 'rdoItem3/1']);
  const gruposPossíveis = [
    jáTeveBaixaDefinitiva,
    condenação,
    honoráriosCustas,
    apensosLEF,
  ];
  if (somenteGruposVálidos(gruposPossíveis)) {
    const gruposVálidos = fromArray(gruposPossíveis);
    if (gruposVálidos !== null) return Selecionador(gruposVálidos);
  }
  throw new Error('Erro ao processar os elementos da página.');
}
function somenteGruposVálidos(grupos) {
  return grupos.every(g => g !== null);
}

function etapa3() {
  if (
    localStorage.hasOwnProperty(FECHAR_APOS_BAIXAR) &&
    localStorage.getItem(FECHAR_APOS_BAIXAR) === 'S'
  ) {
    const { documentosAbertos: abertos } = opener;
    if (abertos)
      Object.values(abertos).forEach(janela => {
        if (janela && !janela.closed) janela.close();
      });
    opener.setTimeout(() => opener.close());
    window.close();
  }
}

function query(selector, parentNode = document) {
  const element = parentNode.querySelector(selector);
  if (element) return element;
  throw new Error(`Elemento não encontrado: '${selector}'.`);
}

function main() {
  const { acao, etapa } = extrairDadosUrl(document.location.href);
  if (etapa === '1') {
    const baixar = query('input#sbmBaixa');
    const capa = query('#fldCapa');
    etapa1({ baixar, capa });
  } else if (etapa === '3') {
    etapa3();
  } else {
    throw new Error(`Ação desconhecida: '${acao}'.`);
  }
}
function extrairDadosUrl(url) {
  const acao = new URL(url).searchParams.get('acao');
  const match = (acao === null ? '' : acao).match(
    /^baixa_arquivamento_processo_etapa_(1|3)$/
  );
  const etapa = (match === null ? ['', 'desconhecida'] : match)[1];
  return { acao, etapa };
}

main();
