// ==UserScript==
// @name Preenchimento dados baixa
// @version 5.2.0
// @author nadameu
// @namespace http://nadameu.com.br/baixa
// @include /^https:\/\/eproc\.(jf(pr|rs|sc)|trf4)\.jus\.br\/eproc(V2|2trf4)\/controlador\.php\?acao=baixa_arquivamento_processo_etapa_(1|3)&/
// @updateUrl https://github.com/nadameu/greasemonkey/raw/master/baixa.meta.js
// @downloadUrl https://github.com/nadameu/greasemonkey/raw/master/baixa.user.js
// @grant none
// ==/UserScript==

function adicionarEstilos(estilos) {
  const style = document.createElement('style');
  style.textContent = estilos;
  document.head.appendChild(style);
}

const FECHAR_APOS_BAIXAR = 'fecharJanelasAposBaixar';

function obterValor(array) {
  return array.reduce((acc, x) => 10 * acc + x, 0);
}

function fromId(id) {
  const element = document.getElementById(id);
  return null === element
    ? null
    : (element =>
        element.matches('input[type="radio"][name]') && '' !== element.name ? element : null)(
        element
      );
}

function fromIds(ids) {
  if (new Set(ids).size !== ids.length) return null;
  const radios = ids.map(fromId);
  return radios.every(x => null === x)
    ? []
    : (xs => xs.every(x => null !== x))(radios) &&
      1 === new Set(radios.map(({ name }) => name)).size
    ? 0 === (array = radios).length
      ? null
      : Object.freeze(array)
    : null;
  var array;
}

const debounce = (ms, callback) => {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(callback, ms, ...args);
    };
  },
  MILISSEGUNDOS_POR_CARACTERE = 1e3 / 15,
  ESPERA_MINIMA = 150;

function Elemento(elemento) {
  return {
    setSelecionado(selecionado) {
      elemento.checked = selecionado;
    },
    adicionarTexto(texto) {
      elemento.insertAdjacentHTML('beforebegin', `<span class="gmValor">${texto}</span>`);
    },
  };
}

function valorDecrescente(a, b) {
  return b.valor - a.valor;
}

function valoresDecrescentes(as, bs) {
  return Math.max(...bs.map(({ valor }) => valor)) - Math.max(...as.map(({ valor }) => valor));
}

function query(selector, parentNode = document) {
  const element = parentNode.querySelector(selector);
  if (element) return element;
  throw Error(`Elemento não encontrado: '${selector}'.`);
}

