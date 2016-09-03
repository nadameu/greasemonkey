// ==UserScript==
// @name        Relatório semanal SIAPRO
// @namespace   http://nadameu.com.br/relatorio-semanal
// @include     http://sap.trf4.gov.br/estatistica/controlador.php?menu=8&submenu=3*
// @version     11
// @grant       none
// ==/UserScript==

const COMPETENCIAS_CORREGEDORIA = {
  CIVEL: 0,
  CRIMINAL: 1,
  EF: 2,
  JEF: 3
};

function parseData(texto) {
  var [d,m,y] = texto.split('/');
  var data = new Date(y, m - 1, d - 1, 23, 59, 59, 999);
  return new Date(data.getTime() + 1);
}

var Aviso = (function() {
  var carregando = false;
  var progresso, saida;
  function Aviso() {
    if (! carregando) throw new Error('Esta classe deve ser instanciada utilizando o método estático getInstance()!');
  }
  Aviso.prototype = {
    constructor: Aviso,
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
        '<center style="font-weight: bold;">',
        'Buscando dados de processos...<br/>',
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
  };
  Aviso.getInstance = function() {
    carregando = true;
    var instance = new Aviso();
    carregando = false;
    Aviso.getInstance = () => instance;
    return instance;
  };

  return Aviso;
})();

var DB = {
  abrir() {
    return new Promise(function(resolve, reject) {
      var req = window.indexedDB.open('relatorioSemanal', 2);
      req.addEventListener('success', function(evt) {
        var db = evt.target.result;
        resolve(db);
      });
      req.addEventListener('error', function(evt) {
        reject(evt.target.error);
      });
      req.addEventListener('upgradeneeded', function(evt) {
        var db = evt.target.result;

        switch (evt.oldVersion) {

          case 0:
            var processos = db.createObjectStore('processos', {keyPath: 'numproc'});
            processos.createIndex('classe', 'classe', {unique: false});
            processos.createIndex('situacao', 'situacao', {unique: false});
            processos.createIndex('localizador', 'localizador', {unique: false});
            processos.createIndex('competencia', 'competencia', {unique: false});

            var classes = db.createObjectStore('classes', {keyPath: 'codigo'});

            var competencias = db.createObjectStore('competencias', {keyPath: 'codigo'});

            var gruposCompetencia = db.createObjectStore('gruposCompetencia', {autoIncrement: true});
            // break intencionalmente omitido

          case 1:
            var setores = db.createObjectStore('setores', {autoIncrement: true});

            var localizadorSetor = db.createObjectStore('localizadorSetor', {keyPath: 'localizador'});
            localizadorSetor.createIndex('setor', 'setor', {unique: false});
            // break intencionalmente omitido

        }
      });
    });
  },
  adicionarItems(nomeOS, items, db = null) {
    var promise = DB.verificarDB(db);
    return promise.then(DB.executarTransacao.bind(null, nomeOS, items.map((item) => (objectStore) => objectStore.add(item))));
  },
  limparObjectStore(nomeOS, db = null) {
    var promise = DB.verificarDB(db);
    return promise.then(DB.executarTransacao.bind(null, nomeOS, (objectStore) => objectStore.clear()));
  },
  obterTodos(nomeOS, db = null) {
    var promise = DB.verificarDB(db);
    return promise.then(function(db) {
      return new Promise(function(resolve, reject) {
        var objectStore = db.transaction([nomeOS]).objectStore(nomeOS);
        var collection = [];
        objectStore.openCursor().addEventListener('success', function(evt) {
          var cursor = evt.target.result;
          if (cursor) {
            collection.push(cursor.value);
            cursor.continue();
          } else {
            resolve(collection);
          }
        }, false);
      });
    });
  },
  obterTodosPorIndice(nomeOS, indice, db = null) {
    var promise = DB.verificarDB(db);
    return promise.then(function(db) {
      return new Promise(function(resolve, reject) {
        var objectStore = db.transaction([nomeOS]).objectStore(nomeOS);
        var index = objectStore.index(indice);
        var collection = [];
        index.openCursor(null, 'nextunique').addEventListener('success', function(evt) {
          var cursor = evt.target.result;
          if (cursor) {
            collection.push(cursor.value[indice]);
            cursor.continue();
          } else {
            resolve(collection);
          }
        }, false);
      });
    });
  },
  redefinirObjectStore(nomeOS, items, db = null) {
    var promise = DB.verificarDB(db);
    promise = promise.then(DB.limparObjectStore.bind(null, nomeOS));
    promise = promise.then(DB.adicionarItems.bind(null, nomeOS, items));
    return promise;
  },
  executarTransacao(nomeOS, fn, db = null) {
    var promise = DB.verificarDB(db);
    return promise.then(function(db) {
      return new Promise(function(resolve, reject) {
        var objectStore = db.transaction([nomeOS], 'readwrite').objectStore(nomeOS);
        if (! (fn instanceof Array)) {
          fn = [fn];
        }
        var transacoesPendentes = 0;
        fn.forEach(function(fnItem) {
          var req = fnItem(objectStore);
          transacoesPendentes++;
          req.addEventListener('success', function() { transacoesPendentes--; });
        });
        objectStore.transaction.addEventListener('complete', function() {
          if (transacoesPendentes === 0) {
            resolve(db);
          } else {
            var err = new Error('Há ' + transacoesPendentes + ' transações pendentes.', nomeOS);
            reject(err);
            throw err;
          }
        });
        objectStore.transaction.addEventListener('abort', console.debug.bind(console, 'aborted', nomeOS));
        objectStore.transaction.addEventListener('error', reject);
      });
    });
  },
  verificarDB(db = null) {
    var promise;
    if (db === null) {
      promise = DB.abrir();
    } else {
      promise = Promise.resolve(db);
    }
    return promise;
  }
};

