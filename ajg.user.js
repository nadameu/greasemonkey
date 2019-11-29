// ==UserScript==
// @name        Solicitações de pagamento em bloco
// @description Permite a criação de solicitações de pagamento em bloco
// @namespace   http://nadameu.com.br/ajg
// @include     /^https:\/\/eproc\.(trf4|jf(pr|rs|sc))\.jus\.br\/eproc(2trf4|V2)\/controlador\.php\?acao=nomeacoes_ajg_listar&/
// @version     3
// @grant       none
// ==/UserScript==

class ErroLinkCriarNaoExiste extends Error {
  constructor() {
    super('Link para criar solicitação de pagamentos não existe!');
  }
}

function Nomeacao() {}
Nomeacao.prototype = {
  idUnica: null,
  numProcesso: null,
  numeroNomeacao: null,
};

class Pagina {
  constructor(doc) {
    this.doc = doc;
  }

  static analisar(doc) {
    const classeAcao = {
      nomeacoes_ajg_listar: PaginaNomeacoes,
      criar_solicitacao_pagamento: PaginaCriar,
    };
    const acao = Pagina.parametros(doc).get('acao');
    if (acao in classeAcao) return new classeAcao[acao](doc);
    throw new Error('Página desconhecida.');
  }

  static parametros(doc) {
    return extrairParametrosUrl(doc.URL);
  }
}
Pagina.prototype.doc = null;

class PaginaCriar extends Pagina {
  get formElement() {
    return this.doc.getElementById('frmRequisicaoPagamentoAJG');
  }
}

class PaginaNomeacoes extends Pagina {
  get tabela() {
    return this.doc.getElementById('tabelaNomAJG');
  }

  adicionarAlteracoes() {
    this.adicionarEstilos();
    const aviso = this.adicionarAvisoCarregando();
    this.adicionarFormulario()
      .then(() => {
        aviso.carregado = true;
      })
      .catch(err => {
        aviso.carregado = false;
        if (!(err instanceof ErroLinkCriarNaoExiste)) {
          throw err;
        }
      });
  }

  adicionarAvisoCarregando() {
    const tabela = this.tabela;
    tabela.insertAdjacentHTML('beforebegin', '<label class="gm-ajg__aviso"></label>');
    const aviso = this.doc.querySelector('.gm-ajg__aviso');
    let qtdPontinhos = 2;
    function update() {
      const pontinhos = '.'.repeat(qtdPontinhos + 1);
      aviso.textContent = `Aguarde, carregando formulário${pontinhos}`;
      qtdPontinhos = (qtdPontinhos + 1) % 3;
    }
    const win = this.doc.defaultView;
    const timer = win.setInterval(update, 1000 / 3);
    update();
    return {
      get carregado() {
        return null;
      },
      set carregado(carregado) {
        win.clearInterval(timer);
        if (carregado) {
          aviso.classList.add('gm-ajg__aviso--carregado');
          aviso.textContent =
            'Selecione as nomeações desejadas para criar solicitações de pagamento em bloco através do formulário no final da página.';
        } else {
          aviso.classList.add('gm-ajg__aviso--nao-carregado');
        }
      },
    };
  }

  adicionarEstilos() {
    this.doc.querySelector('head').insertAdjacentHTML(
      'beforeend',
      `
<style>
.gm-ajg__aviso {}
.gm-ajg__aviso--carregado {}
.gm-ajg__aviso--nao-carregado { display: none; }
.gm-ajg__lista { font-size: 1.2em; }
.gm-ajg__lista__processo { float: left; margin-right: 3ex; }
.gm-ajg__lista__resultado {}
.gm-ajg__lista__resultado--ok { color: green; }
.gm-ajg__lista__resultado--erro { color: red; }
</style>
		`
    );
  }

