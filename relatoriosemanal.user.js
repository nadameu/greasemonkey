// ==UserScript==
// @name        Relatório semanal
// @namespace   http://nadameu.com.br/relatorio-semanal
// @include     /^https:\/\/eproc\.(jf(pr|rs|sc)|trf4)\.jus\.br\/eproc(V2|2trf4)\/controlador\.php\?acao=relatorio_geral_listar\&/
// @include     /^https:\/\/eproc\.(jf(pr|rs|sc)|trf4)\.jus\.br\/eproc(V2|2trf4)\/controlador\.php\?acao=relatorio_geral_consultar\&/
// @version     5
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

        let processos = db.createObjectStore('processos', {keyPath: 'numproc'});
        processos.createIndex('classe', 'classe', {unique: false});
        processos.createIndex('situacao', 'situacao', {unique: false});
        processos.createIndex('data', 'data', {unique: false});
        processos.createIndex('localizador', 'localizador', {unique: false, multiEntry: true});

        let localizadores = db.createObjectStore('localizadores', {keyPath: 'localizador'});
        
        let situacoes = db.createObjectStore('situacoes', {keyPath: 'situacao'});
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
      5: false,
      999: false
    }
  };
}

var [ , acao ] = window.location.search.match(/\^?acao=([^&]+)&/);

if (acao === 'relatorio_geral_listar') {

  let sigilo = $('#selIdSigilo');
  sigilo.append('<option value="5">Nível 5</option>');  

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

    let consultar = document.getElementById('btnConsultar');
    consultar.click();
  };

  let buttons = [2, 3, 4, 5, 999]
  .filter(nivel => !dados.sigilo[nivel])
  .map(nivel => {
    let button = $(`<button>Nível ${nivel}</button>`);
    button.on('click', consultarNivel.bind(null, nivel));
    return button;
  });

  let area = $('#divInfraAreaTelaD');

  area.prepend($('<button id="gerarArquivoSituacoes">Gerar arquivo situações</button>'));
  $('#gerarArquivoSituacoes').on('click', function(evt) {
    evt.preventDefault();

    DB.abrir().then(db => {
      let objectStore = db.transaction(['processos']).objectStore('processos');
      let index = objectStore.index('localizador');

      index.openKeyCursor(null, 'nextunique').onsuccess = function(evt) {
        let cursor = evt.target.result;
        if (cursor) {
          console.info(cursor.key);
          cursor.continue();
        }
      };
    }).catch(err => console.log(err));
  });

  area.prepend($('<button id="gerarArquivo">Gerar arquivo</button>'));
  $('#gerarArquivo').on('click', function(evt) {
    evt.preventDefault();

    DB.abrir().then(db => {
      let objectStore = db.transaction(['processos']).objectStore('processos');
      let campos = ['processo','competenciaCorregedoria',,'classe','localizador','situacao','autuacao','dataEstatistica','data',,,,,,,'setor',,], processos = [];

      objectStore.openCursor().onsuccess = function(evt) {
        let cursor = evt.target.result;
        let i = 0;
        if (cursor) {
          let processo = [];
          campos.forEach(function(campo, indiceCampo) {
            if (campo === 'localizador') {
              processo[indiceCampo] = cursor.value[campo][0];
            } else if (campo === 'data' || campo === 'autuacao' || campo === 'dataEstatistica') {
              processo[indiceCampo] = cursor.value[campo].toLocaleFormat('%Y-%m-%d %H:%M:%S');
            } else {
              processo[indiceCampo] = cursor.value[campo];
            }
          });
          processos.push(processo);
          i++;
          if (cursor.value.localizador.length > 1) {
            for (let l = 1, locs = cursor.value.localizador.length; l < locs; l++) {
              processo.localizador = cursor.value.localizador[l];
              processos.push(processo);
              i++;
            }
          }
          cursor.continue();
        } else {
          let table = document.createElement('table');
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
          let tRow = table.createTHead().insertRow();
          campos = ['Processo', 'Competência Corregedoria', 'Competência', 'Classe', 'Localizador', 'Situação', 'Data autuação', 'Data Estat.', 'Data Últ. Fase', 'Regra', 'Campo a considerar', 'Data considerada', 'Motivo', 'Esperado', 'Dias', 'Setor', 'Atraso', 'Incluir?'];
          for (let i = 0; i < campos.length; i++) tRow.insertCell();
          campos.forEach((campo, i) => tRow.cells[i].innerHTML = '<strong>' + campo + '</strong>');
          let tBody = table.createTBody();
          processos.forEach((processo, r) => {
            let row = tBody.insertRow();
            for (let i = 0; i < campos.length; i++) row.insertCell();
            processo.forEach((campo, i) => {
              row.cells[i].textContent = campo;
              if (i === 0) row.cells[i].setAttribute('x:str', campo);
            });
          });
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
    .catch(console.error)
    .then(function() {
      localStorage.removeItem('relatorioSemanal');
      location.reload();
    });
  });


} else if (acao === 'relatorio_geral_consultar') {

  let tabela = $('#tabelaLocalizadores');
  let campos = [,'processo','autuacao','dias','situacao','sigilo','classe','localizador',,'data'];
  let processos = [], localizadores = new Set(), situacoes = new Set();
  tabela.each(function() {
    $(this).find('tr.infraTrClara, tr.infraTrEscura').each(function() {
      let processo = Object.create(null);
      campos.forEach(function(campo, i) {
        let valor = this.cells[i].textContent;
        switch (campo) {
          case 'processo':
            processo.numproc = valor.replace(/[-.]/g, '');
            processo.setor = '???';
            let classe = Number(this.dataset.classe);
            let competencia = Number(this.dataset.competencia);
            if (competencia >= 9 && competencia <= 20) {
              processo.competenciaCorregedoria = 'Juizado';
            } else if (competencia >= 21 && competencia <= 30) {
              processo.competenciaCorregedoria = 'Criminal';
            } else if ((competencia === 41 || competencia === 43) &&
                       (classe === 99 || classe === 60)) {
              processo.competenciaCorregedoria = 'Execução Fiscal';
            } else {
              processo.competenciaCorregedoria = 'Cível';
            }
            break;

          case 'dias':
            valor = Number(valor);
            var agora = new Date();
            var hoje = new Date((new Date(agora.getFullYear(), agora.getMonth(), agora.getDate() - 1, 23, 59, 59, 999).getTime() + 1));
            processo.dataEstatistica = new Date(hoje.setDate(hoje.getDate() - valor));
            break;

          case 'autuacao':
          case 'data':
            let [d,m,y,h,i,s] = valor.split(/[\/ :]/g);
            valor = new Date(y, m - 1, d, h, i, s);
            break;

          case 'localizador':
            valor = valor.substr(2);
            valor = valor.split(' • ');
            valor = valor.map(loc => loc.replace(/ \(Princ.\)$/, ''));
            valor.forEach(loc => localizadores.add(loc));
            break;

          case 'situacao':
            situacoes.add(valor);
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
          os.add(processo);
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
  }).catch(err => console.error(err));
}

localStorage.setItem('relatorioSemanal', JSON.stringify(dados));