(() => {
  const { acao, etapa } = (url => {
    const acao = new URL(url).searchParams.get('acao'),
      match = (null === acao ? '' : acao).match(/^baixa_arquivamento_processo_etapa_(1|3)$/);
    return {
      acao,
      etapa: (null === match ? ['', 'desconhecida'] : match)[1],
    };
  })(document.location.href);
  if ('1' === etapa)
    (({ baixar, pendencias, wrapper, sidebar }) => {
      adicionarEstilos(
        '.gmLabel {\n\tborder-color: #faa;\n}\n.gmLabel.gmChecked {\n\tbackground: #fdc;\n}\n#gmFechar {\n\tcursor: pointer;\n}\n.gmLabel label {\n\tcursor: pointer;\n}\n.gmValor {\n\tdisplay: inline-block;\n\twidth: 18px;\n\theight: 18px;\n\tline-height: 18px;\n\tcolor: #333;\n\tbackground: #cea;\n\tborder-radius: 100%;\n\ttext-align: center;\n}\n'
      );
      ((wrapper, sidebar) => {
        wrapper.style.transition = 'none';
        wrapper.classList.remove('abre-automaticamente');
        wrapper.classList.add('toggled');
        sidebar.style.transition = 'none';
        wrapper.getBoundingClientRect();
        wrapper.style.transition = '';
        sidebar.style.transition = '';
      })(wrapper, sidebar);
      (pendencias => {
        pendencias.insertAdjacentHTML(
          'beforebegin',
          '<label class="btn btn-default gmLabel"><input id="gmFechar" type="checkbox">&nbsp;<label for="gmFechar">Fechar esta janela e a janela/aba do processo após baixar</label></label>'
        );
        const fechar = document.querySelector('#gmFechar'),
          fecharLabel = document.querySelector('.gmLabel');
        fechar.addEventListener('change', onFecharChange);
        if (localStorage.hasOwnProperty(FECHAR_APOS_BAIXAR)) {
          fechar.checked = 'S' === localStorage.getItem(FECHAR_APOS_BAIXAR);
          onFecharChange();
        }
        function onFecharChange() {
          const selecionado = fechar.checked;
          localStorage.setItem(FECHAR_APOS_BAIXAR, selecionado ? 'S' : 'N');
          selecionado
            ? fecharLabel.classList.add('gmChecked')
            : fecharLabel.classList.remove('gmChecked');
        }
      })(pendencias);
      const osd = ((mensagemInicial, doc = document, win = doc.defaultView) => {
          adicionarEstilos(
            '.gmResultado {\n\tposition: fixed;\n\tdisplay: flex;\n\ttop: 0;\n\tright: 0;\n\tbottom: 0;\n\tleft: 0;\n\tpadding: 15%;\n\tfont-family: sans-serif;\n\tbackground: rgba(0, 0, 0, 0.5);\n\talign-items: center;\n\tjustify-content: center;\n\ttext-align: center;\n\tfont-size: 32px;\n\tfont-weight: bold;\n\tcolor: white;\n\tpointer-events: none;\n}\n'
          );
          const div = doc.createElement('div');
          div.className = 'gmResultado';
          doc.body.appendChild(div);
          let mensagemInicialMostrada = !1;
          div.addEventListener('transitioncancel', onFimTransição, {
            once: !0,
          });
          div.addEventListener('transitionend', onFimTransição, {
            once: !0,
          });
          alteraTextoAguardaEFade(mensagemInicial);
          return {
            mostrarTexto(texto) {
              div.style.transition = '';
              div.style.opacity = '';
              alteraTextoAguardaEFade(texto);
            },
            ocultar() {
              div.style.display = 'none';
              div.getBoundingClientRect();
              div.style.transition = '';
              div.style.opacity = '0';
              div.style.display = '';
            },
          };
          function onFimTransição() {
            if (!mensagemInicialMostrada) {
              mensagemInicialMostrada = !0;
              win.addEventListener('resize', debounce(150, ajustarTamanhoFonte));
              ajustarTamanhoFonte();
            }
          }
          function alteraTextoAguardaEFade(texto) {
            div.textContent = texto;
            div.getBoundingClientRect();
            div.style.transition = `opacity 500ms linear ${
              ((mensagem = texto),
              Math.max(ESPERA_MINIMA, mensagem.length * MILISSEGUNDOS_POR_CARACTERE))
            }ms`;
            var mensagem;
            div.style.opacity = '0';
          }
          function ajustarTamanhoFonte() {
            div.style.fontSize = `${(doc.documentElement.clientHeight / 3) | 0}px`;
          }
        })('Digite a soma das opções que deseja selecionar. Pressione ENTER para confirmar.'),
        selecionador = (() => {
          const gruposPossíveis = [
            fromIds(['rdoItem0/1']),
            fromIds(['rdoItem1/3', 'rdoItem1/1', 'rdoItem1/2']),
            fromIds(['rdoItem2/3', 'rdoItem2/1', 'rdoItem2/2']),
            fromIds(['rdoItem3/2', 'rdoItem3/1']),
          ];
          if (gruposPossíveis.every(g => null !== g)) {
            const gruposVálidos = (array => {
              const gruposNaoVazios = array.filter(grupo => grupo.length > 0),
                names = new Set();
              for (const grupo of gruposNaoVazios) {
                const { name } = grupo[0];
                if (names.has(name)) return null;
                names.add(name);
              }
              return gruposNaoVazios;
            })(gruposPossíveis);
            if (null !== gruposVálidos)
              return (grupos => {
                const { elementos, maximo } = (grupos => {
                  const { grupos: radiosComValor, maximo } = (grupos => {
                    const quantidades = grupos.map(grupo => grupo.length),
                      multiplicadores = (xs =>
                        xs.map((_, i) => (xs => xs.reduce((a, b) => a * b, 1))(xs.slice(0, i))))(
                        quantidades
                      );
                    return {
                      maximo: grupos
                        .map((_, i) => (quantidades[i] - 1) * multiplicadores[i])
                        .reduce((a, b) => a + b, 0),
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
                  })(grupos);
                  return {
                    elementos: radiosComValor
                      .map(grupo =>
                        grupo
                          .map(({ elemento: radio, valor }) => ({
                            elemento: Elemento(radio),
                            valor,
                          }))
                          .sort(valorDecrescente)
                      )
                      .sort(valoresDecrescentes),
                    maximo,
                  };
                })(grupos);
                for (const grupo of elementos)
                  for (const { valor, elemento } of grupo) elemento.adicionarTexto(valor + '');
                return {
                  maximo,
                  setValor(valor) {
                    if (valor > maximo) throw new RangeError(`Valor inválido: ${valor}.`);
                    let restante = valor;
                    for (const grupo of elementos) {
                      let selecionadoGrupo = !1;
                      for (const { valor, elemento } of grupo)
                        if (valor > 0 && restante >= valor) {
                          elemento.setSelecionado(!0);
                          restante -= valor;
                          selecionadoGrupo = !0;
                        } else
                          selecionadoGrupo || 0 !== valor
                            ? elemento.setSelecionado(!1)
                            : elemento.setSelecionado(!0);
                    }
                  },
                };
              })(gruposVálidos);
          }
          throw Error('Erro ao processar os elementos da página.');
        })(),
        controladorDigitos = (maximo => {
          let array = [];
          return {
            pushDígito(digito) {
              array.push(digito);
              let valor = obterValor(array);
              for (; valor > maximo; ) valor = obterValor((array = array.slice(1)));
              return valor;
            },
          };
        })(selecionador.maximo);
      document.addEventListener('click', osd.ocultar);
      document.addEventListener(
        'keypress',
        (({ pushDígito: pushDígito, mostrarTexto, setValor, baixar }) => evt => {
          const digito = (string => (/^\d$/.test(string) ? Number(string) : null))(evt.key);
          if (null !== digito) {
            const valor = pushDígito(digito);
            mostrarTexto(valor.toString());
            setValor(valor);
          } else 13 === evt.keyCode && baixar.click();
        })({
          baixar,
          mostrarTexto: osd.mostrarTexto,
          pushDígito: controladorDigitos.pushDígito,
          setValor: selecionador.setValor,
        })
      );
    })({
      baixar: query('input#sbmBaixa'),
      pendencias: query('#fldPendencias'),
      wrapper: query('#wrapper'),
      sidebar: query('#sidebar-wrapper'),
    });
  else {
    if ('3' !== etapa) throw Error(`Ação desconhecida: '${acao}'.`);
    (() => {
      if (
        localStorage.hasOwnProperty(FECHAR_APOS_BAIXAR) &&
        'S' === localStorage.getItem(FECHAR_APOS_BAIXAR)
      ) {
        const { documentosAbertos: abertos } = opener;
        abertos &&
          Object.values(abertos).forEach(janela => {
            janela && !janela.closed && janela.close();
          });
        opener.setTimeout(() => opener.close());
        window.close();
      }
    })();
  }
})();
