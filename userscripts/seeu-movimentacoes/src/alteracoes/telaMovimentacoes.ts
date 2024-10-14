import { GM_addStyle, GM_deleteValue, GM_getValue, GM_setValue } from '$';
import {
  D,
  Just,
  M,
  Nothing,
  S,
  T,
  applicativeMaybe,
  isJust,
  tuple,
} from '@nadameu/adts';
import { h } from '@nadameu/create-element';
import { pipe } from '@nadameu/pipe';
import * as P from '@nadameu/predicates';
import { createIntersectionObserver } from '../createIntersectionObserver';
import { configurarAbertura } from './configurarAbertura';
import css from './estilos-seeu.scss?inline';
import { esconderDica, mostrarDica, moverDica } from './mostrarDica';
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

  const links = pipe(
    document,
    D.xqueryAll<HTMLImageElement>(
      '//img[starts-with(@id, "iconmovimentacoes")]'
    ),
    S.map((link, i) =>
      pipe(
        link,
        D.xquery<HTMLElement>(
          'ancestor::tr/following-sibling::*[1]/self::tr//*[contains(concat(" ", normalize-space(@class), " "), " extendedinfo ")]'
        ),
        M.map(mutationTarget => ({ link, mutationTarget })),
        M.getOrElse(() => {
          throw new Error(`Lista de eventos não reconhecida: ${i}.`);
        })
      )
    )
  );

  const isAjax = P.hasShape({ Updater: P.isFunction });
  if (!isAjax(Ajax)) {
    throw new Error('Impossível capturar o carregamento de documentos.');
  }

  const oldUpdater = Ajax.Updater;
  Ajax.Updater = function (a, b, c) {
    const matchId = a.match(
      /^divArquivosMovimentacaoProcessomovimentacoes(\d+)$/
    ) as [string, string] | null;
    if (
      !matchId ||
      !/^\/seeu\/processo\/movimentacaoArquivoDocumento\.do\?_tj=/.test(b)
    ) {
      return oldUpdater.call(this, a, b, c);
    }

    const id = matchId[1];
    const img = pipe(
      document,
      D.xquery<HTMLImageElement>(`//img[@id = "iconmovimentacoes${id}"]`),
      M.getOrElse(() => {
        throw new Error(`Imagem não encontrada: #iconmovimentacoes${id}.`);
      })
    );
    if (/iPlus.gif$/.test(img.src)) {
      /* Não recarregar documentos quando a linha é fechada */
      return;
    }

    return oldUpdater.call(this, a, b, {
      ...c,
      onComplete() {
        try {
          const resultado = null as any;
          // const resultado = c.onComplete(...arguments);
          console.log(arguments[0].response.replace(/\s+/g, ' '));

          const div = document.getElementById(a);
          if (!div) {
            throw new Error(`Elemento não encontrado: #${a}.`);
          }

          const tabelas =
            div.querySelectorAll<HTMLTableElement>(':scope > table');
          if (!P.arrayHasLength(1)(tabelas)) {
            throw new Error(`Tabela referente a #${a} não encontrada.`);
          }

          const tabela = tabelas[0];

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
      if (link.src.match(/iPlus/)) {
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
  let currentDica: HTMLElement | null = null;
  document.addEventListener('mouseover', e => {
    if (e.target instanceof HTMLElement && e.target.matches('[data-gm-dica]')) {
      currentDica = e.target;
      mostrarDica(currentDica.dataset.gmDica!);
      currentDica.addEventListener('mousemove', moverDica);
    }
  });
  document.addEventListener('mouseout', e => {
    if (currentDica && e.target === currentDica) {
      currentDica.removeEventListener('mousemove', moverDica);
      esconderDica();
      currentDica = null;
    }
  });

  const tabela = pipe(
    document,
    D.query<HTMLTableElement>('table.resultTable'),
    M.getOrElse(() => {
      throw new Error('Tabela de movimentações não encontrada.');
    })
  );
  const [colgroup, linhaCabecalho] = pipe(
    tabela,
    T.fanout(
      D.xquery<Element>('colgroup'),
      D.xquery<HTMLTableRowElement>('thead/tr')
    ),
    T.sequence(applicativeMaybe),
    M.getOrElse(() => {
      throw new Error('Elementos da tabela de movimentações não encontrados.');
    })
  );
  const linhas = pipe(tabela, D.xqueryAll<HTMLTableRowElement>('tbody/tr'));

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
      pipe(
        document,
        D.queryAll(`.${classNames.ultimoClicado}`),
        S.map(x => x.classList.remove(classNames.ultimoClicado!))
      );
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
      const features =
        ((): string | null => {
          const tipo = GM_getValue(Parametros.TIPO_ABERTURA);
          if (P.isLiteral('padrao')(tipo)) return null;
          if (P.isLiteral('janela')(tipo)) {
            const parametros = GM_getValue(Parametros.PARAMETROS_JANELA);
            if (
              P.hasShape({
                top: P.isInteger,
                left: P.isInteger,
                width: P.isNonNegativeInteger,
                height: P.isNonNegativeInteger,
              })(parametros)
            ) {
              return Object.entries(parametros)
                .map(([key, value]) => `${key}=${value.toString(10)}`)
                .join(',');
            }
          }
          GM_setValue(Parametros.TIPO_ABERTURA, 'padrao');
          GM_deleteValue(Parametros.PARAMETROS_JANELA);
          return null;
        })() ?? undefined;
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
  return pipe(
    table.rows,
    S.map((linha, l) => {
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
      const sequencialNome = pipe(
        linha.cells[0],
        x => x.childNodes,
        S.filter(x => !(x instanceof Text) || x.nodeValue?.trim() !== ''),
        M.maybeBool(
          P.isAnyOf(
            P.isTuple(P.isInstanceOf(Text)),
            P.isTuple(
              P.isInstanceOf(Text),
              P.isInstanceOf(HTMLAnchorElement),
              P.isInstanceOf(HTMLElement)
            )
          )
        ),
        M.map(([texto, ...obs]) =>
          tuple(texto, obs.length === 2 ? Just(obs) : Nothing)
        ),
        M.flatMap(([texto, observacao]) =>
          pipe(
            M.fromNullable(texto.nodeValue),
            M.mapNullable(
              x =>
                x.match(/^\s*(\d+\.\d+)\s+Arquivo:\s+(.*)\s*$/) as
                  | [string, string, string]
                  | null
            ),
            M.map(([, sequencial, nome]) => ({
              sequencial,
              nome: nome || 'Outros',
              observacao,
            }))
          )
        ),
        M.getOrElse(() => {
          throw new Error(`Sequencial e nome não reconhecidos: ${l}.`);
        })
      );
      const assinatura = pipe(
        linha.cells[2],
        D.text,
        M.mapNullable(
          x => x.match(/^\s*Ass\.:\s+(.*)\s*$/) as [string, string] | null
        ),
        M.map(([, assinatura]) => assinatura),
        M.getOrElse(() => {
          throw new Error(`Assinatura não reconhecida: ${l}.`);
        })
      );
      const infoLink = pipe(
        linha.cells[4],
        (
          celula
        ): {
          menu: Node | string;
          popup: Node | string;
          link: HTMLAnchorElement;
          play: Node | undefined;
        } => {
          const opcao1 = pipe(
            celula,
            c => c.childNodes,
            S.filter(
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
          return pipe(
            celula,
            D.xquery<HTMLAnchorElement>('.//strike//a[@href]'),
            M.map(link => {
              link.classList.add(classNames.struck!);
              return link;
            }),
            M.map(link => ({ menu: '', popup: '', link, play: undefined })),
            M.getOrElse(() => {
              throw new Error(`Link para documento não reconhecido: ${l}.`);
            })
          );
        }
      );
      const sigilo = pipe(
        linha.cells[6],
        D.text,
        M.map(x => x.trim()),
        M.filter(x => x !== ''),
        M.getOrElse(() => {
          throw new Error(`Nível de sigilo não reconhecido: ${l}.`);
        })
      );
      const { sequencial, nome, observacao } = sequencialNome;
      const { menu, popup, link, play } = infoLink;
      {
        link.title = `${link.title?.trim() ?? ''}\n\nAss.: ${assinatura}\n\n${sigilo}`;
        const frag = document.createDocumentFragment();
        frag.append(menu, popup);
        pipe(
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
    linhas => {
      table.replaceChildren(
        ...linhas.map((children, r) => {
          const tr = h('tr', { className: r % 2 === 0 ? 'even' : 'odd' });

          for (const child of children) {
            tr.append(h('td', {}, child));
          }

          if (P.arrayHasLength(1)(tr.cells)) {
            tr.className = 'incidente';
            tr.cells[0].colSpan = 4;
          }
          return tr;
        })
      );
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
