// ==UserScript==
// @name        Renajud
// @namespace   http://nadameu.com.br/renajud
// @include     https://renajud.denatran.serpro.gov.br/renajud/restrito/restricoes-insercao.jsf
// @version     7
// @grant       GM_addStyle
// @grant       GM_xmlhttpRequest
// @grant       unsafeWindow
// ==/UserScript==

jQueryWait().done(function() {
  adicionarEstilos();
  criarCampoNumeroProcesso();
  insertPrivilegedCode();
});

function adicionarEstilos() {
  GM_addStyle([
    '@media print { div#alteracoesGreasemonkey, .noprint { display: none; } }',
    '@media screen { div#impressaoGreasemonkey, .noscreen { display: none; } }'
  ].join('\n'));
}

function criarCampoNumeroProcesso() {
  var painel = document.getElementById('panel-inserir-restricao');

  var div = document.createElement('div');
  div.id = 'alteracoesGreasemonkey';

  var select = document.createElement('select');
  ['PR', 'RS', 'SC'].forEach(function(estado) {
    var option = document.createElement('option');
    option.value = estado;
    option.textContent = estado;
    select.appendChild(option);
  });
  select.addEventListener('change', function(e) {
    localStorage.setItem('estado', e.target.value);
  }, false);
  select.value = localStorage.getItem('estado');
  div.appendChild(select);

  div.appendChild(document.createTextNode(' '));

  var input = document.createElement('input');
  input.placeholder = 'Número do processo';
  input.autofocus = true;
  input.addEventListener('change', function(e) {
    var numproc = e.target.value.replace(/\D/g, '');
    getInfo(numproc)
    .progress(function(msg) { input.value = msg; })
    .done(analisarRespostaNumeroProcesso);
    divInfo.textContent = '';
  }, false);
  div.appendChild(input);

  var divInfo = document.createElement('div');
  div.appendChild(divInfo);

  painel.parentNode.insertBefore(div, painel);

  var divImpressao = document.createElement('div');
  divImpressao.id = 'impressaoGreasemonkey';
  document.body.appendChild(divImpressao);

  return input;
}

function getInfo(numproc) {
  var promise = new Promise();
  var estado = getEstado();
  var options = {
    method: 'POST',
    url: 'http://www.trf4.jus.br/trf4/processos/acompanhamento/ws_consulta_processual.php',
    data: '<?xml version="1.0" encoding="UTF-8"?>' +
      '<SOAP-ENV:Envelope xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ns1="urn:consulta_processual" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:SOAP-ENC="http://schemas.xmlsoap.org/soap/encoding/" SOAP-ENV:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">' +
      '<SOAP-ENV:Body>' +
      '<ns1:ws_consulta_processo>' +
      '<num_proc xsi:type="xsd:string">' + numproc + '</num_proc>' +
      '<uf xsi:type="xsd:string">' + estado + '</uf>' +
      '<todas_fases xsi:type="xsd:string">N</todas_fases>' +
      '<todas_partes xsi:type="xsd:string">S</todas_partes>' +
      '<todos_valores>N</todos_valores>' +
      '</ns1:ws_consulta_processo>' +
      '</SOAP-ENV:Body>' +
      '</SOAP-ENV:Envelope>',
    onload: function(xhr) { promise.notify(numproc); return promise.resolve(xhr); },
    onerror: function(xhr) { promise.reject(); }
  };
  promise.notify('Buscando...');
  GM_xmlhttpRequest(options);
  return promise;
}

function getEstado() {
  var div = document.getElementById('alteracoesGreasemonkey');
  var select = div.getElementsByTagName('select')[0];
  var estado = select.value;
  return estado;
}

function analisarRespostaNumeroProcesso(xhr) {
  var parser = new DOMParser();
  var ret = parser.parseFromString(xhr.responseText, 'text/xml').querySelector('return').textContent;
  var processo = parser.parseFromString(ret, 'text/xml');
  var erros = [];
  Array.prototype.forEach.call(processo.querySelectorAll('Erro'), function(erro) {
    erros.push(erro.textContent);
  });
  if (erros.length) {
    var input = document.querySelector('#alteracoesGreasemonkey input');
    var timer = window.setTimeout(function() {
      window.clearTimeout(timer);
      window.alert(erros.join('\n'));
      input.focus();
      input.select();
    }, 100);
  } else {
    unsafeWindow.obterReusProcesso(processo);
  }
}

