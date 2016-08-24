// ==UserScript==
// @name        Relatório semanal SIAPRO
// @namespace   http://nadameu.com.br/relatorio-semanal
// @include     http://sap.trf4.gov.br/estatistica/controlador.php?menu=8&submenu=3*
// @version     3
// @grant       none
// ==/UserScript==

function criarBotao(texto) {
  var botao = document.createElement('button');
  botao.textContent = texto;
  var areaTelaD = document.getElementById('divInfraAreaTelaD');
  areaTelaD.insertBefore(botao, areaTelaD.firstChild);
  return {
    adicionarEvento: botao.addEventListener.bind(botao, 'click'),
    remover() {
      areaTelaD.removeChild(botao);
    }
  };
}

function selecionarCompetencias(...competencias) {
  var options = [...document.getElementById('selCompetencia').getElementsByTagName('option')];
  options.forEach(function(option) {
    if (competencias.indexOf(option.value) > -1) {
      option.selected = true;
    } else {
      option.selected = false;
    }
  });
}

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
  }
  Aviso.getInstance = function() {
    carregando = true;
    var instance = new Aviso();
    carregando = false;
    Aviso.getInstance = () => instance;
    return instance;
  }

  return Aviso;
})();

var DB = {
  abrir() {
    return new Promise(function(resolve, reject) {
      var req = window.indexedDB.open('relatorioSemanal');
      req.onsuccess = function(evt) {
        var db = evt.target.result;
        resolve(db);
      };
      req.onerror = function(evt) {
        reject(evt.target.error);
      };
      req.onupgradeneeded = function(evt) {
        var db = evt.target.result;

        var processos = db.createObjectStore('processos', {keyPath: 'numproc'});
        processos.createIndex('classe', 'classe', {unique: false});
        processos.createIndex('situacao', 'situacao', {unique: false});
//        processos.createIndex('data', 'data', {unique: false});
        processos.createIndex('localizador', 'localizador', {unique: false});

//        let localizadores = db.createObjectStore('localizadores', {keyPath: 'localizador'});

//        let situacoes = db.createObjectStore('situacoes', {keyPath: 'situacao'});
      };
    });
  },
  apagar() {
    return new Promise(function(resolve, reject) {
      var req = window.indexedDB.deleteDatabase('relatorioSemanal');
      req.onsuccess = function(evt) {
        var res = evt.target.result;
        resolve(res);
      };
      req.onerror = function(evt) {
        reject(evt.target.error);
      };
    })
  }
};

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
    }
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
    var celula = celula.querySelector('a');
    if (celula) {
      var onclick = celula.getAttribute('onclick');
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
}

function Processo() {}
Processo.prototype = {
  constructor: Processo,
  autuacao: null,
  classe: null,
  competencia: null,
  dataEstatistica: null,
  dataUltimaFase: null,
  localizador: null,
  magistrado: null,
  numproc: null,
  numprocFormatado: null,
  orgao: null,
  situacao: null
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
    processo.competencia = competencia;
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
  }
};

var XLSFactory = {
  fromProcessos(processos) {
    const campos = {
      'numprocFormatado': 'Processo',
      'autuacao': 'Data autuação',
      'competencia': 'Competência',
      'classe': 'Classe',
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
        row.insertCell().textContent = processo[campo];
        if (campo === 'numprocFormatado' ||
            campo === 'classe' ||
            campo === 'situacao' ||
            campo === 'localizador') {
          row.cells[indiceCampo].setAttribute('x:str', processo[campo]);
        } else if (campo === 'autuacao' ||
                   campo === 'dataEstatistica' ||
                   campo === 'dataUltimaFase') {
          row.cells[indiceCampo].textContent = processo[campo].toLocaleFormat('%Y-%m-%d');
        }
      });
    });
    return xls;
  }
};

switch (sessionStorage.passo) {
  case 'setup':
    console.info('setup');
    document.getElementById('rdoDadosS').checked = true;
    document.getElementById('rdoDadosEv1').checked = false;
    document.getElementById('rdoDadosEv2').checked = true;
    var estatistica = document.getElementById('selEstatistica');
    estatistica.value = ' 23';
    estatistica.onchange();
    document.getElementById('chkNaoAgrupaSubSecao').checked = true;
    document.getElementById('chkAgrupaCompetencia').checked = true;
    //    selecionarCompetencias('41');
    sessionStorage.passo = 'analisar';
    document.getElementById('btnVisualizar').click();
    break;

  case 'analisar':
    console.info('analisar');
    var tabela = document.getElementById('tblResConsulta');
    var linhaTotal = tabela.tBodies[0].lastElementChild;
    var numProcessos = [4,5,6].reduce(function(soma, indiceCelula) {
      return soma + Number(linhaTotal.cells[indiceCelula].textContent);
    }, 0);
    var aviso = Aviso.getInstance();
    aviso.atualizar(0, numProcessos);
    var linhas = [...tabela.tBodies[0].querySelectorAll('tr.TrSubniveis.TrSubniveis2')];
    var competencias = {};
    var promises = [];
    DB.apagar().catch().then(function() {
      linhas.forEach(function(linha) {
        var codigoDescricao = linha.cells[0].textContent.trim();
        var [codigo, descricao] = codigoDescricao.split(/\s+-\s+/);
        competencias[codigo] = descricao;
        for (let linhaDados = linha.nextElementSibling; /^infraTr(?:Clara|Escura)$/.test(linhaDados.className); linhaDados = linhaDados.nextElementSibling) {
          [,,,,'desp','sent','tramita'].forEach(function(situacao, indiceCelula) {
            var celula = linhaDados.cells[indiceCelula];
            var link = LinkDadosFactory.fromCelula(celula);
            promises.push(link.abrirPagina(codigo, situacao).then(function(processos) {
              aviso.acrescentar(Number(celula.textContent));
              return DB.abrir().then(function(db) {
                var objectStore = db.transaction(['processos'], 'readwrite').objectStore('processos');
                var promises2 = [];
                processos.forEach(function(processo) {
                  promises2.push(new Promise(function(resolve, reject) {
                    var transaction = objectStore.add(processo);
                    transaction.onsuccess = resolve;
                  }));
                });
                return Promise.all(promises2);
              });
            }));
          });
        }
      });
    }).then(function() {
      console.info(competencias);
      Promise.all(promises).then(function() {
        aviso.ocultar();
        console.info('all done X!');
        DB.abrir().then(function(db) {
          return new Promise(function(resolve, reject) {
            var processos = [];
            var objectStore = db.transaction(['processos'], 'readonly').objectStore('processos');
            objectStore.openCursor().onsuccess = function(evt) {
              var cursor = evt.target.result;
              if (cursor) {
                processos.push(cursor.value);
                cursor.continue();
              } else {
                console.info('all done!');
                resolve(processos);
              }
            };
          });
        }).then(function(processos) {
          var botao = criarBotao('Fazer download da planilha Excel');
          botao.adicionarEvento(function() {
            var xls = XLSFactory.fromProcessos(processos);
            xls.download();
          });
        });
      });
    });
    delete sessionStorage.passo;
    break;

  default:
    console.info('início');
    var botao = criarBotao('Gerar relatório semanal');
    botao.adicionarEvento(function() {
      infraExibirAviso(false, 'Aguarde, preparando o formulário...');
      sessionStorage.passo = 'setup';
      location.href = '?menu=8&submenu=3';
    });
    break;
}