var GUI = (function() {
  var carregando = false;
  var divBotoes, numBotoes = 0;
  var elementos = new WeakMap();

  function Botao(texto) {
    var botao = document.createElement('button');
    botao.textContent = texto;
    elementos.set(this, botao);
  }
  Botao.prototype = {
    constructor: Botao,
    adicionarEvento(fn) {
      return elementos.get(this).addEventListener('click', fn, false);
    },
    remover() {
      divBotoes.removeChild(elementos.get(this));
    }
  };

  function GUI() {
    if (! carregando) throw new Error('Esta classe deve ser instanciada utilizando o método estático getInstance()!');
    divBotoes = document.createElement('div');
    var areaTelaD = document.getElementById('divInfraAreaTelaD');
    areaTelaD.insertBefore(divBotoes, areaTelaD.firstChild);
  }
  GUI.prototype = {
    constructor: GUI,
    criarBotao(texto) {
      var botao = new Botao(texto);
      numBotoes++;
      if (numBotoes > 1) {
        divBotoes.appendChild(document.createTextNode(' '));
      }
      divBotoes.appendChild(elementos.get(botao));
      return botao;
    }
  };
  GUI.getInstance = function() {
    carregando = true;
    var instance = new GUI();
    carregando = false;
    GUI.getInstance = () => instance;
    return instance;
  };
  return GUI;
})();

function LinkDados() {}
LinkDados.prototype = {
  constructor: LinkDados,
  url: null,
  abrirPagina(competencia, situacao) {
    if (! this.url) return Promise.resolve([]);
    const situacoesValidas = {
      'desp': 'MOVIMENTO-AGUARDA DESPACHO',
      'sent': 'MOVIMENTO-AGUARDA SENTENÇA',
      'tramita': 'MOVIMENTO'
    };
    var self = this;
    return new Promise(function(resolve, reject) {
      var xml = new XMLHttpRequest();
      xml.open('GET', self.url);
      xml.onload = resolve;
      xml.onerror = reject;
      xml.send(null);
    }).then(function(evt) {
      var xml = evt.target;
      var html = xml.responseText;
      var parser = new DOMParser();
      var doc = parser.parseFromString(html, 'text/html');
      var tabela = doc.getElementById('tblSubResConsulta');
      var linhas = [...tabela.tBodies[0].rows].filter((linha) => /^infraTr(?:Clara|Escura)$/.test(linha.className));
      var processos = linhas.map(ProcessoFactory.fromLinha.bind(null, competencia)).filter((processo) => processo.situacao === situacoesValidas[situacao]);
      return processos;
    });
  }
};

