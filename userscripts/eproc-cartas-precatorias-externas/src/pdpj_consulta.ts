import { GM } from '$';
import { createBroadcastService } from '@nadameu/create-broadcast-service';
import * as P from '@nadameu/predicates';
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
  const input = P.check(
    P.isNotNull,
    document.querySelector<HTMLInputElement>('input[name="numeroProcesso"]'),
    'Não foi possível obter o campo do número do processo.'
  );
  const result_botao = document
    .querySelectorAll('button')
    .values()
    .filter(b => /Buscar/.test(b.textContent.trim()))
    .take(2)
    .reduce(
      (_, value, i): { is_ok: true; value: typeof value } | { is_ok: false } =>
        i === 0 ? { is_ok: true, value } : { is_ok: false },
      { is_ok: false }
    );
  if (!result_botao.is_ok) {
    throw new Error('Não foi possível obter o botão "Buscar".');
  }
  const botao = result_botao.value;
  input.value = numero;
  input.dispatchEvent(new Event('input'));
  const consulta = P.check(
    P.isNotNull,
    document.querySelector('app-consulta-processo'),
    'Não foi possível obter consulta.'
  );
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
  if (P.arrayHasLength(1)(rows)) {
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
