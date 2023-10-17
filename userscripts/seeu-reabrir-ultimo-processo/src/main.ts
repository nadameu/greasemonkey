import { h } from '@nadameu/create-element';
import { createTaggedUnion, Static } from '@nadameu/match';
import * as pkg from '../package.json';
import styles from './estilos.module.scss';

const Resultado = createTaggedUnion({
  SemLink: null,
  UrlAlterado: null,
  ErroDeRede: (erro: Error) => ({ erro }),
  Ok: null,
});
type Resultado = Static<typeof Resultado>;

const PREFIX = `<${pkg.gm_name}>`;
const logInfo = (...args: any[]) => console.info(PREFIX, ...args);
const logErro = (...args: any[]) => console.error(PREFIX, ...args);

const URL_RE = /'\/seeu\/historicoProcessosRecursos\.do\?actionType=listar'/;

handleResultado(main());

function handleResultado(resultado: Resultado) {
  Resultado.match(resultado, {
    SemLink: () => {
      logInfo('Sem link.');
    },
    UrlAlterado: () => {
      logErro('URL alterado.');
    },
    ErroDeRede: erro => {
      logErro(erro);
    },
    Ok: () => {
      logInfo('Botão adicionado.');
    },
  });
}

function main() {
  if (
    document.location.href.match(
      /^https:\/\/seeu\.pje\.jus\.br\/seeu\/historicoProcessosRecursos\.do\?actionType=listar$/
    )
  ) {
    if (window.localStorage.getItem(pkg.name) === 'REABRIR_ULTIMO') {
      window.localStorage.removeItem(pkg.name);
      const links = document.querySelectorAll<HTMLAnchorElement>(
        'table.resultTable a.link[href^="/seeu/historicoProcessosRecursos.do?"]'
      );
      if (links.length === 0) return Resultado.SemLink;
      links[0]!.click();
    }
    return Resultado.SemLink;
  }
  if (!unsafeWindow.openDialogHistoricoProcessosRecursos) return Resultado.SemLink;
  if (!URL_RE.test(unsafeWindow.openDialogHistoricoProcessosRecursos.toString()))
    return Resultado.UrlAlterado;
  const link = document.querySelector<HTMLAnchorElement>(
    '#userinfo #shortcuts > a#history.shortcuts'
  );
  if (
    link &&
    link.getAttribute('href') === "javascript: openDialogHistoricoProcessosRecursos('');"
  ) {
    const botao = h(
      'button',
      { type: 'button', className: styles.botao },
      'Reabrir último processo'
    );
    botao.addEventListener('click', evt => {
      evt.preventDefault();
      window.localStorage.setItem(pkg.name, 'REABRIR_ULTIMO');
      link.click();
    });
    link.parentElement!.insertAdjacentElement('afterbegin', botao);
    return Resultado.Ok;
  } else {
    return Resultado.SemLink;
  }
}
