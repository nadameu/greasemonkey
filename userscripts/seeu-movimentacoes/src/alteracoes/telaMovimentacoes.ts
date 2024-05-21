import { GM_addStyle, GM_deleteValue, GM_getValue, GM_setValue } from '$';
import {
  D,
  E,
  Just,
  Left,
  M,
  Nothing,
  Right,
  S,
  T,
  applicativeEither,
  isJust,
  tailRec,
  tuple,
} from '@nadameu/adts';
import { h } from '@nadameu/create-element';
import { pipe } from '@nadameu/pipe';
import * as P from '@nadameu/predicates';
import { createIntersectionObserver } from '../createIntersectionObserver';
import { createMutationObserver } from '../createMutationObserver';
import { configurarAbertura } from './configurarAbertura';
import css from './estilos-seeu.scss?inline';
import { esconderDica, mostrarDica, moverDica } from './mostrarDica';
import {
  FECHAR_AUTOMATICAMENTE,
  PARAMETROS_JANELA,
  TIPO_ABERTURA,
} from './parametros';
import classNames from './telaMovimentacoes.module.scss';

export const telaMovimentacoes = (url: URL) =>
  pipe(
    url.pathname,
    M.maybeBool(x =>
      [
        '/seeu/visualizacaoProcesso.do',
        '/seeu/processo.do',
        '/seeu/processo/juntarDocumento.do',
        '/seeu/processo/buscaProcesso.do',
      ].includes(x)
    ),
    M.flatMap(() =>
      pipe(
        document,
        D.query('li[name="tabMovimentacoesProcesso"].currentTab'),
        M.map(() => {
          return pipe(
            document,
            D.queryAll<HTMLImageElement>('img[id^=iconmovimentacoes]'),
            S.map((link, i) =>
              pipe(
                link.closest('tr'),
                M.fromNullable,
                M.mapNullable(x => x.nextElementSibling),
                M.filter(x => x.matches('tr')),
                M.flatMap(D.query('.extendedinfo')),
                M.map(mutationTarget => ({ link, mutationTarget })),
                M.toEither(() => `Lista de eventos não reconhecida: ${i}.`)
              )
            ),
            S.sequence(applicativeEither),
            E.map(links => {
              const obs = createIntersectionObserver();
              const mut = createMutationObserver();
              for (const { link, mutationTarget } of links) {
                const aviso = h(
                  'div',
                  { className: classNames.avisoCarregando },
                  'Carregando lista de documentos...'
                );
                mut.observe(mutationTarget, node => {
                  if (!(node instanceof HTMLTableElement)) return;
                  if (link.src.match(/iPlus/)) {
                    node.style.display = 'none';
                    return;
                  }
                  if (aviso.parentNode) {
                    aviso.remove();
                  }
                  pipe(
                    onTabelaAdicionada(node),
                    E.mapLeft(err => {
                      console.log(
                        '<SEEU - Movimentações>',
                        'Erro encontrado:',
                        err
                      );
                    }),
                    E.merge
                  );
                });

                const { unobserve } = obs.observe(link, () => {
                  unobserve();
                  link.click();
                });

                link.addEventListener('click', () => {
                  if (link.src.match(/iPlus/)) {
                    if (aviso.parentNode) {
                      aviso.remove();
                    }
                    const tabela = mutationTarget.querySelector('table');
                    if (tabela) {
                      tabela.style.display = 'none';
                    }
                  } else {
                    mutationTarget.parentNode!.insertBefore(
                      aviso,
                      mutationTarget
                    );
                  }
                });
              }

              const janelasAbertas = new Map<string, Window>();
              const { exibirBotaoFechar } =
                criarBotaoJanelasAbertas(janelasAbertas);
              const onDocumentClick = createOnDocumentClick({
                janelasAbertas,
                exibirBotaoFechar,
              });
              document.addEventListener('click', onDocumentClick);
              window.addEventListener('beforeunload', () => {
                if (GM_getValue(FECHAR_AUTOMATICAMENTE, true)) {
                  for (const win of janelasAbertas.values()) {
                    if (!win.closed) win.close();
                  }
                }
              });
              let currentDica: HTMLElement | null = null;
              document.addEventListener('mouseover', e => {
                if (
                  e.target instanceof HTMLElement &&
                  e.target.matches('[data-gm-dica]')
                ) {
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
              pipe(
                document,
                D.queryAll<HTMLTableRowElement>(
                  'table.resultTable > tbody > tr'
                ),
                S.map(row => {
                  if (row.cells.length === 1) {
                    const previousRow = row.previousElementSibling;
                    if (previousRow instanceof HTMLTableRowElement) {
                      row.insertCell(0).colSpan = previousRow.cells.length - 1;
                      row.cells[1]!.colSpan = 1;
                    }
                  } else {
                    const len = row.cells.length;
                    const colunaDataHora = len - 3;
                    pipe(
                      row.cells,
                      S.map((cell, i) => {
                        if (i !== colunaDataHora) {
                          cell.removeAttribute('nowrap');
                        }
                      })
                    );
                    row.insertCell();
                  }
                })
              );
              pipe(
                document,
                D.query('table.resultTable > colgroup'),
                M.map(g => {
                  g.appendChild(h('col'));
                  return g;
                }),
                M.map(g => {
                  pipe(g.children, cols => {
                    pipe(
                      cols,
                      S.filter(P.isInstanceOf(HTMLElement)),
                      S.map((col, i) => {
                        col.removeAttribute('width');
                        switch (i) {
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
                      })
                    );
                  });
                })
              );
              pipe(
                document,
                D.query<HTMLTableElement>('table.resultTable'),
                M.map(tabela => {
                  const configurar = h(
                    'button',
                    { type: 'button' },
                    'Configurar abertura de documentos'
                  );
                  configurar.addEventListener('click', e => {
                    e.preventDefault();
                    configurarAbertura();
                  });
                  const fechar = h('input', {
                    type: 'checkbox',
                    checked: GM_getValue<boolean>(FECHAR_AUTOMATICAMENTE, true),
                  });
                  fechar.addEventListener('click', () => {
                    GM_setValue(FECHAR_AUTOMATICAMENTE, fechar.checked);
                  });
                  tabela.insertAdjacentElement(
                    'beforebegin',
                    h(
                      'div',
                      { className: classNames.divConfigurarAbertura },
                      configurar,
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
                  return tabela;
                }),
                M.flatMap(D.query<HTMLTableRowElement>(':scope > thead > tr')),
                M.map(row => {
                  const th = h('th', {}, 'Documentos');
                  row.appendChild(th);
                  for (const th of row.cells) {
                    th.removeAttribute('style');
                  }
                })
              );
            })
          );
        }),
        M.orElse(() => Just(E.of<void, string>(void 0))),
        M.map(either => {
          GM_addStyle(css);
          return either;
        })
      )
    )
  );
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
          const tipo = GM_getValue(TIPO_ABERTURA);
          if (P.isAnyOf(P.isLiteral('padrao'), P.isLiteral('janela'))(tipo)) {
            if (tipo === 'padrao') return null;
            const parametros = GM_getValue(PARAMETROS_JANELA);
            if (
              P.hasShape({
                top: P.isInteger,
                left: P.isInteger,
                width: P.isNonNegativeInteger,
                height: P.isNonNegativeInteger,
              })(parametros)
            ) {
              return Object.entries(parametros)
                .map(([key, value]) => `${key}=${value}`)
                .join(',');
            }
          }
          GM_setValue(TIPO_ABERTURA, 'padrao');
          GM_deleteValue(PARAMETROS_JANELA);
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
    return {
      exibirBotaoFechar() {},
    };
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
const onTabelaAdicionada = (table: HTMLTableElement) =>
  pipe(
    table.rows,
    S.traverse(applicativeEither)((linha, l) => {
      if (linha.cells.length !== 7) {
        if (
          linha.classList.contains('linhaPeticao') &&
          linha.cells.length === 1 &&
          linha.cells[0]!.colSpan === 7
        ) {
          const frag = document.createDocumentFragment();
          frag.append(...linha.cells[0]!.childNodes);
          return Right([frag]);
        }
        return Left(`Formato de linha desconhecido: ${l}.`);
      }
      const sequencialNome = pipe(
        linha.cells[0]!,
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
            texto,
            x => x.nodeValue!,
            x =>
              M.fromNullable(x.match(/^\s*(\d+\.\d+)\s+Arquivo:\s+(.*)\s*$/)),
            M.filter((x): x is [string, string, string] => x.length === 3),
            M.map(([, sequencial, nome]) => ({
              sequencial,
              nome: nome || 'Outros',
              observacao,
            }))
          )
        ),
        M.toEither(() => `Sequencial e nome não reconhecidos: ${l}.`)
      );
      const assinatura = pipe(
        linha.cells[2]!,
        D.text,
        M.mapNullable(x => x.match(/^\s*Ass\.:\s+(.*)\s*$/)),
        M.filter((x): x is [string, string] => x.length === 2),
        M.map(([, assinatura]) => ({ assinatura })),
        M.toEither(() => `Assinatura não reconhecida: ${l}.`)
      );
      const link = pipe(linha.cells[4]!, celula =>
        pipe(
          celula,
          c => c.childNodes,
          S.filter(
            x => !(x instanceof Text && /^\s*$/.test(x.nodeValue ?? ''))
          ),
          E.eitherBool(
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
          E.map(childNodes => {
            const [menu, popup, link, play] = childNodes;
            return { menu, popup, link, play };
          }),
          E.orElse(() =>
            pipe(
              celula,
              D.query('strike'),
              M.flatMap(D.query<HTMLAnchorElement>('a[href]')),
              M.map(link => {
                link.classList.add(classNames.struck!);
                return link;
              }),
              M.map(link => ({ menu: '', popup: '', link, play: undefined })),
              M.toEither(() => null)
            )
          ),
          E.mapLeft(() => `Link para documento não reconhecido: ${l}.`)
        )
      );
      const sigilo = pipe(
        linha.cells[6]!,
        D.text,
        M.map(x => x.trim()),
        M.filter(x => x !== ''),
        M.map(sigilo => ({ sigilo })),
        M.toEither(() => `Nível de sigilo não reconhecido: ${l}.`)
      );
      const result = pipe(
        tuple(sequencialNome, assinatura, link, sigilo),
        T.sequence(applicativeEither),
        E.map(
          ([
            { sequencial, nome, observacao },
            { assinatura },
            { menu, popup, link, play },
            { sigilo },
          ]) => {
            link.title = `${
              link.title?.trim() ?? ''
            }\n\nAss.: ${assinatura}\n\n${sigilo}`;
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
            const span = h('span', {}, nome.replace(/_/g, ' '));
            span.style.fontWeight = 'bold';
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
        )
      );
      return result;
    }),
    E.map(linhas => {
      table.replaceChildren(
        ...pipe(
          linhas,
          S.map((linha, r) =>
            S.foldLeft<string | Node, HTMLTableRowElement>(
              h('tr', { className: r % 2 === 0 ? 'even' : 'odd' }),
              (tr, node) => {
                tr.append(h('td', {}, node as string | HTMLElement));
                if (linha.length === 1) {
                  tr.className = 'incidente';
                  tr.cells[0]!.colSpan = 4;
                }
                return tr;
              }
            )(linha)
          )
        )
      );
    })
  );
function getId(sp: string) {
  return pipe(
    tailRec({ acc: [] as string[], curr: sp }, ({ acc, curr }) =>
      curr.length > 0
        ? Left({
            acc: [...acc, curr.slice(0, 8)],
            curr: curr.slice(8),
          })
        : Right(acc)
    ),
    x => x.slice(6, 8),
    S.map(x => parseInt(x, 16)),
    S.foldLeft(0n, (acc, x) => acc * 4294967296n + BigInt(x))
  );
}
