// ==UserScript==
// @name        Sequência de localizadores
// @namespace   http://nadameu.com.br/seq_localiza
// @include     /^https:\/\/eproc\.(jf(pr|rs|sc)|trf4)\.jus\.br\/eproc(V2|2trf4)\/controlador\.php\?acao=processo_localizador_historico_listar\&/
// @version     3
// @grant       none
// ==/UserScript==

var $ = window.jQuery;

$('head').append($('<style type="text/css"></style>').html([
  '.extraLocalizador { display: inline-block; padding: 2px; background-color: #ddd; border: 1px solid; border-radius: 5px; }',
  '.extraLocalizadorPrincipal { font-weight: bold; }',
  '.extraLocalizadorSecundario { }',
  '.extraLocalizadorIncluido { color: #006; }',
  '.extraLocalizadorExcluido { opacity: 0.5; text-decoration: line-through; }',
  '.extraLocalizadorInvertido { color: #040; }'
].join(' ')));

var Eventos = function() {
  this.orgaos = [];
};
Eventos.prototype = Object.create(Array.prototype);
Eventos.prototype.constructor = Eventos;
Eventos.prototype.orgaos = null;
Eventos.prototype.incluir = function(data, usuario, orgao, localizador) {
  this.registrar('incluir', data, usuario, orgao, localizador);
};
Eventos.prototype.excluir = function(data, usuario, orgao, localizador) {
  this.registrar('excluir', data, usuario, orgao, localizador);
};
Eventos.prototype.registrar = function(operacao, data, usuario, orgao, localizador) {
  if (this.orgaos.indexOf(orgao) === -1) {
    this.orgaos.push(orgao);
  }
  let filtrados = this.filter(function(evento) {
    return evento.data.toISOString() === data.toISOString() && evento.usuario === usuario;
  });
  let evento;
  if (filtrados.length === 0) {
    evento = new Evento(data, usuario);
    this.push(evento);
    this.ordenarPorData();
  } else  if (filtrados.length === 1) {
    evento = filtrados[0];
  } else {
    throw new Error('Busca retornou mais de um evento com data: ' + data + ' e usuário: ' + usuario);
  }
  return evento[operacao](orgao, localizador);
};
Eventos.prototype.ordenarPorData = function() {
  this.sort(function(a, b) {
    return a.data.valueOf() - b.data.valueOf();
  });
};

