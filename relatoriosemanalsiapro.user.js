// ==UserScript==
// @name        Relatório semanal SIAPRO
// @namespace   http://nadameu.com.br/relatorio-semanal
// @include     http://sap.trf4.gov.br/estatistica/controlador.php*
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

var Classes = new Map();

var ClassesPorNome = new Map();

var Competencias = new Map();

var DB = {
  abrir() {
    return new Promise(function(resolve, reject) {
      var req = window.indexedDB.open('relatorioSemanal');
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
            processos.createIndex('classe', 'classe');
            processos.createIndex('situacao', 'situacao');
            processos.createIndex('localizador', 'localizador');
            processos.createIndex('competencia', 'competencia');
            processos.createIndex('juizo', 'juizo');
            processos.createIndex('jloc', ['juizo', 'localizador', 'competencia', 'classe']);

            var classes = db.createObjectStore('classes', {keyPath: 'codigo'});

            var competencias = db.createObjectStore('competencias', {keyPath: 'codigo'});

            var setores = db.createObjectStore('setores', {keyPath: 'id', autoIncrement: true});
            setores.createIndex('nome', 'nome', {unique: true});

            var jlocs = db.createObjectStore('jlocs', {keyPath: 'id', autoIncrement: true});
            jlocs.createIndex('jloc', ['juizo', 'localizador', 'competencia', 'classe'], {unique: true});
            jlocs.createIndex('localizador', 'localizador');
            // break intencionalmente omitido
        }
      });
    });
  },
  adicionarItem(nomeOS, item, key, db = null) {
    var promise = DB.verificarDB(db);
    return promise.then(function(db) {
      return new Promise(function(resolve, reject) {
        var objectStore = db.transaction([nomeOS], 'readwrite').objectStore(nomeOS);
        var req = objectStore.add(item, key);
        req.addEventListener('success', function(evt) { key = evt.target.result; }, false);
        objectStore.transaction.addEventListener('complete', function() {
          resolve(key);
        }, false);
        objectStore.transaction.addEventListener('abort', console.debug.bind(console, 'aborted', nomeOS));
        objectStore.transaction.addEventListener('error', reject);
      });
    });
  },
  adicionarItens(nomeOS, items, db = null) {
    var promise = DB.verificarDB(db);
    return promise.then(DB.executarTransacao.bind(null, nomeOS, items.map((item) => (objectStore) => objectStore.add(item))));
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
  limparObjectStore(nomeOS, db = null) {
    var promise = DB.verificarDB(db);
    return promise.then(DB.executarTransacao.bind(null, nomeOS, (objectStore) => objectStore.clear()));
  },
  obter(nomeOS, range, db = null) {
    var promise = DB.verificarDB(db);
    return promise.then(function(db) {
      return new Promise(function(resolve, reject) {
        var objectStore = db.transaction([nomeOS]).objectStore(nomeOS);
        var collection = [];
        objectStore.openCursor(range).addEventListener('success', function(evt) {
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
  obterPorIndice(nomeOS, indice, range, db = null) {
    var promise = DB.verificarDB(db);
    return promise.then(function(db) {
      return new Promise(function(resolve, reject) {
        var objectStore = db.transaction([nomeOS]).objectStore(nomeOS);
        var index = objectStore.index(indice);
        var collection = [];
        index.openCursor(range).addEventListener('success', function(evt) {
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
  obterTodosOrdenadosPorIndice(nomeOS, indice, db = null) {
    var promise = DB.verificarDB(db);
    return promise.then(function(db) {
      return new Promise(function(resolve, reject) {
        var objectStore = db.transaction([nomeOS]).objectStore(nomeOS);
        var index = objectStore.index(indice);
        var collection = [];
        index.openCursor().addEventListener('success', function(evt) {
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
  obterValoresIndice(nomeOS, indice, db = null) {
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
    promise = promise.then(DB.adicionarItens.bind(null, nomeOS, items));
    return promise;
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
  abrirPagina(juizo, competencia, situacao) {
    if (! this.url) return Promise.resolve([]);
    const situacoesValidas = {
      'desp': 'MOVIMENTO-AGUARDA DESPACHO',
      'sent': 'MOVIMENTO-AGUARDA SENTENÇA',
      'tramita': 'MOVIMENTO'
    };
    return XHR.obterDoc('GET', this.url).then(function(doc) {
      var tabela = doc.getElementById('tblSubResConsulta');
      var re = /^infraTr(?:Clara|Escura)$/;
      var linhas = [...tabela.tBodies[0].rows].filter((linha) => re.test(linha.className));
      var processos = linhas.map(ProcessoFactory.fromLinha.bind(null, juizo, competencia)).filter((processo) => processo.situacao === situacoesValidas[situacao]);
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
  descricaoClasse: null,
  descricaoCompetencia: null,
  localizador: null,
  magistrado: null,
  numproc: null,
  numprocFormatado: null,
  orgao: null,
  situacao: null,
  get competenciaCorregedoria() {
    if (this.competencia >= 9 && this.competencia <= 20) {
      return COMPETENCIAS_CORREGEDORIA.JEF;
    } else if (this.competencia >= 21 && this.competencia <= 30) {
      return COMPETENCIAS_CORREGEDORIA.CRIMINAL;
    } else if ((this.competencia === 41 || this.competencia === 43) &&
               (this.classe === 99 || this.classe === 60)) {
      return COMPETENCIAS_CORREGEDORIA.EF;
    } else {
      return COMPETENCIAS_CORREGEDORIA.CIVEL;
    }
  }
};

var ProcessoFactory = {
  fromLinha(juizo, competencia, linha) {
    var processo = new Processo();
    var numprocFormatado = processo.numprocFormatado = linha.cells[0].querySelector('a').textContent;
    processo.numproc = numprocFormatado.replace(/[.-]/g, '');
    processo.autuacao = parseData(linha.cells[1].textContent);
    processo.classe = ClassesPorNome.get(linha.cells[2].textContent) || 0;
    [,,'descricaoClasse','situacao','orgao','localizador','magistrado'].forEach(function(campo, indiceCelula) {
      processo[campo] = linha.cells[indiceCelula].textContent;
    });
    if (processo.classe === 0) console.info(processo.classe, processo.descricaoClasse);
    processo.dataEstatistica = parseData(linha.cells[7].textContent);
    processo.dataUltimaFase = parseData(linha.cells[8].textContent);
    processo.competencia = competencia;
    processo.descricaoCompetencia = Competencias.get(competencia);
    processo.juizo = juizo;
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

var XHR = {
  obterDoc(method, url, data = null) {
    return new Promise(function(resolve, reject) {
      var xml = new XMLHttpRequest();
      xml.open(method, url);
      xml.addEventListener('load', resolve, false);
      xml.addEventListener('error', reject, false);
      xml.send(data);
    }).then(function(evt) {
      var xml = evt.target;
      var html = xml.responseText;
      var parser = new DOMParser();
      var doc = parser.parseFromString(html, 'text/html');
      return doc;
    });
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
  fromProcessosSetoresJLOCS(processos, setores, jlocs) {
    const campos = {
      'numprocFormatado': 'Processo',
      'autuacao': 'Data autuação',
      'descricaoCompetencia': 'Competência',
      'descricaoClasse': 'Classe',
      'competenciaCorregedoria': 'Competência Corregedoria',
      'situacao': 'Situação',
      'localizador': 'Localizador',
      'dataEstatistica': 'Data Estat.',
      'dataUltimaFase': 'Data Últ. Fase',
      'setor': 'Setor'
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
        } else if (campo === 'setor') {
          var regrasLocalizador = jlocs.get(processo.localizador);
          if (! regrasLocalizador) {
            // Avisar o usuário sobre localizadores não cadastrados.
          } else {
            regrasLocalizador = regrasLocalizador.filter(function(regra) {
              return (regra.juizo === null || regra.juizo === processo.juizo) &&
                (regra.competencia === null || regra.competencia === processo.competencia) &&
                (regra.classe === null || regra.classe === processo.classe);
            });
            var idSetor = regrasLocalizador[0].setor;
            var setor = setores.get(idSetor).nome;
            celula.textContent = setor;
          }
        } else {
          celula.textContent = processo[campo];
        }
      });
    });
    return xls;
  }
};

var passo = sessionStorage.passo;
console.info(passo || 'inicio');
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
    window.infraExibirAviso(false, 'Buscando dados de classes processuais...');
    var promise = XHR.obterDoc(form.method, form.action, data).then(function(doc) {
      window.infraOcultarAviso();
      return doc;
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
      var linhas = [...tabela.tBodies[0].querySelectorAll('tr.TrSubniveis.TrSubniveis2')];
      linhas.forEach(function(linha) {
        var codigoNome = linha.cells[0].textContent.trim().split(' - ');
        var codigo = Number(codigoNome.splice(0, 1));
        var nome = codigoNome.join(' - ');
        if (nome === 'CLASSE NÃO CADASTRADO') {
          console.info('classe não cadastrada', codigo);
        } else {
          Classes.set(codigo, nome);
          ClassesPorNome.set(nome, codigo);
        }
      }, new Map());
      var classesItens = [...Classes].map(function([codigo, nome]) {
        return {codigo: codigo, nome: nome};
      });
      return DB.redefinirObjectStore('classes', classesItens);
    });

    promise = promise.then(function() {
      window.infraOcultarAviso();
      document.getElementById('chkAgrupaClasse').checked = false;
      document.getElementById('chkAgrupaCompetencia').checked = true;

      var form = document.forms[0];
      var data = new FormData(form);
      data.append('acao', 'gerar_relatorio');
      window.infraExibirAviso(false, 'Buscando dados de competências...');
      return XHR.obterDoc(form.method, form.action, data).then(function(doc) {
        window.infraOcultarAviso();
        return doc;
      });
    });

    promise = promise.then(function(doc) {
      window.infraExibirAviso(false, 'Salvando dados de competências...');
      var tabela = doc.getElementById('tblResConsulta');
      var linhas = [...tabela.tBodies[0].querySelectorAll('tr.TrSubniveis.TrSubniveis2')];
      Competencias = linhas.reduce(function(map, linha) {
        var codigoNome = linha.cells[0].textContent.trim().split(' - ');
        var codigo = Number(codigoNome.splice(0, 1));
        var nome = codigoNome.join(' - ');
        return map.set(codigo, nome);
      }, new Map());

      var competenciasItens = [...Competencias].map(function([codigo, nome]) {
        return {codigo: codigo, nome: nome};
      });
      return DB.redefinirObjectStore('competencias', competenciasItens).then(function() {
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
          var competencia = Number(linha.cells[0].textContent.trim().split(' - ')[0]);
          for (let linhaDados = linha.nextElementSibling; /^infraTr(?:Clara|Escura)$/.test(linhaDados.className); linhaDados = linhaDados.nextElementSibling) {
            var juizo = linhaDados.cells[0].textContent.trim().split(' - ')[0];
            [,,,,'desp','sent','tramita'].forEach(function(situacao, indiceCelula) {
              var celula = linhaDados.cells[indiceCelula];
              var numProcessosCelula = Number(celula.textContent);
              var link = LinkDadosFactory.fromCelula(celula);
              promisesProcessos.push(link.abrirPagina(juizo, competencia, situacao).then(function(processos) {
                aviso.acrescentar(numProcessosCelula);
                return DB.adicionarItens('processos', processos);
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
    criarBotaoExcluir();
    criarBotaoObterDados();
    criarBotaoSetores();
    criarBotaoLocalizadorSetor();
    criarBotaoJLOCS();
    criarBotaoLocalizadoresSituacoes();
    criarBotaoExcel();
    criarBotaoHTML();
    break;
}

function criarBotaoExcluir() {
  var gui = GUI.getInstance();
  var botaoDados = gui.criarBotao('Excluir tudo');
  botaoDados.adicionarEvento(function() {
    if (confirm('Excluir todos os dados?')) {
      window.infraExibirAviso(false, 'Excluindo dados...');
      var req = indexedDB.deleteDatabase('relatorioSemanal');
      req.addEventListener('success', function() {
        window.infraOcultarAviso();
      }, false);
      req.addEventListener('error', function(evt) {
        console.error(evt);
      }, false);
    }
  });
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
      DB.obterTodos('setores').then(function(setores) {
        setores = setores.reduce((map, setor) => map.set(setor.id, setor), new Map());
        DB.obterTodos('jlocs').then(function(jlocs) {
          jlocs = jlocs.reduce(function(map, item) {
            if (! map.has(item.localizador)) {
              map.set(item.localizador, []);
            }
            map.get(item.localizador).push(item);
            return map;
          }, new Map());
          window.infraOcultarAviso();
          var xls = XLSFactory.fromProcessosSetoresJLOCS(processos, setores, jlocs);
          xls.download();
        });
      });
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
      DB.obterTodos('setores').then(function(setores) {
        setores = setores.reduce((map, setor) => map.set(setor.id, setor), new Map());
        DB.obterTodos('jlocs').then(function(jlocs) {
          jlocs = jlocs.reduce(function(map, item) {
            if (! map.has(item.localizador)) {
              map.set(item.localizador, []);
            }
            map.get(item.localizador).push(item);
            return map;
          }, new Map());
          window.infraOcultarAviso();
          var xls = XLSFactory.fromProcessosSetoresJLOCS(processos, setores, jlocs);
          xls.exibir();
        });
      });
    });
  });
}

function criarBotaoAbrirJanela(id, titulo, fn) {
  var gui = GUI.getInstance();
  var botao = gui.criarBotao(titulo);
  botao.adicionarEvento(abrirJanela.bind(null, id, titulo, fn));
  window.addEventListener('message', analisarMensagem.bind(null, id, fn), false);
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
  window.infraAbrirJanela(url, '_blank', Math.floor(screen.availWidth * .75), Math.floor(screen.availHeight * .75), 'scrollbars=yes');
}

function analisarMensagem(id, fn, evt) {
  if (evt.data === id) {
    console.info('mensagem', id);
    var win = evt.source, doc = win.document;
    fn(win, doc);
  }
}

function criarBotaoLocalizadorSetor() {
  return criarBotaoAbrirJanela('localizadorSetor', 'Localizador/Setor', function(win, doc) {
    var style = doc.createElement('style');
    style.innerHTML = [
      'body, table { font-family: Helvetica, sans-serif; font-size: 12pt; }',
      'h1 { font-size: 1.5em; line-height: 1.5em; }',
      'h2 { font-size: 1.25em; line-height: 1.5em; height: 3em; text-align: center; }',
      'h3 { font-size: 1.1em; line-height: 1.5em; }'
    ].join('\n');
    doc.getElementsByTagName('head')[0].appendChild(style);
    doc.body.innerHTML = [
      '<h1>Localizador/Setor</h1>',
      '<div>',
      '<div style="float: left; width: 25%;">',
      '<h2>Localizadores multissetoriais</h2>',
      '<select id="localizadores-0" multiple style="vertical-align: middle; height: 20em; width: 80%;"></select>',
      '<div style="display: inline-block; vertical-align: middle;">',
      '<button id="incluir-0">&larr;</button>',
      '<br/>',
      '<button id="excluir-0">&rarr;</button>',
      '</div>',
      '</div>',
      '<div style="float: left; width: 25%;">',
      '<h2>Localizadores</h2>',
      '<select id="localizadores" multiple style="height: 50em; width: 90%;"></select>',
      '</div>',
      '<div id="setores" style="float: left; width: 50%;">',
      '<h2>Setores</h2>',
      '</div>',
      '</div>'
    ].join('');

    var setores = new Map();
    var promise = DB.obterTodosOrdenadosPorIndice('setores', 'nome').then(function(setoresDB) {
      setores = setoresDB.reduce(function(map, setor) { return map.set(setor.nome, setor); }, new Map());

      var setoresDiv = doc.getElementById('setores');
      [...setores.values()].forEach(function(setor) {
        var div = doc.createElement('div');
        div.id = 'setor-' + setor.id;
        div.innerHTML = [
          '<h3>' + setor.nome + '</h3>',
          '<div style="display: inline-block; vertical-align: middle;">',
          '<button id="incluir-' + setor.id + '">&rarr;</button>',
          '<br/>',
          '<button id="excluir-' + setor.id + '">&larr;</button>',
          '</div>',
          '<select id="localizadores-' + setor.id + '" multiple style="vertical-align: middle; height: 10em; width: 90%;"></select>'
        ].join('');
        setoresDiv.appendChild(div);
        var incluir = doc.getElementById('incluir-' + setor.id);
        var excluir = doc.getElementById('excluir-' + setor.id);
        incluir.addEventListener('click', function() {
          var localizadores = doc.getElementById('localizadores').getElementsByTagName('option');
          localizadores = [...localizadores].filter((localizador) => localizador.selected);
          DB.adicionarItens('jlocs', localizadores.map(function(localizador) {
            return {juizo: null, localizador: localizador.value, competencia: null, classe: null, setor: setor.id};
          })).then(function() {
            win.location.reload();
          });
        }, false);
        excluir.addEventListener('click', function() {
          var localizadores = doc.getElementById('localizadores-' + setor.id).getElementsByTagName('option');
          localizadores = [...localizadores].filter((localizador) => localizador.selected);
          DB.executarTransacao('jlocs', localizadores.map((localizador) => (objectStore) => objectStore.delete(Number(localizador.value)))).then(function() {
            win.location.reload();
          });
        }, false);
      });
    });

    var localizadoresSetor = new Map();
    var localizadoresMultissetoriais = new Set();
    promise = promise.then(DB.obterTodosOrdenadosPorIndice.bind(null, 'jlocs', 'localizador')).then(function(jlocs) {
      jlocs.forEach(function(item) {
        var option = doc.createElement('option');
        option.value = item.id;
        option.textContent = item.localizador;
        if (item.juizo === null && item.competencia === null && item.classe === null) {
          localizadoresSetor.set(item.localizador, item.setor);
          doc.getElementById('setor-' + item.setor).querySelector('select').appendChild(option);
        } else {
          localizadoresMultissetoriais.add(item.localizador);
          doc.getElementById('setor-' + item.setor).querySelector('select').appendChild(option);
        }
      });
    });

    var localizadores;
    promise = promise.then(DB.obterValoresIndice.bind(null, 'processos', 'localizador')).then(function(localizadores) {
      var select = doc.getElementById('localizadores');
      localizadores.forEach(function(localizador) {
        var option = doc.createElement('option');
        option.value = localizador;
        option.textContent = localizador;
        if (! localizadoresSetor.has(localizador)) {
          select.appendChild(option);
        }
      });
    });
  });
}

function criarBotaoJLOCS() {
  return criarBotaoAbrirJanela('jlocs', 'Localizador/Competência/Classe/Juízo/Setor', function(win, doc) {
    var style = doc.createElement('style');
    style.innerHTML = [
      'body, table { font-family: Helvetica, sans-serif; font-size: 12pt; }',
      'h1 { font-size: 1.5em; line-height: 1.5em; }',
      'h2 { font-size: 1.25em; line-height: 1.5em; height: 3em; text-align: center; }',
      'h3 { font-size: 1.1em; line-height: 1.5em; }'
    ].join('\n');
    doc.getElementsByTagName('head')[0].appendChild(style);
    doc.body.innerHTML = [
      '<h1>Localizador/Competência/Classe/Juízo/Setor</h1>',
      '<div>',
      '<div style="float: left; width: 19%; margin-right: 1%;">',
      '<h2>Localizador</h2>',
      '<select id="localizadores" multiple style="vertical-align: middle; height: 20em; width: 100%;"></select>',
      '</div>',
      '<div style="float: left; width: 14%; margin-right: 1%;">',
      '<h2>Competência</h2>',
      '<select id="competencias" multiple style="vertical-align: middle; height: 20em; width: 100%;"></select>',
      '</div>',
      '<div style="float: left; width: 19%; margin-right: 1%;">',
      '<h2>Classe</h2>',
      '<select id="classes" multiple style="vertical-align: middle; height: 20em; width: 100%;"></select>',
      '</div>',
      '<div style="float: left; width: 9%; margin-right: 1%;">',
      '<h2>Juízo</h2>',
      '<select id="juizos" multiple style="vertical-align: middle; height: 20em; width: 100%;"></select>',
      '</div>',
      '<div style="float: left; width: 34%; margin-right: 1%;">',
      '<h2>Setor</h2>',
      '<select id="setores" multiple style="vertical-align: middle; height: 20em; width: 100%;"></select>',
      '</div>',
      '</div>'
    ].join('');

    var por = {
      juizo: new Map(),
      localizador: new Map(),
      competencia: new Map(),
      classe: new Map()
    };
    var classes, competencias, jlocz;
    var promises = [];
    promises.push(DB.obterTodos('competencias').then((competencias) => competencias.reduce((map, competencia) => map.set(competencia.codigo, competencia.nome), new Map())));
    promises.push(DB.obterTodos('classes').then((classes) => classes.reduce((map, classe) => map.set(classe.codigo, classe.nome), new Map())));
    promises.push(DB.obterTodos('jlocs'));
    Promise.all(promises).then(function([competencias, classes, jlocs]) {
      DB.abrir().then(function(db) {
        var objectStore = db.transaction(['processos']).objectStore('processos');
        var index = objectStore.index('jloc');
        jlocz = [];
        index.openCursor(null, 'nextunique').addEventListener('success', function(evt) {
          var cursor = evt.target.result;
          if (cursor) {
            jlocz.push({
              juizo: cursor.value.juizo,
              localizador: cursor.value.localizador,
              competencia: cursor.value.competencia,
              classe: cursor.value.classe
            });
            cursor.continue();
          } else {
            var localizadoresElement = doc.getElementById('localizadores');
            var localizadores = jlocz.reduce((set, obj) => set.add(obj.localizador), new Set());
            [...localizadores.values()].sort().forEach(function(localizador) {
              var option = doc.createElement('option');
              option.value = localizador;
              option.textContent = localizador;
              localizadoresElement.appendChild(option);
            });
            localizadoresElement.addEventListener('change', function() {
              var localizadoresSelecionados = [...localizadoresElement.getElementsByTagName('option')].filter((option) => option.selected).map((option) => option.value);
              if (localizadoresSelecionados.length === 0) {
                var competenciasLocalizadoresSelecionados = new Set(jlocz.map((obj) => obj.competencia));
              } else {
                var competenciasLocalizadoresSelecionados = new Set(localizadoresSelecionados.reduce((arr, localizador) => arr.concat(jlocz.filter((obj) => obj.localizador === localizador)), []).map((obj) => obj.competencia));
              }
              var competenciasElement = doc.getElementById('competencias');
              competenciasElement.innerHTML = '';
              [...competenciasLocalizadoresSelecionados.values()].sort((a,b)=>a-b).forEach(function(competencia) {
                var option = doc.createElement('option');
                var num = '' + competencia;
                while (num.length < 2) num = '0' + num;
                option.value = competencia;
                option.textContent = num + ' - ' + competencias.get(competencia);
                competenciasElement.appendChild(option);
              });
              var classesLocalizadoresSelecionados = localizadoresSelecionados.reduce(function(arr, localizador) {
                Array.prototype.push.apply(arr, por.localizador.get(localizador));
                return arr;
              }, []).reduce((set, obj) => set.add(obj.classe), new Set());
              var classesElement = doc.getElementById('classes');
              classesElement.innerHTML = '';
              [...classesLocalizadoresSelecionados.values()].sort((a,b)=>a-b).forEach(function(classe) {
                var option = doc.createElement('option');
                option.value = classe;
                var num = '' + classe;
                while (num.length < 6) num = '0' + num;
                option.textContent = num + ' - ' + classes.get(classe);
                classesElement.appendChild(option);
              });
              var juizosLocalizadoresSelecionados = localizadoresSelecionados.reduce(function(arr, localizador) {
                Array.prototype.push.apply(arr, por.localizador.get(localizador));
                return arr;
              }, []).reduce((set, obj) => set.add(obj.juizo), new Set());
              var juizosElement = doc.getElementById('juizos');
              juizosElement.innerHTML = '';
              [...juizosLocalizadoresSelecionados.values()].sort().forEach(function(juizo) {
                var option = doc.createElement('option');
                option.value = juizo;
                option.textContent = juizo;
                juizosElement.appendChild(option);
              });
            }, false);
            var competenciasElement = doc.getElementById('competencias');
            [...por.competencia.keys()].sort((a,b)=>a-b).forEach(function(competencia) {
              var option = doc.createElement('option');
              var num = '' + competencia;
              while (num.length < 2) num = '0' + num;
              option.value = competencia;
              option.textContent = num + ' - ' + competencias.get(competencia);
              competenciasElement.appendChild(option);
            });
            competenciasElement.addEventListener('change', function() {
              var localizadoresSelecionados = [...localizadoresElement.getElementsByTagName('option')].filter((option) => option.selected).map((option) => option.value);
              var competenciasSelecionadas = [...competenciasElement.getElementsByTagName('option')].filter((option) => option.selected).map((option) => option.value);
              if (competenciasSelecionadas.length === 0) {
                var classesCompetenciasSelecionadas = localizadoresSelecionados.reduce(function(arr, localizador) {
                  Array.prototype.push.apply(arr, por.localizador.get(localizador));
                  return arr;
                }, []).reduce((set, obj) => set.add(obj.classe), new Set());
              } else {
                var classesCompetenciasSelecionadas = localizadoresSelecionados.reduce(function(arr, localizador) {
                  Array.prototype.push.apply(arr, por.localizador.get(localizador));
                  return arr;
                }, []).filter(function(obj) {
                  return competenciasSelecionadas.reduce(function(ret, competencia) {
                    console.info(ret, competencia, obj);
                    return ret || (obj.competencia === Number(competencia));
                  }, false);
                }).reduce((set, obj) => set.add(obj.classe), new Set());
              }
              var classesElement = doc.getElementById('classes');
              classesElement.innerHTML = '';
              [...classesCompetenciasSelecionadas.values()].sort((a,b)=>a-b).forEach(function(classe) {
                var option = doc.createElement('option');
                option.value = classe;
                var num = '' + classe;
                while (num.length < 6) num = '0' + num;
                option.textContent = num + ' - ' + classes.get(classe);
                classesElement.appendChild(option);
              });
            }, false);
            var classesElement = doc.getElementById('classes');
            [...por.classe.keys()].sort((a,b)=>a-b).forEach(function(classe) {
              var option = doc.createElement('option');
              option.value = classe;
              var num = '' + classe;
              while (num.length < 6) num = '0' + num;
              option.textContent = num + ' - ' + classes.get(classe);
              classesElement.appendChild(option);
            });
            var juizosElement = doc.getElementById('juizos');
            [...por.juizo.keys()].sort().forEach(function(juizo) {
              var option = doc.createElement('option');
              option.value = juizo;
              option.textContent = juizo;
              juizosElement.appendChild(option);
            });
          }
        })
      });
    });
/*
    var setores = new Map();
    var promise = DB.obterTodosOrdenadosPorIndice('setores', 'nome').then(function(setoresDB) {
      setores = setoresDB.reduce(function(map, setor) { return map.set(setor.nome, setor); }, new Map());

      var setoresDiv = doc.getElementById('setores');
      [...setores.values()].forEach(function(setor) {
        var div = doc.createElement('div');
        div.id = 'setor-' + setor.id;
        div.innerHTML = [
          '<h3>' + setor.nome + '</h3>',
          '<div style="display: inline-block; vertical-align: middle;">',
          '<button id="incluir-' + setor.id + '">&rarr;</button>',
          '<br/>',
          '<button id="excluir-' + setor.id + '">&larr;</button>',
          '</div>',
          '<select id="localizadores-' + setor.id + '" multiple style="vertical-align: middle; height: 10em; width: 90%;"></select>'
        ].join('');
        setoresDiv.appendChild(div);
        var incluir = doc.getElementById('incluir-' + setor.id);
        var excluir = doc.getElementById('excluir-' + setor.id);
        incluir.addEventListener('click', function() {
          var localizadores = doc.getElementById('localizadores').getElementsByTagName('option');
          localizadores = [...localizadores].filter((localizador) => localizador.selected);
          DB.adicionarItens('jlocs', localizadores.map(function(localizador) {
            return {juizo: null, localizador: localizador.value, competencia: null, classe: null, setor: setor.id};
          })).then(function() {
            win.location.reload();
          });
        }, false);
        excluir.addEventListener('click', function() {
          var localizadores = doc.getElementById('localizadores-' + setor.id).getElementsByTagName('option');
          localizadores = [...localizadores].filter((localizador) => localizador.selected);
          DB.executarTransacao('jlocs', localizadores.map((localizador) => (objectStore) => objectStore.delete(Number(localizador.value)))).then(function() {
            win.location.reload();
          });
        }, false);
      });
    });

    var localizadoresSetor = new Map();
    var localizadoresMultissetoriais = new Set();
    promise = promise.then(DB.obterTodosOrdenadosPorIndice.bind(null, 'jlocs', 'localizador')).then(function(jlocs) {
      jlocs.forEach(function(item) {
        var option = doc.createElement('option');
        option.value = item.id;
        option.textContent = item.localizador;
        if (item.juizo === null && item.competencia === null && item.classe === null) {
          localizadoresSetor.set(item.localizador, item.setor);
          doc.getElementById('setor-' + item.setor).querySelector('select').appendChild(option);
        } else {
          localizadoresMultissetoriais.add(item.localizador);
          doc.getElementById('setor-' + item.setor).querySelector('select').appendChild(option);
        }
      });
    });

    var localizadores;
    promise = promise.then(DB.obterValoresIndice.bind(null, 'processos', 'localizador')).then(function(localizadores) {
      var select = doc.getElementById('localizadores');
      localizadores.forEach(function(localizador) {
        var option = doc.createElement('option');
        option.value = localizador;
        option.textContent = localizador;
        if (! localizadoresSetor.has(localizador)) {
          select.appendChild(option);
        }
      });
    });
  */
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
      '<h1>Setores</h1>',
      '<table border="1" cellspacing="0" cellpadding="2" style="border-collapse: collapse;">',
      '<thead>',
      '<tr><th>Setor</th><th>Ações</th></tr>',
      '</thead>',
      '<tbody>',
      '</tbody>',
      '<tfoot>',
      '<tr><td><input id="novo-nome" placeholder="Novo setor" autofocus/></td><td><button id="salvar">Salvar</button><button id="cancelar">Cancelar</button></td></tr>',
      '</tfoot>',
      '</table>'
    ].join('');

    var novoSetor = doc.getElementById('novo-nome');
    var salvar = doc.getElementById('salvar');
    salvar.addEventListener('click', function(evt) {
      var nomeNovoSetor = novoSetor.value.trim();
      DB.adicionarItem('setores', {nome: nomeNovoSetor}).then(function(key) {
        win.location.reload();
      }).catch(function(evt) {
        if (evt.target.error.name === 'ConstraintError') {
          win.alert('Já existe um setor chamado "' + nomeNovoSetor + '"!');
          novoSetor.select();
          novoSetor.focus();
        } else {
          throw evt;
        }
      });
    }, false);
    var cancelar = doc.getElementById('cancelar');
    cancelar.addEventListener('click', function() { novoSetor.value = ''; }, false);

    DB.obterTodosOrdenadosPorIndice('setores', 'nome').then(function(setores) {
      setores.forEach(function(setor) {
        var tabela = doc.getElementsByTagName('table')[0];
        var linha = tabela.tBodies[0].insertRow();
        linha.insertCell().textContent = setor.nome;
        var celulaAcoes = linha.insertCell();

        var editar = doc.createElement('button');
        editar.textContent = 'Editar';
        celulaAcoes.appendChild(editar);

        var excluir = doc.createElement('button');
        excluir.textContent = 'Excluir';
        celulaAcoes.appendChild(excluir);

        var salvar = doc.createElement('button');
        salvar.textContent = 'Salvar';
        salvar.style.display = 'none';
        celulaAcoes.appendChild(salvar);

        var cancelar = doc.createElement('button');
        cancelar.textContent = 'Cancelar';
        cancelar.style.display = 'none';
        celulaAcoes.appendChild(cancelar);

        editar.addEventListener('click', function() {
          linha.cells[0].innerHTML = '<input/>';
          var novoNome = linha.cells[0].querySelector('input');
          novoNome.value = setor.nome;
          editar.style.display = 'none';
          excluir.style.display = 'none';
          salvar.style.display = '';
          cancelar.style.display = '';
        }, false);
        excluir.addEventListener('click', function() {
          if (win.confirm('Deseja excluir o setor "' + setor.nome + '"?')) {
            DB.executarTransacao('setores', (objectStore) => objectStore.delete(setor.id)).then(function() {
              win.location.reload();
            });
          }
        }, false);
        salvar.addEventListener('click', function() {
          var novoSetor = linha.cells[0].querySelector('input');
          var nomeNovoSetor = novoSetor.value.trim();
          DB.executarTransacao('setores', (objectStore) => objectStore.put({id: setor.id, nome: nomeNovoSetor})).then(function(key) {
            win.location.reload();
          }).catch(function(evt) {
            if (evt.target.error.name === 'ConstraintError') {
              win.alert('Já existe um setor chamado "' + nomeNovoSetor + '"!');
              novoSetor.select();
              novoSetor.focus();
            } else {
              throw evt;
            }
          });
        }, false);
        cancelar.addEventListener('click', function() {
          linha.cells[0].textContent = setor.nome;
          editar.style.display = '';
          excluir.style.display = '';
          salvar.style.display = 'none';
          cancelar.style.display = 'none';
        }, false);
      });
    });
  });
}
