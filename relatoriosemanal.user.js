// ==UserScript==
// @name        Relatório semanal
// @namespace   http://nadameu.com.br/relatorio-semanal
// @include     /^https:\/\/eproc\.(jf(pr|rs|sc)|trf4)\.jus\.br\/eproc(V2|2trf4)\/controlador\.php\?acao=relatorio_geral_listar\&/
// @include     /^https:\/\/eproc\.(jf(pr|rs|sc)|trf4)\.jus\.br\/eproc(V2|2trf4)\/controlador\.php\?acao=relatorio_geral_consultar\&/
// @version     3
// @grant       none
// ==/UserScript==

var DB = {
  abrir: function() {
    return new Promise(function(resolve, reject) {
      let req = window.indexedDB.open('relatorioSemanal');
      req.onsuccess = function(evt) {
        let db = evt.target.result;
        resolve(db);
      };
      req.onerror = function(evt) {
        reject(evt.target.error);
      };
      req.onupgradeneeded = function(evt) {
        let db = evt.target.result;
        let os = db.createObjectStore('processos', {keyPath: 'numproc'});
        os.createIndex('classe', 'classe', {unique: false});
        os.createIndex('situacao', 'situacao', {unique: false});
        os.createIndex('data', 'data', {unique: false});
        os.createIndex('localizador', 'localizador', {unique: false, multiEntry: true});
        os.transaction.onerror = function(evt) {
          reject(evt.target.error);
        };
      };
    });
  }
};

var dados = JSON.parse(localStorage.getItem('relatorioSemanal'));
console.log(dados);
if (! dados) {
  dados = {
    emAndamento: false,
    sigilo: {
      2: false,
      3: false,
      4: false,
      999: false
    }
  };
}

var [ , acao ] = window.location.search.match(/\^?acao=([^&]+)&/);