var LinkDadosFactory = {
  fromCelula(celula) {
    var linkDados = new LinkDados();
    var link = celula.querySelector('a');
    if (link) {
      var onclick = link.getAttribute('onclick');
      var parametros = [];
      var re = /'([^']*)'/g, match;
      while (match = re.exec(onclick)) {
        parametros.push(match[1]);
      }
      var [hash, numcol, fonte, orgao, valorcoluna, demais, menuOrigem] = parametros;
      linkDados.url = 'controlador.php?menu='+menuOrigem+'&submenu=3&acao=gerar_subrelatorio&hashconf='+hash+'&num_col='+numcol+'&fonte='+fonte+demais+'&orgao='+orgao+'&valorcoluna='+valorcoluna+'&selProcessoSemMovimentacao=&selProcessoRemanescentes=';
    }
    return linkDados;
  }
};

function Processo() {}
Processo.prototype = {
  constructor: Processo,
  autuacao: null,
  classe: null,
  competencia: null,
  dataEstatistica: null,
  dataUltimaFase: null,
  descricaoCompetencia: null,
  localizador: null,
  magistrado: null,
  numproc: null,
  numprocFormatado: null,
  orgao: null,
  situacao: null,
  get competenciaCorregedoria() {
    if (this.competencia >= '09' && this.competencia <= '20') {
      return COMPETENCIAS_CORREGEDORIA.JEF;
    } else if (this.competencia >= '21' && this.competencia <= '30') {
      return COMPETENCIAS_CORREGEDORIA.CRIMINAL;
    } else if ((this.competencia === '41' || this.competencia === '43') &&
               (this.classe === 'EXECUÇÃO FISCAL' ||
                this.classe === 'CARTA DE ORDEM' ||
                this.classe === 'CARTA PRECATÓRIA' ||
                this.classe === 'CARTA ROGATÓRIA')) {
      return COMPETENCIAS_CORREGEDORIA.EF;
    } else {
      return COMPETENCIAS_CORREGEDORIA.CIVEL;
    }
  }
};

var ProcessoFactory = {
  fromLinha(competencia, linha) {
    var processo = new Processo();
    var numprocFormatado = processo.numprocFormatado = linha.cells[0].querySelector('a').textContent;
    processo.numproc = numprocFormatado.replace(/[.-]/g, '');
    processo.autuacao = parseData(linha.cells[1].textContent);
    [,,'classe','situacao','orgao','localizador','magistrado'].forEach(function(campo, indiceCelula) {
      processo[campo] = linha.cells[indiceCelula].textContent;
    });
    processo.dataEstatistica = parseData(linha.cells[7].textContent);
    processo.dataUltimaFase = parseData(linha.cells[8].textContent);
    processo.competencia = competencia.codigo;
    processo.descricaoCompetencia = competencia.descricao;
    return processo;
  },
  fromRegistroDB(registroDB) {
    var processo = new Processo();
    for (let campo in registroDB) {
      processo[campo] = registroDB[campo];
    }
    return processo;
  }
};

