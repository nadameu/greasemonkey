// ==UserScript==
// @name        Processos prioritários
// @namespace   http://nadameu.com.br/processos-prioritarios
// @include     /^https:\/\/eproc\.(jf(pr|rs|sc)|trf4)\.jus\.br/eproc(V2|2trf4)/controlador\.php\?acao\=usuario_tipo_monitoramento_localizador_listar\&/
// @include     /^https:\/\/eproc\.(jf(pr|rs|sc)|trf4)\.jus\.br/eproc(V2|2trf4)/controlador\.php\?acao\=localizador_processos_lista\&/
// @include     /^https:\/\/eproc\.(jf(pr|rs|sc)|trf4)\.jus\.br/eproc(V2|2trf4)/controlador\.php\?acao\=localizador_orgao_listar\&/
// @include     /^https:\/\/eproc\.(jf(pr|rs|sc)|trf4)\.jus\.br/eproc(V2|2trf4)/controlador\.php\?acao\=relatorio_geral_listar\&/
// @include     /^https:\/\/eproc\.(jf(pr|rs|sc)|trf4)\.jus\.br/eproc(V2|2trf4)/controlador\.php\?acao\=[^&]+\&acao_origem=principal\&/
// @version     10
// @grant       none
// ==/UserScript==

const CompetenciasCorregedoria = {
  JUIZADO: 1,
  CIVEL: 2,
  CRIMINAL: 3,
  EXECUCAO_FISCAL: 4
};

const Situacoes = {
  'MOVIMENTO': 3,
  'MOVIMENTO-AGUARDA DESPACHO': 2,
  'MOVIMENTO-AGUARDA SENTENÇA': 4,
  'INICIAL': 1,
  'INDEFINIDA': 5
}

