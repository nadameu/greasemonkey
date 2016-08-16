// ==UserScript==
// @name        Processos prioritários
// @namespace   http://nadameu.com.br/processos-prioritarios
// @include     /^https:\/\/eproc\.(jf(pr|rs|sc)|trf4)\.jus\.br/eproc(V2|2trf4)/controlador\.php\?acao\=usuario_tipo_monitoramento_localizador_listar\&/
// @include     /^https:\/\/eproc\.(jf(pr|rs|sc)|trf4)\.jus\.br/eproc(V2|2trf4)/controlador\.php\?acao\=localizador_processos_lista\&/
// @version     1
// @grant       none
// ==/UserScript==

var PrivateVarsFactory = {
  create() {
    var _privateVars = new WeakMap();
    return function(obj) {
      if (! _privateVars.has(obj)) {
        _privateVars.set(obj, {});
      }
      return _privateVars.get(obj);
    }
  }
};

var GUI = (function() {

  var instance = null, construindo = false;
  var progresso = null, saida = null;

  function GUI() {
    if (! construindo) {
      throw new Error('Classe deve ser instanciada usando o método .getInstance().');
    }
  }
  GUI.prototype = {
    constructor: GUI,
    atualizarVisualizacao(localizador, ...prioridades) {
      var linha = localizador.accept(this).linha;
      var baloes = prioridades.map(function(prioridade, indicePrioridade) {
        return '<span class="gmProcessos gmPrioridade' + indicePrioridade + (prioridade > 0 ? '' : ' gmVazio') + '">' + prioridade + '</span>';
      });
      linha.cells[0].innerHTML = localizador.nome + '<div style="float: right;">' + baloes.join('') + '</div>';
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
        infraExibirAviso(false, [
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
        infraOcultarAviso();
        progresso = null;
        saida = null;
      }
    },
    criarBotaoAcao() {
      var area = document.getElementById('divInfraAreaTelaD');
      var button = document.createElement('button');
      button.textContent = 'Teste';
      area.insertBefore(button, area.firstChild);
      return button;
    },
    visitLocalizador(pvtVars) {
      return pvtVars;
    }
  };
  GUI.getInstance = function() {
    if (! instance) {
      construindo = true;
      instance = new GUI;
      construindo = false;
    }
    return instance;
  };
  return GUI;
})();

var LocalizadoresFactory = (function() {

  var _private = PrivateVarsFactory.create();

  function trataHTML(evt) {
    var parser = new DOMParser;
    var doc = parser.parseFromString(evt.target.response, 'text/html');
    var pagina = Number(doc.getElementById('hdnInfraPaginaAtual').value);
    console.info(this.nome, pagina);
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
      this.link.textContent = this.processos.length;
      if (this.processos.length > 0) {
        var celulaLocalizadores = _private(this.processos[0]).linha.cells[6];
        var localizadores = [...celulaLocalizadores.querySelectorAll('input[type="hidden"]')]
        .filter((localizador) => localizador.value === this.idLocalizador);
        console.info(localizadores);
      }
      return this;
    }
  };

  function Localizador() {
    this.processos = [];
  }
  Localizador.prototype = {
    constructor: Localizador,
    processos: null,
    accept(obj) {
      if (obj instanceof GUI) {
        return obj.visitLocalizador(_private(this));
      }
      return false;
    },
    get idLocalizador() {
      if (this.link.href) {
        var camposGet = parsePares(link.search.split(/^\?/)[1].split('&'));
        return camposGet.selLocalizador;
      } else {
        return null;
      }
    },
    get link() {
      return _private(this).linha.querySelector('a');
    },
    get nome() {
      return _private(this).linha.cells[0].textContent;
    },
    obterPagina(pagina, doc) {
      var link = this.link;
      var camposGet = parsePares(link.search.split(/^\?/)[1].split('&'));
      return new Promise(function(resolve, reject) {
        var url, data;
        if (pagina === 0) {
          url = link.href;
          data = new FormData();
          var camposPost = [
            'optchkcClasse',
            'optDataAutuacao',
            'optchkcUltimoEvento',
            'optNdiasSituacao',
            'optPrioridadeAtendimento',
            'chkStatusProcesso'
          ];
          camposPost.forEach((campo) => data.append(campo, 'S'));
          data.append('paginacao', '100');
        } else {
          doc.getElementById('selLocalizador').value = camposGet.selLocalizador;
          var paginaAtual = doc.getElementById('hdnInfraPaginaAtual');
          paginaAtual.value = pagina;
          var form = paginaAtual.parentElement;
          while (form.tagName.toLowerCase() !== 'form') {
            form = form.parentElement;
          }
          url = form.action;
          data = new FormData(form);
        }
        var xml = new XMLHttpRequest;
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
        return this.obterPagina(0);
      }
    },
    get sigla() {},
    get quantidadeProcessos() {
      return Number(_private(this).linha.querySelector('a').textContent);
    }
  };

  var LocalizadorFactory = {
    fromLinha(linha) {
      var localizador = new Localizador;
      _private(localizador).linha = linha;
      return localizador;
    }
  };

  function Localizadores() {
  }
  Localizadores.prototype = definirPropriedades(Object.create(Array.prototype), {
    constructor: Localizadores,
    get quantidadeProcessos() {
      var qtd = 0;
      for (let localizador of this) {
        qtd += localizador.quantidadeProcessos;
      }
      return qtd;
    }
  });

  var LocalizadoresFactory = {
    fromTabela(tabela) {
      var localizadores = new Localizadores;
      var linhas = [...tabela.querySelectorAll('tr[class^="infraTr"]')];
      linhas.forEach(function(linha) {
        localizadores.push(LocalizadorFactory.fromLinha(linha));
      });
      return localizadores;
    }
  };
  return LocalizadoresFactory;
})();

var ProcessoFactory = (function() {

  var _private = PrivateVarsFactory.create();

  function Processo() {
  }
  Processo.prototype = {
    constructor: Processo,
    get idLocalizador() {
      return _private(this).linha.dataset.idLocalizador;
    },
    get prioridade() {
      return _private(this).linha.cells[10].textContent === 'Sim';
    },
    get ultimoEvento() {
      return parseDataHora(_private(this).linha.cells[8].innerHTML);
    }
  };

  var ProcessoFactory = {
    fromLinha(linha) {
      var processo = new Processo;
      _private(processo).linha = linha;
      return processo;
    }
  };
  return ProcessoFactory;
})();

if (/\?acao=usuario_tipo_monitoramento_localizador_listar\&/.test(location.search)) {
  var gui = GUI.getInstance();
  var botao = gui.criarBotaoAcao();
  $(botao).on('click', function() {

    var tabela = document.getElementById('divInfraAreaTabela').querySelector('table');
    var localizadores = LocalizadoresFactory.fromTabela(tabela);
    gui.avisoCarregando.atualizar(0, localizadores.quantidadeProcessos);

    var promises = [];
    localizadores.forEach(function(localizador) {
      promises.push(localizador.obterProcessos());
    });
    Promise.all(promises).then(function() {
      gui.avisoCarregando.ocultar();
      var hoje = new Date();
      localizadores.forEach(function(localizador) {
        var vermelho = 0, laranja = 0, amarelo = 0, verde = 0;
        localizador.processos.forEach(function(processo) {
          var ultimoEvento = processo.ultimoEvento.getTime();
          if (processo.prioridade) {
            vermelho++;
          } else if (ultimoEvento < (hoje.getTime() - 60*864e5)) {
            laranja++;
          } else if (ultimoEvento < (hoje.getTime() - 30*864e5)) {
            amarelo++;
          } else {
            verde++;
          }
        });
        gui.atualizarVisualizacao(localizador, vermelho, laranja, amarelo, verde);
      });
    });
  });
  var estilos = $('<style></style>');
  estilos.html([
    '.gmProcessos { display: inline-block; margin: 0 2px; padding: 0 5px; font-weight: bold; border-radius: 25%; color: black; }',
    '.gmProcessos.gmPrioridade0 { background-color: #ff8a8a; }',
    '.gmProcessos.gmPrioridade1 { background-color: #f84; }',
    '.gmProcessos.gmPrioridade2 { background-color: #ff8; }',
    '.gmProcessos.gmPrioridade3 { background-color: #8aff8a; }',
    '.gmProcessos.gmVazio { opacity: 0.5; color: #888; }'
  ].join('\n'));
  $('head').append(estilos);
} else if (/\?acao=localizador_processos_lista\&/.test(location.search)) {
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
    nome = decodeURIComponent(partes.splice(0, 1));
    valor = decodeURIComponent(partes.join('='));
    obj[nome] = valor;
  });
  return obj;
}