function XLS() {}
XLS.prototype = {
  constructor: XLS,
  tabela: null,
  download(nomeArquivo = 'processos.xls') {
    var blob = new Blob([
      '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40"><head>',
      '<meta http-equiv="Content-Type" content="text/html; charset=UTF-8"/>',
      '<style>td { white-space: nowrap; }</style>',
      '<!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>processos</x:Name><x:WorksheetOptions><x:ProtectContents>False</x:ProtectContents></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->',
      '</head><body>',
      this.tabela.outerHTML,
      '</body></html>'
    ], {type: 'application/vnd.ms-excel'});
    var url = URL.createObjectURL(blob);
    var link = document.createElement('a');
    link.href = url;
    link.textContent = 'download';
    link.download = nomeArquivo;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },
  exibir() {
    var blob = new Blob([
      '<html><head>',
      '<meta http-equiv="Content-Type" content="text/html; charset=UTF-8"/>',
      '<style>',
      [
        'table { border-collapse: collapse; font-family: Helvetica, sans-serif; font-size: 10pt; }',
        'td { white-space: nowrap; border: 1px solid black; }'
      ].join('\n'),
      '</style>',
      '</head><body>',
      this.tabela.outerHTML,
      '</body></html>'
    ], {type: 'text/html'});
    var url = URL.createObjectURL(blob);
    window.open(url, 'resultado');
  }
};

var XLSFactory = {
  fromProcessos(processos) {
    const campos = {
      'numprocFormatado': 'Processo',
      'autuacao': 'Data autuação',
      'descricaoCompetencia': 'Competência',
      'classe': 'Classe',
      'competenciaCorregedoria': 'Competência Corregedoria',
      'situacao': 'Situação',
      'localizador': 'Localizador',
      'dataEstatistica': 'Data Estat.',
      'dataUltimaFase': 'Data Últ. Fase'
    };
    var xls = new XLS();
    var table = xls.tabela = document.createElement('table');
    var tRow = table.createTHead().insertRow();
    Object.getOwnPropertyNames(campos).forEach((campo) => tRow.insertCell().innerHTML = '<strong>' + campos[campo] + '</strong>');
    var tBody = table.createTBody();
    processos.forEach(function(processo) {
      var row = tBody.insertRow();
      Object.getOwnPropertyNames(campos).forEach(function(campo, indiceCampo) {
        var celula = row.insertCell();
        if (campo === 'numprocFormatado' ||
            campo === 'descricaoCompetencia' ||
            campo === 'classe' ||
            campo === 'situacao' ||
            campo === 'localizador') {
          celula.textContent = processo[campo];
          celula.setAttribute('x:str', processo[campo]);
        } else if (campo === 'autuacao' ||
                   campo === 'dataEstatistica' ||
                   campo === 'dataUltimaFase') {
          celula.textContent = processo[campo].toLocaleFormat('%Y-%m-%d');
        } else if (campo === 'competenciaCorregedoria') {
          celula.textContent = [
            'Cível',
            'Criminal',
            'Execução Fiscal',
            'Juizado'
          ][ processo[campo] ];
        } else {
          celula.textContent = processo[campo];
        }
      });
    });
    return xls;
  }
};

