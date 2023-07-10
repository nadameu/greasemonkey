import { XHR } from './XHR';
import { ErroLinkCriarNaoExiste } from './ErroLinkCriarNaoExiste';
import { Nomeacao } from './Nomeacao';
import css from './nomeacoes.scss?raw';
import html from './nomeacoes.html?raw';
import { PaginaCriar } from './PaginaCriar';

export class PaginaNomeacoes {
  win: Window;

  get tabela() {
    const tabela = this.doc.getElementById('tabelaNomAJG');
    if (!tabela) throw new Error('Tabela não encontrada.');
    return tabela;
  }

  constructor(public doc: Document) {
    if (!doc.defaultView) throw new Error('Janela não encontrada.');
    this.win = doc.defaultView;
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
    const aviso = this.doc.querySelector('.gm-ajg__aviso')!;
    let qtdPontinhos = 2;
    function update() {
      const pontinhos = '.'.repeat(qtdPontinhos + 1);
      aviso.textContent = `Aguarde, carregando formulário${pontinhos}`;
      qtdPontinhos = (qtdPontinhos + 1) % 3;
    }
    const win = this.win;
    const timer = win.setInterval(update, 1000 / 3);
    update();
    return {
      get carregado(): boolean | null {
        return null;
      },
      set carregado(carregado: boolean) {
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
    const style = this.doc.head.appendChild(this.doc.createElement('style'));
    style.textContent = css;
  }

  async adicionarFormulario() {
    const linkCriar = this.doc.querySelector<HTMLAnchorElement>(
      'a[href^="controlador.php?acao=criar_solicitacao_pagamento&"]'
    );
    if (!linkCriar) throw new ErroLinkCriarNaoExiste();

    const areaTelaD = this.doc.getElementById('divInfraAreaTelaD');
    if (!areaTelaD) throw new Error('Elemento não encontrado: #divInfraAreaTelaD.');
    areaTelaD.insertAdjacentHTML('beforeend', '<div class="gm-ajg__div"></div>');
    const div = this.doc.querySelector('.gm-ajg__div')!;

    div.innerHTML = '<label>Aguarde, carregando formulário...</label>';
    const doc = await XHR.buscarDocumento(linkCriar.href);
    div.textContent = '';
    const form = doc.getElementById('frmRequisicaoPagamentoAJG')?.cloneNode(true);
    if (!(form instanceof HTMLFormElement)) throw new Error('Formulário não encontrado.');
    if (!this.validarFormularioExterno(form)) throw new Error('Formulário não foi validado!');
    div.textContent = 'Ok.';
    div.innerHTML = html;
    const novoFormulario = this.doc.querySelector('.gm-ajg__formulario') as HTMLFormElement;
    novoFormulario.method = form.method;
    novoFormulario.action = form.action;
    const enviar = this.doc.querySelector('.gm-ajg__formulario__enviar')!;
    enviar.addEventListener('click', this.onEnviarClicado.bind(this));
  }

  async enviarFormulario(url, method, data) {
    const doc = await XHR.buscarDocumento(url, method, data);
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
  }

  nomeacaoFromLinha(linha) {
    const nomeacao = new Nomeacao();
    const linkCriar = linha.querySelector(
      'a[href^="controlador.php?acao=criar_solicitacao_pagamento&"]'
    );
    if (linkCriar) {
      const parametros = new URL(linkCriar.href).searchParams;
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
      const DEBUG = true;
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

  validarFormularioExterno(form: Node) {
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
        if (!validadoAteAgora) return false;
        const elt = form.elements[i];
        const nome = elt.name || elt.id;
        return nome === nomeEsperado;
      }, true);
    if (!validado) {
      console.error('Campos do formulário não correspondem ao esperado');
    }
    return validado;
  }
}
