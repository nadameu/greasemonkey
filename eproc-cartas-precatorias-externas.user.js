// ==UserScript==
// @name        eproc-cartas-precatorias-externas
// @name:pt-BR  eproc - processos externos
// @namespace   http://nadameu.com.br
// @match       https://eproc.jfpr.jus.br/eprocV2/controlador.php?acao=relatorio_processo_carta_precatoria_listar&*
// @match       https://eproc.jfrs.jus.br/eprocV2/controlador.php?acao=relatorio_processo_carta_precatoria_listar&*
// @match       https://eproc.jfsc.jus.br/eprocV2/controlador.php?acao=relatorio_processo_carta_precatoria_listar&*
// @match       https://eproc.trf4.jus.br/eproc2trf4/controlador.php?acao=relatorio_processo_carta_precatoria_listar&*
// @match       https://eproc.jfpr.jus.br/eprocV2/controlador.php?acao=processo_selecionar&*
// @match       https://eproc.jfrs.jus.br/eprocV2/controlador.php?acao=processo_selecionar&*
// @match       https://eproc.jfsc.jus.br/eprocV2/controlador.php?acao=processo_selecionar&*
// @match       https://eproc.trf4.jus.br/eproc2trf4/controlador.php?acao=processo_selecionar&*
// @match       https://portaldeservicos.pdpj.jus.br/consulta
// @match       https://portaldeservicos.pdpj.jus.br/consulta/autosdigitais
// @grant       GM_addStyle
// @grant       GM.deleteValue
// @grant       GM.getValue
// @grant       GM.setValue
// @grant       window.close
// @grant       unsafeWindow
// @version     1.2.0
// @author      nadameu
// @description Permite consultar processos externos através do serviço www.jus.br
// ==/UserScript==

async function main() {
  switch (document.location.hostname) {
    case 'eproc.jfpr.jus.br':
    case 'eproc.jfrs.jus.br':
    case 'eproc.jfsc.jus.br':
    case 'eproc.trf4.jus.br':
      return eproc_main();
      break;

    case 'portaldeservicos.pdpj.jus.br':
      return pdpj_main();
      break;

    default:
      throw new Error(`Servidor desconhecido: ${document.location.hostname}.`);
  }
}

function eproc_main() {
  const params = new URL(document.location.href).searchParams;
  switch (params.get('acao')) {
    case 'processo_selecionar':
      return eproc_processo();

    case 'relatorio_processo_carta_precatoria_listar':
      return eproc_cartas();

    default:
      throw new Error(`Ação desconhecida: ${params.get('acao')}`);
  }
}

function eproc_processo() {
  const tabelas = document.querySelectorAll('#tableRelacionado');
  if (tabelas.length > 1) throw new Error('Não foi possível obter tabela única de processos relacionados.');
  if (tabelas.length === 0) return;
  const [tabela] = tabelas;
  const outros = tabela.querySelectorAll('#carregarOutrosRelacionados > a[href^="javascript:"]');
  if (outros.length > 1) throw new Error('Não foi possível obter link único para carregamento de processos relacionados.');
  if (outros.length === 1) {
    const $ = unsafeWindow.jQuery;
    $(document).on('ajaxComplete', function(_evt, _xhr, opts) {
      const params = new URL(opts.url, document.location.href).searchParams;
      if (params.get('acao_ajax') === 'carregar_processos_relacionados') {
        try {
          eproc_analisar_tabela(tabela);
        } catch (err) {
          log_erro(err);
        }
      }
    });
  }
  return eproc_analisar_tabela(tabela);
}

function eproc_analisar_tabela(tabela) {
  for (const linha of tabela.rows) {
    if (linha.cells.length <= 1) continue; // link para carregar mais relacionados
    if (linha.cells[0].querySelector('a[href]') !== null) continue; // já possui link
    const texto = linha.cells[0].textContent?.trim() ?? '';
    const match = texto.match(/^(\d{20})(?:\/[A-Z]{2})?$/)
    if (match === null) {
      throw new Error(`Formato de número de processo desconhecido: ${texto}.`);
    }
    const [, numero] = match;
    const [, seq, dv, ...resto] = numero.match(/(.......)(..)(....)(.)(..)(....)/);
    const numero_formatado = `${seq}-${dv}.${resto.join('.')}`;
    const link = document.createElement('a');
    link.href = 'javascript:';
    link.addEventListener('click', e => {
      e.preventDefault();
      abrir_aba_pdpj(numero).catch(log_erro);
    });
    link.textContent = texto.replace(numero, numero_formatado);
    const span = document.createElement('span');
    span.className = 'gm-pdpj';
    span.textContent = 'jus.br';
    linha.cells[0].replaceChildren(link, ' ', span);
  }
  GM_addStyle(`
.bootstrap-styles #divCapaProcesso span.gm-pdpj {
  display: inline-block;
  font-size: .67rem;
  font-weight: normal;
  border-radius: 4px;
  color: hsl(333, 50%, 30%);
  border: 1px solid;
  padding: 0 .5ch;
  line-height: 1.2em;
}
`);
}

