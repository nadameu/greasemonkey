// ==UserScript==
// @name        Relatório semanal SIAPRO
// @namespace   http://nadameu.com.br/relatorio-semanal
// @include     http://sap.trf4.gov.br/estatistica/controlador.php*
// @include     https://sap.trf4.jus.br/estatistica/controlador.php*
// @version     18.0.3
// @grant       none
// ==/UserScript==

const COMPETENCIAS_CORREGEDORIA = {
  CIVEL: 0,
  CRIMINAL: 1,
  EF: 2,
  JEF: 3
};

function dateToISO(data) {
  const ano = data.getFullYear();
  let mes = pad(data.getMonth() + 1);
  let dia = pad(data.getDate());
  return `${ano}-${mes}-${dia}`;
}

function pad(num) {
  let txt = String(num);
  while (txt.length < 2) {
    txt = `0${txt}`;
  }
  return txt;
}

function parseData(texto) {
  var [d,m,y] = texto.split('/');
  var data = new Date(y, m - 1, d - 1, 23, 59, 59, 999);
  return new Date(data.getTime() + 1);
}

function juntarComE(partes) {
  if (partes.length > 1) {
    var ultimaParte = partes.pop();
    var penultimaParte = partes.pop();
    partes.push([penultimaParte, ultimaParte].join(' e '));
  }
  return partes.join(', ');
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

        if (evt.oldVersion < 1) {
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
        }

        if (evt.oldVersion < 2) {
            processos.createIndex('orgao', 'orgao');

            jlocs.createIndex('setor', 'setor');

            var grupos = db.createObjectStore('grupos', {keyPath: 'id', autoIncrement: true});
            grupos.createIndex('nome', 'nome', {unique: true});

            var comClaGru = db.createObjectStore('comClaGru', {keyPath: 'id', autoIncrement: true});
            comClaGru.createIndex('comCla', ['competencia', 'classe'], {unique: true});
            comClaGru.createIndex('grupo', 'grupo');

            var julgse = db.createObjectStore('julgse', {keyPath: 'id', autoIncrement: true});
            julgse.createIndex('julg', ['juizo', 'localizador', 'grupo'], {unique: true});
            julgse.createIndex('setor', 'setor');
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
  excluirTodosPorValorIndice(nomeOS, indice, valor, db = null) {
    var promise = DB.verificarDB(db);
    return promise.then(function(db) {
      return new Promise(function(resolve, reject) {
        var objectStore = db.transaction([nomeOS], 'readwrite').objectStore(nomeOS);
        var index = objectStore.index(indice);
        var transacoesPendentes = 0;
        index.openCursor(IDBKeyRange.only(valor)).addEventListener('success', function(evt) {
          var cursor = evt.target.result;
          if (cursor) {
            var req = cursor.delete();
            transacoesPendentes++;
            req.addEventListener('success', function() { transacoesPendentes--; }, false);
            cursor.continue();
          }
        }, false);
        objectStore.transaction.addEventListener('complete', function() {
          if (transacoesPendentes === 0) {
            resolve(db);
          } else {
            var err = new Error('Há ' + transacoesPendentes + ' transações pendentes.', nomeOS);
            reject(err);
            throw err;
          }
        });
        objectStore.transaction.addEventListener('abort', console.debug.bind(console, 'aborted (DELETE)', nomeOS));
        objectStore.transaction.addEventListener('error', reject);
      });
    });
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
            collection.push(cursor.key);
            cursor.continue();
          } else {
            var keyPath = evt.target.source.keyPath;
            if (typeof keyPath === 'object') {
              collection = collection.map((item) => keyPath.reduce((obj, campo, i) => {
                obj[campo] = item[i];
                return obj;
              }, {}));
            }
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
  substituirItem(nomeOS, item, key, db = null) {
    var promise = DB.verificarDB(db);
    return promise.then(function(db) {
      return new Promise(function(resolve, reject) {
        var objectStore = db.transaction([nomeOS], 'readwrite').objectStore(nomeOS);
        var req = objectStore.put(item, key);
        req.addEventListener('success', function(evt) { key = evt.target.result; }, false);
        objectStore.transaction.addEventListener('complete', function() {
          resolve(key);
        }, false);
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
      'competenciaCorregedoria': 'Competência Corregedoria',
      'descricaoCompetencia': 'Competência',
      'descricaoClasse': 'Classe',
      'localizador': 'Localizador',
      'situacao': 'Situação',
      'autuacao': 'Data autuação',
      'dataEstatistica': 'Data Estat.',
      'dataUltimaFase': 'Data Últ. Fase',
      'regra': 'Regra',
      'campo': 'Campo a considerar',
      'data': 'Data considerada',
      'motivo': 'Motivo',
      'esperado': 'Esperado',
      'dias': 'Dias',
      'setor': 'Setor',
      'atraso': 'Atraso',
      'incluir': 'Incluir?'
    };
    var xls = new XLS();
    var table = xls.tabela = document.createElement('table');
    table.insertAdjacentHTML('afterbegin', [
      '<col style="mso-number-format: \'@\';"/>', // Processo
      '<col width="0" style="mso-number-format: \'@\';"/>', // Competência Corregedoria
      '<col width="0" style="mso-number-format: \'@\';"/>', // Competência
      '<col style="mso-number-format: \'@\';"/>', // Classe
      '<col style="mso-number-format: \'@\';"/>', // Localizador
      '<col style="mso-number-format: \'@\';"/>', // Situação
      '<col width="0" style="mso-number-format: \'dd\\/mm\\/yyyy\';"/>', // Data autuação;
      '<col width="0" style="mso-number-format: \'dd\\/mm\\/yyyy\';"/>', // Data Estat.
      '<col width="0" style="mso-number-format: \'dd\\/mm\\/yyyy\';"/>', // Data Últ. Fase
      '<col width="0" style="mso-number-format: \'0\';"/>', // Regra
      '<col width="0" style="mso-number-format: \'@\';"/>', // Campo a considerar
      '<col style="mso-number-format: \'dd\\/mm\\/yyyy\';"/>', // Data considerada
      '<col style="mso-number-format: \'@\';"/>', // Motivo
      '<col style="mso-number-format: \'0\';"/>', // Esperado
      '<col style="mso-number-format: \'0\';"/>', // Dias
      '<col style="mso-number-format: \'@\';"/>', // Setor
      '<col style="mso-number-format: \'0.00%\';"/>', // Atraso
      '<col style="mso-number-format: \'@\';"/>' // Incluir?
    ].join(''));
    var tBody = table.createTBody();
    var primeiraLinha = tBody.insertRow();
    for (let i = 0; i < 11; i++) {
      primeiraLinha.insertCell();
    }
    var dataFinalRelatorio = primeiraLinha.insertCell();
    dataFinalRelatorio.setAttribute('x:fmla', '=TODAY() + (8 - WEEKDAY(TODAY(), 2))');
    dataFinalRelatorio.textContent = '(Somente Excel)';
    for (let i = 12; i < 18; i++) {
      primeiraLinha.insertCell();
    }
    var tRow = tBody.insertRow();
    Object.getOwnPropertyNames(campos).forEach((campo) => tRow.insertCell().innerHTML = '<strong>' + campos[campo] + '</strong>');
    processos.forEach(function(processo, indiceProcesso) {
      var row = tBody.insertRow();
      var linhaExcel = indiceProcesso + 3;
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
          celula.textContent = dateToISO(processo[campo]);
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
            window.alert('Verifique se os setores de todos os localizadores foram cadastrados.');
            throw new Error();
          } else {
            regrasLocalizador = regrasLocalizador.filter(function(regra) {
              return (regra.juizo === null || regra.juizo === processo.juizo) &&
                (regra.competencia === null || regra.competencia === processo.competencia) &&
                (regra.classe === null || regra.classe === processo.classe);
            });
            if (regrasLocalizador.length === 0) {
              window.alert('Verifique se os setores de todos os localizadores foram cadastrados.');
              throw new Error();
            }
            var idSetor = regrasLocalizador[0].setor;
            var setor = setores.get(idSetor).nome;
            celula.textContent = setor;
          }
        } else if (campo === 'regra') {
          celula.setAttribute('x:fmla', '=VLOOKUP($E' + linhaExcel + ', [regras.xls]localizador_situacao_regra!$A$2:$D$999, MATCH($F' + linhaExcel + ', [regras.xls]localizador_situacao_regra!$A$1:$D$1, 0), FALSE)');
        } else if (campo === 'campo') {
          celula.setAttribute('x:fmla', '=VLOOKUP($J' + linhaExcel + ', [regras.xls]regras_corregedoria!$A$2:$H$99, 4, FALSE)');
        } else if (campo === 'data') {
          celula.setAttribute('x:fmla', '=OFFSET($A' + linhaExcel + ', 0, MATCH($K' + linhaExcel + ', $A$2:$N$2, 0) - 1)');
        } else if (campo === 'motivo') {
          celula.setAttribute('x:fmla', '=VLOOKUP($J' + linhaExcel + ', [regras.xls]regras_corregedoria!$A$2:$H$99, 3, FALSE)');
        } else if (campo === 'esperado') {
          celula.setAttribute('x:fmla', '=VLOOKUP($J' + linhaExcel + ', [regras.xls]regras_corregedoria!$A$2:$H$99, MATCH($B' + linhaExcel + ', [regras.xls]regras_corregedoria!$A$1:$H$1, 0), FALSE)');
        } else if (campo === 'dias') {
          celula.setAttribute('x:fmla', '=$L$1 - $L' + linhaExcel);
        } else if (campo === 'atraso') {
          celula.setAttribute('x:fmla', '=$O' + linhaExcel + ' / $N' + linhaExcel + ' - 1');
        } else if (campo === 'incluir') {
          celula.setAttribute('x:fmla', '=IF($Q' + linhaExcel + ' >= VLOOKUP($P' + linhaExcel + ', [regras.xls]tolerância!$A$2:$B$9, 2, FALSE), "S", "N")');
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
    criarBotaoOrgaos();
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
        window.alert('Todos os dados foram excluídos.');
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

function criarBotaoOrgaos() {
  return criarBotaoAbrirJanela('orgaos', 'Órgãos', function(win, doc) {
    var style = doc.createElement('style');
    style.innerHTML = [
      'html, body { margin: 0; width: 100%; height: 100%; }',
      'body, table { font-family: Helvetica, sans-serif; font-size: 12pt; }',
      'h1 { margin: 0.5em 2ex; font-size: 1.25em; line-height: 1.5em; }',
      'ul { display: inline-block; margin: 0 2ex; padding: 0; min-width: 15ex; }',
      'li { list-style-type: none; border-bottom: 1px solid #ccc; }',
      'span.descricao { display: inline-block; width: -moz-calc(100% - 16px); vertical-align: middle; }',
      'span.excluir { display: inline-block; width: 16px; height: 16px; font-size: 14px; line-height: 14px; font-weight: bold; text-align: center; background: red; color: white; border-radius: 8px; cursor: default; }'
    ].join('\n');
    doc.getElementsByTagName('head')[0].appendChild(style);
    doc.body.innerHTML = [
      '<h1>Órgãos</h1>',
      '<ul id="lista"></ul>'
    ].join('');

    var lista = doc.getElementById('lista');

    DB.obterValoresIndice('processos', 'orgao').then(function(orgaos) {
      orgaos.forEach(function(orgao, indiceOrgao) {
        lista.insertAdjacentHTML('beforeend', [
          '<li>',
          '<span class="descricao">',
          orgao,
          '</span>',
          '<span id="excluir-' + indiceOrgao + '" class="excluir" title="Excluir">&Cross;</span>',
          '</li>'
        ].join(''));

        var excluirElement = doc.getElementById('excluir-' + indiceOrgao);
        excluirElement.addEventListener('click', function() {
          if (win.confirm('Deseja excluir os processos do órgão "' + orgao + '"?')) {
            DB.excluirTodosPorValorIndice('processos', 'orgao', orgao).then(() => win.location.reload());
          }
        }, false);
      });
    });
  });
}

function criarBotaoJLOCS() {
  return criarBotaoAbrirJanela('jlocs', 'Setores', function(win, doc) {
    var style = doc.createElement('style');
    style.innerHTML = [
      'html, body { margin: 0; width: 100%; height: 100%; }',
      'body, table { font-family: Helvetica, sans-serif; font-size: 12pt; }',
      'h1 { margin: 0.5em 0; font-size: 1.25em; line-height: 1.5em; text-align: center; overflow: hidden; }',
      'h2 { font-size: 1.1em; line-height: 1.5em; }',
      '.campos { position: absolute; width: 100%; height: 100%; }',
      '.campo { float: left; margin: 0 0.5%; height:100%; }',
      '.campo select { width: 100%; height: calc(100% - 7em); }',
      '.campo label { display: inline-block; line-height: 2em; height: 2em; overflow: hidden; }',
      '.campo label input { vertical-align: middle; }',
      '.setor { border-top: 1px solid black; padding-bottom: 1em; }',
      '.setor h2 { display: inline-block; width: 70%; overflow: hidden; vertical-align: middle; }',
      '.setor button { width: 15%; overflow: hidden; }',
      '.setor button.adicionar { width: 2em; height: 2em; padding: 0; line-height: 1em; vertical-align: top; }',
      '.setor ul { display: inline-block; margin: 0 0 0 0.5ex; padding: 0; width: -moz-calc(100% - 2em - 0.5ex); }',
      '.setor li { list-style-type: none; font-size: .85em; border-bottom: 1px solid #ccc; }',
      '.setor span.descricao { display: inline-block; width: -moz-calc(100% - 16px); vertical-align: middle; }',
      '.setor span.excluir { display: inline-block; width: 16px; height: 16px; font-size: 14px; line-height: 14px; font-weight: bold; text-align: center; background: red; color: white; border-radius: 8px; cursor: default; }'
    ].join('\n');
    doc.getElementsByTagName('head')[0].appendChild(style);
    doc.body.innerHTML = [
      '<div class="campos">',
      '<div class="campo" style="width: 14%;">',
      '<h1>Localizador</h1>',
      '<select id="localizadores" multiple></select>',
      '</div>',
      '<div class="campo" style="width: 14%;">',
      '<h1>Competência</h1>',
      '<select id="competencias" disabled multiple></select>',
      '<br/>',
      '<label><input id="competencias-ignorar" type="checkbox" checked/> Ignorar competência</label>',
      '</div>',
      '<div class="campo" style="width: 24%;">',
      '<h1>Classe</h1>',
      '<select id="classes" disabled multiple></select>',
      '<br/>',
      '<label><input id="classes-ignorar" type="checkbox" checked/> Ignorar classe</label>',
      '</div>',
      '<div class="campo" style="width: 9%;">',
      '<h1>Juízo</h1>',
      '<select id="juizos" disabled multiple></select>',
      '<br/>',
      '<label><input id="juizos-ignorar" type="checkbox" checked/> Ignorar juízo</label>',
      '</div>',
      '<div class="campo" style="width: 34%; overflow-y: scroll;">',
      '<h1>Setor</h1>',
      '<div id="novo-setor" class="setor">',
      '<h2>[Novo setor]</h2>',
      '<input id="novo-setor-nome" placeholder="Nome do novo setor" style="width: -moz-calc(70% - 6px); padding: 2px; border: 1px solid black;"/>',
      '<button id="novo-setor-salvar">Salvar</button>',
      '<button id="novo-setor-cancelar">Cancelar</button>',
      '</div>',
      '</div>',
      '</div>'
    ].join('');

    var competencias = DB.obterTodos('competencias').then((competencias) => new Map(competencias.map((obj) => [obj.codigo, obj.nome])));
    var classes = DB.obterTodos('classes').then((classes) => new Map(classes.map((obj) => [obj.codigo, obj.nome])));
    var jlocs = DB.obterTodos('jlocs');
    var jlocz = DB.obterValoresIndice('processos', 'jloc');
    var setores = DB.obterTodosOrdenadosPorIndice('setores', 'nome').then((setores) => new Map(setores.map((obj) => [obj.id, obj.nome])));

    Promise.all([competencias, classes, jlocs, jlocz, setores]).then(function([competencias, classes, jlocs, jlocz, setores]) {

      function adicionarOpcoes(elemento, mapa) {
        for (let [valor, descricao] of mapa) {
          var option = doc.createElement('option');
          option.value = valor;
          option.textContent = descricao;
          elemento.appendChild(option);
        }
      }

      function filtrarOpcoes(id, locSelecionados, compSelecionadas = [], classesSelecionadas = []) {
        var paraMapa;
        switch (id) {
          case 'competencias':
            paraMapa = jloczParaMapaCompetencias;
            break;

          case 'classes':
            paraMapa = jloczParaMapaClasses;
            break;

          case 'juizos':
            paraMapa = jloczParaMapaJuizos;
            break;
        }
        var opcoes = jloczSemSetor;
        if (locSelecionados.length > 0) {
          opcoes = opcoes.filter((jloc) => locSelecionados.filter((localizador) => jloc.localizador === localizador).length > 0);
        }
        if (compSelecionadas.length > 0) {
          opcoes = opcoes.filter((jloc) => compSelecionadas.filter((competencia) => jloc.competencia === competencia).length > 0);
        }
        if (classesSelecionadas.length > 0) {
          opcoes = opcoes.filter((jloc) => classesSelecionadas.filter((classe) => jloc.classe === classe).length > 0);
        }
        opcoes = paraMapa(opcoes);
        var elemento = doc.getElementById(id);
        substituirOpcoes(elemento, opcoes);
      }

      function substituirOpcoes(elemento, mapa) {
        elemento.innerHTML = '';
        adicionarOpcoes(elemento, mapa);
      }

      function jloczParaMapaClasses(arr) {
        return new Map(arr.map((obj) => Number(obj.classe)).sort((a,b)=>a-b).map((codigo) => [codigo, ('000000' + codigo).substr(-6) + ' - ' + classes.get(codigo)]));
      }

      function jloczParaMapaCompetencias(arr) {
        return new Map(arr.map((obj) => Number(obj.competencia)).sort((a,b)=>a-b).map((codigo) => [codigo, ('00' + codigo).substr(-2) + ' - ' + competencias.get(codigo)]));
      }

      function jloczParaMapaJuizos(arr) {
        return new Map(arr.map((obj) => obj.juizo).sort().map((juizo) => [juizo, juizo]));
      }

      function jloczParaMapaLocalizadores(arr) {
        return new Map(arr.map((obj) => obj.localizador).sort().map((localizador) => [localizador, localizador]));
      }

      function obterValoresSelecionados(id) {
        var select = doc.getElementById(id);
        return [...select.getElementsByTagName('option')].filter((opt) => opt.selected).map((opt) => opt.value);
      }

      function obterValoresSelecionadosOuNull(id) {
        var valores = obterValoresSelecionados(id);
        if (valores.length === 0) {
          return [null];
        } else {
          return valores;
        }
      }

      function obterValoresSelecionadosComoNumero(id) {
        return obterValoresSelecionados(id).map((text) => Number(text));
      }

      function obterValoresSelecionadosComoNumeroOuNull(id) {
        var valores = obterValoresSelecionados(id).map((text) => Number(text));
        if (valores.length === 0) {
          return [null];
        } else {
          return valores;
        }
      }

      function atualizarConformeSelecionados(id) {
        var localizadoresSelecionados = [], competenciasSelecionadas = [], classesSelecionadas = [];
        switch (id) {
          case 'classes':
            if (! doc.getElementById('classes-ignorar').checked) {
              classesSelecionadas = obterValoresSelecionadosComoNumero('classes');
            }
            // break intencionalmente omitido

          case 'competencias':
            if (! doc.getElementById('competencias-ignorar').checked) {
              competenciasSelecionadas = obterValoresSelecionadosComoNumero('competencias');
            }
            // break intencionalmente omitido

          case 'localizadores':
            localizadoresSelecionados = obterValoresSelecionados('localizadores');
            // break intencionalmente omitido
        }
        switch (id) {
          case 'localizadores':
            filtrarOpcoes('competencias', localizadoresSelecionados);
            // break intencionalmente omitido

          case 'competencias':
            filtrarOpcoes('classes', localizadoresSelecionados, competenciasSelecionadas);
            // break intencionalmente omitido

          case 'classes':
            filtrarOpcoes('juizos', localizadoresSelecionados, competenciasSelecionadas, classesSelecionadas);
            // break intencionalmente omitido
        }
      }

      function observarAlteracaoSelecao(id) {
        var fn = atualizarConformeSelecionados.bind(null, id);
        doc.getElementById(id).addEventListener('change', fn, false);
        return fn;
      }

      function observarAlteracaoIgnorar(id) {
        var checkbox = doc.getElementById(id + '-ignorar');
        var select = doc.getElementById(id);
        checkbox.addEventListener('change', function() {
          if (checkbox.checked) {
            select.disabled = true;
            [...select.getElementsByTagName('option')].forEach((opt) => opt.selected = false);
          } else {
            select.disabled = false;
          }
          atualizarConformeSelecionados(id);
        }, false);
      }

      function erroPreenchendoCampo(campo, msg) {
        win.alert(msg);
        campo.select();
        campo.focus();
      }

      var jloczSemSetor = jlocz.filter(function(jloc) {
        return jlocs.findIndex(function(item) {
          return (item.juizo === null || item.juizo === jloc.juizo) &&
            (item.localizador === null || item.localizador === jloc.localizador) &&
            (item.competencia === null || item.competencia === jloc.competencia) &&
            (item.classe === null || item.classe === jloc.classe);
        }) === -1;
      });

      var localizadoresElement = doc.getElementById('localizadores');
      var localizadores = jloczParaMapaLocalizadores(jloczSemSetor);
      adicionarOpcoes(localizadoresElement, localizadores);

      var adicionarCompetenciasClassesJuizos = observarAlteracaoSelecao('localizadores');
      adicionarCompetenciasClassesJuizos();

      observarAlteracaoSelecao('competencias');
      observarAlteracaoIgnorar('competencias');
      observarAlteracaoSelecao('classes');
      observarAlteracaoIgnorar('classes');
      observarAlteracaoIgnorar('juizos');

      var novoSetor = doc.getElementById('novo-setor');
      var novoSetorNome = doc.getElementById('novo-setor-nome');
      var novoSetorSalvar = doc.getElementById('novo-setor-salvar');
      var novoSetorCancelar = doc.getElementById('novo-setor-cancelar');

      novoSetorSalvar.addEventListener('click', function() {
        var nome = novoSetorNome.value.trim();
        if (nome === '') {
          return erroPreenchendoCampo(novoSetorNome, 'O nome não pode estar em branco!');
        }
        DB.adicionarItem('setores', {nome: nome})
        .then(() => win.location.reload())
        .catch(function(evt) {
          if (evt.target && evt.target.error.name === 'ConstraintError') {
            return erroPreenchendoCampo(novoSetorNome, 'Já existe um setor chamado "' + nome + '"!');
          } else {
            throw evt;
          }
        });
      }, false);

      novoSetorCancelar.addEventListener('click', function() {
        doc.getElementById('novo-setor-nome').value = '';
      }, false);

      [...setores].forEach(function([id, nome]) {
        var html = [
          '<div id="setor-' + id + '" class="setor">',
          '<h2 id="setor-' + id + '-titulo">' + nome + '</h2>',
          '<input id="setor-' + id + '-nome" value="' + nome + '" placeholder="Nome do setor" style="display: none; width: -moz-calc(70% - 6px); margin: 1em 0; padding: 2px; border: 1px solid #888; font-size: 1.1em; font-weight: 700;"/>',
          '<button id="setor-' + id + '-editar">Editar</button>',
          '<button id="setor-' + id + '-excluir">Excluir</button>',
          '<button id="setor-' + id + '-salvar" style="display: none;">Salvar</button>',
          '<button id="setor-' + id + '-cancelar" style="display: none;">Cancelar</button>',
          '<br/>',
          '<button id="setor-' + id + '-adicionar" class="adicionar">&rarr;</button>',
          '<ul id="setor-' + id + '-lista"></ul>',
          '</div>'
        ].join('');

        novoSetor.insertAdjacentHTML('beforebegin', html);

        var setorElement = doc.getElementById('setor-' + id);
        var tituloElement = doc.getElementById('setor-' + id + '-titulo');
        var nomeElement = doc.getElementById('setor-' + id + '-nome');
        var editarElement = doc.getElementById('setor-' + id + '-editar');
        var excluirElement = doc.getElementById('setor-' + id + '-excluir');
        var salvarElement = doc.getElementById('setor-' + id + '-salvar');
        var cancelarElement = doc.getElementById('setor-' + id + '-cancelar');
        var adicionarElement = doc.getElementById('setor-' + id + '-adicionar');
        var listaElement = doc.getElementById('setor-' + id + '-lista');

        function toggleDisplay() {
          ['titulo', 'nome', 'editar','excluir','salvar','cancelar'].forEach(function(nome) {
            var elemento = doc.getElementById('setor-' + id + '-' + nome);
            elemento.style.display = elemento.style.display ? '' : 'none';
          });
        }

        editarElement.addEventListener('click', function() {
          toggleDisplay();
          nomeElement.select();
          nomeElement.focus();
        }, false);

        excluirElement.addEventListener('click', function() {
          if (win.confirm('Deseja excluir o setor "' + nome + '"?')) {
            DB.excluirTodosPorValorIndice('jlocs', 'setor', id).then(DB.executarTransacao.bind(null, 'setores', (objectStore) => objectStore.delete(id))).then(function() {
              win.location.reload();
            });
          }
        }, false);

        salvarElement.addEventListener('click', function() {
          var nome = nomeElement.value.trim();
          if (nome === '') {
            return erroPreenchendoCampo(nomeElement, 'O nome não pode estar em branco!');
          }
          DB.substituirItem('setores', {id: id, nome: nome})
          .then(() => win.location.reload())
          .catch(function(evt) {
            if (evt.target && evt.target.error.name === 'ConstraintError') {
              return erroPreenchendoCampo(nomeElement, 'Já existe um setor chamado "' + nome + '"!');
            } else {
              throw evt;
            }
          });
        }, false);

        cancelarElement.addEventListener('click', function() {
          nomeElement.value = nome;
          toggleDisplay();
        }, false);

        adicionarElement.addEventListener('click', function() {
          var localizadoresSelecionados = obterValoresSelecionados('localizadores');
          var competenciasSelecionadas = obterValoresSelecionadosComoNumeroOuNull('competencias');
          var classesSelecionadas = obterValoresSelecionadosComoNumeroOuNull('classes');
          var juizosSelecionados = obterValoresSelecionadosOuNull('juizos');

          if (localizadoresSelecionados.length === 0) {
            return win.alert('É preciso selecionar ao menos um localizador.');
          }

          var novos = [], msgs = [];
          localizadoresSelecionados.forEach(function(localizador) {
            competenciasSelecionadas.forEach(function(competencia) {
              classesSelecionadas.forEach(function(classe) {
                juizosSelecionados.forEach(function(juizo) {
                  var novo = {
                    juizo: juizo,
                    localizador: localizador,
                    competencia: competencia,
                    classe: classe,
                    setor: id
                  };
                  var maisEspecificos = jlocs.filter((existente) => existente.localizador === novo.localizador).filter(function(existente) {
                    return ['competencia', 'classe', 'juizo'].reduce(function(ret, campo) {
                      return ret && (novo[campo] === null || (existente[campo] === null || existente[campo] === novo[campo]));
                    }, true);
                  });
                  if (maisEspecificos.length > 0) {
                    var camposNecessarios = ['competencia', 'classe', 'juizo'].filter(function(campo) {
                      return maisEspecificos.reduce(function(ret, existente) {
                        return ret && novo[campo] === null && existente[campo] !== null;
                      }, true);
                    });
                    var msg = ['Para '];
                    var selecionados = ['o localizador "' + novo.localizador + '"'];
                    if (novo.competencia) selecionados.push('a competência ' + ('00' + novo.competencia).substr(-2));
                    if (novo.classe) selecionados.push('a classe ' + ('000000' + novo.classe).substr(-6));
                    if (novo.juizo) selecionados.push('o juízo "' + novo.juizo + '"');
                    msg.push(juntarComE(selecionados));
                    msg.push(', é necessário selecionar ao menos ');
                    var necessarios = [];
                    if (camposNecessarios.indexOf('competencia') > -1) necessarios.push('uma competência');
                    if (camposNecessarios.indexOf('classe') > -1) necessarios.push('uma classe');
                    if (camposNecessarios.indexOf('juizo') > -1) necessarios.push('um juízo');
                    msg.push(juntarComE(necessarios));
                    msg.push('.');
                    msgs.push(msg.join(''));
                  } else  {
                    novos.push(novo);
                  }
                });
              });
            });
          });
          var promise = Promise.resolve();
          if (msgs.length) {
            msgs.unshift('Com base em registros preexistentes, foram encontrados os seguintes erros:', '');
            msgs.push('', 'Alternativamente, exclua os registros conflitantes.');
            win.alert(msgs.join('\n'));
          }
          if (novos.length) {
            console.info('incluir', novos);
            promise = promise.then(DB.adicionarItens.bind(null, 'jlocs', novos));
            promise = promise.then(() => win.location.reload());
          }
        }, false);

        function compare(a, b) {
          if (a.localizador < b.localizador) return -1;
          if (a.localizador > b.localizador) return +1;
          if (competencias.get(a.competencia) < competencias.get(b.competencia)) return -1;
          if (competencias.get(a.competencia) > competencias.get(b.competencia)) return +1;
          if (classes.get(a.classe) < classes.get(b.classe)) return -1;
          if (classes.get(a.classe) > classes.get(b.classe)) return +1;
          if (a.juizo < b.juizo) return -1;
          if (a.juizo > b.juizo) return +1;
          return 0;
        }

        jlocs.filter((obj) => obj.setor === id).sort(compare).forEach(function(jloc) {
          var elementos = [jloc.localizador];
          if (jloc.competencia !== null) elementos.push('<abbr title="' + competencias.get(jloc.competencia) + '">' + ('00' + jloc.competencia).substr(-2) + '</abbr>');
          if (jloc.classe !== null) elementos.push('<abbr title="' + classes.get(jloc.classe) + '">' + ('000000' + jloc.classe).substr(-6) + '</abbr>');
          if (jloc.juizo !== null) elementos.push(jloc.juizo);
          listaElement.insertAdjacentHTML('beforeend', [
            '<li id="jloc-' + jloc.id + '">',
            '<span class="descricao">',
            elementos.join(', '),
            '</span>',
            '<span id="jloc-' + jloc.id + '-excluir" class="excluir">&Cross;</span>',
            '</li>'
          ].join(''));

          var excluirElement = doc.getElementById('jloc-' + jloc.id + '-excluir');

          excluirElement.addEventListener('click', function() {
            DB.executarTransacao('jlocs', (objectStore) => objectStore.delete(jloc.id)).then(() => win.location.reload());
          }, false);
        });
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
