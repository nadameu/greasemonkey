import { GM } from '$';
import { createBroadcastService } from '@nadameu/create-broadcast-service';
import { assert } from '@nadameu/predicates';
import { validar_mensagem } from './validar_mensagem';

export async function pdpj_consulta() {
  await new Promise<void>((res, rej) => {
    let ms = 100;
    const LIMIT = 15_000;
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
  const numero = await GM.getValue('numero');
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
  assert(botoes.length === 1, 'Não foi possível obter o botão "Buscar".');
  const botao = botoes[0]!;
  input.value = numero;
  input.dispatchEvent(new Event('input'));
  const consulta = document.querySelector('app-consulta-processo');
  assert(consulta != null, 'Não foi possível obter consulta.');
  const promise = new Promise<void>(res => {
    const observer = new MutationObserver(x => {
      x.forEach(y => {
        console.log(y.addedNodes);
      });
      const rows = x.filter(
        y =>
          y.target instanceof HTMLElement &&
          y.target.matches('app-lista-processo mat-row')
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
  if (rows.length === 1) {
    const bc = createBroadcastService('gm-precatorias', validar_mensagem);
    bc.subscribe(({ processo_aberto }) => {
      if (processo_aberto === numero) {
        bc.destroy();
        window.close();
      }
    });
    rows[0]!.click();
  }
}