var Evento = function(data, usuario) {
  this.data = data;
  this.usuario = usuario;
  this.mudancas = {};
};
Evento.prototype = {
  data: null,
  mudancas: null,
  usuario: '',
  getMudancasOrgao: function(orgao) {
    if (! (orgao in this.mudancas)) {
      this.mudancas[orgao] = {incluir:[], excluir:[], inverter: []};
    }
    return this.mudancas[orgao];
  },
  incluir: function(orgao, localizador) {
    this.getMudancasOrgao(orgao).incluir.push(localizador);
  },
  excluir: function(orgao, localizador) {
    this.getMudancasOrgao(orgao).excluir.push(localizador);
  }
};
var Tabela = function(orgaos) {
  let tabela = document.createElement('table');
  tabela.className = 'infraTable';
  let caption = document.createElement('caption');
  caption.className = 'infraCaption';
  caption.innerHTML = [
    '',
    '<span class="extraLocalizador extraLocalizadorPrincipal">Localizador principal</span> / <span class="extraLocalizador extraLocalizadorPrincipal extraLocalizadorIncluido">Principal incluído</span> / <span class="extraLocalizador extraLocalizadorPrincipal extraLocalizadorExcluido">Principal excluído</span> / <span class="extraLocalizador extraLocalizadorPrincipal extraLocalizadorInvertido">Tornou-se principal</span>',
    '<span class="extraLocalizador extraLocalizadorSecundario">Localizador secundário</span> / <span class="extraLocalizador extraLocalizadorSecundario extraLocalizadorIncluido">Secundário incluído</span> / <span class="extraLocalizador extraLocalizadorSecundario extraLocalizadorExcluido">Secundário excluído</span> / <span class="extraLocalizador extraLocalizadorSecundario extraLocalizadorInvertido">Tornou-se secundário</span>',
    '<br/>'
  ].join('<br/>');
  tabela.appendChild(caption);
  let thead = tabela.createTHead();
  let primeiraLinha = thead.insertRow();
  ['Data', 'Usuário'].concat(orgaos).forEach(function(coluna) {
    let th = document.createElement('th');
    th.className = 'infraTh';
    th.textContent = coluna;
    primeiraLinha.appendChild(th);
  });
  let tbody = tabela.createTBody();
  let paridade = 0;
  this.inserirLinha = function(evento) {
    let linha = tbody.insertRow(0);
    linha.className = (++paridade % 2) ? 'infraTrClara' : 'infraTrEscura';
    let celulaData = linha.insertCell(0);
    celulaData.textContent = evento.data.toLocaleString();
    let celulaUsuario = linha.insertCell(1);
    celulaUsuario.textContent = evento.usuario;
    orgaos.forEach(function(orgao) {
      let celulaOrgao = linha.insertCell();
      if (! (orgao in evento.mudancas)) {
        return;
      }
      let itens = [];
      ['pri', 'sec', 'ter'].forEach(function(tipo) {
        ['Exc', ''].forEach(function(tipoAdicional) {
          evento.atuais[orgao][tipo + tipoAdicional].forEach(function(localizador) {
            let item = {
              nome: localizador,
              classes: ['extraLocalizador'],
              tipo: tipo,
              tipoAdicional: tipoAdicional
            };
            let classeTipo;
            switch (tipo) {
              case 'pri':
                classeTipo = 'extraLocalizadorPrincipal';
                break;
                
              case 'sec':
              case 'ter':
                classeTipo = 'extraLocalizadorSecundario';
                break;
            }
            item.classes.push(classeTipo);
            if (tipoAdicional === 'Exc') {
              item.classes.push('extraLocalizadorExcluido');
            }
            ['incluir', 'inverter'].forEach(function(operacao) {
              if (evento.mudancas[orgao][operacao].indexOf(localizador) !== -1) {
                let classe;
                switch (operacao) {
                  case 'incluir':
                    classe = 'extraLocalizadorIncluido';
                    break;
                    
                  case 'inverter':
                    if (tipo !== 'ter') {
                      classe = 'extraLocalizadorInvertido';
                    }
                    break;
                }
                if (typeof classe !== 'undefined') {
                  item.classes.push(classe);
                }
              }
            });
            itens.push(item);
          });
        });
      });
      itens.sort(function(a, b) {
        if (a.tipoAdicional === 'Exc' && b.tipoAdicional === '') {
          return -1;
        } else if (a.tipoAdicional === '' && b.tipoAdicional === 'Exc') {
          return +1;
        }
        
        if (a.tipo === 'Pri' && b.tipo !== 'Pri') {
          return -1;
        } else if (a.tipo !== 'Pri' && b.tipo === 'Pri') {
          return +1;
        }
        
        return a.nome < b.nome ? -1 : +1;
      });
      let codigoHTMLItens = [];
      itens.forEach(function(item) {
        codigoHTMLItens.push('<span class="' + item.classes.join(' ') + '">' + item.nome + '</span>');
      });
      celulaOrgao.innerHTML = codigoHTMLItens.join(', ');
    });
  };
  this.replace = function(tabelaASubstituir) {
    return tabelaASubstituir.replaceWith(tabela);
  }
};

var eventos = new Eventos();

var linhas = $('table[summary="Histórico de Localizadores"] tr');

