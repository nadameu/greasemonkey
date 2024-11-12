import { GM_addStyle, GM_getValue, GM_setValue } from '$';
import {
  A,
  applicativeMaybe,
  D,
  flow,
  I,
  isJust,
  isNothing,
  Just,
  M,
  Nothing,
  T,
} from '@nadameu/adts';
import { h } from '@nadameu/create-element';
import * as P from '@nadameu/predicates';
import { createIntersectionObserver } from '../createIntersectionObserver';
import { configurarAbertura } from './configurarAbertura';
import { DadosAbertura, dadosAberturaToFeatures } from './dadosAbertura';
import css from './estilos-seeu.scss?inline';
import * as Parametros from './parametros';
import classNames from './telaMovimentacoes.module.scss';

const caminhosValidos = [
  '/seeu/visualizacaoProcesso.do',
  '/seeu/processo.do',
  '/seeu/processo/juntarDocumento.do',
  '/seeu/processo/buscaProcesso.do',
  '/seeu/processo/criminal/execucao/buscaProcessoExecucao.do',
];

export function telaMovimentacoes(url: URL): null {
  if (!caminhosValidos.includes(url.pathname)) return null;

  const abaCorreta =
    document.querySelector('li[name="tabMovimentacoesProcesso"].currentTab') !==
    null;
  if (!abaCorreta) return null;

  const links = flow(
    document,
    D.xqueryAll<HTMLImageElement>(
      '//img[starts-with(@id, "iconmovimentacoes")]'
    ),
    I.map((link, i) =>
      flow(
        link,
        D.xquery<HTMLElement>(
          'ancestor::tr/following-sibling::*[1]/self::tr//*[contains(concat(" ", normalize-space(@class), " "), " extendedinfo ")]'
        ),
        M.getOrThrow(`Lista de eventos não reconhecida: ${i}.`),
        mutationTarget => ({ link, mutationTarget })
      )
    )
  );

  const isAjax = P.hasShape({ Updater: P.isFunction });
  P.assert(isAjax(Ajax), 'Impossível capturar o carregamento de documentos.');

  const oldUpdater = Ajax.Updater;
  Ajax.Updater = function (a, b, c) {
    const regA = /^divArquivosMovimentacaoProcessomovimentacoes(\d+)$/;
    const regB = /^\/seeu\/processo\/movimentacaoArquivoDocumento\.do\?_tj=/;

    const maybeId = (() => {
      if (!regB.test(b)) return Nothing;
      return M.match<2>(regA)(a);
    })();

    if (isNothing(maybeId)) {
      return oldUpdater.call(this, a, b, c);
    }

    const id = maybeId.value[1];
    const img = flow(
      document,
      D.xquery<HTMLImageElement>(`//img[@id = "iconmovimentacoes${id}"]`),
      M.getOrThrow(`Imagem não encontrada: #iconmovimentacoes${id}.`)
    );
    if (/iPlus.gif$/.test(img.src)) {
      /* Não recarregar documentos quando a linha é fechada */
      return;
    }

    return oldUpdater.call(this, a, b, {
      ...c,
      onComplete() {
        try {
          const resultado = c.onComplete(...arguments);

          const div = P.check(
            P.isNotNull,
            document.getElementById(a),
            `Elemento não encontrado: #${a}.`
          );

          const tabela = P.check(
            P.arrayHasLength(1),
            div.querySelectorAll<HTMLTableElement>(':scope > table'),
            `Tabela referente a #${a} não encontrada.`
          )[0];

          div.parentNode
            ?.querySelector(`.${classNames.avisoCarregando}`)
            ?.remove();

          onTabelaAdicionada(tabela);

          return resultado;
        } catch (err) {
          console.group('<SEEU - Movimentações>');
          console.error(err);
          console.groupEnd();
        }
      },
    });
  };
  Ajax.Updater.prototype = oldUpdater.prototype;

  const obs = createIntersectionObserver();
  for (const { link, mutationTarget } of links) {
    const aviso = h(
      'div',
      { className: classNames.avisoCarregando },
      'Carregando lista de documentos...'
    );

    const { unobserve } = obs.observe(link, () => {
      unobserve();
      link.click();
    });

    link.addEventListener('click', () => {
      if (/iPlus/.test(link.src)) {
      } else {
        mutationTarget.querySelector(':scope > table')?.remove();
        mutationTarget.parentNode!.insertBefore(aviso, mutationTarget);
      }
    });
  }

  const janelasAbertas = new Map<string, Window>();
  const { exibirBotaoFechar } = criarBotaoJanelasAbertas(janelasAbertas);
  const onDocumentClick = createOnDocumentClick({
    janelasAbertas,
    exibirBotaoFechar,
  });
  document.addEventListener('click', onDocumentClick);
  window.addEventListener('beforeunload', () => {
    if (GM_getValue(Parametros.FECHAR_AUTOMATICAMENTE, true)) {
      for (const win of janelasAbertas.values()) {
        if (!win.closed) win.close();
      }
    }
  });

  const tabela = flow(
    document,
    D.query<HTMLTableElement>('table.resultTable'),
    M.getOrThrow('Tabela de movimentações não encontrada.')
  );
  const [colgroup, linhaCabecalho] = flow(
    tabela,
    T.fanout(
      D.xquery<Element>('colgroup'),
      D.xquery<HTMLTableRowElement>('thead/tr')
    ),
    T.sequence(applicativeMaybe),
    M.getOrThrow('Elementos da tabela de movimentações não encontrados.')
  );
  const linhas = flow(tabela, D.xqueryAll<HTMLTableRowElement>('tbody/tr'));

  for (const linha of linhas) {
    if (P.arrayHasLength(1)(linha.cells)) {
      const previousRow = linha.previousElementSibling;
      if (previousRow instanceof HTMLTableRowElement) {
        linha.insertCell(0).colSpan = previousRow.cells.length - 1;
        linha.cells[1]!.colSpan = 1;
      }
    } else {
      const len = linha.cells.length;
      const colunaDataHora = len - 3;
      for (const [i, cell] of Object.entries(linha.cells)) {
        if (Number(i) !== colunaDataHora) {
          cell.removeAttribute('nowrap');
        }
      }
      linha.insertCell();
    }
  }

  colgroup.append(h('col'));
  const cols = colgroup.children as HTMLCollectionOf<HTMLElement>;
  for (const [i, col] of Object.entries(cols)) {
    col.removeAttribute('width');
    switch (Number(i)) {
      case cols.length - 3:
        col.style.width = '40%';
        break;
      case cols.length - 2:
        col.style.width = '15%';
        break;
      case cols.length - 1:
        col.style.width = '30%';
        break;
    }
  }

  const fechar = h('input', {
    type: 'checkbox',
    checked: GM_getValue<boolean>(Parametros.FECHAR_AUTOMATICAMENTE, true),
    onclick: () => {
      GM_setValue(Parametros.FECHAR_AUTOMATICAMENTE, fechar.checked);
    },
  });
  tabela.insertAdjacentElement(
    'beforebegin',
    h(
      'div',
      { className: classNames.divConfigurarAbertura },
      h(
        'button',
        {
          type: 'button',
          onclick: e => {
            e.preventDefault();
            configurarAbertura();
          },
        },
        'Configurar abertura de documentos'
      ),
      h('br'),
      h(
        'label',
        {},
        fechar,
        ' ',
        'Fechar automaticamente documentos abertos ao sair'
      )
    )
  );

  const th = h('th', {}, 'Documentos');
  linhaCabecalho.appendChild(th);
  for (const th of linhaCabecalho.cells) {
    th.removeAttribute('style');
  }

  GM_addStyle(css);
  return null;
}
function createOnDocumentClick({
  janelasAbertas,
  exibirBotaoFechar,
}: {
  janelasAbertas: Map<string, Window>;
  exibirBotaoFechar: () => void;
}) {
  return function onDocumentClick(evt: Event) {
    if (
      evt.target instanceof HTMLElement &&
      evt.target.matches('a[href][data-gm-doc-link]')
    ) {
      evt.preventDefault();
      const link = evt.target as HTMLAnchorElement;
      document
        .querySelectorAll(`.${classNames.ultimoClicado}`)
        .forEach(x => x.classList.remove(classNames.ultimoClicado!));
      link.classList.add(classNames.ultimoClicado!);
      exibirBotaoFechar();
      const id = link.dataset.gmDocLink!;
      if (janelasAbertas.has(id)) {
        const win = janelasAbertas.get(id)!;
        if (!win.closed) {
          win.focus();
          return;
        }
      }

      const features = dadosAberturaToFeatures(DadosAbertura.carregar());
      const win = window.open(link.href, `doc${id}`, features);
      janelasAbertas.set(id, win!);
    }
  };
}
function criarBotaoJanelasAbertas(janelasAbertas: Map<string, Window>) {
  const menu = window.parent?.document.querySelector('ul#main-menu');
  if (!menu) {
    console.log('Não encontrado.');
    return { exibirBotaoFechar() {} };
  }
  const doc = menu.ownerDocument;
  const fechar = doc.createElement('li');
  fechar.className = 'gm-seeu-movimentacoes__fechar-janelas-abertas';
  fechar.style.display = 'none';
  const link = doc.createElement('a');
  link.href = '#';
  link.textContent = 'Fechar janelas abertas';
  link.addEventListener('click', onClick);
  fechar.appendChild(link);
  menu.appendChild(fechar);
  window.addEventListener('beforeunload', () => {
    link.removeEventListener('click', onClick);
    menu.removeChild(fechar);
  });
  return {
    exibirBotaoFechar() {
      fechar.style.display = '';
    },
  };

  function onClick(evt: Event) {
    evt.preventDefault();
    for (const janela of janelasAbertas.values()) {
      if (!janela.closed) {
        janela.close();
      }
    }
    janelasAbertas.clear();
    fechar.style.display = 'none';
  }
}
function onTabelaAdicionada(table: HTMLTableElement) {
  return flow(
    table.rows,
    I.map((linha, l) => {
      if (!P.arrayHasLength(7)(linha.cells)) {
        if (
          linha.classList.contains('linhaPeticao') &&
          P.arrayHasLength(1)(linha.cells) &&
          linha.cells[0].colSpan === 7
        ) {
          const frag = document.createDocumentFragment();
          frag.append(...linha.cells[0].childNodes);
          return [frag];
        }
        throw new Error(`Formato de linha desconhecido: ${l}.`);
      }
      const isTextoObservacoes = P.isAnyOf(
        P.isTuple(P.isInstanceOf(Text)),
        P.isTuple(
          P.isInstanceOf(Text),
          P.isInstanceOf(HTMLAnchorElement),
          P.isInstanceOf(HTMLElement)
        )
      );
      const sequencialNome = flow(
        linha.cells[0].childNodes,
        A.filter(x => !(x instanceof Text) || P.isNonEmptyString(x.nodeValue)),
        M.maybeBool(isTextoObservacoes),
        M.flatMap(([texto, ...obs]) =>
          flow(
            M.fromNullable(texto.nodeValue),
            M.flatMap(M.match<3>(/^\s*(\d+\.\d+)\s+Arquivo:\s+(.*)\s*$/)),
            M.map(([, sequencial, nome]) => ({
              sequencial,
              nome: nome || 'Outros',
              observacao: obs.length === 2 ? Just(obs) : Nothing,
            }))
          )
        ),
        M.getOrThrow(`Sequencial e nome não reconhecidos: ${l}.`)
      );
      const assinatura = flow(
        linha.cells[2],
        D.text,
        M.flatMap(M.match<2>(/^\s*Ass\.:\s+(.*)\s*$/)),
        M.map(([, assinatura]) => assinatura),
        M.getOrThrow(`Assinatura não reconhecida: ${l}.`)
      );
      const infoLink = flow(
        linha.cells[4],
        (
          celula
        ): {
          menu: Node | string;
          popup: Node | string;
          link: HTMLAnchorElement;
          play: Node | undefined;
        } => {
          const opcao1 = flow(
            celula,
            c => c.childNodes,
            A.filter(
              x => !(x instanceof Text && /^\s*$/.test(x.nodeValue ?? ''))
            ),
            M.maybeBool(
              P.isAnyOf(
                P.isTuple(
                  P.isInstanceOf(HTMLImageElement),
                  P.isInstanceOf(HTMLDivElement),
                  P.isInstanceOf(HTMLAnchorElement)
                ),
                P.isTuple(
                  P.isInstanceOf(HTMLImageElement),
                  P.isInstanceOf(HTMLDivElement),
                  P.isInstanceOf(HTMLAnchorElement),
                  P.isInstanceOf(HTMLAnchorElement)
                )
              )
            ),
            M.map(childNodes => {
              const [menu, popup, link, play] = childNodes;
              return { menu, popup, link, play };
            })
          );
          if (isJust(opcao1)) return opcao1.value;
          return flow(
            celula,
            D.xquery<HTMLAnchorElement>('.//strike//a[@href]'),
            M.map(link => {
              link.classList.add(classNames.struck!);
              return link;
            }),
            M.map(link => ({ menu: '', popup: '', link, play: undefined })),
            M.getOrThrow(`Link para documento não reconhecido: ${l}.`)
          );
        }
      );
      const sigilo = flow(
        linha.cells[6],
        D.text,
        M.map(x => x.trim()),
        M.filter(x => x !== ''),
        M.getOrThrow(`Nível de sigilo não reconhecido: ${l}.`)
      );
      const { sequencial, nome, observacao } = sequencialNome;
      const { menu, popup, link, play } = infoLink;
      {
        link.title = `${link.title?.trim() ?? ''}\n\nAss.: ${assinatura}\n\n${sigilo}`;
        const frag = document.createDocumentFragment();
        frag.append(menu, popup);
        flow(
          link.href,
          href => new URL(href),
          u => M.fromNullable(u.searchParams.get('_tj')),
          M.map(getId),
          M.map(id => {
            link.dataset.gmDocLink = id.toString(36);
          })
        );
        const file = document.createDocumentFragment();
        const span = h(
          'span',
          { style: { fontWeight: 'bold' } },
          nome.replace(/_/g, ' ')
        );
        file.append(span, h('br'));
        if (play) {
          file.append(play);
        }
        link.textContent = link.textContent!.trim();
        file.append(link);
        if (isJust(observacao)) {
          file.append(h('br'), ...observacao.value);
        }
        const cadeado =
          sigilo === 'Público'
            ? ''
            : h('i', { className: 'icon icon-mdi:lock', title: sigilo });
        return [sequencial, frag, file, cadeado];
      }
    }),
    I.map((children, r) => {
      const tr = h('tr', { className: r % 2 === 0 ? 'even' : 'odd' });

      for (const child of children) {
        tr.append(h('td', {}, child));
      }

      if (P.arrayHasLength(1)(tr.cells)) {
        tr.className = 'incidente';
        tr.cells[0].colSpan = 4;
      }
      return tr;
    }),
    linhas => {
      table.replaceChildren(...linhas);
    }
  );
}
function getId(sp: string) {
  let slices: string[] = [];
  for (let curr = sp; curr.length > 0; curr = curr.slice(8)) {
    slices.push(curr.slice(0, 8));
  }
  return slices
    .slice(6, 8)
    .map(x => parseInt(x, 16))
    .reduce((acc, x) => acc * 4294967296n + BigInt(x), 0n);
}