var passo = sessionStorage.passo;
console.info(passo);
switch (passo) {
  case 'obterDadosMesAnterior':
    var inicio = document.getElementById('selMesAnoIni');
    var fim = document.getElementById('selMesAnoFim');
    var mesAnterior = inicio.getElementsByTagName('option')[1];
    inicio.value = mesAnterior.value;
    inicio.onchange();
    fim.value = mesAnterior.value;
    fim.onchange();
    // break intencionalmente omitido

  case 'obterDados':
    document.getElementById('rdoDadosS').checked = true;
    document.getElementById('rdoDadosEv1').checked = false;
    document.getElementById('rdoDadosEv2').checked = true;
    var estatistica = document.getElementById('selEstatistica');
    estatistica.value = ' 23';
    estatistica.onchange();
    document.getElementById('chkNaoAgrupaSubSecao').checked = true;
    document.getElementById('chkAgrupaClasse').checked = true;

    var form = document.forms[0];
    var data = new FormData(form);
    data.append('acao', 'gerar_relatorio');
    var promise = new Promise(function(resolve, reject) {
      window.infraExibirAviso(false, 'Buscando dados de classes processuais...');
      var xml = new XMLHttpRequest();
      xml.open(form.method, form.action);
      xml.addEventListener('load', function(evt) {
        window.infraOcultarAviso();
        var xml = evt.target;
        var html = xml.responseText;
        var parser = new DOMParser();
        var doc = parser.parseFromString(html, 'text/html');
        resolve(doc);
      }, false);
      xml.addEventListener('error', reject, false);
      xml.send(data);
    });

    promise = promise.then(function(doc) {
      window.infraExibirAviso(false, 'Salvando dados de classes processuais...');
      var tabela = doc.getElementById('tblResConsulta');
      if (! tabela) {
        window.infraOcultarAviso();
        if (sessionStorage.passo === 'obterDados') {
          window.infraExibirAviso(false, 'Não foi possível obter os dados, tentando mês anterior...');
          sessionStorage.passo = 'obterDadosMesAnterior';
          location.href = '?menu=8&submenu=3';
          return Promise.reject('Tentando mês anterior');
        } else {
          window.alert('Não foi possível obter os dados do relatório.\n\nTente gerar um relatório manualmente para verificar eventuais mensagens de erro.');
          return Promise.reject('Relatório não obtido.');
        }
      }
      console.info('Tabela existe.');
      var linhas = [...tabela.tBodies[0].querySelectorAll('tr.TrSubniveis.TrSubniveis2')];
      console.info('Cheguei aqui');
      var classes = linhas.reduce(function(map, linha) {
        var codigoNome = linha.cells[0].textContent.trim().split(' - ');
        var codigo = Number(codigoNome.splice(0, 1));
        var nome = codigoNome.join(' - ');
        if (nome === 'CLASSE NÃO CADASTRADO') {
          console.info('classe não cadastrada', codigo);
          return map;
        } else {
          return map.set(codigo, nome);
        }
      }, new Map());
      var itensClasse = [...classes].map(function([codigo, nome]) {
        return {codigo: codigo, nome: nome};
      });
      console.info('shit')
      return DB.redefinirObjectStore('classes', itensClasse);
    });

    promise = promise.then(function() {
      window.infraOcultarAviso();
      document.getElementById('chkAgrupaClasse').checked = false;
      document.getElementById('chkAgrupaCompetencia').checked = true;

      var form = document.forms[0];
      var data = new FormData(form);
      data.append('acao', 'gerar_relatorio');
      return new Promise(function(resolve, reject) {
        window.infraExibirAviso(false, 'Buscando dados de competências...');
        var xml = new XMLHttpRequest();
        xml.open(form.method, form.action);
        xml.addEventListener('load', function(evt) {
          window.infraOcultarAviso();
          var xml = evt.target;
          var html = xml.responseText;
          var parser = new DOMParser();
          var doc = parser.parseFromString(html, 'text/html');
          resolve(doc);
        }, false);
        xml.addEventListener('error', reject, false);
        xml.send(data);
      });
    });

    promise = promise.then(function(doc) {
      window.infraExibirAviso(false, 'Salvando dados de competências...');
      var tabela = doc.getElementById('tblResConsulta');
      var linhas = [...tabela.tBodies[0].querySelectorAll('tr.TrSubniveis.TrSubniveis2')];
      var competencias = linhas.reduce(function(map, linha) {
        var codigoNome = linha.cells[0].textContent.trim().split(' - ');
        var codigo = Number(codigoNome.splice(0, 1));
        var nome = codigoNome.join(' - ');
        return map.set(codigo, nome);
      }, new Map());

      var itensCompetencia = [...competencias].map(function([codigo, nome]) {
        return {codigo: codigo, nome: nome};
      });
      return DB.redefinirObjectStore('competencias', itensCompetencia).then(function() {
        window.infraOcultarAviso();
        return [tabela, linhas];
      });
    });

    promise = promise.then(function([tabela, linhas]) {
      var linhaTotal = tabela.tBodies[0].lastElementChild;
      var numProcessos = [4,5,6].reduce(function(soma, indiceCelula) {
        return soma + Number(linhaTotal.cells[indiceCelula].textContent);
      }, 0);
      var aviso = Aviso.getInstance();
      aviso.atualizar(0, numProcessos);

      var promises = [];

      promises.push(DB.limparObjectStore('processos').then(function(db) {
        var promisesProcessos = [];
        linhas.forEach(function(linha) {
          var codigoDescricao = linha.cells[0].textContent.trim().split(' - ');
          var codigo = Number(codigoDescricao.splice(0, 1));
          var descricao = codigoDescricao.join(' - ');
          for (let linhaDados = linha.nextElementSibling; /^infraTr(?:Clara|Escura)$/.test(linhaDados.className); linhaDados = linhaDados.nextElementSibling) {
            [,,,,'desp','sent','tramita'].forEach(function(situacao, indiceCelula) {
              var celula = linhaDados.cells[indiceCelula];
              var numProcessosCelula = Number(celula.textContent);
              var link = LinkDadosFactory.fromCelula(celula);
              promisesProcessos.push(link.abrirPagina({codigo: codigo, descricao: descricao}, situacao).then(function(processos) {
                aviso.acrescentar(numProcessosCelula);
                return DB.adicionarItems('processos', processos);
              }));
            });
          }
        });
        return Promise.all(promisesProcessos);
      }));

      return Promise.all(promises).catch(function(evt) {
        console.error(evt.target.error);
      }).then(function() {
        var aviso = Aviso.getInstance();
        aviso.ocultar();
        delete sessionStorage.passo;
      });
    });
    // break intencionalmente omitido

  default:
    console.info('início');
    criarBotaoObterDados();
    criarBotaoExcel();
    criarBotaoHTML();
    criarBotaoLocalizadoresSituacoes();
    criarBotaoLocalizadorSetor();
    criarBotaoSetores();
    break;
}

