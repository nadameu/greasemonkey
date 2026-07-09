import { GM_deleteValue, GM_getValue, unsafeWindow } from '$';
import { Mensagem } from './Mensagem';
import { lift_throwable } from './try_catch';

export function parseImprimir() {
  const segredo = GM_getValue('salvar') as string | undefined;
  GM_deleteValue('salvar');
  if (segredo !== undefined) {
    unsafeWindow.print = lift_throwable(() => {
      const estilos = [
        ...document.querySelectorAll<HTMLLinkElement>(
          'link[rel="stylesheet"][href^="css/estilos-editor"]'
        ),
      ].map(e => {
        const clone = e.cloneNode(true) as HTMLLinkElement;
        clone.href = new URL(clone.href, document.location.href).href;
        return clone.outerHTML;
      });

      const minutas = document
        .querySelectorAll<HTMLElement>('#toPrint > #Body > #Content > article')
        .values()
        .map((article, index) => {
          const titulo =
            article
              .querySelector<HTMLElement>(
                'section[data-nome="titulo"] + section'
              )
              ?.dataset.nome_apresentacao?.replace(/(\/|\s|-)+/g, '_') ??
            'Minuta';
          const codigo =
            article.querySelector<HTMLElement>(
              'footer span[data-codigo_documento_rodape]'
            )?.dataset.codigo_documento_rodape ??
            (index + 1).toString().padStart(12, '0');
          const html = article.innerHTML;
          return { titulo, codigo, html };
        })
        .toArray();
      const mensagem: Mensagem = { segredo, estilos, minutas };

      window.opener?.postMessage(mensagem);
      window.close();
    });
  }
}
