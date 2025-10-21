import { GM } from '$';
import { createBroadcastService } from '@nadameu/create-broadcast-service';
import { arrayHasLength, assert } from '@nadameu/predicates';
import { isMensagem } from './Mensagem';

export async function pdpj_consulta() {
  await new Promise<void>((res, rej) => {
    let ms = 100;
    const LIMIT = 15000;
    let timer = window.setTimeout(function retry() {
      window.clearTimeout(timer);
      const app = document.querySelector('app-consulta-processo');
      if (app == null && ms < LIMIT) {
        ms *= 2;
        window.setTimeout(retry, ms);
      } else if (ms >= LIMIT) {
        rej(new Error('timeout'));
      } else {
        res();
      }
    }, ms);
  });
  const numero = await GM.getValue<string | null>('numero', null);
  console.log({ numero });
  if (!numero) return;
  await GM.deleteValue('numero');
  const input = document.querySelector<HTMLInputElement>(
    'input[name="numeroProcesso"]'
  );
  assert(
    input != null,
    'Não foi possível obter o campo do número do processo.'
  );
  const botoes = Array.from(document.querySelectorAll('button')).filter(
    b => b.textContent.trim().match(/Buscar/) !== null
  );
  assert(arrayHasLength(1)(botoes), 'Não foi possível obter o botão "Buscar".');
  const [botao] = botoes;
  input.value = numero;
  input.dispatchEvent(new Event('input'));
  const consulta = document.querySelector('app-consulta-processo');
  assert(consulta != null, 'Não foi possível obter consulta.');
  const promise = new Promise<void>(res => {
    const observer = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        console.log(mutation.addedNodes);
      });
      const rows = mutations.filter(
        ({ target }) =>
          target instanceof HTMLElement &&
          target.matches('app-lista-processo mat-row')
      );
      if (rows.length > 0) {
        observer.disconnect();
        res();
      }
    });
    observer.observe(consulta, { childList: true, subtree: true });
  });
  botao.click();
  await promise;
  const rows = consulta.querySelectorAll<HTMLElement>(
    'app-lista-processo mat-row'
  );
  if (arrayHasLength(1)(rows)) {
    const bc = createBroadcastService('gm-precatorias', isMensagem);
    bc.subscribe(({ processo_aberto }) => {
      if (processo_aberto === numero) {
        bc.destroy();
        window.close();
      }
    });
    rows[0].click();
  }
}