var GUI = (function() {

  var instance = null, construindo = false;
  var button = null, progresso = null, saida = null;
  var invalidSymbols = /[&<>"]/g;
  var replacementSymbols = {
    '&': 'amp',
    '<': 'lt',
    '>': 'gt',
    '"': 'quot'
  };

  function safeHTML(strings, ...vars) {
    return vars.reduce((result, variable, i) => result + variable.replace(invalidSymbols, (sym) => '&' + replacementSymbols[sym] + ';') + strings[i + 1], strings[0]);
  }

  function GUI() {
    if (! construindo) {
      throw new Error('Classe deve ser instanciada usando o método .getInstance().');
    }
    var estilos = document.createElement('style');
    estilos.innerHTML = [
      'tr.infraTrEscura { background-color: #f0f0f0; }',
      '.gmProcessos { display: inline-block; margin: 0 0.25ex; padding: 0 0.5ex; font-weight: bold; min-width: 2.5ex; line-height: 1.5em; border: 2px solid transparent; border-radius: 1ex; text-align: center; color: black; }',
      '.gmProcessos.gmPrioridade0 { background-color: #ff8a8a; }',
      '.gmProcessos.gmPrioridade1 { background-color: #f84; }',
      '.gmProcessos.gmPrioridade2 { background-color: #ff8; }',
      '.gmProcessos.gmPrioridade3 { background-color: #8aff8a; }',
      '.gmProcessos.gmVazio { opacity: 0.25; background-color: inherit; color: #888; }',
      '.gmDetalhes td:first-child { padding-left: 3ex; }',
      '.gmDetalhesAberto { border-color: black; }'
    ].join('\n');
    document.querySelector('head').appendChild(estilos);
  }
  GUI.prototype = {
    constructor: GUI,
    atualizarVisualizacao(localizador) {
      var linha = localizador.linha;
      var avisos = [
        'Processos com prazo excedido em dobro',
        'Processos com prazo vencido',
        'Processos com prazo a vencer nos próximos 3 dias',
        'Processos no prazo'
      ];
      var prioridades = [
        localizador.processos.filter(processo => processo.atrasoPorcentagem >= 1),
        localizador.processos.filter(processo => processo.atraso >= 0 && processo.atrasoPorcentagem < 1),
        localizador.processos.filter(processo => processo.atraso < 0 && processo.atraso >= -3),
        localizador.processos.filter(processo => processo.atraso < -3)
      ];
      var baloes = prioridades.map(function(processos, indicePrioridade) {
        return '<span id="gmLocalizador' + localizador.id + 'Prioridade' + indicePrioridade + '" class="gmProcessos gmPrioridade' + indicePrioridade + (processos.length > 0 ? '' : ' gmVazio') + '" onmouseover="infraTooltipMostrar(&quot;' + avisos[indicePrioridade] + '&quot;);" onmouseout="infraTooltipOcultar();">' + processos.length + '</span>';
      });
      var conteudo = [];
      if (! (localizador.sigla || localizador.nome)) {
        conteudo.push(localizador.siglaNome);
      } else if (localizador.sigla) {
        conteudo.push(localizador.sigla);
        if (localizador.nome !== localizador.sigla) {
          conteudo.push(' (' + localizador.nome + ')');
        }
      } else {
        conteudo.push(localizador.nome);
      }
      if (localizador.lembrete) {
        conteudo.push(' ');
        conteudo.push('<img class="infraImgNormal" src="../../../infra_css/imagens/balao.gif" style="width:0.9em; height:0.9em; opacity:1; border-width:0;" onmouseover="' + safeHTML`return infraTooltipMostrar('${localizador.lembrete}','',400);` + '" onmouseout="return infraTooltipOcultar();"/>');
      }
      conteudo.push('<div style="float: right;">');
      conteudo.push(baloes.join(''));
      conteudo.push('</div>');
      linha.cells[0].innerHTML = conteudo.join('');
      prioridades.forEach(function(processos, indicePrioridade) {
        var balao = document.getElementById('gmLocalizador' + localizador.id + 'Prioridade' + indicePrioridade);
        balao.addEventListener('click', function(evt) {
          evt.preventDefault();
          evt.stopPropagation();
          [...document.getElementsByClassName('gmDetalhes')].forEach(function(linhaAntiga) {
            linha.parentElement.removeChild(linhaAntiga);
          });
          if (balao.classList.contains('gmDetalhesAberto')) {
            balao.classList.remove('gmDetalhesAberto');
            return;
          }
          [...document.getElementsByClassName('gmDetalhesAberto')].forEach(function(balaoAberto) {
            balaoAberto.classList.remove('gmDetalhesAberto');
          });
          balao.classList.add('gmDetalhesAberto');
          processos.sort((a, b) => {
            if (a.atrasoPorcentagem < b.atrasoPorcentagem) return +1;
            if (a.atrasoPorcentagem > b.atrasoPorcentagem) return -1;
            return 0;
          });
          processos.forEach(function(processo, indiceProcesso) {
            var linhaNova = linha.parentElement.insertRow(linha.rowIndex + 1 + indiceProcesso);
            var atraso = Math.round(processo.atraso);
            linhaNova.className = 'infraTrClara gmDetalhes';
            linhaNova.dataset.classe = ('0'.repeat(6) + processo.numClasse).substr(-6);
            linhaNova.dataset.competencia = ('0'.repeat(2) + processo.numCompetencia).substr(-2);
            var textoData;
            switch (processo.campoDataConsiderada) {
              case 'dataSituacao':
                switch (processo.situacao) {
                  case 'MOVIMENTO-AGUARDA DESPACHO':
                    textoData = 'concl. p/ desp. desde ';
                    break;

                  case 'MOVIMENTO-AGUARDA SENTENÇA':
                    textoData = 'concl. p/ sent. desde ';
                    break;

                  default:
                    textoData = 'na situação desde ';
                    break;
                }
                break;

              case 'dataUltimoEvento':
                textoData = 'último evento em ';
                break;
            }
            var esperado = processo.prazoCorregedoria;
            linhaNova.innerHTML = [
              '<td>',
              [
                '<a href="' + processo.link + '">' + processo.numprocFormatado + '</a>',
                textoData + processo[ processo.campoDataConsiderada ].toLocaleString().substr(0, 10),
                ' esperado ' + esperado + (esperado > 1 ? ' dias' : ' dia'),
                processo.classe.toUpperCase()
              ].join(' | '),
              '</td>',
              '<td>',
              atraso >= 0 ? 'Prazo excedido há ' : '',
              Math.abs(atraso),
              Math.abs(atraso) > 1 ? ' dias ' : ' dia ',
              atraso < 0 ? 'até o fim do prazo' : '',
              processo.prioridade ? ' <span style="color: red;">(Prioridade)</span>' : '',
              '</td>'
            ].join('');
          });
        }, false);
      });
    },
    avisoCarregando: {
      acrescentar(qtd) {
        if (! progresso || ! saida) {
          throw new Error('Aviso ainda não foi exibido.');
        }
        var atual = progresso.value, total = progresso.max;
        this.atualizar(atual + qtd, total);
      },
      atualizar(atual, total) {
        if (! progresso || ! saida) {
          this.exibir();
        }
        progresso.max = total;
        progresso.value = atual;
        saida.textContent = atual + ' / ' + total;
      },
      exibir() {
        window.infraExibirAviso(false, [
          '<center>',
          'Carregando dados dos processos...<br/>',
          '<progress id="gmProgresso" value="0" max="1"></progress><br/>',
          '<output id="gmSaida"></output>',
          '</center>'
        ].join(''));
        progresso = document.getElementById('gmProgresso');
        saida = document.getElementById('gmSaida');
      },
      ocultar() {
        window.infraOcultarAviso();
        progresso = null;
        saida = null;
      }
    },
    criarBotaoAcao() {
      var area = document.getElementById('divInfraAreaTelaD');
      button = document.createElement('button');
      button.textContent = 'Analisar conteúdo dos localizadores';
      area.insertBefore(button, area.firstChild);
      return button;
    },
    removerBotaoAcao() {
      if (button) {
        button.parentNode.removeChild(button);
        button = null;
      }
    },
    visitLocalizador(pvtVars) {
      return pvtVars;
    }
  };
  GUI.getInstance = function() {
    if (! instance) {
      construindo = true;
      instance = new GUI();
      construindo = false;
    }
    return instance;
  };
  return GUI;
})();

var LocalizadoresFactory = (function() {

  function trataHTML(evt) {
    var parser = new DOMParser();
    var doc = parser.parseFromString(evt.target.response, 'text/html');
    var pagina = Number(doc.getElementById('hdnInfraPaginaAtual').value);
    var quantidadeProcessosCarregados = Number(doc.getElementById('hdnInfraNroItens').value);
    var gui = GUI.getInstance();
    gui.avisoCarregando.acrescentar(quantidadeProcessosCarregados);
    var linhas = [...doc.querySelectorAll('#divInfraAreaTabela > table > tbody > tr[class^="infraTr"]')];
    linhas.forEach(function(linha, indiceLinha) {
      this.processos.push(ProcessoFactory.fromLinha(linha));
    }, this);
    var proxima = doc.getElementById('lnkInfraProximaPaginaSuperior');
    if (proxima) {
      console.info('Buscando próxima página',this.nome);
      return this.obterPagina(pagina + 1, doc);
    } else {
      return this;
    }
  }

  function Localizador() {
    this.processos = [];
  }
  Localizador.prototype = {
    constructor: Localizador,
    id: null,
    lembrete: null,
    link: null,
    nome: null,
    processos: null,
    sigla: null,
    siglaNome: null,
    obterPagina(pagina, doc) {
      var self = this;
      return new Promise(function(resolve, reject) {
        var url, data;
        if (pagina === 0) {
          url = self.link.href;
          data = new FormData();
          var camposPost = [
            'optchkcClasse',
            'optDataAutuacao',
            'optchkcUltimoEvento',
            'optNdiasSituacao',
            'optJuizo',
            'optPrioridadeAtendimento',
            'chkStatusProcesso'
          ];
          camposPost.forEach((campo) => data.append(campo, 'S'));
          data.append('paginacao', '100');
        } else {
          doc.getElementById('selLocalizador').value = self.id;
          var paginaAtual = doc.getElementById('hdnInfraPaginaAtual');
          paginaAtual.value = pagina;
          var form = paginaAtual.parentElement;
          while (form.tagName.toLowerCase() !== 'form') {
            form = form.parentElement;
          }
          url = form.action;
          data = new FormData(form);
        }
        var xml = new XMLHttpRequest();
        xml.open('POST', url);
        xml.responseType = 'text/html';
        xml.onerror = reject;
        xml.onload = resolve;
        xml.send(data);
      })
      .then(trataHTML.bind(this))
      .catch(console.error.bind(console));
    },
    obterProcessos() {
      var link = this.link;
      if (! link.href) {
        return Promise.resolve(this);
      } else {
        return this.obterPagina(0).then(function() {
          this.link.textContent = this.processos.length;
          if (this.processos.length > 0) {
            var localizadorProcesso = this.processos[0].localizadores.filter((localizador) => localizador.id === this.id)[0];
            if (! this.sigla) {
              this.sigla = localizadorProcesso.sigla;
            }
            if (this.sigla && this.nome) {
              this.siglaNome = [this.sigla, this.nome].join(' - ');
            }
            var siglaComSeparador = this.sigla + ' - ';
            this.nome = this.siglaNome.substr(siglaComSeparador.length);
            this.lembrete = localizadorProcesso.lembrete;
          }
          return this;
        }.bind(this));
      }
    },
    get quantidadeProcessos() {
      return Number(this.link.textContent);
    }
  };

  var LocalizadorFactory = {
    fromLinha(linha) {
      var localizador = new Localizador();
      localizador.linha = linha;
      var siglaNome = linha.cells[0].textContent.split(' - ');
      if (siglaNome.length === 2) {
        localizador.sigla = siglaNome[0];
        localizador.nome = siglaNome[1];
      }
      localizador.siglaNome = siglaNome.join(' - ');
      var link = localizador.link = linha.querySelector('a');
      if (link.href) {
        var camposGet = parsePares(link.search.split(/^\?/)[1].split('&'));
        localizador.id = camposGet.selLocalizador;
      }
      return localizador;
    },
    fromLinhaPainel(linha) {
      var localizador = new Localizador();
      localizador.linha = linha;
      localizador.nome = linha.cells[0].textContent.match(/^Processos com Localizador\s+"(.*)"$/)[1];
      var link = localizador.link = linha.querySelector('a,u');
      if (link && link.href) {
        var camposGet = parsePares(link.search.split(/^\?/)[1].split('&'));
        localizador.id = camposGet.selLocalizador;
      }
      return localizador;
    }
  };

  function Localizadores() {
  }
  Localizadores.prototype = definirPropriedades(Object.create(Array.prototype), {
    constructor: Localizadores,
    tabela: null,
    obterProcessos() {
      var cookiesAntigos = parseCookies(document.cookie);
      var promises = this.map((localizador) => localizador.obterProcessos());
      return Promise.all(promises).then(function() {
        var cookiesNovos = parseCookies(document.cookie);
        var expira = new Date();
        expira.setFullYear(expira.getFullYear() + 1);
        for (let key in cookiesNovos) {
          if ((typeof cookiesAntigos[key] !== 'undefined') && cookiesNovos[key] !== cookiesAntigos[key]) {
            document.cookie = encodeURIComponent(key) + '=' + encodeURIComponent(cookiesAntigos[key]) + '; expires=' + expira.toUTCString();
          }
        }
      });
    },
    get quantidadeProcessos() {
      return this.reduce((soma, localizador) => soma + localizador.quantidadeProcessos, 0);
    }
  });

  var LocalizadoresFactory = {
    fromTabela(tabela) {
      var localizadores = new Localizadores();
      localizadores.tabela = tabela;
      var linhas = [...tabela.querySelectorAll('tr[class^="infraTr"]')];
      linhas.forEach(function(linha) {
        localizadores.push(LocalizadorFactory.fromLinha(linha));
      });
      return localizadores;
    },
    fromTabelaPainel(tabela) {
      var localizadores = new Localizadores();
      localizadores.tabela = tabela;
      var linhas = [...tabela.querySelectorAll('tr[class^="infraTr"]')];
      linhas.forEach(function(linha) {
        localizadores.push(LocalizadorFactory.fromLinhaPainel(linha));
      });
      return localizadores;
    }
  };
  return LocalizadoresFactory;
})();

var ProcessoFactory = (function() {

  function LocalizadorProcesso() {
  }
  LocalizadorProcesso.prototype = {
    constructor: LocalizadorProcesso,
    id: null,
    lembrete: null,
    principal: null,
    sigla: null
  };

  var LocalizadorProcessoFactory = {
    fromInput(input) {
      var localizador = new LocalizadorProcesso();
      localizador.id = input.value;
      var elementoNome = input.nextSibling;
      localizador.principal = (elementoNome.nodeName.toLowerCase() === 'u');
      localizador.sigla = elementoNome.textContent.trim();
      var linkLembrete = elementoNome.nextElementSibling;
      if (linkLembrete.attributes.hasOwnProperty('onmouseover')) {
        var onmouseover = linkLembrete.attributes.onmouseover.value;
        localizador.lembrete = onmouseover.match(/^return infraTooltipMostrar\('Obs: (.*) \/ ([^(]+)\(([^)]+)\)','',400\);$/)[1];
      }
      return localizador;
    }
  };

  function LocalizadoresProcesso() {
  }
  LocalizadoresProcesso.prototype = definirPropriedades(Object.create(Array.prototype), {
    constructor: LocalizadoresProcesso,
    principal: null
  });

  var LocalizadoresProcessoFactory = {
    fromCelula(celula) {
      var localizadores = new LocalizadoresProcesso();
      var inputs = [...celula.getElementsByTagName('input')];
      inputs.forEach(function(input) {
        var localizador = LocalizadorProcessoFactory.fromInput(input);
        if (localizador.principal) {
          localizadores.principal = localizador;
        }
        localizadores.push(localizador);
      });
      return localizadores;
    }
  };

  function Processo() {
    this.dadosComplementares = new Set();
    this.lembretes = [];
    this.localizadores = [];
  }
  Processo.prototype = {
    constructor: Processo,
    classe: null,
    dadosComplementares: null,
    dataAutuacao: null,
    dataInclusaoLocalizador: null,
    dataSituacao: null,
    dataUltimoEvento: null,
    juizo: null,
    lembretes: null,
    link: null,
    localizadores: null,
    numClasse: null,
    numCompetencia: null,
    numproc: null,
    numprocFormatado: null,
    sigilo: null,
    situacao: null,
    ultimoEvento: null,
    get atraso() {
      var hoje = new Date();
      var dataConsiderada = this[ this.campoDataConsiderada ];
      return hoje.getTime()/864e5 - (dataConsiderada.getTime()/864e5 + this.prazoCorregedoria);
    },
    get atrasoPorcentagem() {
      return this.atraso / this.prazoCorregedoria;
    },
    get competenciaCorregedoria() {
      if (this.competencia >= 9 && this.competencia <= 20) {
        return CompetenciasCorregedoria.JUIZADO;
      } else if (this.competencia >= 21 && this.competencia <= 30) {
        return CompetenciasCorregedoria.CRIMINAL;
      } else if ((this.competencia === 41 || this.competencia === 43) &&
                 (this.classe === 99 || this.classe === 60)) {
        return CompetenciasCorregedoria.EXECUCAO_FISCAL;
      } else {
        return CompetenciasCorregedoria.CIVEL;
      }
    },
    get campoDataConsiderada() {
      switch (this.situacao) {
        case 'MOVIMENTO-AGUARDA DESPACHO':
        case 'MOVIMENTO-AGUARDA SENTENÇA':
          return 'dataSituacao';
          break;

        case 'MOVIMENTO':
          return 'dataUltimoEvento';
          break;

        default:
          return 'dataSituacao';
          break;
      }
    },
    get prazoCorregedoria() {
      var situacao = Situacoes[this.situacao] || Situacoes['INDEFINIDA'];
      var dias = RegrasCorregedoria[this.competenciaCorregedoria][ situacao ];
      if (this.prioridade) dias /= 2;
      return dias;
    },
    get prioridade() {
      return this.dadosComplementares.has('Prioridade Atendimento') ||
        this.dadosComplementares.has('Réu Preso') ||
        this.dadosComplementares.has('Doença Grave') ||
        this.dadosComplementares.has('Idoso');
    }
  };

  var ProcessoFactory = {
    fromLinha(linha) {
      var processo = new Processo();
      processo.linha = linha;
      processo.numClasse = Number(linha.dataset.classe);
      processo.numCompetencia = Number(linha.dataset.competencia);
      var link = processo.link = linha.cells[1].querySelector('a');
      var numprocFormatado = processo.numprocFormatado = link.textContent;
      processo.numproc = numprocFormatado.replace(/[-.]/g, '');
      var links = linha.cells[1].getElementsByTagName('a');
      if (links.length === 2) {
        var onmouseover = [...links[1].attributes].filter((attr) => attr.name === 'onmouseover')[0].value;
        var [,codigoLembrete] = onmouseover.match(/^return infraTooltipMostrar\('([^']+)','Lembretes',400\);$/);
        var div = document.createElement('div');
        div.innerHTML = codigoLembrete;
        var linhas = [...div.childNodes[0].rows].reverse();
        processo.lembretes = linhas.map((linha) => linha.cells[2].textContent);
      }
      var textoSigilo = linha.cells[1].getElementsByTagName('br')[0].nextSibling.textContent;
      processo.sigilo = Number(textoSigilo.match(/Nível ([0-5])/)[1]);
      processo.situacao = linha.cells[2].textContent;
      processo.juizo = linha.cells[3].textContent;
      processo.dataAutuacao = parseDataHora(linha.cells[4].textContent);
      var diasNaSituacao = Number(linha.cells[5].textContent);
      var dataHoje = new Date();
      var dataAnteriorSituacao = new Date(dataHoje.getFullYear(), dataHoje.getMonth(), dataHoje.getDate() - diasNaSituacao - 1, 23, 59, 59, 999);
      processo.dataSituacao = new Date(dataAnteriorSituacao.getTime() + 1);
      var labelsDadosComplementares = [...linha.cells[6].getElementsByTagName('label')];
      if (labelsDadosComplementares.length === 0) {
        processo.classe = linha.cells[6].textContent;
      } else {
        processo.classe = linha.cells[6].firstChild.textContent;
        labelsDadosComplementares.forEach((label) => processo.dadosComplementares.add(label.textContent));
      }
      processo.localizadores = LocalizadoresProcessoFactory.fromCelula(linha.cells[7]);
      var breakUltimoEvento = linha.cells[8].querySelector('br');
      processo.dataUltimoEvento = parseDataHora(breakUltimoEvento.previousSibling.textContent);
      processo.ultimoEvento = breakUltimoEvento.nextSibling.textContent;
      processo.dataInclusaoLocalizador = parseDataHora(linha.cells[9].textContent);
      var textoPrioridade = linha.cells[10].textContent;
      if (textoPrioridade === 'Sim') {
        processo.dadosComplementares.add('Prioridade Atendimento');
      }
      return processo;
    }
  };
  return ProcessoFactory;
})();

var RegrasCorregedoria = {
  [CompetenciasCorregedoria.JUIZADO]: {
    [Situacoes['INICIAL']]: 10,
    [Situacoes['MOVIMENTO-AGUARDA DESPACHO']]: 15,
    [Situacoes['MOVIMENTO']]: 10,
    [Situacoes['MOVIMENTO-AGUARDA SENTENÇA']]: 45,
    [Situacoes['INDEFINIDA']]: 30
  },
  [CompetenciasCorregedoria.CIVEL]: {
    [Situacoes['INICIAL']]: 10,
    [Situacoes['MOVIMENTO-AGUARDA DESPACHO']]: 20,
    [Situacoes['MOVIMENTO']]: 15,
    [Situacoes['MOVIMENTO-AGUARDA SENTENÇA']]: 60,
    [Situacoes['INDEFINIDA']]: 60
  },
  [CompetenciasCorregedoria.CRIMINAL]: {
    [Situacoes['INICIAL']]: 15,
    [Situacoes['MOVIMENTO-AGUARDA DESPACHO']]: 20,
    [Situacoes['MOVIMENTO']]: 15,
    [Situacoes['MOVIMENTO-AGUARDA SENTENÇA']]: 60,
    [Situacoes['INDEFINIDA']]: 30
  },
  [CompetenciasCorregedoria.EXECUCAO_FISCAL]: {
    [Situacoes['INICIAL']]: 10,
    [Situacoes['MOVIMENTO-AGUARDA DESPACHO']]: 60,
    [Situacoes['MOVIMENTO']]: 25,
    [Situacoes['MOVIMENTO-AGUARDA SENTENÇA']]: 60,
    [Situacoes['INDEFINIDA']]: 120
  }
};

function adicionarBotaoComVinculo(localizadores) {
  var gui = GUI.getInstance();
  var botao = gui.criarBotaoAcao();
  botao.addEventListener('click', function() {

    gui.removerBotaoAcao();

    gui.avisoCarregando.atualizar(0, localizadores.quantidadeProcessos);

    localizadores.obterProcessos().then(function() {
      gui.avisoCarregando.ocultar();
      localizadores.forEach(function(localizador) {
        gui.atualizarVisualizacao(localizador);
      });
    });
  }, false);
}

if (/\?acao=usuario_tipo_monitoramento_localizador_listar\&/.test(location.search)) {
  var tabela = document.getElementById('divInfraAreaTabela').querySelector('table');
  var localizadores = LocalizadoresFactory.fromTabela(tabela);
  adicionarBotaoComVinculo(localizadores);
} else if (/\?acao=localizador_processos_lista\&/.test(location.search)) {
} else if (/\&acao_origem=principal\&/.test(location.search)) {
  var tabela = document.getElementById('fldLocalizadores').querySelector('table');
  var localizadores = LocalizadoresFactory.fromTabelaPainel(tabela);
  adicionarBotaoComVinculo(localizadores);
}

function definirPropriedades(target, ...sources) {
  sources.forEach(source => {
    Object.defineProperties(target, Object.getOwnPropertyNames(source).reduce((descriptors, key) => {
      descriptors[key] = Object.getOwnPropertyDescriptor(source, key);
      return descriptors;
    }, {}));
  });
  return target;
}

function parseCookies(texto) {
  var pares = texto.split(/\s*;\s*/);
  return parsePares(pares);
}

function parseDataHora(texto) {
  let [d,m,y,h,i,s] = texto.split(/\W/g);
  return new Date(y, m - 1, d, h, i, s);
}

function parsePares(pares) {
  var obj = {};
  pares.forEach(function(par) {
    var partes = par.split('=');
    var nome = decodeURIComponent(partes.splice(0, 1));
    var valor = decodeURIComponent(partes.join('='));
    obj[nome] = valor;
  });
  return obj;
}