  adicionarFormulario() {
    const linkCriar = this.doc.querySelector(
      'a[href^="controlador.php?acao=criar_solicitacao_pagamento&"]'
    );
    if (!linkCriar) return Promise.reject(new ErroLinkCriarNaoExiste());

    const areaTelaD = this.doc.getElementById('divInfraAreaTelaD');
    areaTelaD.insertAdjacentHTML('beforeend', '<div class="gm-ajg__div"></div>');
    const div = this.doc.querySelector('.gm-ajg__div');

    div.innerHTML = '<label>Aguarde, carregando formulário...</label>';
    return XHR.buscarDocumento(linkCriar.href).then(doc => {
      div.textContent = '';
      const paginaCriar = Pagina.analisar(doc);
      const form = paginaCriar.formElement.cloneNode(true);
      if (!this.validarFormularioExterno(form))
        return Promise.reject(new Error('Formulário não foi validado!'));
      div.textContent = 'Ok.';
      div.innerHTML = `
<fieldset class="infraFieldset">
<legend class="infraLegend">Criar solicitações de pagamento em bloco</legend>
<form class="gm-ajg__formulario" method="${form.method}" action="${form.action}">
	<label>Valor da solicitação (R$): <input name="txtValorSolicitacao" onpaste="return false;" onkeypress="return infraMascaraDinheiro(this, event, 2, 18);"></label><br>
	<br>
	<label>Data da prestação do serviço: <input id="gm-ajg__formulario__data" name="txtDataPrestacao" onpaste="return false;" onkeypress="return infraMascaraData(this, event);"></label><img title="Selecionar data" alt="Selecionar data" src="../../../infra_css/imagens/calendario.gif" class="infraImg" onclick="infraCalendario('gm-ajg__formulario__data', this);"><br>
	<br>
	<label class="infraLabel">Motivo:</label><br>
	<label><input type="checkbox" name="chkMotivo[]" value="0"> Nível de especialização e complexidade do trabalho</label><br>
	<label><input type="checkbox" name="chkMotivo[]" value="1"> Natureza e importância da causa</label><br>
	<label><input type="checkbox" name="chkMotivo[]" value="6"> Lugar da prestação do serviço</label><br>
	<label><input type="checkbox" name="chkMotivo[]" value="3"> Tempo de tramitação do processo</label><br>
	<label><input type="checkbox" name="chkMotivo[]" value="2"> Grau de zelo profissional</label><br>
	<label><input type="checkbox" name="chkMotivo[]" value="4"> Trabalho realizado pelo profissional</label><br>
	<br>
	<label>Observação:<br><textarea name="selTxtObservacao" cols="55" rows="4" maxlength="500"></textarea></label><br>
	<br>
	<label>Decisão fundamentada <small><em>(Obrigatório quando o valor extrapolar o máximo)</em></small>:<br><textarea name="selTxtDecisao" cols="55" rows="4" maxlength="2000"></textarea></label><br>
</form>
<br>
<button class="gm-ajg__formulario__enviar">Criar solicitações em bloco</button>
</fieldset>
<output class="gm-ajg__resultado"></output>
			`;
      const enviar = this.doc.querySelector('.gm-ajg__formulario__enviar');
      enviar.addEventListener('click', this.onEnviarClicado.bind(this));
      return Promise.resolve();
    });
  }

  enviarFormulario(url, method, data) {
    return XHR.buscarDocumento(url, method, data).then(doc => {
      const validacao = doc.getElementById('txaInfraValidacao');
      const excecoes = Array.from(doc.querySelectorAll('.infraExcecao'));
      const tabelaErros = doc.querySelector('table[summary="Erro(s)"]');
      if (validacao) {
        const match = validacao.textContent.trim().match(/^Solicitação de pagamento (\d+) criada$/);
        if (match) {
          return match[1];
        }
      }
      const msgsErro = new Set(['Houve um erro ao tentar criar a solicitação!', '']);
      excecoes.forEach(excecao => msgsErro.add(excecao.textContent.trim()));
      if (tabelaErros) {
        const tBodyRows = Array.from(tabelaErros.rows).slice(1);
        tBodyRows.map(linha => linha.cells[1].textContent.trim()).forEach(msg => msgsErro.add(msg));
      }
      window.errorDoc = doc;
      console.error('DEBUG: window.errorDoc');
      if (excecoes.length === 0 && !tabelaErros) {
        return false;
      }
      const msgErro = Array.from(msgsErro.values()).join('\n');
      throw new Error(msgErro);
    });
  }

  nomeacaoFromLinha(linha) {
    const nomeacao = new Nomeacao();
    const linkCriar = linha.querySelector(
      'a[href^="controlador.php?acao=criar_solicitacao_pagamento&"]'
    );
    if (linkCriar) {
      const parametros = extrairParametrosUrl(linkCriar.href);
      const idUnica = parametros.get('id_unica');
      const [numProcesso] = idUnica.split('|').slice(1);
      const numeroNomeacao = linha.cells[2].textContent.trim();
      nomeacao.idUnica = idUnica;
      nomeacao.numProcesso = numProcesso;
      nomeacao.numeroNomeacao = numeroNomeacao;
    }
    return nomeacao;
  }

