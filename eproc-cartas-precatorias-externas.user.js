// ==UserScript==
// @name        eproc-cartas-precatorias-externas
// @namespace   http://nadameu.com.br
// @match       https://eproc.jfsc.jus.br/eprocV2/controlador.php?acao=relatorio_processo_carta_precatoria_listar&*
// @match       https://portaldeservicos.pdpj.jus.br/consulta
// @match       https://portaldeservicos.pdpj.jus.br/consulta/autosdigitais
// @grant       GM_addStyle
// @grant       GM.deleteValue
// @grant       GM.getValue
// @grant       GM.setValue
// @grant       window.close
// @version     1.0.0
// @author      nadameu
// @description Permite consultar cartas precatórias externas através do serviço www.jus.br
// ==/UserScript==

async function main() {
  switch (document.domain) {
    case 'eproc.jfpr.jus.br':
    case 'eproc.jfrs.jus.br':
    case 'eproc.jfsc.jus.br':
    case 'eproc.trf4.jus.br':
      return main_eproc();
      break;

    case 'portaldeservicos.pdpj.jus.br':
      return main_pdpj();
      break;

    default:
      throw new Error(`Domínio desconhecido: ${document.domain}.`);
  }
}

function main_eproc() {
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
    botao.textContent = 'Consultar (PDPJ)';
    botao.onclick = (e) => {
      e.preventDefault();
      document.querySelector('button.gm-precatorias.gm-clicked')?.classList.toggle('gm-clicked', false);
      botao.classList.add('gm-clicked');
      (async () => {
        await GM.setValue('numero', numero);
        window.open('https://portaldeservicos.pdpj.jus.br/consulta', '_blank');
      })();
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

function main_pdpj() {
  switch (document.location.pathname) {
    case '/consulta':
      return main_pdpj_consulta();
      break;

    case '/consulta/autosdigitais':
      return main_pdpj_processo();
      break;

    default:
      throw new Error(`Caminho desconhecido: ${document.location.pathname}.`);
  }
}

async function main_pdpj_consulta() {
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

async function main_pdpj_processo() {
  const params = new URL(document.location.href).searchParams;
  const numero_formatado = params.get('processo');
  assert(numero_formatado !== null, 'Número do processo não encontrado.')
  const numero = numero_formatado.replace(/[.-]/g, '');
  assert(/^[0-9]{20}$/.test(numero), `Número de processo inválido: ${numero_formatado}.`);
  const bc = createBroadcastService('gm-precatorias', validar_mensagem);
  bc.publish({ processo_aberto: numero });
  bc.destroy();
}

main().catch(err => {
  console.group('<eproc-cartas-precatorias-externas>');
  console.error(err);
  console.groupEnd();
});

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