if (acao === 'relatorio_geral_listar') {

  let consultarNivel = function(nivel) {
    dados.emAndamento = nivel;
    localStorage.setItem('relatorioSemanal', JSON.stringify(dados));
    let limpar = $('#btnLimparCookie');
    limpar.click();

    let sigilo = $('#selIdSigilo');
    sigilo.val(nivel);
    sigilo.trigger('change');

    $('#optNdiasSituacao').get(0).checked = true;
    $('#optPaginacao100').get(0).checked = true;
    $('#optAutoresPrincipais').get(0).checked = false;
    $('#optReusPrincipais').get(0).checked = false;

    /* TESTE COM PAGINAÇÃO */
    $('#optPaginacao100').val(8);

    let consultar = document.getElementById('btnConsultar');
    consultar.click();
  };

  let buttons = [2, 3, 4, 999]
  .filter(nivel => !dados.sigilo[nivel])
  .map(nivel => {
    let button = $(`<button>Nível ${nivel}</button>`);
    button.on('click', consultarNivel.bind(null, nivel));
    return button;
  });

  let area = $('#divInfraAreaTelaD');
  area.prepend($('<button id="gerarArquivo">Gerar arquivo</button>'));
  $('#gerarArquivo').on('click', function(evt) {
    evt.preventDefault();
    
    DB.abrir().then(db => {
      let objectStore = db.transaction(['processos']).objectStore('processos');
      let campos = [], processos = [];

      objectStore.openCursor().onsuccess = function(evt) {
        let cursor = evt.target.result;
        if (cursor) {
          let processo = [];
          let i = 0;
          for (let n in cursor.value) {
            campos[i++] = n;
            if (n === 'localizador') {
              processo.push(cursor.value[n][0]);
            } else if (n === 'data') {
              processo.push(cursor.value[n].toLocaleFormat('%Y-%m-%d %H:%M:%S'));
            } else {
              processo.push(cursor.value[n]);
            }
          }
          processos.push(processo);
          cursor.continue();
        } else {
          let table = document.createElement('table');
          let tRow = table.createTHead().insertRow();
          campos.forEach(campo => tRow.insertCell().innerHTML = '<strong>' + campo + '</strong>');
          tRow.insertCell().innerHTML = '<strong>Parado há</strong>';
          let tBody = table.createTBody();
          processos.reduce((tb, processo, r) => {
            let row = tb.insertRow();
            processo.forEach((campo, i) => {
              row.insertCell().textContent = campo;
              if (i === 0) row.cells[i].setAttribute('x:str', campo);
              if (i === processo.length - 1) {
                row.insertCell().textContent = '???';
                row.cells[i + 1].setAttribute('x:fmla', '=NOW() - H' + (r + 2));
                row.cells[i + 1].setAttribute('x:str', '????');
                row.cells[i + 1].setAttribute('style', 'mso-number-format: "0\\\\ \\0022dia(s)\\0022";');
              }
            })
            return tb;
          }, tBody);
          let blob = new Blob([
            '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40"><head>',
            '<meta http-equiv="Content-Type" content="text/html; charset=UTF-8"/>',
            '<style>td { white-space: nowrap; }</style>',
            '<!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>processos</x:Name><x:WorksheetOptions><x:ProtectContents>False</x:ProtectContents></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->',
            '</head><body>',
            table.outerHTML,
            '</body></html>'
          ], {type: 'application/vnd.ms-excel'});
          let link = URL.createObjectURL(blob);
          //link = 'data:text/csv,' + escape(text);
          console.log(link);
          let a = document.createElement('a');
          a.href = link;
          a.textContent = 'download';
          a.download = 'processos.xls';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          //URL.revokeObjectURL(link);
        }
      };
    });
  });

  area.prepend(buttons);
  
  area.prepend($('<button id="excluirDB">Excluir banco de dados</button>'));
  $('#excluirDB').on('click', function(evt) {
    evt.preventDefault();
    
    console.info('apagando...');
    new Promise(function(resolve, reject) {
      let req = indexedDB.deleteDatabase('relatorioSemanal');
      req.onsuccess = resolve;
      req.onerror = reject;
    })
    .then(evt => console.log('ok', evt))
    .catch(console.error);
  });
  

} else if (acao === 'relatorio_geral_consultar') {

  let tabela = $('#tabelaLocalizadores');
  let campos = [,'processo',,'dias','situacao','sigilo','classe','localizador',,'data'];
  let processos = [];
  tabela.each(function() {
    $(this).find('tr.infraTrClara, tr.infraTrEscura').each(function() {
      let processo = Object.create(null);
      campos.forEach(function(campo, i) {
        let valor = this.cells[i].textContent;
        switch (campo) {
          case 'processo':
            processo.numproc = valor.replace(/[-.]/g, '');
            break;
            
          case 'dias':
            valor = Number(valor);
            break;

          case 'data':
            let [d,m,y,h,i,s] = valor.split(/[\/ :]/g);
            valor = new Date(y, m - 1, d, h, i, s);
            break;

          case 'localizador':
            valor = valor.substr(2);
            valor = valor.split(' • ');
            valor = valor.map(loc => loc.replace(/ \(Princ.\)$/, ''));
            break;
        }
        processo[campo] = valor;
      }, this);
      processos.push(processo);
    });
  });

  let promise = new Promise((resolve, reject) => {
    if (processos.length) {
      DB.abrir().then(db => {
        db.onerror = reject;
        let tx = db.transaction(['processos'], 'readwrite');
        let os = tx.objectStore('processos');
        tx.oncomplete = resolve;
        processos.forEach(processo => {
          let req = os.add(processo);
        });
      }).catch(reject);
    } else {
      resolve();
    }
  });
  promise.then(x => {
    let pagina = $('#selInfraPaginacaoSuperior'), paginas = $('option', pagina);
    if (paginas.size() && pagina.val() < paginas.size()) {
      NextPagina('+');
    } else {
      dados.sigilo[dados.emAndamento] = true;
      dados.emAndamento = false;
      localStorage.setItem('relatorioSemanal', JSON.stringify(dados));
      $('#btnVoltar').click();
    }
  }).catch(evt => console.error(evt.target.error));
}

localStorage.setItem('relatorioSemanal', JSON.stringify(dados));
