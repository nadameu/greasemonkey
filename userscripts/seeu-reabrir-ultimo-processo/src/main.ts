import { h } from '@nadameu/create-element';
import * as pkg from '../package.json';
import styles from './estilos.scss?inline';

const LOG_PREFIX = `<${pkg.gm_name}>`;
const LOCAL_STORAGE_VALUE = 'REABRIR_ULTIMO';

const resultado = main();
if (resultado && resultado instanceof Error) {
  console.group(LOG_PREFIX);
  console.error(resultado);
  console.groupEnd();
}

function main(): Error | void {
  if (
    document.location.href.match(
      /^https:\/\/seeu\.pje\.jus\.br\/seeu\/historicoProcessosRecursos\.do\?actionType=listar$/
    )
  ) {
    if (window.localStorage.getItem(pkg.name) === LOCAL_STORAGE_VALUE) {
      window.localStorage.removeItem(pkg.name);
      const links = document.querySelectorAll<HTMLAnchorElement>(
        'table.resultTable a.link[href^="/seeu/historicoProcessosRecursos.do?"]'
      );
      if (links.length === 0)
        return new Error('Não há processos no histórico.');
      links[0]!.click();
    }
    return;
  }
  const header = document.querySelector('seeu-header');
  if (!header || !header.shadowRoot)
    return new Error('Cabeçalho não encontrado.');
  header.shadowRoot.appendChild(h('style', {}, styles));
  const link = header.shadowRoot.querySelector<HTMLElement>(
    'seeu-icon[name="mdi:history"]'
  );
  if (!link) return new Error('Link não encontrado.');

  const botao = link.cloneNode(true) as HTMLElement;
  botao.id = 'gm-seeu-reabrir__button';
  botao.setAttribute('name', 'mdi:reload');
  botao.dataset.tooltip = 'Reabrir último processo';
  botao.addEventListener('click', evt => {
    evt.preventDefault();
    window.localStorage.setItem(pkg.name, LOCAL_STORAGE_VALUE);
    link.click();
  });
  link.parentElement!.insertBefore(botao, link);
}
