import { h } from '@nadameu/create-element';
import { eitherToPromise } from './eitherToPromise';
import css from './estilos.scss?inline';
import { queryOne } from './queryOne';
import { promiseToEither } from './promiseToEither';
import { Either } from '@nadameu/either';

export function paginaListar(): Promise<Either<Error, void>> {
  return promiseToEither(obterLinhasPrev()).then(e =>
    e.map(linhasPrev => {
      document.head.appendChild(h('style', {}, css));

      for (const { linha, json } of linhasPrev) {
        const button = h('button', { type: 'button', className: 'gm-cnis' }, 'Analisar dados CNIS');
        button.addEventListener('click', evt => {
          evt.preventDefault();
          console.log(json.href);
        });
        linha.cells[1]!.append(h('br'), button);
      }
    })
  );
}

interface MinhaTabela extends HTMLTableElement {
  readonly tBodies: HTMLTableElement['tBodies'] & { 0: HTMLTableSectionElement };
}

const isTabelaCorreta = (tabela: HTMLTableElement): tabela is MinhaTabela => {
  if (tabela.tBodies.length !== 1) return false;
  if (tabela.tBodies[0]!.rows.length === 0) return false;
  return true;
};

async function obterLinhasPrev() {
  const tabela = await getTabela();
  const linhas = Array.from(tabela.tBodies[0].rows);
  const linhasDossiePrev: Array<{ linha: HTMLTableRowElement; json: URL }> = [];
  const reJson =
    /^executarAcao\('pessoa_consulta_integrada\/download_json', '([^']+)', this.closest\('tr'\)\);$/;
  const jsonSelector = '.container-acoes-table__desktop > a.btnDownloadJson';
  for (const linha of linhas) {
    if (linha.cells.length < 9) throw new Error('Formato da linha desconhecido.');
    const tipo = linha.cells[1]!.textContent?.trim() ?? '';
    if (tipo !== 'Dossiê Previdenciário') continue;
    const linkJson = await eitherToPromise(
      queryOne<HTMLAnchorElement>(jsonSelector, linha.cells[8]!)
    );
    const href = linkJson.getAttribute('onclick')?.match(reJson)?.[1];
    if (!href) throw new Error('Link desconhecido.');
    const json = new URL(href, document.URL);
    linhasDossiePrev.push({ linha, json });
  }
  if (linhasDossiePrev.length < 1) throw new Error('Nenhum dossiê previdenciário.');
  return linhasDossiePrev;
}

async function getTabela(): Promise<MinhaTabela> {
  const tabela = await eitherToPromise(
    queryOne<HTMLTableElement>('table[id="tbl_pessoa_consulta_integrada"]')
  );
  if (isTabelaCorreta(tabela)) return tabela;
  let timer: number, mo: MutationObserver;
  await Promise.race([
    new Promise<never>((_, rej) => {
      timer = window.setTimeout(
        () => rej(new Error('Não foi possível obter os dados da tabela.')),
        10_000
      );
    }),
    new Promise<void>(res => {
      mo = new MutationObserver(() => {
        if (isTabelaCorreta(tabela)) res();
      });
      mo.observe(tabela, { childList: true, subtree: true });
    }),
  ]).finally(() => {
    window.clearTimeout(timer);
    mo.disconnect();
  });
  return tabela as MinhaTabela;
}
