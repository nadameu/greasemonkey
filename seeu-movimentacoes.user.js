// ==UserScript==
// @name         seeu-movimentacoes
// @name:pt-BR   SEEU - Movimentações
// @namespace    nadameu.com.br
// @version      2.3.1
// @author       nadameu
// @description  Melhoria na apresentação das movimentações do processo
// @match        https://seeu.pje.jus.br/*
// @grant        GM_addStyle
// ==/UserScript==

(t => {
  if (typeof GM_addStyle == 'function') {
    GM_addStyle(t);
    return;
  }
  const d = document.createElement('style');
  (d.textContent = t), document.head.append(d);
})(
  ' ._dica_1a6d3_1{position:absolute;border:1px solid #408;background:hsl(66,25%,93%);max-width:25%}td a._struck_1a6d3_8{cursor:not-allowed}td a._struck_1a6d3_8,td a._struck_1a6d3_8:hover{text-decoration:line-through} '
);

(function () {
  'use strict';

  var __defProp = Object.defineProperty;
  var __defNormalProp = (obj, key, value) =>
    key in obj
      ? __defProp(obj, key, {
          enumerable: true,
          configurable: true,
          writable: true,
          value,
        })
      : (obj[key] = value);
  var __publicField = (obj, key, value) => {
    __defNormalProp(obj, typeof key !== 'symbol' ? key + '' : key, value);
    return value;
  };
  const concat = (l, r) => l.concat(r);
  const semigroupArray = { concat };
  const tag = _type => _tag => props => Object.assign(props, { _type, _tag });
  const isTagged = _tag => obj => obj._tag === _tag;
  const tagMaybe = /* @__PURE__ */ tag('Maybe');
  const Just = value => tagMaybe('Just')({ value });
  const isJust = /* @__PURE__ */ isTagged('Just');
  const Nothing = /* @__PURE__ */ tagMaybe('Nothing')({});
  const isNothing = /* @__PURE__ */ isTagged('Nothing');
  const tagEither = /* @__PURE__ */ tag('Either');
  const Left = left => tagEither('Left')({ left });
  const isLeft = /* @__PURE__ */ isTagged('Left');
  const Right = right => tagEither('Right')({ right });
  const isRight = /* @__PURE__ */ isTagged('Right');
  const deriveMap = M => f => M.flatMap(x => M.of(f(x)));
  const deriveAp = M => fa => ff =>
    M.flatMap(f => M.flatMap(a => M.of(f(a)))(fa))(ff);
  const deriveLift2 = M => f => (fa, fb) =>
    M.ap(fb)(M.map(a => b => f(a, b))(fa));
  const of$1 = Right;
  const match = (f, g) => fa => (isLeft(fa) ? f(fa.left) : g(fa.right));
  const flatMapBoth = match;
  const flatMap$1 = f => fa => (isRight(fa) ? f(fa.right) : fa);
  const mapBoth = (f, g) =>
    flatMapBoth(
      e => Left(f(e)),
      a => Right(g(a))
    );
  const map$2 = /* @__PURE__ */ deriveMap({ of: of$1, flatMap: flatMap$1 });
  const ap = /* @__PURE__ */ deriveAp({ of: of$1, flatMap: flatMap$1 });
  const mapLeft = f => fa => (isLeft(fa) ? Left(f(fa.left)) : fa);
  const eitherBool = pred => a => (pred(a) ? Right(a) : Left(a));
  const merge = fa => (isLeft(fa) ? fa.left : fa.right);
  const orElse$1 = f => fa => (isRight(fa) ? fa : f(fa.left));
  const applicativeEither = { ap, map: map$2, of: of$1 };
  const flatMap = f => fa => (isNothing(fa) ? Nothing : f(fa.value));
  const of = Just;
  const map$1 = /* @__PURE__ */ deriveMap({ of, flatMap });
  const orElse = ifNothing => fa => (isNothing(fa) ? ifNothing() : fa);
  const fromNullable = value => (value == null ? Nothing : Just(value));
  const mapNullable = f => flatMap(x => fromNullable(f(x)));
  const getOrElse = getDefault => fa =>
    isNothing(fa) ? getDefault() : fa.value;
  const maybeBool = pred => a => (pred(a) ? Just(a) : Nothing);
  const filter$1 = pred => flatMap(maybeBool(pred));
  const toEither = whenLeft => fb =>
    isNothing(fb) ? Left(whenLeft()) : Right(fb.value);
  const query = selector => parentNode =>
    fromNullable(parentNode.querySelector(selector));
  const queryAll = selector => parentNode =>
    parentNode.querySelectorAll(selector);
  const text = node => fromNullable(node.textContent);
  const identity = x => x;
  const tailRec = (seed, f) => {
    let result = f(seed);
    while (isLeft(result)) result = f(result.left);
    return result.right;
  };
  const constant = a => _ => a;
  const tagList = /* @__PURE__ */ tag('List');
  const Cons = (head, tail) => tagList('Cons')({ head, tail });
  const Nil = /* @__PURE__ */ tagList('Nil')({});
  const isNil = /* @__PURE__ */ isTagged('Nil');
  class Concat {
    constructor(left, right) {
      __publicField(this, 'length');
      this.left = left;
      this.right = right;
      this.length = left.length + right.length;
    }
    *[Symbol.iterator]() {
      let left = this.left;
      let rights = Cons(this.right, Nil);
      while (true) {
        while (left instanceof Concat) {
          rights = Cons(left.right, rights);
          left = left.left;
        }
        yield* left;
        if (isNil(rights)) return;
        left = rights.head;
        rights = rights.tail;
      }
    }
  }
  const fromGen =
    gen =>
    (...args) => [...gen(...args)];
  const empty = () => [];
  const append = (xs, x) => (xs.length === 0 ? [x] : new Concat(xs, [x]));
  const map = f =>
    fromGen(function* (fa, i = 0) {
      for (const a of fa) yield f(a, i++);
    });
  const foldLeft = (seed, f) => fa => {
    let acc = seed,
      i = 0;
    for (const a of fa) acc = f(acc, a, i++);
    return acc;
  };
  const foldMap = M => f =>
    foldLeft(M.empty(), (bs, a, i) => M.concat(bs, f(a, i)));
  const fold = M => foldMap(M)(identity);
  const traverse = M => f => fa => {
    const lifted = deriveLift2(M)(append);
    return M.map(xs => [...xs])(
      foldLeft(M.of(empty()), (ftb, a, i) => lifted(ftb, f(a, i)))(fa)
    );
  };
  const sequence$1 = M => traverse(M)(identity);
  const filterMap = f =>
    fromGen(function* (fa, i = 0) {
      for (const a of fa) {
        const maybe = f(a, i++);
        if (isJust(maybe)) yield maybe.value;
      }
    });
  const filter = pred => filterMap((a, i) => (pred(a, i) ? Just(a) : Nothing));
  const toNonEmptyArray = seq => (seq.length === 0 ? Nothing : Just([...seq]));
  const monoidString = {
    empty: () => '',
    concat: (l, r) => `${l}${r}`,
  };
  const tuple = (...values) => values;
  const sequence = sequence$1;
  const makeApplicativeValidation = M => ({
    map: map$2,
    of: of$1,
    ap: fa => ff =>
      isLeft(ff)
        ? isLeft(fa)
          ? Left(M.concat(ff.left, fa.left))
          : ff
        : isLeft(fa)
        ? fa
        : Right(ff.right(fa.right)),
  });
  function pipe(x) {
    let y = x;
    for (let i = 1, len = arguments.length; i < len; i += 1) {
      y = arguments[i](y);
    }
    return y;
  }
  var _GM_addStyle = /* @__PURE__ */ (() =>
    typeof GM_addStyle != 'undefined' ? GM_addStyle : void 0)();
  const isInstanceOf = Constructor => obj => obj instanceof Constructor;
  function refine(...predicates) {
    return value => predicates.every(p => p(value));
  }
  function isAnyOf(...predicates) {
    return value => predicates.some(p => p(value));
  }
  const isArray = x => Array.isArray(x);
  const isTuple = (...predicates) =>
    refine(isArray, xs => {
      if (xs.length !== predicates.length) return false;
      for (let i = 0; i < predicates.length; i += 1) {
        if (!predicates[i](xs[i])) return false;
      }
      return true;
    });
  const createObserver = nativeObserver => {
    const callbacks = /* @__PURE__ */ new Map();
    const obs = nativeObserver(callbacks);
    return {
      observe(key, callback) {
        if (!callbacks.has(key)) {
          callbacks.set(key, /* @__PURE__ */ new Set());
        }
        callbacks.get(key).add(callback);
        obs.observe(key);
        return {
          unobserve() {
            var _a, _b;
            (_a = callbacks.get(key)) == null ? void 0 : _a.delete(callback);
            if (
              ((_b = callbacks.get(key)) == null ? void 0 : _b.size) ??
              true
            ) {
              callbacks.delete(key);
              if (callbacks.size === 0) {
                obs.disconnect();
              }
            }
          },
        };
      },
    };
  };
  const createIntersectionObserver = () =>
    createObserver(
      callbacks =>
        new IntersectionObserver(entries => {
          for (const entry of entries) {
            if (entry.isIntersecting && callbacks.has(entry.target)) {
              for (const callback of callbacks.get(entry.target)) {
                callback();
              }
            }
          }
        })
    );
  const createMutationObserver = () =>
    createObserver(callbacks => {
      const mut = new MutationObserver(records => {
        for (const record of records) {
          if (callbacks.has(record.target)) {
            for (const callback of callbacks.get(record.target)) {
              for (const node of record.addedNodes) {
                callback(node);
              }
            }
          }
        }
      });
      return {
        disconnect() {
          mut.disconnect();
        },
        observe(key) {
          mut.observe(key, { childList: true, subtree: true });
        },
      };
    });
  const css =
    'table.resultTable>tbody>tr{--cor-pessoa: #444}table.resultTable>tbody>tr:not([id^=rowmovimentacoes])>td:nth-last-child(3){background:linear-gradient(to bottom right,var(--cor-pessoa) 50%,transparent 50%) top left/12px 12px no-repeat}table.resultTable>tbody>tr[id*=",JUIZ,"]{--cor-pessoa: #698e23}table.resultTable>tbody>tr[id*=",JUIZ,"]>td:nth-last-child(3){border:1px solid var(--cor-pessoa)}table.resultTable>tbody>tr[id*=",SERVIDOR,"]{--cor-pessoa: #698e23}table.resultTable>tbody>tr[id*=",PROMOTOR,"]{--cor-pessoa: #236e8e}table.resultTable>tbody>tr[id*=",ADVOGADO,"]{--cor-pessoa: #8e3523}table.resultTable>tbody>tr[id*=",OUTROS,"]{--cor-pessoa: #595959}td a.link{display:inline-block;background-position-y:.5em}table.resultTable thead>tr>th{padding:0 5px}table.resultTable tr div.extendedinfo{border:none;margin:0;width:auto}table.resultTable table.form{margin:0 0 4px;width:calc(100% - 4px);border-collapse:collapse;border:1px solid}table.resultTable table.form td{width:auto;padding:0;vertical-align:top!important}table.resultTable table.form td:nth-child(1){width:36px;text-align:center;padding-left:6px;padding-right:2px}table.resultTable table.form td:nth-child(2){width:16px;text-align:center;padding:5px 0 4px}table.resultTable table.form td:nth-child(3){width:89%}table.resultTable table.form tr.odd{background:hsl(333,34.8%,91%)}table.resultTable table.form tr.even{background:hsl(333,33.3%,97.1%)}table.resultTable table.form .ajaxCalloutGenericoHelp{display:inline;margin-right:4px}\n';
  const dica$1 = '_dica_1a6d3_1';
  const struck = '_struck_1a6d3_8';
  const classNames = {
    dica: dica$1,
    struck,
  };
  let dica = null;
  function criarDica() {
    const dica2 = document.createElement('div');
    dica2.hidden = true;
    dica2.className = classNames.dica;
    document.body.appendChild(dica2);
    return dica2;
  }
  function mostrarDica(html) {
    if (!dica) {
      dica = criarDica();
    }
    dica.innerHTML = html;
    dica.hidden = false;
  }
  const distanciaDoMouse = 16;
  const margemBorda = 2 * distanciaDoMouse;
  const intervalMs = 16;
  let lastTime = Date.now();
  let lastE;
  let timer = null;
  function moverDica(e) {
    lastE = e;
    const curTime = Date.now();
    if (curTime < lastTime + intervalMs) {
      if (timer === null) {
        timer = window.setTimeout(() => {
          timer = null;
          moverDica(lastE);
        }, intervalMs);
      }
      return;
    }
    lastTime = curTime;
    let x = e.clientX;
    let y = e.clientY;
    const { width, height } = dica.getBoundingClientRect();
    const { width: docWidth, height: docHeight } =
      document.documentElement.getBoundingClientRect();
    if (x + distanciaDoMouse + width > docWidth - margemBorda) {
      x -= distanciaDoMouse + width - window.scrollX;
    } else {
      x += distanciaDoMouse + window.scrollX;
    }
    if (y + distanciaDoMouse + height > docHeight - margemBorda) {
      y -= distanciaDoMouse + height - window.scrollY;
    } else {
      y += distanciaDoMouse + window.scrollY;
    }
    dica.style.left = `${x}px`;
    dica.style.top = `${y}px`;
  }
  function esconderDica() {
    dica.hidden = true;
  }
  const telaMovimentacoes = url =>
    pipe(
      url.pathname,
      maybeBool(x =>
        [
          '/seeu/visualizacaoProcesso.do',
          '/seeu/processo.do',
          '/seeu/processo/buscaProcesso.do',
        ].includes(x)
      ),
      flatMap(() =>
        pipe(
          document,
          query('li[name="tabMovimentacoesProcesso"].currentTab'),
          map$1(() => {
            return pipe(
              document,
              queryAll('img[id^=iconmovimentacoes]'),
              map((link, i) =>
                pipe(
                  link.closest('tr'),
                  fromNullable,
                  mapNullable(x => x.nextElementSibling),
                  filter$1(x => x.matches('tr')),
                  flatMap(query('.extendedinfo')),
                  map$1(mutationTarget => ({ link, mutationTarget })),
                  toEither(() => `Lista de eventos não reconhecida: ${i}.`)
                )
              ),
              sequence$1(applicativeEither),
              map$2(links => {
                const obs = createIntersectionObserver();
                const mut = createMutationObserver();
                for (const { link, mutationTarget } of links) {
                  mut.observe(mutationTarget, node => {
                    if (!(node instanceof HTMLTableElement)) return;
                    pipe(
                      onTabelaAdicionada(node),
                      mapLeft(err => {
                        console.log(
                          '<SEEU - Movimentações>',
                          'Erro encontrado:',
                          err
                        );
                      }),
                      merge
                    );
                  });
                  const { unobserve } = obs.observe(link, () => {
                    unobserve();
                    link.click();
                  });
                }
                const janelasAbertas = /* @__PURE__ */ new Map();
                const onDocumentClick = createOnDocumentClick(janelasAbertas);
                document.addEventListener('click', onDocumentClick);
                window.addEventListener('beforeunload', () => {
                  for (const win of janelasAbertas.values()) {
                    if (!win.closed) win.close();
                  }
                });
                let currentDica = null;
                document.addEventListener('mouseover', e => {
                  if (
                    e.target instanceof HTMLElement &&
                    e.target.matches('[data-gm-dica]')
                  ) {
                    currentDica = e.target;
                    mostrarDica(currentDica.dataset.gmDica);
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
                  queryAll('table.resultTable > tbody > tr'),
                  map(row => {
                    if (row.cells.length === 1) {
                      const previousRow = row.previousElementSibling;
                      if (previousRow instanceof HTMLTableRowElement) {
                        row.insertCell(0).colSpan =
                          previousRow.cells.length - 1;
                        row.cells[1].colSpan = 1;
                      }
                    } else {
                      const len = row.cells.length;
                      const colunaDataHora = len - 3;
                      pipe(
                        row.cells,
                        map((cell, i) => {
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
                  query('table.resultTable > colgroup'),
                  map$1(g => {
                    g.appendChild(document.createElement('col'));
                    return g;
                  }),
                  map$1(g => {
                    pipe(g.children, cols => {
                      pipe(
                        cols,
                        filter(isInstanceOf(HTMLElement)),
                        map((col, i) => {
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
                  query('table.resultTable > thead > tr'),
                  map$1(row => {
                    const th = document.createElement('th');
                    th.textContent = 'Documentos';
                    row.appendChild(th);
                    for (const th2 of row.cells) {
                      th2.removeAttribute('style');
                    }
                  })
                );
              })
            );
          }),
          orElse(() => Just(of$1(void 0))),
          map$1(either => {
            _GM_addStyle(css);
            return either;
          })
        )
      )
    );
  function createOnDocumentClick(janelasAbertas) {
    return function onDocumentClick(evt) {
      if (
        evt.target instanceof HTMLElement &&
        evt.target.matches('a[href][data-gm-doc-link]')
      ) {
        const link = evt.target;
        evt.preventDefault();
        const id = link.dataset.gmDocLink;
        if (janelasAbertas.has(id)) {
          const win2 = janelasAbertas.get(id);
          if (!win2.closed) {
            win2.focus();
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
        janelasAbertas.set(id, win);
      }
    };
  }
  const onTabelaAdicionada = table =>
    pipe(
      table.rows,
      traverse(applicativeEither)((linha, l) => {
        if (linha.cells.length !== 7)
          return Left(`Formato de linha desconhecido: ${l}.`);
        const sequencialNome = pipe(
          linha.cells[0],
          x => x.childNodes,
          filter(x => {
            var _a;
            return (
              !(x instanceof Text) ||
              ((_a = x.nodeValue) == null ? void 0 : _a.trim()) !== ''
            );
          }),
          maybeBool(
            isAnyOf(
              isTuple(isInstanceOf(Text)),
              isTuple(
                isInstanceOf(Text),
                isInstanceOf(HTMLAnchorElement),
                isInstanceOf(HTMLElement)
              )
            )
          ),
          map$1(([texto, ...obs]) =>
            tuple(texto, obs.length === 2 ? Just(obs) : Nothing)
          ),
          flatMap(([texto, observacao]) =>
            pipe(
              texto,
              x => x.nodeValue,
              x =>
                fromNullable(x.match(/^\s*(\d+\.\d+)\s+Arquivo:\s+(.*)\s*$/)),
              filter$1(x => x.length === 3),
              map$1(([, sequencial, nome]) => ({
                sequencial,
                nome: nome || 'Outros',
                observacao,
              }))
            )
          ),
          toEither(() => `Sequencial e nome não reconhecidos: ${l}.`)
        );
        const assinatura = pipe(
          linha.cells[2],
          text,
          mapNullable(x => x.match(/^\s*Ass\.:\s+(.*)\s*$/)),
          filter$1(x => x.length === 2),
          map$1(([, assinatura2]) => ({ assinatura: assinatura2 })),
          toEither(() => `Assinatura não reconhecida: ${l}.`)
        );
        const link = pipe(linha.cells[4], celula =>
          pipe(
            celula,
            c => c.childNodes,
            filter(
              x => !(x instanceof Text && /^\s*$/.test(x.nodeValue ?? ''))
            ),
            eitherBool(
              isAnyOf(
                isTuple(
                  isInstanceOf(HTMLImageElement),
                  isInstanceOf(HTMLDivElement),
                  isInstanceOf(HTMLAnchorElement)
                ),
                isTuple(
                  isInstanceOf(HTMLImageElement),
                  isInstanceOf(HTMLDivElement),
                  isInstanceOf(HTMLAnchorElement),
                  isInstanceOf(HTMLAnchorElement)
                )
              )
            ),
            map$2(childNodes => {
              const [menu, popup, link2, play] = childNodes;
              return { menu, popup, link: link2, play };
            }),
            orElse$1(() =>
              pipe(
                celula,
                query('strike'),
                flatMap(query('a[href]')),
                map$1(link2 => {
                  link2.classList.add(classNames.struck);
                  return link2;
                }),
                map$1(link2 => ({
                  menu: '',
                  popup: '',
                  link: link2,
                  play: void 0,
                })),
                toEither(() => null)
              )
            ),
            mapLeft(() => `Link para documento não reconhecido: ${l}.`)
          )
        );
        const result = pipe(
          tuple(sequencialNome, assinatura, link),
          sequence(applicativeEither),
          map$2(
            ([
              { sequencial, nome, observacao },
              { assinatura: assinatura2 },
              { menu, popup, link: link2, play },
            ]) => {
              var _a;
              link2.title = `${
                ((_a = link2.title) == null ? void 0 : _a.trim()) ?? ''
              }

Ass.: ${assinatura2}`;
              const frag = document.createDocumentFragment();
              frag.append(menu, popup);
              pipe(
                link2.href,
                href => new URL(href),
                u => fromNullable(u.searchParams.get('_tj')),
                map$1(getId),
                map$1(id => {
                  link2.dataset.gmDocLink = id.toString(36);
                })
              );
              const file = document.createDocumentFragment();
              const span = document.createElement('span');
              span.style.fontWeight = 'bold';
              span.textContent = nome.replace(/_/g, ' ');
              file.append(span, document.createElement('br'));
              if (play) {
                file.append(play);
              }
              file.append(link2);
              if (isJust(observacao)) {
                file.append(document.createElement('br'), ...observacao.value);
              }
              return [sequencial, frag, file];
            }
          )
        );
        return result;
      }),
      map$2(linhas => {
        table.replaceChildren(
          ...pipe(
            linhas,
            map((linha, r) => {
              const tr = document.createElement('tr');
              tr.classList.add(r % 2 === 0 ? 'even' : 'odd');
              return foldLeft(tr, (tr2, i) => {
                const td = document.createElement('td');
                td.append(i);
                tr2.append(td);
                return tr2;
              })(linha);
            })
          )
        );
      })
    );
  function getId(sp) {
    return pipe(
      tailRec({ acc: [], curr: sp }, ({ acc, curr }) =>
        curr.length > 0
          ? Left({
              acc: [...acc, curr.slice(0, 8)],
              curr: curr.slice(8),
            })
          : Right(acc)
      ),
      x => x.slice(6, 8),
      map(x => parseInt(x, 16)),
      foldLeft(0n, (acc, x) => acc * 4294967296n + BigInt(x))
    );
  }
  const alteracoes = /* @__PURE__ */ Object.freeze(
    /* @__PURE__ */ Object.defineProperty(
      {
        __proto__: null,
        telaMovimentacoes,
      },
      Symbol.toStringTag,
      { value: 'Module' }
    )
  );
  const main = () => {
    const url = new URL(document.location.href);
    return pipe(
      Object.entries(alteracoes),
      filterMap(([name, f]) =>
        pipe(f(url), map$1(mapLeft(err => [`[${name}]: ${err}`])))
      ),
      toNonEmptyArray,
      map$1(sequence$1(makeApplicativeValidation(semigroupArray))),
      getOrElse(() => Left([`Página não reconhecida: ${url.pathname}.`])),
      mapBoth(fold(monoidString), constant(void 0))
    );
  };
  pipe(
    main(),
    mapLeft(err => {
      console.log('<SEEU - Movimentações>', 'Erro encontrado:', err);
    })
  );
})();