  onEnviarClicado() {
    const form = this.doc.querySelector('.gm-ajg__formulario');
    const url = form.action;
    const method = form.method;

    const tabela = this.tabela;
    const linhas = Array.from(tabela.rows).slice(1);
    const linhasProcessosSelecionados = linhas.filter(linha => {
      const checkbox = linha.querySelector('input[type="checkbox"]');
      return checkbox && checkbox.checked;
    });

    if (linhasProcessosSelecionados.length === 0) return;
    const pergunta =
      linhasProcessosSelecionados.length === 1
        ? 'Criar solicitação de pagamento para 1 processo?'
        : `Criar solicitações de pagamento para ${linhasProcessosSelecionados.length} processos?`;
    if (!confirm(pergunta)) return;

    const resultado = this.doc.querySelector('.gm-ajg__resultado');
    resultado.innerHTML = `
<label>Solicitações a criar:</label><br>
<dl class="gm-ajg__lista"></dl>
		`;
    const lista = resultado.querySelector('.gm-ajg__lista');

    let duvida = false;
    const promise = linhasProcessosSelecionados.reduce((promise, linha) => {
      const nomeacao = this.nomeacaoFromLinha(linha);
      const data = new FormData(form);
      data.set('hdnInfraTipoPagina', '1');
      data.set('id_unica', nomeacao.idUnica);
      data.set('num_processo', nomeacao.numProcesso);
      data.set('numeroNomeacao', nomeacao.numeroNomeacao);

      const termo = this.doc.createElement('dt');
      termo.className = 'gm-ajg__lista__processo';
      termo.textContent = nomeacao.numProcesso;
      const definicao = this.doc.createElement('dd');
      definicao.className = 'gm-ajg__lista__resultado';
      definicao.textContent = 'Na fila';
      lista.appendChild(termo);
      lista.appendChild(definicao);
      const DEBUG = false;
      const fns = [
        () => (definicao.textContent = 'Criando...'),
        () =>
          DEBUG
            ? new Promise((resolve, reject) => {
                let timer;
                timer = this.doc.defaultView.setTimeout(() => {
                  this.doc.defaultView.clearTimeout(timer);
                  if (Math.random() < 0.1) {
                    reject(new Error('Erro ao criar solicitação!'));
                  } else {
                    resolve(parseInt(Math.random() * 1000));
                  }
                }, 1000);
              })
            : this.enviarFormulario(url, method, data),
        num => {
          if (num) {
            definicao.classList.add('gm-ajg__lista__resultado--ok');
            definicao.textContent = `Criada solicitação ${num}.`;
          } else {
            duvida = true;
            definicao.textContent = '???';
          }
        },
      ];
      return fns
        .reduce((p, fn) => p.then(fn), promise)
        .catch(err => {
          definicao.classList.add('gm-ajg__lista__resultado--erro');
          definicao.textContent = 'Erro.';
          return Promise.reject(err);
        });
    }, Promise.resolve());

    lista.scrollIntoView();

    promise.then(() => {
      let mensagem;
      if (duvida) {
        mensagem = 'Não foi possível verificar se uma ou mais solicitações foram criadas.';
      } else {
        if (linhasProcessosSelecionados.length === 1) {
          mensagem = 'Solicitação criada com sucesso!';
        } else {
          mensagem = 'Solicitações criadas com sucesso!';
        }
        mensagem += '\nA página será recarregada para atualizar a lista de processos.';
      }
      this.doc.defaultView.alert(mensagem);
      if (!duvida) {
        this.doc.defaultView.location.reload();
      }
    });
    promise.catch(err => {
      console.error(err);
      this.doc.defaultView.alert(err.message);
    });
  }

  validarFormularioExterno(form) {
    const camposEsperados = [
      'hdnInfraTipoPagina',
      'btnnovo',
      'btnVoltar',
      'txtValorSolicitacao',
      'txtDataPrestacao',
      'chkMotivo[]',
      'chkMotivo[]',
      'chkMotivo[]',
      'chkMotivo[]',
      'chkMotivo[]',
      'chkMotivo[]',
      'selTxtObservacao',
      'selTxtDecisao',
      'numPaginaAtual',
      'id_unica',
      'num_processo',
      'numeroNomeacao',
      'btnnovo',
      'btnVoltar',
    ];
    const validado =
      form.length === camposEsperados.length &&
      camposEsperados.reduce((validadoAteAgora, nomeEsperado, i) => {
        const elt = form.elements[i];
        const nome = elt.name || elt.id;
        return validadoAteAgora && nome === nomeEsperado;
      }, true);
    if (!validado) {
      console.error('Campos do formulário não correspondem ao esperado');
    }
    return validado;
  }
}

class XHR {
  static buscarDocumento(url, method = 'GET', data = null) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open(method, url);
      xhr.responseType = 'document';
      xhr.addEventListener('load', evt => resolve(evt.target.response));
      xhr.addEventListener('error', reject);
      xhr.send(data);
    });
  }
}

function main() {
  const pagina = Pagina.analisar(document);
  pagina.adicionarAlteracoes();
}

function extrairParametrosUrl(url) {
  const str = url
    .split('?')
    .slice(1)
    .join('?');
  return new Map(
    str.split('&').map(pair => pair.split('=').map(texto => decodeURIComponent(texto)))
  );
}

main();