function criarBotaoObterDados() {
  var gui = GUI.getInstance();
  var botaoDados = gui.criarBotao('Obter dados atualizados dos processos');
  botaoDados.adicionarEvento(function() {
    window.infraExibirAviso(false, 'Preparando o formulário...');
    sessionStorage.passo = 'obterDados';
    location.href = '?menu=8&submenu=3';
  });
}

function criarBotaoExcel() {
  var gui = GUI.getInstance();
  var botaoExcel = gui.criarBotao('Gerar planilha Excel');
  botaoExcel.adicionarEvento(function() {
    window.infraExibirAviso(false, 'Gerando arquivo...');
    DB.obterTodos('processos').then(function(processos) {
      processos = processos.map((processo) => ProcessoFactory.fromRegistroDB(processo));
      window.infraOcultarAviso();
      var xls = XLSFactory.fromProcessos(processos);
      xls.download();
    });
  });
}

function criarBotaoHTML() {
  var gui = GUI.getInstance();
  var botaoHTML = gui.criarBotao('Gerar página com resultados');
  botaoHTML.adicionarEvento(function() {
    window.infraExibirAviso(false, 'Gerando arquivo...');
    DB.obterTodos('processos').then(function(processos) {
      processos = processos.map((processo) => ProcessoFactory.fromRegistroDB(processo));
      window.infraOcultarAviso();
      var xls = XLSFactory.fromProcessos(processos);
      xls.exibir();
    });
  });
}

function criarBotaoAbrirJanela(id, titulo, fn) {
  var gui = GUI.getInstance();
  var botao = gui.criarBotao(titulo);
  botao.adicionarEvento(abrirJanela.bind(null, id, titulo, fn));
}

