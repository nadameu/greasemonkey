import { GM_getValue, GM_setValue } from '$';
import { ok } from './Result';

export function parseImprimir() {
  return ok(null).chain(() => {
    if (GM_getValue<boolean>('salvar', false)) {
      GM_setValue('salvar', false);
      window.print = () => undefined;

      const articles = document
        .querySelectorAll<HTMLElement>('#toPrint > #Body > #Content > article')
        .values()
        .map(x => x.innerHTML)
        .toArray();
      window.opener?.postMessage(articles);
      window.close();
    }
    return ok(() => {});
  });
}