for (let i = linhas.length - 1, linha; i >= 1 && typeof (linha = linhas[i]) !== 'undefined'; i--) {
  let orgao = linha.cells[0].textContent;
  let localizador = linha.cells[1].textContent;
  let usuarioInclusao = linha.cells[2].textContent;
  let dataInclusao = parseDate(linha.cells[3].textContent);
  eventos.incluir(dataInclusao, usuarioInclusao, orgao, localizador);
  let ativo = linha.cells[4].textContent === 'Sim';
  let usuarioDesativacao, dataDesativacao;
  if (! ativo) {
    usuarioDesativacao = linha.cells[5].textContent;
    dataDesativacao = parseDate(linha.cells[6].textContent);
    eventos.excluir(dataDesativacao, usuarioDesativacao, orgao, localizador);
  }
}
var orgaos = eventos.orgaos;
var tabela = new Tabela(orgaos);
eventos.forEach(function(evento, i) {
  if (i > 0) {
    evento.atuais = $.extend(true, {}, eventos[i - 1].atuais);
  } else {
    evento.atuais = {};
  }
  eventos.orgaos.forEach(function(orgao) {
    if (i === 0) {
      evento.atuais[orgao] = {
        pri: [],
        sec: [],
        ter: []
      };
    }
    evento.atuais[orgao].priExc = [];
    evento.atuais[orgao].secExc = [];
    evento.atuais[orgao].terExc = [];
  });
  for (let orgao in evento.mudancas) {
    let atuais = evento.atuais[orgao];
    let mudancas = evento.mudancas[orgao];
    let itens = [];
    if (mudancas.incluir.length > 0 && mudancas.excluir.length > 0) {
      for (let indexExcluir = mudancas.excluir.length - 1, localizador; indexExcluir >= 0 && typeof (localizador = mudancas.excluir[indexExcluir]) !== 'undefined'; indexExcluir--) {
        let haDuplicados = false;
        let somenteLocalizadorIgual = function(mudanca) { return mudanca === localizador; };
        while(mudancas.incluir.filter(somenteLocalizadorIgual).length > 1 || mudancas.excluir.filter(somenteLocalizadorIgual).length > 1) {
          mudancas.incluir.splice(mudancas.incluir.indexOf(localizador), 1);
          mudancas.excluir.splice(mudancas.excluir.indexOf(localizador), 1);
          haDuplicados = true;
        }
        if (haDuplicados) {
          continue;
        }
        let indexIncluir = mudancas.incluir.indexOf(localizador);
        if (indexIncluir !== -1) {
          mudancas.incluir.splice(indexIncluir, 1);
          mudancas.excluir.splice(indexExcluir, 1);
          mudancas.inverter.push(localizador);
        }
      }
    }
    mudancas.inverter.forEach(function(localizador) {
      let newKey;
      ['pri', 'sec', 'ter'].forEach(function(key) {
        let index = atuais[key].indexOf(localizador);
        if (index !== -1) {
          atuais[key].splice(index, 1);
          if (key === 'pri') {
            newKey = 'sec';
          } else if (key === 'sec') {
            newKey = 'pri';
          } else if (key === 'ter') {
            newKey = 'ter';
          }
        }
      });
      if (typeof newKey !== 'undefined') {
        atuais[newKey].push(localizador);
      }
    });
    if (atuais.pri.length + atuais.sec.length + atuais.ter.length - mudancas.excluir.length === 0) {
      atuais.priExc = atuais.pri;
      atuais.secExc = atuais.sec;
      atuais.terExc = atuais.ter;
      if (mudancas.incluir.length === 1) {
        atuais.pri = mudancas.incluir;
        atuais.sec = [];
        atuais.ter = [];
      } else {
        atuais.pri = [];
        atuais.sec = [];
        atuais.ter = mudancas.incluir;
      }
    } else {
      mudancas.excluir.forEach(function(localizador) {
        ['pri', 'sec', 'ter'].forEach(function(key) {
          let index = atuais[key].indexOf(localizador), newKey;
          if (index !== -1) {
            atuais[key].splice(index, 1);
            newKey = key + 'Exc';
            atuais[newKey].push(localizador);
          }
        });
      });
      mudancas.incluir.forEach(function(localizador) {
        if (atuais.pri.length > 0) {
          atuais.sec.push(localizador);
        } else if (atuais.ter.length === 0 && mudancas.incluir.length === 1) {
          atuais.pri.push(localizador);
        } else {
          atuais.ter.push(localizador);
        }
      });
    }
  }
  tabela.inserirLinha(evento);
});
tabela.replace($('table[summary="Histórico de Localizadores"]'));

function parseDate(texto) {
  let [d, m, y, h, i, s] = texto.split(/\W/);
  return new Date(y, m-1, d, h, i, s, 0);
}
