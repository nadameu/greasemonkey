// ==UserScript==
// @name         Solicitações de pagamento em bloco
// @namespace    http://nadameu.com.br/ajg
// @version      4.1.0
// @author       nadameu
// @description  Permite a criação de solicitações de pagamento em bloco
// @match        https://eproc.jfpr.jus.br/eprocV2/controlador.php?acao=nomeacoes_ajg_listar&*
// @match        https://eproc.jfrs.jus.br/eprocV2/controlador.php?acao=nomeacoes_ajg_listar&*
// @match        https://eproc.jfsc.jus.br/eprocV2/controlador.php?acao=nomeacoes_ajg_listar&*
// @match        https://eproc.trf4.jus.br/eproc2trf4/controlador.php?acao=nomeacoes_ajg_listar&*
// ==/UserScript==

(function () {
  'use strict';

  class ErroLinkCriarNaoExiste extends Error {
    name = 'ErroLinkCriarNaoExiste';
    constructor() {
      super('Link para criar solicitação de pagamentos não existe!');
    }
  }
  function h(tag, props = null, ...children) {
    const element = document.createElement(tag);
    for (const [key, value] of Object.entries(props ?? {})) {
      element[key] = value;
    }
    element.append(...children);
    return element;
  }
  function adicionarAvisoCarregando({ tabela }) {
    const aviso = h('label', { className: 'gm-ajg__aviso' });
    tabela.insertAdjacentElement('beforebegin', aviso);
    let qtdPontinhos = 2;
    function update() {
      const pontinhos = '.'.repeat(qtdPontinhos + 1);
      aviso.textContent = `Aguarde, carregando formulário${pontinhos}`;
      qtdPontinhos = (qtdPontinhos + 1) % 3;
    }
    const timer = window.setInterval(update, 1e3 / 3);
    update();
    return {
      set carregado(carregado) {
        window.clearInterval(timer);
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
  const css =
    '.bootstrap-styles .gm-ajg__aviso{width:100%;background:#e6cbd7;padding:.5em;border-color:#4d0022;border-style:solid;border-width:1px 0}.bootstrap-styles .gm-ajg__aviso--nao-carregado{display:none}.bootstrap-styles .gm-ajg__lista{font-size:1.2em}.bootstrap-styles .gm-ajg__lista__processo{float:left;margin-right:3ex}.bootstrap-styles .gm-ajg__lista__resultado--ok{color:green}.bootstrap-styles .gm-ajg__lista__resultado--erro{color:red}.bootstrap-styles .gm-ajg__div fieldset{width:max-content;background:#eddee5!important;border-radius:.5em}.bootstrap-styles .gm-ajg__div fieldset legend{background:#e6cbd7;padding:.2em;border-radius:.5em;border:1px solid hsl(333,40%,50%)}';
  function adicionarEstilos() {
    document.head.appendChild(h('style', null, css));
  }
  const html = `<fieldset class="infraFieldset">\r
  <legend class="infraLegend">Criar solicitações de pagamento em bloco</legend>\r
  <form class="gm-ajg__formulario">\r
    <label\r
      >Valor da solicitação (R$):\r
      <input\r
        name="txtValorSolicitacao"\r
        onpaste="return false;"\r
        onkeypress="return infraMascaraDinheiro(this, event, 2, 18);" /></label\r
    ><br />\r
    <br />\r
    <label\r
      >Data da prestação do serviço:\r
      <input\r
        id="gm-ajg__formulario__data"\r
        name="txtDataPrestacao"\r
        onpaste="return false;"\r
        onkeypress="return infraMascaraData(this, event);" /></label\r
    ><img\r
      title="Selecionar data"\r
      alt="Selecionar data"\r
      src="infra_css/imagens/calendario.gif"\r
      class="infraImg"\r
      onclick="infraCalendario('gm-ajg__formulario__data', this);"\r
    /><br />\r
    <br />\r
    <label class="infraLabel">Motivo:</label><br />\r
    <label\r
      ><input type="checkbox" name="chkMotivo[]" value="0" /> Nível de\r
      especialização e complexidade do trabalho</label\r
    ><br />\r
    <label\r
      ><input type="checkbox" name="chkMotivo[]" value="1" /> Natureza e\r
      importância da causa</label\r
    ><br />\r
    <label\r
      ><input type="checkbox" name="chkMotivo[]" value="6" /> Lugar da prestação\r
      do serviço</label\r
    ><br />\r
    <label\r
      ><input type="checkbox" name="chkMotivo[]" value="3" /> Tempo de\r
      tramitação do processo</label\r
    ><br />\r
    <label\r
      ><input type="checkbox" name="chkMotivo[]" value="2" /> Grau de zelo\r
      profissional</label\r
    ><br />\r
    <label\r
      ><input type="checkbox" name="chkMotivo[]" value="4" /> Trabalho realizado\r
      pelo profissional</label\r
    ><br />\r
    <br />\r
    <label\r
      >Observação:<br /><textarea\r
        name="selTxtObservacao"\r
        cols="55"\r
        rows="4"\r
        maxlength="500"\r
      ></textarea></label\r
    ><br />\r
    <br />\r
    <label\r
      >Decisão fundamentada\r
      <small><em>(Obrigatório quando o valor extrapolar o máximo)</em></small\r
      >:<br /><textarea\r
        name="selTxtDecisao"\r
        cols="55"\r
        rows="4"\r
        maxlength="2000"\r
      ></textarea></label\r
    ><br />\r
  </form>\r
  <br />\r
  <button class="gm-ajg__formulario__enviar">\r
    Criar solicitações em bloco\r
  </button>\r
</fieldset>\r
<div class="gm-ajg__resultado"></div>\r
`;
  function buscarDocumento(url, method = 'GET', data = null) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open(method, url);
      xhr.responseType = 'document';
      xhr.addEventListener('load', () => resolve(xhr.response));
      xhr.addEventListener('error', () =>
        reject(new Error(`Erro ao obter o documento "${url}".`))
      );
      xhr.send(data);
    });
  }
  async function enviarFormulario(url, method, data) {
    const doc = await buscarDocumento(url, method, data);
    const validacao = doc.getElementById('txaInfraValidacao');
    const excecoes = Array.from(doc.querySelectorAll('.infraExcecao'));
    const tabelaErros = doc.querySelector('table[summary="Erro(s)"]');
    if (validacao) {
      const match = validacao.textContent
        ?.trim()
        .match(/^Solicitação de pagamento (\d+) criada$/);
      if (match) {
        return match[1];
      }
    }
    const msgsErro = /* @__PURE__ */ new Set([
      'Houve um erro ao tentar criar a solicitação!',
      '',
    ]);
    excecoes.forEach(excecao =>
      msgsErro.add(excecao.textContent?.trim() ?? '')
    );
    if (tabelaErros) {
      const tBodyRows = Array.from(tabelaErros.rows).slice(1);
      tBodyRows
        .map(linha => linha.cells[1]?.textContent?.trim())
        .forEach(msg => msgsErro.add(msg ?? ''));
    }
    if (excecoes.length === 0 && !tabelaErros) {
      return false;
    }
    const msgErro = Array.from(msgsErro.values())
      .filter(x => x !== '')
      .join('\n');
    throw new ErroEnvioFormulario(msgErro, doc);
  }
  class ErroEnvioFormulario extends Error {
    constructor(msg, doc) {
      super(msg);
      this.doc = doc;
      this.document = doc;
    }
    document;
    name = 'ErroEnvioFormulario';
  }
  class ElementoNaoEncontradoError extends Error {
    constructor(selector, context) {
      super(`Elemento não encontrado: '${selector}'.`);
      this.context = context;
    }
    name = 'ElementoNaoEncontradoError';
  }
  async function query(selector, context = document) {
    const elt = context.querySelector(selector);
    if (!elt) throw new ElementoNaoEncontradoError(selector, context);
    return elt;
  }
  async function nomeacaoFromLinha(linha) {
    const linkCriar = await query(
      'a[href^="controlador.php?acao=criar_solicitacao_pagamento&"]',
      linha
    );
    const parametros = new URL(linkCriar.href).searchParams;
    const idUnica = parametros.get('id_unica') || null;
    const numProcesso = idUnica?.split('|')[1] || null;
    const numeroNomeacao = linha.cells[2]?.textContent?.trim() || null;
    if (idUnica && numProcesso && numeroNomeacao)
      return { idUnica, numProcesso, numeroNomeacao };
    throw new ErroNomeacaoLinha(linha);
  }
  class ErroNomeacaoLinha extends Error {
    constructor(linha) {
      super('Não foi possível obter os dados para a nomeação.');
      this.linha = linha;
    }
    name = 'ErroNomeacaoLinha';
  }
  function getTabela() {
    return query('table#tabelaNomAJG');
  }
  async function onEnviarClicado() {
    const form = document.querySelector('.gm-ajg__formulario');
    const url = form.action;
    const method = form.method;
    const tabela = await getTabela();
    const linhas = Array.from(tabela.rows).slice(1);
    const linhasProcessosSelecionados = linhas.filter(linha => {
      const checkbox = linha.querySelector('input[type="checkbox"]');
      return checkbox && checkbox.checked;
    });
    if (linhasProcessosSelecionados.length === 0) return;
    const cao = linhasProcessosSelecionados.length > 1 ? 'ções' : 'ção';
    const s = linhasProcessosSelecionados.length > 1 ? 's' : '';
    const pergunta = `Criar solicita${cao} de pagamento para ${linhasProcessosSelecionados.length} processo${s}?`;
    if (!confirm(pergunta)) return;
    const resultado = document.querySelector('.gm-ajg__resultado');
    resultado.innerHTML = `
<label>Solicitações a criar:</label><br>
<dl class="gm-ajg__lista"></dl>
		`;
    const lista = resultado.querySelector('.gm-ajg__lista');
    let duvida = false;
    try {
      await linhasProcessosSelecionados.reduce(async (promise, linha) => {
        const nomeacao = await nomeacaoFromLinha(linha);
        const data = new FormData(form);
        data.set('hdnInfraTipoPagina', '1');
        data.set('id_unica', nomeacao.idUnica);
        data.set('num_processo', nomeacao.numProcesso);
        data.set('numeroNomeacao', nomeacao.numeroNomeacao);
        const termo = h(
          'dt',
          { className: 'gm-ajg__lista__processo' },
          nomeacao.numProcesso
        );
        const definicao = h(
          'dd',
          { className: 'gm-ajg__lista__resultado' },
          'Na fila'
        );
        lista.appendChild(termo);
        lista.appendChild(definicao);
        const DEBUG = false;
        return promise
          .then(async () => {
            definicao.textContent = 'Criando...';
            const num = await (DEBUG
              ? new Promise((resolve, reject) => {
                  let timer;
                  timer = window.setTimeout(() => {
                    window.clearTimeout(timer);
                    if (Math.random() < 0.1) {
                      reject(new Error('Erro ao criar solicitação!'));
                    } else {
                      resolve(String(Math.round(Math.random() * 1e3)));
                    }
                  }, 1e3);
                })
              : enviarFormulario(url, method, data));
            if (num) {
              definicao.classList.add('gm-ajg__lista__resultado--ok');
              definicao.textContent = `Criada solicitação ${num}.`;
            } else {
              duvida = true;
              definicao.textContent = '???';
            }
          })
          .catch(async err => {
            definicao.classList.add('gm-ajg__lista__resultado--erro');
            definicao.textContent = 'Erro.';
            throw err;
          });
      }, Promise.resolve());
      lista.scrollIntoView();
      let mensagem;
      if (duvida) {
        mensagem =
          'Não foi possível verificar se uma ou mais solicitações foram criadas.';
      } else {
        if (linhasProcessosSelecionados.length === 1) {
          mensagem = 'Solicitação criada com sucesso!';
        } else {
          mensagem = 'Solicitações criadas com sucesso!';
        }
        mensagem +=
          '\nA página será recarregada para atualizar a lista de processos.';
      }
      window.alert(mensagem);
      if (!duvida) {
        window.location.reload();
      }
    } catch (err) {
      console.error(err);
      window.alert(err instanceof Error ? err.message : String(err));
    }
  }
  function validarFormularioExterno(form) {
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
    try {
      if (form.length !== camposEsperados.length) throw new Error();
      for (const [i, nomeEsperado] of camposEsperados.entries()) {
        const elt = form.elements[i];
        const nome =
          (elt && ('name' in elt ? elt.name : null)) || elt?.id || '';
        if (nome !== nomeEsperado) throw new Error();
      }
    } catch (_) {
      console.error('Campos do formulário não correspondem ao esperado.');
      return false;
    }
    return true;
  }
  async function adicionarFormulario({ areaTelaD, linkCriar }) {
    const div = areaTelaD.appendChild(
      h(
        'div',
        { className: 'gm-ajg__div' },
        h('label', null, 'Aguarde, carregando formulário...')
      )
    );
    await new Promise(res => {
      window.setTimeout(res, 1e3);
    });
    let doc;
    try {
      doc = await buscarDocumento(linkCriar.href);
    } finally {
      div.textContent = '';
    }
    const form = await query('form[id="frmRequisicaoPagamentoAJG"]', doc).then(
      x => x.cloneNode(true)
    );
    if (!validarFormularioExterno(form))
      throw new Error('Formulário não foi validado!');
    div.innerHTML = html;
    const formularioAdicionado = document.querySelector('.gm-ajg__formulario');
    formularioAdicionado.method = form.method;
    formularioAdicionado.action = form.action;
    const enviar = document.querySelector('.gm-ajg__formulario__enviar');
    enviar.addEventListener('click', () => {
      onEnviarClicado().catch(err => {
        console.error(err);
      });
    });
  }
  async function main() {
    let linkCriar;
    try {
      linkCriar = await query(
        'a[href^="controlador.php?acao=criar_solicitacao_pagamento&"]'
      );
    } catch (_) {
      return;
    }
    adicionarEstilos();
    const areaTelaD = await query('#divInfraAreaTelaD');
    const tabela = await getTabela();
    const aviso = adicionarAvisoCarregando({ tabela });
    try {
      await adicionarFormulario({ areaTelaD, linkCriar });
      aviso.carregado = true;
    } catch (err) {
      aviso.carregado = false;
      if (err instanceof ErroLinkCriarNaoExiste) return;
      throw err;
    }
  }
  main().catch(err => {
    console.error(err);
  });
})();