function abrirJanela(id, titulo, fn) {
  var blob = new Blob([
    '<!doctype html>',
    '<html><head>',
    '<meta charset="utf-8">',
    '<title>' + titulo + '</title>',
    '</head><body>',
    '<script>',
    'window.opener.postMessage("' + id + '", "http://sap.trf4.gov.br/");',
    '</script>',
    '</body></html>'
  ], {mimeType: 'text/html'});
  var url = URL.createObjectURL(blob);
  var analisarMensagem = (function(id) {
    return function(evt) {
      if (evt.data === id) {
        window.removeEventListener('message', analisarMensagem, false);
        var win = evt.source, doc = win.document;
        fn(win, doc);
      }
    };
  })(id);
  window.addEventListener('message', analisarMensagem, false);
  window.infraAbrirJanela(url, '_blank', Math.floor(screen.availWidth * .75), Math.floor(screen.availHeight * .75), 'scrollbars=yes');
}

function criarBotaoLocalizadorSetor() {
  return criarBotaoAbrirJanela('localizadorSetor', 'Localizador/Setor', function(win, doc) {
    doc.body.innerHTML = [
      '<h1>Localizador/Setor</h1>',
      '<table border="1" cellspacing="0" cellpadding="2" style="border-collapse: collapse;">',
      '<thead>',
      '<tr><th>Localizador</th><th>Setor</th></tr>',
      '</thead>',
      '<tbody>',
      '</tbody>',
      '</table>'
    ].join('');
    DB.obterTodosPorIndice('processos', 'localizador').then(function(localizadores) {
      var tabela = doc.getElementsByTagName('table')[0];
      localizadores.forEach(function(localizador) {
        var linha = tabela.insertRow();
        linha.insertCell().textContent = localizador;
      });
    });
  });
}

function criarBotaoLocalizadoresSituacoes() {
  return criarBotaoAbrirJanela('localizadoresSituacoes', 'Localizadores/Situações', function(win, doc) {
    doc.body.innerHTML = [
      '<h1>Localizadores/Situações</h1>',
      '<table border="1" cellspacing="0" cellpadding="2" style="border-collapse: collapse;">',
      '<thead>',
      '<tr><th rowspan="2">Localizador</th><th colspan="3">Situação</th></tr>',
      '<tr><th>MOVIMENTO</th><th>AG. DESPACHO</th><th>AG. SENTENÇA</th></tr>',
      '</thead>',
      '<tbody>',
      '</tbody>',
      '</table>'
    ].join('');

    DB.obterTodos('processos').then(function(processos) {
      var localizadores = new Map();
      processos = processos.map((processo) => ProcessoFactory.fromRegistroDB(processo));
      processos.forEach(function(processo) {
        var nomeLocalizador = processo.localizador;
        if (! localizadores.has(nomeLocalizador)) {
          localizadores.set(nomeLocalizador, {
            nome: nomeLocalizador,
            processos: []
          });
        }
        var localizador = localizadores.get(nomeLocalizador);
        localizador.processos.push(processo);
      });
      localizadores = [...localizadores.values()];
      localizadores.sort((a, b) => b.processos.length - a.processos.length);
      return localizadores;
    }).then(function(localizadores) {
      var tabela = doc.getElementsByTagName('table')[0];
      var situacoes = ['MOVIMENTO', 'MOVIMENTO-AGUARDA DESPACHO', 'MOVIMENTO-AGUARDA SENTENÇA'];
      localizadores.forEach(function({nome: nome, processos: processos}) {
        var linha = tabela.insertRow();
        linha.insertCell().textContent = nome;
        situacoes.forEach(function(situacao) {
          linha.insertCell().textContent = processos.filter((processo) => processo.situacao === situacao).length;
        });
      });
    });
  });
}

function criarBotaoSetores() {
  return criarBotaoAbrirJanela('setores', 'Setores', function(win, doc) {
    doc.body.innerHTML = [
      '<h1>Localizadores/Situações</h1>',
      '<table border="1" cellspacing="0" cellpadding="2" style="border-collapse: collapse;">',
      '<thead>',
      '<tr><th>Setor</th></tr>',
      '</thead>',
      '<tbody>',
      '</tbody>',
      '</table>'
    ].join('');

    DB.obterTodos('setores').then(function(setores) {
      setores.forEach(function(setor) {
        var linha = tabela.insertRow();
        linha.insertCell().textContent = setor.nome;
      });
    });
  });
}