function jQueryWait() {
  var promise = new Promise();
  var timer;
  (function() {
    window.clearTimeout(timer);
    if (typeof unsafeWindow.jQuery === 'undefined') {
      timer = window.setTimeout(this, 100);
    } else {
      promise.resolve();
    }
  })();
  return promise;
}

function insertPrivilegedCode() {
  var script = document.createElement('script');
  script.type = 'text/javascript';
  script.innerHTML = '(' + privilegedCode.toSource() + ')();';
  document.getElementsByTagName('head')[0].appendChild(script);
}

function privilegedCode() {

  window.obterReusProcesso = function obterReusProcesso(processo) {
    var reus = [];
    Array.prototype.forEach.call(processo.querySelectorAll('Partes Parte'), function(parte) {
      if ((parte.querySelectorAll('Réu').length && parte.querySelector('Réu').textContent == 'S') || (parte.querySelectorAll('Reu').length && parte.querySelector('Reu').textContent == 'S')) {
        reus.push(parte.querySelector('CPF_CGC').textContent);
      }
    });
    limparCampos().done(function() {
      obterVeiculosReus(reus);
    });
  };

  function obterVeiculosReus(reus) {
    var veiculos = 0;
    var fila = new Fila(function() {
      if (veiculos === 0) {
        $('#alteracoesGreasemonkey div').html('Nenhum veículo encontrado.');
        return;
      }
      imprimirDetalhesVeiculos(veiculos);
    });
    reus.forEach(function(documento, i) {
      fila.push(function() {
        $('#alteracoesGreasemonkey div').html('Obtendo lista de veículos do réu...');
        obterVeiculoReu(documento)
        .done(function(totalVeiculos) {
          var qtd = totalVeiculos - veiculos;
          veiculos = totalVeiculos;
          if (qtd === 0) {
            $('#alteracoesGreasemonkey div').html('Imprimindo tela de réu sem veículos...');
            if (i < (reus.length - 1)) {
              imprimirTelaSemVeiculos().done(function() {
                fila.avancar();
              });
            } else {
              imprimirTelaSemVeiculosELimparPesquisa().done(function() {
                fila.avancar();
              });
            }
          } else {
            fila.avancar();
          }
        })
        .fail(function(msg) { alert(msg); });
      });
    });
    fila.avancar();
  }

  function imprimirTelaSemVeiculosELimparPesquisa() {
    var promise = jQuery.Deferred();
    imprimirTelaSemVeiculos();
    limparCampoPesquisa().done(function() {
      promise.resolve();
    });
    return promise;
  }

  function imprimirTela() {
    ocultarMensagemAguarde();
    window.print();
  }

  function imprimirTelaSemVeiculos() {
    var veiculos = $('[id="form-incluir-restricao:panel-lista-veiculo"]');
    veiculos.hide();
    imprimirTela();
    veiculos.show();
  }

  function ocultarMensagemAguarde() {
    blockui.blocker.hide();
    blockui.content.hide();
  }

  function obterVeiculoReu(documento) {
    var promise = window.pesquisaAtual = jQuery.Deferred();
    pesquisarDocumento(documento);
    return promise;
  }

  function imprimirDetalhesVeiculos(qtd) {
    var fila = new Fila(function() {
      $('#alteracoesGreasemonkey div').html('Imprimindo detalhes dos veículos...');
      window.setTimeout(function() {
        imprimirTela();
        $('#alteracoesGreasemonkey div').html('Concluído.');
      }, 1000);
    });
    var veiculos = new Array(qtd);
    for (var i = 0; i < qtd; ++i) {
      veiculos[i] = i;
    }
    var divImpressao = $('#impressaoGreasemonkey');
    $('#alteracoesGreasemonkey div').html('Obtendo detalhes dos veículos...');
    veiculos.forEach(function(i) {
      var prefixo = 'form-incluir-restricao:lista-veiculo:' + i;
      fila.push(function() {
        var promise = window.pesquisaAtual = jQuery.Deferred();
        $('button[id="' + prefixo + ':j_idt76"]').click();
        promise.done(function() {
          var obj = $('[id="' + prefixo + ':panel-group-dados-veiculo"]');
          obj.css({pageBreakBefore: 'always'});
          divImpressao.append(obj);
          $('button[id="' + prefixo + ':j_idt188"]').click();
          fila.avancar();
        });
      });
      fila.push(function() {
        var promise = window.pesquisaAtual = jQuery.Deferred();
        $('button[id="' + prefixo + ':link-detalhes-veiculo-restricoes"]').click();
        promise.done(function() {
          var restricoes = $('[id="' + prefixo + ':j_idt238_list"] > li').toArray().map(li => li.textContent.trim());
          var celula = $('[id="form-incluir-restricao:lista-veiculo_data"] > tr:nth-child(' + (i+1) + ') > td:nth-child(8)');
          celula.html('<div class="noscreen">' + celula.html() + '</div>');
          celula.append(restricoes.map(restricao => '<div class="noprint">' + restricao + '</div>'));
          divImpressao.append($('[id="' + prefixo + ':j_idt232"]'));
          divImpressao.append($('[id="' + prefixo + ':panel-mostrar-detalhes"]'));
          $('button[id="' + prefixo + ':j_idt441"]').click();
          fila.avancar();
        });
      });
    });
    fila.avancar();
  }

  function limparCampos() {
    var promise = jQuery.Deferred();
    limparCampoPesquisa().done(function() {
      limparLista(promise);
    });
    limparImpressao();
    return promise;
  }

  function limparCampoPesquisa(promise) {
    if (typeof promise === 'undefined') {
      promise = jQuery.Deferred();
    }
    window.pesquisaAtual = promise;
    $('[id="form-incluir-restricao:j_idt56"]').click();
    return promise;
  }

  function limparLista(promise) {
    if (typeof promise === 'undefined') {
      promise = jQuery.Deferred();
    }
    window.pesquisaAtual = promise;
    var botao = $('[id="form-incluir-restricao:j_idt444"]');
    if (botao.size() > 0) {
      botao.click();
    } else {
      promise.resolve();
    }
    return promise;
  }
  
  function limparImpressao() {
    $('#impressaoGreasemonkey').html('');
  }

  function pesquisarDocumento(documento) {
    var botaopesquisar = $('[id="form-incluir-restricao:botao-pesquisar"]');
    var documentobox = $('[id="form-incluir-restricao:campo-cpf-cnpj"]');
    documentobox.val(documento);
    botaopesquisar.click();
  }

  function preencherMunicipio(codigo) {
    return preencherSelectOneMenu('form-incluir-restricao:campo-municipio', codigo);
  }

  function preencherOrgao(codigo) {
    return preencherSelectOneMenu('form-incluir-restricao:campo-orgao', codigo);
  }

  function preencherMagistrado(codigo) {
    var ret = preencherSelectOneMenu('form-incluir-restricao:campo-magistrado', codigo);
    document.getElementById('preencher-magistrado-automaticamente').checked = true;
    return ret;
  }

  function preencherNumeroProcesso(numero) {
    if (numero === '') {
      return;
    }
    var campo = $('input[id="form-incluir-restricao:campo-numero-processo"]');
    campo.val(numero);
    campo.trigger('blur');
  }

  function preencherSelectOneMenu(idCampo, valor) {
    var idSelect = idCampo + '_input', idPainel = idCampo + '_panel';
    var select = $('select[id="' + idSelect + '"]');
    var texto = select.find('option[value="' + valor + '"]').html();
    var menu = $('div[id="' + idCampo + '"] .ui-selectonemenu-trigger');
    var opcao = $('div[id="' + idPainel + '"] li[data-label="' + texto + '"]');
    if (menu.length + opcao.length !== 2) {
      console.error('Campo não encontrado: "' + idCampo + '"', menu, opcao);
      return;
    }
    var valorAntigo = select.val();
    menu.click();
    opcao.click();
    if (valor === valorAntigo) {
      return false;
    }
    return true;
  }
  
  function corrigirCampoMagistrado() {
    $('select[id="form-incluir-restricao:campo-orgao_input"] option[value=""]').attr('value', '');
  }

  function observarAlteracaoMagistrado(fn) {
    var opcoes = $('div[id="form-incluir-restricao:campo-magistrado_panel"] li[data-label]');
    var select = $('select[id="form-incluir-restricao:campo-magistrado_input"]');
    opcoes.each(function() {
      $(this).on('click', function() {
        var valor = select.val();
        return fn(valor);
      });
    });
  }
  
  function criarCampoPreencherMagistradoAutomaticamente() {
    var menu = $('div[id="form-incluir-restricao:campo-magistrado"]');
    var celula = menu.parent('td');
    celula.after('<td><label><input type="checkbox" id="preencher-magistrado-automaticamente"/> Usar este valor como padrão para todos os processos</label></td>');
    return document.getElementById('preencher-magistrado-automaticamente');
  }
  
  function observarAlteracaoPreencherMagistradoAutomaticamente(fn) {
    var preencherMagistradoAutomaticamente = $('#preencher-magistrado-automaticamente');
    preencherMagistradoAutomaticamente.on('click', function() {
      var valor = preencherMagistradoAutomaticamente.get(0).checked;
      return fn(valor);
    });
  }

  $(window.document).ajaxComplete(function(ev, xhr, options) {
    var textoCampos = options.data.split('&');
    var campos = {};
    textoCampos.forEach(function(textoCampo) {
      var split = textoCampo.split('='), campo, valor;
      campo = decodeURIComponent(split[0]);
      valor = decodeURIComponent(split[1]);
      if (campo in campos) {
        var valorAnterior = campos[campo];
        if (valorAnterior instanceof Array) {
          campos[campo].push(valor);
        } else {
          campos[campo] = [valorAnterior, valor];
        }
      } else {
        campos[campo] = valor;
      }
    });

    var xml = window.xmlRetornado = xhr.responseXML.documentElement;
    var partes = campos['javax.faces.source'].split(':');

    var orgao, magistrado, processo;

    switch (partes[0]) {
      case 'form-incluir-restricao':
        switch (partes[1]) {
          case 'j_idt56':
          case 'j_idt444':
            pesquisaAtual.resolve();
            break;

          case 'j_idt49':
            if ($('div[id="form-incluir-restricao:campo-municipio"]').size()) {
              console.log('Usuário está na tela de restrição (preenchimento de dados do processo)...');
              limparImpressao();
              $('#alteracoesGreasemonkey').hide();
              corrigirCampoMagistrado();
              criarCampoPreencherMagistradoAutomaticamente();
              var municipio = localStorage.getItem('municipio');
              if (municipio !== null) {
                if (! preencherMunicipio(municipio)) {
                  console.log('Campo "Comarca/Município" já estava preenchido');
                  orgao = localStorage.getItem('orgao');
                  if (orgao !== null) {
                    if (! preencherOrgao(orgao)) {
                      console.log('Campo "Órgão Judiciário" já estava preenchido');
                      magistrado = localStorage.getItem('magistrado');
                      if (magistrado !== null) {
                        preencherMagistrado(magistrado);
                        processo = $('#alteracoesGreasemonkey input').val();
                        preencherNumeroProcesso(processo);
                      }
                    }
                  }
                }
              }
              observarAlteracaoPreencherMagistradoAutomaticamente(function(marcado) {
                var select = $('select[id="form-incluir-restricao:campo-magistrado_input"]');
                magistrado = select.val();
                if (marcado && magistrado !== 'Selecione o magistrado') {
                  localStorage.setItem('magistrado', magistrado);
                } else {
                  localStorage.removeItem('magistrado');
                }
              });
            } else if ($('button[id="form-incluir-restricao:button-confirmar"]').size()) {
              console.log('Usuário está na tela de confirmação de inserção da restrição...');
            } else {
              console.log('Usuário retornou à tela principal...');
              $('#alteracoesGreasemonkey').show();
            }
            break;

          case 'campo-municipio':
            console.log('Campo "Município" alterado.');
            var codigoMunicipio = $('select[id="form-incluir-restricao:campo-municipio_input"]').val();
            if (codigoMunicipio !== '') {
              localStorage.setItem('municipio', codigoMunicipio);
            } else {
              localStorage.removeItem('municipio');
            }
            
            orgao = localStorage.getItem('orgao');
            if (orgao !== null) {
              preencherOrgao(orgao);
            }
            break;

          case 'campo-orgao':
            console.log('Campo "Órgão" alterado.');
            var codigoOrgao = $('select[id="form-incluir-restricao:campo-orgao_input"]').val();
            if (codigoOrgao !== '') {
              localStorage.setItem('orgao', codigoOrgao);
            } else {
              localStorage.removeItem('orgao');
            }

            magistrado = localStorage.getItem('magistrado');
            if (magistrado !== null) {
              preencherMagistrado(magistrado);
              processo = $('#alteracoesGreasemonkey input').val();
              preencherNumeroProcesso(processo);
            }

            observarAlteracaoMagistrado(function(novoValor) {
              console.log('Campo "Magistrado" alterado.');
              if (document.getElementById('preencher-magistrado-automaticamente').checked && novoValor !== 'Selecione o magistrado') {
                localStorage.setItem('magistrado', novoValor);
              } else {
                localStorage.removeItem('magistrado');
              }
              var processo = $('#alteracoesGreasemonkey input').val();
              preencherNumeroProcesso(processo);
            });

            break;

          case 'campo-numero-processo':
            console.log('Campo "Número do processo" alterado.');
            break;

          case 'button-confirmar':
            console.log('Usuário confirmou restrição.');
            break;

          case 'botao-pesquisar':
            var extensionObj = xml.querySelector('extension[ln=primefaces][type=args]');
            if (extensionObj) {
              var extension = $.parseJSON(extensionObj.innerHTML);
              if ('validationFailed' in extension) {
                pesquisaAtual.reject('Validação falhou.');
              } else if ('totalRecords' in extension) {
                pesquisaAtual.resolve(extension.totalRecords);
              }
            } else {
              var erros = $('.ui-messages-error-detail');
              if (erros.length > 0) {
                erros.each(function(indexErro, erro) {
                  if (erro.textContent === 'A pesquisa não retornou resultados.') {
                    pesquisaAtual.resolve(0);
                  }
                });
              } else {
                console.log('???');
              }
            }
            break;

          case 'lista-veiculo':
            switch (partes[3]) {
              case 'j_idt76':
                pesquisaAtual.resolve();
                break;

              case 'link-detalhes-veiculo-restricoes':
                pesquisaAtual.resolve();
                break;

              default:
                console.log(campos['javax.faces.source']);
                break;
            }
            break;

          default:
            console.log(campos['javax.faces.source']);
            break;
        }
        break;

      default:
        console.log(campos['javax.faces.source']);
        break;
    }
  });

  function Fila(fn) {
    this.callbackWhenDone = fn;
  }
  Fila.prototype = Object.create(Array.prototype);
  Fila.prototype.constructor = Fila;
  Fila.prototype.callbackWhenDone = null;
  Fila.prototype.avancar = function() {
    if (this.length > 0) {
      var comando = this.shift();
      comando();
    } else {
      this.callbackWhenDone();
    }
  };

}

