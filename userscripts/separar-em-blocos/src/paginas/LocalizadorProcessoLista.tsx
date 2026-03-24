import { createBroadcastService } from '@nadameu/create-broadcast-service';
import { h } from '@nadameu/create-element';
import { createStore, Store } from '@nadameu/create-store';
import { Either, Left, Right, traverse } from '@nadameu/either';
import { Handler } from '@nadameu/handler';
import {
  FromConstructorsWith,
  makeConstructorsWith,
  matchWith,
} from '@nadameu/match';
import * as p from '@nadameu/predicates';
import { createRef, JSX, render } from 'preact';
import { useCallback, useEffect, useState } from 'preact/hooks';
import * as Database from '../database';
import { Bloco } from '../types/Bloco';
import {
  BroadcastMessage,
  isBroadcastMessage,
} from '../types/BroadcastMessage';
import { isNumProc, NumProc } from '../types/NumProc';

interface InfoLinha {
  linha: HTMLTableRowElement;
  checkbox: HTMLInputElement;
  checked: boolean;
}

type MapaProcessos = Map<NumProc, InfoLinha>;

interface InfoBloco extends Bloco {
  nestaPagina: number;
  total: number;
}

export function LocalizadorProcessoLista(): Either<Error, void> {
  const tabela = document.querySelector<HTMLTableElement>(
    'table#tabelaLocalizadores'
  );
  const { desmarcarTodosProcessos, marcarTodosProcessos } = (() => {
    const ret = {
      desmarcarTodosProcessos: () => {},
      marcarTodosProcessos: () => {},
    };
    if (!tabela) return ret;
    const imgInfraCheck = document.getElementById(
      'imgInfraCheck'
    ) as HTMLImageElement | null;
    if (!imgInfraCheck) return ret;
    const lnkInfraCheck = document.getElementById(
      'lnkInfraCheck'
    ) as HTMLAnchorElement | null;
    if (!lnkInfraCheck) return ret;

    ret.desmarcarTodosProcessos = () => {
      imgInfraCheck.title = imgInfraCheck.alt = 'Remover Seleção';
      lnkInfraCheck.click();
    };
    ret.marcarTodosProcessos = () => {
      lnkInfraCheck.click();
    };
    return ret;
  })();

  const linhas = tabela?.rows ?? [];

  const eitherMapa: Either<Error, MapaProcessos> = traverse(
    linhas,
    (linha, i) => {
      if (i === 0) return Right([]);
      const endereco =
        linha.cells[1]?.querySelector<HTMLAnchorElement>('a[href]')?.href;
      if (p.isUndefined(endereco))
        return Left(new Error(`Link do processo não encontrado: linha ${i}.`));
      const numproc = new URL(endereco).searchParams.get('num_processo');
      if (p.isNull(numproc))
        return Left(
          new Error(`Número do processo não encontrado: linha ${i}.`)
        );
      if (!isNumProc(numproc))
        return Left(
          new Error(
            `Número de processo desconhecido: ${JSON.stringify(numproc)}.`
          )
        );
      const checkbox = linha.cells[0]?.querySelector<HTMLInputElement>(
        'input[type=checkbox]'
      );
      if (p.isNullish(checkbox))
        return Left(new Error(`Caixa de seleção não encontrada: linha ${i}.`));
      return Right([
        [numproc, { linha, checkbox, checked: checkbox.checked }] as const,
      ]);
    }
  ).map(entriess => new Map(entriess.flat(1)));
  if (eitherMapa.isLeft) return eitherMapa as Left<Error>;
  const mapa = eitherMapa.rightValue;
  const processosMarcados = new Set<NumProc>();
  const processosNaoMarcados = new Set<NumProc>();
  for (const [numproc, { checked }] of mapa) {
    if (checked) {
      processosMarcados.add(numproc);
    } else {
      processosNaoMarcados.add(numproc);
    }
  }

  const acoes =
    document.getElementById('fldAcoes') ??
    document.getElementById('divInfraAreaTabela');
  if (p.isNull(acoes))
    return Left(new Error('Não foi possível inserir os blocos na página.'));

  const div = acoes.insertAdjacentElement(
    'beforebegin',
    h('div', { className: 'gm-blocos__lista' })
  ) as HTMLDivElement;

  const dialogNomeBloco = h('output', { className: 'gm-blocos__nome' });
  const dialogProcessos = h('output', { className: 'gm-blocos__processos' });
  const dialog = h(
    'dialog',
    { className: 'gm-blocos__dialog' },
    h(
      'form',
      { method: 'dialog' },
      h('div', null, 'Processos do bloco "', dialogNomeBloco, '":'),
      dialogProcessos,
      h('button', null, 'Fechar')
    )
  ) as HTMLDialogElement;
  document.body.appendChild(dialog);

  const Model = makeConstructorsWith('status', {
    init: () => ({}),
    loaded: (blocos: InfoBloco[], aviso?: string) => ({ blocos, aviso }),
    error: (error: unknown) => ({ error }),
  });
  type Model = FromConstructorsWith<'status', typeof Model>;
  const matchModel = matchWith('status')<Model>;

  type CheckboxState = 'checked' | 'unchecked' | 'disabled';

  const AsyncAction = makeConstructorsWith('type', {
    criarBloco: (nome: Bloco['nome']) => ({ nome }),
    excluirBD: () => ({}),
    excluirBloco: (id: Bloco['id']) => ({ id }),
    obterBlocos: () => ({}),
    removerProcessosAusentes: (id: Bloco['id']) => ({ id }),
    renomearBloco: (id: Bloco['id'], nome: Bloco['nome']) => ({ id, nome }),
  });
  type AsyncAction = FromConstructorsWith<'type', typeof AsyncAction>;
  const SyncAction = makeConstructorsWith('type', {
    blocosObtidos: (blocos: Bloco[]) => ({ blocos }),
    checkboxClicado: (id: Bloco['id'] | -1, estadoAnterior: CheckboxState) => ({
      id,
      estadoAnterior,
    }),
    erroCapturado: (aviso: string) => ({ aviso }),
    erroDesconhecido: (erro: unknown) => ({ erro }),
    reset: () => ({}),
  });
  type SyncAction = FromConstructorsWith<'type', typeof SyncAction>;
  const AliasAction = makeConstructorsWith('type', {
    blocosModificados: (blocos: Bloco[]) => ({ blocos }),
    mensagemRecebida: (msg: BroadcastMessage) => ({ msg }),
  });
  type AliasAction = FromConstructorsWith<'type', typeof AliasAction>;

  const Action = { ...AsyncAction, ...SyncAction, ...AliasAction };
  type Action = AsyncAction | SyncAction | AliasAction;

  const bc = createBroadcastService('gm-blocos', isBroadcastMessage);
  const store: Store<Model, Action> = Object.assign(
    {},
    createStore<Model, SyncAction>(() => Model.init(), reducer)
  );
  store.dispatch = handleAliasAction(store)(store.dispatch);
  store.dispatch = handleAsyncAction(store)(store.dispatch);
  bc.subscribe(msg => store.dispatch(Action.mensagemRecebida(msg)));
  const onCliqueTabela = (() => {
    function recalcular() {
      processosMarcados.clear();
      processosNaoMarcados.clear();
      for (const [numproc, info] of mapa) {
        if (info.checkbox.checked) {
          info.checked = true;
          processosMarcados.add(numproc);
        } else {
          info.checked = false;
          processosNaoMarcados.add(numproc);
        }
      }
      update(store.getState());
    }
    let timer: number;
    return () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(recalcular, 100);
    };
  })();
  if (tabela) {
    tabela.addEventListener('click', onCliqueTabela);
  }
  store.subscribe(update);
  store.dispatch(Action.obterBlocos());
  return Right(undefined);

  function update(state: Model) {
    return render(<Main state={state} />, div);
  }

  function reducer(state: Model, action: SyncAction): Model {
    return matchWith('type')<SyncAction>(action)
      .case(
        'blocosObtidos',
        ({ blocos }): Model =>
          matchModel(state)
            .case('error', state => state)
            .otherwise((): Model => {
              const info = blocos.map(
                (bloco): InfoBloco => ({
                  ...bloco,
                  nestaPagina: bloco.processos.filter(numproc =>
                    mapa.has(numproc)
                  ).length,
                  total: bloco.processos.length,
                })
              );
              return Model.loaded(info);
            })
            .get()
      )
      .case(
        'checkboxClicado',
        ({ id, estadoAnterior }): Model =>
          matchModel(state)
            .case('loaded', (state): Model => {
              if (estadoAnterior === 'disabled') return state;
              desmarcarTodosProcessos();
              const processos = (() => {
                if (id === -1) {
                  const processosComBloco = new Set(
                    Array.from(
                      state.blocos.flatMap(({ processos }) =>
                        processos.filter(p => mapa.has(p))
                      )
                    )
                  );
                  return new Set(
                    Array.from(mapa)
                      .filter(([x]) => !processosComBloco.has(x))
                      .map(([numproc]) => numproc)
                  );
                } else {
                  return new Set(
                    state.blocos
                      .filter(x => x.id === id)
                      .flatMap(x => x.processos.filter(x => mapa.has(x)))
                  );
                }
              })();
              for (const [numproc, info] of mapa) {
                const checked = processos.has(numproc);
                info.checked = checked;
                info.checkbox.disabled = !checked;
              }
              marcarTodosProcessos();
              for (const info of mapa.values()) {
                info.checkbox.disabled = false;
              }
              return { ...state };
            })
            .otherwise(state => state)
            .get()
      )
      .case(
        'erroCapturado',
        ({ aviso }): Model =>
          matchModel(state)
            .case('init', () => Model.error(aviso))
            .case('error', state => state)
            .case('loaded', state => ({ ...state, aviso }))
            .get()
      )
      .case(
        'erroDesconhecido',
        ({ erro }): Model =>
          matchModel(state)
            .case('error', state => state)
            .otherwise(() => Model.error(erro))
            .get()
      )
      .case('reset', (): Model => Model.init())
      .get();
  }

  function handleAsyncAction(
    store: Pick<Store<Model, Action>, 'getState' | 'dispatch'>
  ) {
    return (next: Store<Model, Exclude<Action, AsyncAction>>['dispatch']) => {
      return (action: Action): void => {
        const isAsyncAction = (action: Action): action is AsyncAction =>
          Object.keys(AsyncAction).includes(action.type);
        if (!isAsyncAction(action)) return next(action);

        const promise = matchWith('type')<AsyncAction>(action)

          .case('criarBloco', async ({ nome }) => {
            const blocos = await Database.getBlocos();
            if (blocos.some(x => x.nome === nome))
              return Action.erroCapturado(
                `Já existe um bloco com o nome ${JSON.stringify(nome)}.`
              );
            const bloco: Bloco = {
              id: (Math.max(-1, ...blocos.map(x => x.id)) +
                1) as p.NonNegativeInteger,
              nome,
              processos: [],
            };
            return Action.blocosModificados(await Database.createBloco(bloco));
          })
          .case('excluirBD', async (): Promise<Action> => {
            await Database.deleteBlocos();
            return Action.obterBlocos();
          })
          .case(
            'excluirBloco',
            async ({ id }): Promise<Action> =>
              Action.blocosModificados(await Database.deleteBloco(id))
          )
          .case(
            'obterBlocos',
            async (): Promise<Action> =>
              Action.blocosModificados(await Database.getBlocos())
          )
          .case('removerProcessosAusentes', async ({ id }): Promise<Action> => {
            const bloco = await Database.getBloco(id);
            if (!bloco) throw new Error(`Bloco não encontrado: ${id}.`);
            const processos = bloco.processos.filter(x => mapa.has(x));
            return Action.blocosModificados(
              await Database.updateBloco({ ...bloco, processos })
            );
          })
          .case('renomearBloco', async ({ id, nome }): Promise<Action> => {
            const blocos = await Database.getBlocos();
            const bloco = blocos.find(x => x.id === id);
            if (!bloco) throw new Error(`Bloco não encontrado: ${id}.`);
            const others = blocos.filter(x => x.id !== id);
            if (others.some(x => x.nome === nome))
              return Action.erroCapturado(
                `Já existe um bloco com o nome ${JSON.stringify(nome)}.`
              );
            return Action.blocosModificados(
              await Database.updateBloco({ ...bloco, nome })
            );
          })
          .get();
        promise.catch(Action.erroDesconhecido).then(store.dispatch);
        if (action.type === 'obterBlocos') return next(Action.reset());
      };
    };
  }

  function handleAliasAction(
    _store: Pick<Store<Model, Action>, 'dispatch' | 'getState'>
  ) {
    return (next: Store<Model, SyncAction>['dispatch']) => {
      return (action: SyncAction | AliasAction): void => {
        const replaced = matchWith('type')(action)
          .case('blocosModificados', ({ blocos }) => {
            bc.publish({ type: 'Blocos', blocos });
            return Action.blocosObtidos(blocos);
          })
          .case('mensagemRecebida', ({ msg: { blocos } }) =>
            Action.blocosObtidos(blocos)
          )
          .otherwise(s => s)
          .get();
        return next(replaced);
      };
    };
  }

  function Main({ state }: { state: Model }) {
    return matchModel(state)
      .case('error', state => <ShowError reason={state.error} />)
      .case('loaded', state => <Blocos state={state} />)
      .case('init', () => <Loading />)
      .get();
  }

  function Loading() {
    return <>Carregando...</>;
  }

  function ShowError({ reason }: { reason: unknown }) {
    const message = messageFromReason(reason);

    return (
      <>
        <div class="gm-erro">{message}</div>
        <button onClick={() => store.dispatch(Action.obterBlocos())}>
          Tentar carregar dados salvos
        </button>{' '}
        <button onClick={() => store.dispatch(Action.excluirBD())}>
          Apagar os dados locais
        </button>
      </>
    );
  }

  function messageFromReason(reason: unknown) {
    if (reason instanceof Error) {
      if (reason.message) {
        return `Ocorreu um erro: ${reason.message}`;
      }
      return 'Ocorreu um erro desconhecido.';
    }
    return `Ocorreu um erro: ${String(reason)}`;
  }

  function Blocos({ state }: { state: Extract<Model, { status: 'loaded' }> }) {
    const [nome, setNome] = useState('');

    const onSubmit = useCallback(
      (e: Event) => {
        e.preventDefault();
        if (p.isNonEmptyString(nome)) store.dispatch(Action.criarBloco(nome));
        else
          store.dispatch(
            Action.erroCapturado('Nome do bloco não pode estar em branco.')
          );
        setNome('');
      },
      [nome]
    );

    let aviso: JSX.Element | null = state.aviso ? (
      <Aviso>{state.aviso}</Aviso>
    ) : null;

    const processosComBlocoNestaPagina = new Set(
      state.blocos.flatMap(({ processos }) =>
        processos.filter(p => mapa.has(p))
      )
    );
    const processosSemBloco = new Map(
      Array.from(mapa).filter(
        ([numproc]) => !processosComBlocoNestaPagina.has(numproc)
      )
    );
    const semBloco = ((): CheckboxState => {
      if (processosSemBloco.size === 0) return 'disabled';
      for (const numproc of processosMarcados) {
        if (!processosSemBloco.has(numproc)) return 'unchecked';
      }
      for (const numproc of processosNaoMarcados) {
        if (processosSemBloco.has(numproc)) return 'unchecked';
      }
      return 'checked';
    })();

    return (
      <>
        <h4>Blocos</h4>
        <table>
          <tbody>
            {state.blocos.map(bloco => (
              <BlocoPaginaLista key={bloco.id} {...bloco} />
            ))}
          </tbody>
          <tfoot>
            {semBloco !== 'disabled' && (
              <tr>
                <td>
                  {
                    <input
                      type="radio"
                      checked={semBloco === 'checked'}
                      onClick={() =>
                        store.dispatch(Action.checkboxClicado(-1, semBloco))
                      }
                    />
                  }
                </td>
                <td>
                  <label
                    onClick={() =>
                      store.dispatch(Action.checkboxClicado(-1, semBloco))
                    }
                  >
                    (processos sem bloco)
                  </label>
                </td>
                <td>
                  <small>
                    (
                    {((s: number): string =>
                      `${s} processo${s > 1 ? 's' : ''}`)(
                      processosSemBloco.size
                    )}
                    )
                  </small>
                </td>
              </tr>
            )}
          </tfoot>
        </table>
        <form onSubmit={onSubmit}>
          <button type="button" onClick={onNovoClicked}>
            Criar bloco
          </button>
        </form>
        {aviso !== null ? <br /> : null}
        {aviso}
      </>
    );
  }

  function onNovoClicked(evt: Event) {
    evt.preventDefault();
    const nome = prompt('Nome do novo bloco:');
    if (nome === null) return;
    if (p.isNonEmptyString(nome)) {
      store.dispatch(Action.criarBloco(nome));
    } else {
      store.dispatch(
        Action.erroCapturado('Nome do bloco não pode estar em branco.')
      );
    }
  }

  function Aviso(props: JSX.ElementChildrenAttribute) {
    return (
      <>
        <div class="gm-aviso">{props.children}</div>
        <button
          type="button"
          onClick={() => store.dispatch(Action.obterBlocos())}
        >
          Recarregar dados
        </button>
      </>
    );
  }

  function BlocoPaginaLista(props: InfoBloco) {
    const [editing, setEditing] = useState(false);
    const input = createRef<HTMLInputElement>();
    useEffect(() => {
      if (editing && input.current) {
        input.current.select();
        input.current.focus();
      }
    }, [editing, input]);

    let displayNome: JSX.Element | string = props.nome;

    let botaoRenomear: JSX.Element | null = (
      <BotaoAcao
        src="imagens/minuta_editar.gif"
        label="Renomear"
        onClick={onRenomearClicked}
      />
    );
    let removerAusentes: JSX.Element | null = (
      <BotaoAcao
        src="imagens/minuta_transferir.png"
        label="Remover processos ausentes"
        onClick={() =>
          store.dispatch(Action.removerProcessosAusentes(props.id))
        }
      />
    );

    if (editing) {
      displayNome = (
        <>
          <input
            class="rename"
            ref={input}
            onKeyPress={onKeyPress}
            onKeyUp={evt => {
              if (evt.key === 'Escape' || evt.key === 'Esc') {
                setEditing(() => false);
              }
            }}
            value={props.nome}
          />
          <br />
          <small>(Enter para confirmar, Esc para cancelar)</small>
        </>
      );
      botaoRenomear = null;
    }
    if (props.total <= props.nestaPagina) {
      removerAusentes = null;
    }

    const chkState = ((): CheckboxState => {
      const meusProcessosNestaPagina = new Set(
        props.processos.filter(n => mapa.has(n))
      );
      if (meusProcessosNestaPagina.size === 0) return 'disabled';
      for (const numproc of processosMarcados) {
        if (!meusProcessosNestaPagina.has(numproc)) return 'unchecked';
      }
      for (const numproc of processosNaoMarcados) {
        if (meusProcessosNestaPagina.has(numproc)) return 'unchecked';
      }
      return 'checked';
    })();
    const qtdProcessos = (
      <small>({createAbbr(props.nestaPagina, props.total)})</small>
    );
    return (
      <tr>
        <td>
          <input
            type="radio"
            checked={chkState === 'checked'}
            disabled={chkState === 'disabled'}
            style={{ cursor: chkState === 'disabled' ? 'not-allowed' : 'auto' }}
            onClick={() =>
              store.dispatch(Action.checkboxClicado(props.id, chkState))
            }
          />
        </td>
        <td>
          <label
            onClick={() =>
              store.dispatch(Action.checkboxClicado(props.id, chkState))
            }
          >
            {displayNome}
          </label>
        </td>
        <td>
          {props.total > 0 ? (
            <a
              href="#"
              onClick={e => {
                e.preventDefault();
                dialogNomeBloco.textContent = props.nome;
                console.log(dialogProcessos);
                dialogProcessos.innerHTML = props.processos.join('<br>');
                dialog.showModal();
                window
                  .getSelection()
                  ?.getRangeAt(0)
                  ?.selectNodeContents(dialogProcessos);
              }}
            >
              {qtdProcessos}
            </a>
          ) : (
            qtdProcessos
          )}
        </td>
        <td>{botaoRenomear}</td>
        <td>
          <BotaoAcao
            src="imagens/minuta_excluir.gif"
            label="Excluir"
            onClick={onExcluirClicked}
          />
        </td>
        <td>{removerAusentes}</td>
      </tr>
    );

    function createAbbr(
      nestaPagina: number,
      total: number
    ): JSX.Element | string {
      if (nestaPagina === total)
        return `${total} processo${total > 1 ? 's' : ''}`;
      const textoTotal = `${total} processo${total > 1 ? 's' : ''} no bloco`;
      const textoPagina = `${
        nestaPagina === 0 ? 'nenhum' : nestaPagina
      } nesta página`;
      const textoResumido = `${nestaPagina}/${total} processo${
        total > 1 ? 's' : ''
      }`;
      return (
        <abbr title={`${textoTotal}, ${textoPagina}.`}>{textoResumido}</abbr>
      );
    }

    function onKeyPress(
      evt: JSX.TargetedEvent<HTMLInputElement, KeyboardEvent>
    ) {
      if (evt.key === 'Enter') {
        evt.preventDefault();
        const nome = evt.currentTarget.value;
        setEditing(false);
        if (p.isNonEmptyString(nome)) {
          store.dispatch(Action.renomearBloco(props.id, nome));
        } else {
          store.dispatch(
            Action.erroCapturado('Nome do bloco não pode estar em branco.')
          );
        }
      }
    }

    function onRenomearClicked() {
      setEditing(true);
    }
    function onExcluirClicked() {
      let confirmed = true;
      const len = props.total;
      if (len > 0)
        confirmed = window.confirm(
          `Este bloco possui ${len} processo${
            len > 1 ? 's' : ''
          }. Deseja excluí-lo?`
        );
      if (confirmed) store.dispatch(Action.excluirBloco(props.id));
    }
  }

  function BotaoAcao({
    onClick,
    label,
    src,
  }: {
    onClick: Handler<Event>;
    label: string;
    src: string;
  }) {
    return (
      <img
        style="cursor: pointer;"
        src={src}
        onMouseOver={() => infraTooltipMostrar(label)}
        onMouseOut={() => infraTooltipOcultar()}
        onClick={evt => {
          infraTooltipOcultar();
          onClick(evt);
        }}
        aria-label={label}
        width="16"
        height="16"
      />
    );
  }
}