function eproc_cartas() {
  const tabela = document.getElementById('divInfraAreaTabela')?.querySelector(':scope > .infraTable[summary="Tabela de Cartas Precatórias Externas."]');
  assert(tabela != null, 'Erro ao obter tabela.');
  for (const [i, linha] of Array.from(tabela.rows).slice(1).entries()) {
    assert(linha.cells.length === 14, `Número de células esperado: 14. Obtido: ${linha.cells.length}. Linha: ${i}.`);
    const celula = linha.cells[0];
    const numero_formatado = celula.textContent.trim();
    if (numero_formatado === '') continue;
    const numero = numero_formatado.replace(/[.-]/g, '');
    if(! /^[0-9]{20}$/.test(numero)) {
      celula.style.color = 'red';
      continue;
    }
    const botao = document.createElement('button');
    botao.type = 'button';
    botao.className = 'gm-precatorias'
    botao.textContent = 'Consultar (jus.br)';
    botao.onclick = (e) => {
      e.preventDefault();
      document.querySelector('button.gm-precatorias.gm-clicked')?.classList.toggle('gm-clicked', false);
      botao.classList.add('gm-clicked');
      abrir_aba_pdpj(numero).catch(log_erro);
    };
    celula.append(document.createElement('br'), botao);
  }
  GM_addStyle(`
.bootstrap-styles button.gm-precatorias {
  border: 1px outset hsl(333, 25%, 75%);
  border-radius: 4px;
  background: hsl(333, 25%, 50%);
  color: white;
  box-shadow: 0 2px 4px #0004;
  padding: 2px 8px;
}
.bootstrap-styles button.gm-precatorias.gm-clicked {
  box-shadow: 0 0 1px 2px yellow;
}
`);
}

async function abrir_aba_pdpj(numero) {
  await GM.setValue('numero', numero);
  window.open('https://portaldeservicos.pdpj.jus.br/consulta', '_blank');
}

function pdpj_main() {
  switch (document.location.pathname) {
    case '/consulta':
      return pdpj_consulta();
      break;

    case '/consulta/autosdigitais':
      return pdpj_processo();
      break;

    default:
      throw new Error(`Caminho desconhecido: ${document.location.pathname}.`);
  }
}

async function pdpj_consulta() {
  await new Promise((res, rej) => {
    let ms = 100;
    const LIMIT = 15_000;
    let timer = window.setTimeout(function retry() {
      window.clearTimeout(timer);
      const app = document.querySelector('app-consulta-processo');
      if (app == null && ms < LIMIT) {
        ms *= 2;
        window.setTimeout(retry, ms);
      } else if (ms >= LIMIT){
        rej(new Error('timeout'));
      } else {
        res();
      }
    }, ms);
  });
  const numero = await GM.getValue('numero');
  console.log({numero});
  if (! numero) return;
  await GM.deleteValue('numero');
  const input = document.querySelector('input[name="numeroProcesso"]');
  assert(input != null, 'Não foi possível obter o campo do número do processo.');
  const botoes = Array.from(document.querySelectorAll('button')).filter(b => b.textContent.trim().match(/Buscar/) !== null);
  assert(botoes.length === 1, 'Não foi possível obter o botão "Buscar".');
  const botao = botoes[0];
  input.value = numero;
  input.dispatchEvent(new Event('input'));
  const consulta = document.querySelector('app-consulta-processo');
  assert(consulta != null, 'Não foi possível obter consulta.');
  const promise = new Promise(res => {
    const observer = new MutationObserver(x => {
      x.forEach(y => { console.log(y.addedNodes); });
      const rows = x.filter(y => y.target.matches('app-lista-processo mat-row'));
      if (rows.length > 0) {
        observer.disconnect();
        res();
      }
    });
    observer.observe(consulta, { childList: true, subtree: true });
  });
  botao.click();
  await promise;
  const rows = consulta.querySelectorAll('app-lista-processo mat-row');
  if (rows.length === 1) {
    const bc = createBroadcastService('gm-precatorias', validar_mensagem);
    bc.subscribe(({ processo_aberto }) => {
      if (processo_aberto === numero) {
        bc.destroy();
        window.close();
      }
    });
    rows[0].click();
  }
}

async function pdpj_processo() {
  const params = new URL(document.location.href).searchParams;
  const numero_formatado = params.get('processo');
  assert(numero_formatado !== null, 'Número do processo não encontrado.')
  const numero = numero_formatado.replace(/[.-]/g, '');
  assert(/^[0-9]{20}$/.test(numero), `Número de processo inválido: ${numero_formatado}.`);
  const bc = createBroadcastService('gm-precatorias', validar_mensagem);
  bc.publish({ processo_aberto: numero });
  bc.destroy();
}

main().catch(log_erro);

function log_erro(err) {
  console.group('<eproc-cartas-precatorias-externas>');
  console.error(err);
  console.groupEnd();
}

function assert(condition, msg) {
  if (! condition) throw new Error(msg);
}

function createBroadcastService(id, isValidMsg) {
  const listeners = new Set();
  const bc = new BroadcastChannel(id);
  bc.addEventListener('message', onMessage);

  return { destroy, publish, subscribe };

  function onMessage(evt) {
    if (isValidMsg(evt.data))
      for (const listener of listeners) listener(evt.data);
  }

  function destroy() {
    bc.removeEventListener('message', onMessage);
    listeners.clear();
    bc.close();
  }
  function publish(message) {
    bc.postMessage(message);
  }
  function subscribe(listener) {
    listeners.add(listener);
    return {
      unsubscribe() {
        listeners.delete(listener);
      },
    };
  }
}

function validar_mensagem(msg) {
  return typeof msg === 'object' &&
    msg !== null &&
    ('processo_aberto' in msg) &&
    typeof msg.processo_aberto === 'string' &&
    /^[0-9]{20}$/.test(msg.processo_aberto);
}