function Promise() {
  var successCallbacks = [], failCallbacks = [], progressCallbacks = [], missedNotifications = [], missedRejection = null, missedResolution = null;
  var resolved = false, rejected = false;
  var p = {
    always: function(callback) {
      if (resolved) {
        callback.apply(null, missedResolution);
      } else if (rejected) {
        callback.apply(null, missedRejection);
      } else {
        successCallbacks.push(callback);
        failCallbacks.push(callback);
      }
      return p;
    },
    done: function(callback) {
      if (resolved) {
        callback.apply(null, missedResolution);
      } else {
        successCallbacks.push(callback);
      }
      return p;
    },
    fail: function(callback) {
      if (rejected) {
        callback.apply(null, missedRejection);
      } else {
        failCallbacks.push(callback);
      }
      return p;
    },
    notify: function() {
      var args = Array.prototype.slice.call(arguments);
      progressCallbacks.forEach(function(callback) {
        callback.apply(null, args);
      });
      if (progressCallbacks.length === 0) {
        missedNotifications.push(args);
      }
    },
    progress: function(callback) {
      if (missedNotifications.length > 0) {
        missedNotifications.forEach(function(args) {
          callback.apply(null, args);
        });
      }
      progressCallbacks.push(callback);
      return p;
    },
    reject: function() {
      var args = Array.prototype.slice.call(arguments);
      if (resolved || rejected) {
        throw new Error('Promessa já havia sido resolvida ou rejeitada.');
      }
      rejected = true;
      failCallbacks.forEach(function(callback) {
        callback.apply(null, args);
      });
      if (failCallbacks.length === 0) {
        missedRejection = args;
      }
    },
    resolve: function() {
      var args = Array.prototype.slice.call(arguments);
      if (resolved || rejected) {
        throw new Error('Promessa já havia sido resolvida ou rejeitada.');
      }
      resolved = true;
      successCallbacks.forEach(function(callback) {
        callback.apply(null, args);
      });
      if (successCallbacks.length === 0) {
        missedResolution = args;
      }
    }
  };
  return p;
}
