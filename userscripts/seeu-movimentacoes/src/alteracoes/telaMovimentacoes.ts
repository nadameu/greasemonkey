import { GM_addStyle, GM_getValue, GM_info, GM_setValue } from '$';
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
import css from './estilos-seeu.scss?inline';
import { esconderDica, mostrarDica, moverDica } from './mostrarDica';
import classNames from './telaMovimentacoes.module.scss';

export const telaMovimentacoes = (url: URL) =>
  pipe(
    url.pathname,
    M.maybeBool(x =>
      [
        '/seeu/visualizacaoProcesso.do',
        '/seeu/processo.do',
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
                  aviso.textContent = 'Atualizando lista de documentos...';
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
              const onDocumentClick = createOnDocumentClick(janelasAbertas);
              document.addEventListener('click', onDocumentClick);
              window.addEventListener('beforeunload', () => {
                for (const win of janelasAbertas.values()) {
                  if (!win.closed) win.close();
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
                  const botao = h(
                    'button',
                    { type: 'button' },
                    'Configurar abertura de documentos'
                  );
                  const div = h(
                    'div',
                    { className: classNames.divConfigurarAbertura },
                    botao
                  );
                  botao.addEventListener('click', e => {
                    e.preventDefault();
                    onConfigurarClick();
                  });
                  tabela.insertAdjacentElement('beforebegin', div);
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
function createOnDocumentClick(janelasAbertas: Map<string, Window>) {
  return function onDocumentClick(evt: Event) {
    if (
      evt.target instanceof HTMLElement &&
      evt.target.matches('a[href][data-gm-doc-link]')
    ) {
      const link = evt.target as HTMLAnchorElement;
      evt.preventDefault();
      const id = link.dataset.gmDocLink!;
      if (janelasAbertas.has(id)) {
        const win = janelasAbertas.get(id)!;
        if (!win.closed) {
          win.focus();
          return;
        }
      }
      const win = window.open(
        link.href,
        `doc${id}`,
        `top=0,left=${(window.screen.width / 6) | 0},width=${
          ((window.screen.width * 2) / 3) | 0
        },height=${window.screen.availHeight}`
      );
      janelasAbertas.set(id, win!);
    }
  };
}
const onTabelaAdicionada = (table: HTMLTableElement) =>
  pipe(
    table.rows,
    S.traverse(applicativeEither)((linha, l) => {
      if (linha.cells.length !== 7)
        return Left(`Formato de linha desconhecido: ${l}.`);
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
      const result = pipe(
        tuple(sequencialNome, assinatura, link),
        T.sequence(applicativeEither),
        E.map(
          ([
            { sequencial, nome, observacao },
            { assinatura },
            { menu, popup, link, play },
          ]) => {
            link.title = `${link.title?.trim() ?? ''}\n\nAss.: ${assinatura}`;
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
            file.append(link);
            if (isJust(observacao)) {
              file.append(h('br'), ...observacao.value);
            }
            return [sequencial, frag, file];
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
              (tr, i) => {
                tr.append(h('td', {}, i as string));
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
function onConfigurarClick() {
  const win = window.open(
    'about:blank',
    '_blank',
    'top=0,left=0,width=800,height=450'
  );
  if (!win) {
    window.alert(
      [
        'Ocorreu um erro ao tentar configurar a abertura de documentos.',
        'Verifique se há permissão para abertura de janelas "pop-up".',
      ].join('\n')
    );
    return;
  }
  win.addEventListener('load', () => {
    win.document.title = 'Configurar abertura de documentos';
    const saida = document.createDocumentFragment();
    let padrao: HTMLInputElement,
      janela: HTMLInputElement,
      salvar: HTMLButtonElement,
      cancelar: HTMLButtonElement;
    let valor = GM_getValue<'padrao' | 'janela'>(GM_info.script.name, 'padrao');
    saida.append(
      h('h1', {}, 'Configurar abertura de documentos'),
      h('p', {}, 'Selecione a forma de abertura de documentos:'),
      h(
        'p',
        {},
        h(
          'label',
          {},
          (padrao = h('input', {
            type: 'radio',
            name: 'tipo',
            value: 'padrao',
            checked: valor === 'padrao',
          })),
          ' ',
          'Padrão do SEEU (abrir em abas)'
        )
      ),
      h(
        'p',
        {},
        h(
          'label',
          {},
          (janela = h('input', {
            type: 'radio',
            name: 'tipo',
            value: 'janela',
            checked: valor === 'janela',
          })),
          ' ',
          'Abrir em janelas separadas'
        )
      ),
      h(
        'p',
        {},
        (salvar = h('button', { type: 'button' }, 'Salvar')),
        ' ',
        (cancelar = h('button', { type: 'button' }, 'Cancelar'))
      )
    );
    padrao.addEventListener('click', () => {
      valor = 'padrao';
    });
    janela.addEventListener('click', () => {
      valor = 'janela';
    });
    salvar.addEventListener('click', e => {
      e.preventDefault();
      GM_setValue(GM_info.script.name, valor);
      win.close();
    });
    cancelar.addEventListener('click', e => {
      e.preventDefault();
      win.close();
    });
    win.document.body.append(saida);
  });
}
