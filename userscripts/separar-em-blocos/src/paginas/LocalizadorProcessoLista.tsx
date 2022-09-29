import { createBroadcastService } from '@nadameu/create-broadcast-service';
import { createStore, Store } from '@nadameu/create-store';
import { Either, Left, Right, traverse } from '@nadameu/either';
import { Handler } from '@nadameu/handler';
import { createTaggedUnion, matchBy } from '@nadameu/match';
import * as p from '@nadameu/predicates';
import { createRef, JSX, render } from 'preact';
import { useCallback, useEffect, useState } from 'preact/hooks';
import * as Database from '../database';
import checkboxChecked from '../imagens/checkbox_checked.svg';
import checkboxDisabled from '../imagens/checkbox_disabled.svg';
import checkboxEmpty from '../imagens/checkbox_empty.svg';
import checkboxUndefined from '../imagens/checkbox_undefined.svg';
import { BroadcastMessage, isBroadcastMessage } from '../types/Action';
import { Bloco } from '../types/Bloco';
import { isNumProc, NumProc } from '../types/NumProc';
import css from './LocalizadorProcessoLista.scss?inline';

type MapaProcessos = Map<
  NumProc,
  {
    linha: HTMLTableRowElement;
    checkbox: HTMLInputElement;
  }
>;

interface InfoBloco extends Bloco {
  nestaPagina: number;
  total: number;
}

export function LocalizadorProcessoLista(): Either<Error, void> {
  const tabela = document.querySelector<HTMLTableElement>('table#tabelaLocalizadores');
  const linhas = tabela?.rows ?? [];

  const eitherMapa: Either<Error, MapaProcessos> = traverse(linhas, (linha, i) => {
    if (i === 0) return Right([]);
    const endereco = linha.cells[1]?.querySelector<HTMLAnchorElement>('a[href]')?.href;
    if (p.isNullish(endereco))
      return Left(new Error(`Link do processo não encontrado: linha ${i}.`));
    const numproc = new URL(endereco).searchParams.get('num_processo');
    if (p.isNullish(numproc))
      return Left(new Error(`Número do processo não encontrado: linha ${i}.`));
    if (!isNumProc(numproc))
      return Left(new Error(`Número de processo desconhecido: ${JSON.stringify(numproc)}.`));
    const checkbox = linha.cells[0]?.querySelector<HTMLInputElement>('input[type=checkbox]');
    if (p.isNullish(checkbox))
      return Left(new Error(`Caixa de seleção não encontrada: linha ${i}.`));
    return Right([[numproc, { linha, checkbox }] as const]);
  }).map(entriess => new Map(entriess.flat(1)));
  if (eitherMapa.isLeft) return eitherMapa as Left<Error>;
  const mapa = eitherMapa.rightValue;

  let acoes = document.getElementById('fldAcoes');
  if (p.isNullish(acoes)) {
    acoes = document.getElementById('divInfraAreaTabela');
    if (p.isNullish(acoes)) return Left(new Error('Não foi possível inserir os blocos na página.'));
  }

  const div = acoes.insertAdjacentElement('beforebegin', document.createElement('div'))!;
  div.id = 'gm-blocos';

  document.body.insertAdjacentHTML(
    'beforeend',
    /*html*/ `<dialog id="gm-blocos-dialog"><form method="dialog"><div><output></output></div><button>Fechar</button></form></dialog>`
  );
  const dialog = document.getElementById('gm-blocos-dialog') as HTMLDialogElement;
  const dialogOutput = dialog.querySelector('output')!;

  const Model: {
    init: InitModel;
    loaded(blocos: InfoBloco[], aviso?: string): LoadedModel;
    error(error: unknown): ErrorModel;
    match: ReturnType<
      typeof createTaggedUnion<
        {
          init: null;
          loaded: (
            blocos: InfoBloco[],
            aviso?: string
          ) => {
            blocos: InfoBloco[];
            aviso: string | undefined;
          };
          error: (error: unknown) => {
            error: unknown;
          };
        },
        'status'
      >
    >['match'];
  } = createTaggedUnion(
    {
      init: null,
      loaded: (blocos: InfoBloco[], aviso?: string) => ({ blocos, aviso }),
      error: (error: unknown) => ({ error }),
    },
    'status'
  );
  type Model = InitModel | LoadedModel | ErrorModel;
  interface InitModel {
    status: 'init';
  }
  interface LoadedModel {
    status: 'loaded';
    blocos: InfoBloco[];
    aviso?: string;
  }
  interface ErrorModel {
    status: 'error';
    error: unknown;
  }

  type CheckboxState = 'checked' | 'unchecked' | 'partial' | 'disabled';

  const Action = createTaggedUnion(
    {
      blocosModificados: (blocos: Bloco[]): Omit<BlocosModificadosAction, 'type'> => ({ blocos }),
      blocosObtidos: (blocos: Bloco[]): Omit<BlocosObtidosAction, 'type'> => ({ blocos }),
      checkboxClicado: (
        id: Bloco['id'] | -1 | -2,
        estadoAnterior: CheckboxState
      ): Omit<CheckboxClicadoAction, 'type'> => ({
        id,
        estadoAnterior,
      }),
      criarBloco: (nome: Bloco['nome']): Omit<CriarBlocoAction, 'type'> => ({ nome }),
      erroCapturado: (aviso: string): Omit<ErroCapturadoAction, 'type'> => ({ aviso }),
      erroDesconhecido: (erro: unknown): Omit<ErroDesconhecidoAction, 'type'> => ({ erro }),
      excluirBD: null,
      excluirBloco: (id: Bloco['id']): Omit<ExcluirBlocoAction, 'type'> => ({ id }),
      mensagemRecebida: (msg: BroadcastMessage): Omit<MensagemRecebidaAction, 'type'> => ({ msg }),
      obterBlocos: null,
      noop: null,
      removerProcessosAusentes: (
        id: Bloco['id']
      ): Omit<RemoverProcessosAusentesAction, 'type'> => ({ id }),
      renomearBloco: (id: Bloco['id'], nome: Bloco['nome']): Omit<RenomearBlocoAction, 'type'> => ({
        id,
        nome,
      }),
      reset: null,
    },
    'type'
  );
  type AsyncAction =
    | CriarBlocoAction
    | ExcluirBDAction
    | ExcluirBlocoAction
    | ObterBlocosAction
    | RemoverProcessosAusentesAction
    | RenomearBlocoAction;
  type SyncAction =
    | BlocosObtidosAction
    | CheckboxClicadoAction
    | ErroCapturadoAction
    | ErroDesconhecidoAction
    | NoOpAction
    | ResetAction;
  type AliasAction = BlocosModificadosAction | MensagemRecebidaAction;
  interface BlocosModificadosAction {
    type: 'blocosModificados';
    blocos: Bloco[];
  }
  interface BlocosObtidosAction {
    type: 'blocosObtidos';
    blocos: Bloco[];
  }
  interface CheckboxClicadoAction {
    type: 'checkboxClicado';
    id: Bloco['id'] | -1 | -2;
    estadoAnterior: CheckboxState;
  }
  interface CriarBlocoAction {
    type: 'criarBloco';
    nome: Bloco['nome'];
  }
  interface ErroCapturadoAction {
    type: 'erroCapturado';
    aviso: string;
  }
  interface ErroDesconhecidoAction {
    type: 'erroDesconhecido';
    erro: unknown;
  }
  interface ExcluirBDAction {
    type: 'excluirBD';
  }
  interface ExcluirBlocoAction {
    type: 'excluirBloco';
    id: Bloco['id'];
  }
  interface MensagemRecebidaAction {
    type: 'mensagemRecebida';
    msg: BroadcastMessage;
  }
  interface ObterBlocosAction {
    type: 'obterBlocos';
  }
  interface NoOpAction {
    type: 'noop';
  }
  interface RemoverProcessosAusentesAction {
    type: 'removerProcessosAusentes';
    id: Bloco['id'];
  }
  interface RenomearBlocoAction {
    type: 'renomearBloco';
    id: Bloco['id'];
    nome: Bloco['nome'];
  }
  interface ResetAction {
    type: 'reset';
  }
  type Action = AsyncAction | SyncAction | AliasAction;

  const bc = createBroadcastService('gm-blocos', isBroadcastMessage);
  const store: Store<Model, Action> = Object.assign(
    {},
    createStore<Model, SyncAction>(() => Model.init, reducer)
  );
  store.dispatch = handleAliasAction(store)(store.dispatch);
  store.dispatch = handleAsyncAction(store)(store.dispatch);
  bc.subscribe(msg => store.dispatch(Action.mensagemRecebida(msg)));
  if (tabela) {
    tabela.addEventListener('click', () => {
      update(store.getState());
    });
  }
  document.head.appendChild(document.createElement('style')).textContent = css;
  store.subscribe(update);
  store.dispatch(Action.obterBlocos);
  return Right(undefined);

  function update(state: Model) {
    return render(<Main state={state} />, div);
  }

  function reducer(state: Model, action: SyncAction): Model {
    return Action.match(
      action,
      {
        blocosObtidos: ({ blocos }) =>
          Model.match(
            state,
            {
              error: state => state,
            },
            (): Model => {
              const info = blocos.map(
                (bloco): InfoBloco => ({
                  ...bloco,
                  nestaPagina: bloco.processos.filter(numproc => mapa.has(numproc)).length,
                  total: bloco.processos.length,
                })
              );
              return Model.loaded(info);
            }
          ),
        checkboxClicado: ({ id, estadoAnterior }) =>
          Model.match(
            state,
            {
              loaded: (state): Model => {
                if (estadoAnterior === 'disabled') return state;
                const processos = (() => {
                  if (id === -1) {
                    const processosComBloco = new Set(
                      Array.from(
                        state.blocos.flatMap(({ processos }) => processos.filter(p => mapa.has(p)))
                      )
                    );
                    return Array.from(mapa)
                      .filter(([x]) => !processosComBloco.has(x))
                      .map(x => x[1]);
                  } else if (id === -2) {
                    return Array.from(mapa.values());
                  } else {
                    return state.blocos
                      .filter(x => x.id === id)
                      .flatMap(x => x.processos)
                      .map(x => mapa.get(x))
                      .filter(p.isDefined);
                  }
                })();
                const check = estadoAnterior === 'unchecked';
                processos.forEach(({ checkbox }) => {
                  if (checkbox.checked !== check) {
                    checkbox.click();
                  }
                });
                return state;
              },
            },
            state => state
          ),
        erroCapturado: ({ aviso }) =>
          Model.match(state, {
            init: () => Model.error(aviso),
            error: state => state,
            loaded: state => ({ ...state, aviso }),
          }),
        erroDesconhecido: ({ erro }) =>
          Model.match(state, { error: state => state }, () => Model.error(erro)),
        noop: () => state,
        reset: () => Model.init,
      },
      other => other
    );
  }

  function handleAsyncAction(store: Pick<Store<Model, Action>, 'getState' | 'dispatch'>) {
    return (next: Store<Model, Exclude<Action, AsyncAction>>['dispatch']) => {
      return (action: Action): void => {
        const promise = Action.match<
          Action,
          AsyncAction['type'],
          Promise<Action> | Exclude<Action, AsyncAction>
        >(
          action,
          {
            criarBloco: async ({ nome }) => {
              const blocos = await Database.getBlocos();
              if (blocos.some(x => x.nome === nome))
                return Action.erroCapturado(
                  `Já existe um bloco com o nome ${JSON.stringify(nome)}.`
                );
              const bloco: Bloco = {
                id: (Math.max(-1, ...blocos.map(x => x.id)) + 1) as p.NonNegativeInteger,
                nome,
                processos: [],
              };
              return Action.blocosModificados(await Database.createBloco(bloco));
            },
            excluirBD: async () => {
              await Database.deleteBlocos();
              return Action.obterBlocos;
            },
            excluirBloco: async ({ id }) =>
              Action.blocosModificados(await Database.deleteBloco(id)),
            obterBlocos: async () => Action.blocosModificados(await Database.getBlocos()),
            removerProcessosAusentes: async ({ id }) => {
              const bloco = await Database.getBloco(id);
              if (!bloco) throw new Error(`Bloco não encontrado: ${id}.`);
              const processos = bloco.processos.filter(x => mapa.has(x));
              return Action.blocosModificados(await Database.updateBloco({ ...bloco, processos }));
            },
            renomearBloco: async ({ id, nome }) => {
              const blocos = await Database.getBlocos();
              const bloco = blocos.find(x => x.id === id);
              if (!bloco) throw new Error(`Bloco não encontrado: ${id}.`);
              const others = blocos.filter(x => x.id !== id);
              if (others.some(x => x.nome === nome))
                return Action.erroCapturado(
                  `Já existe um bloco com o nome ${JSON.stringify(nome)}.`
                );
              return Action.blocosModificados(await Database.updateBloco({ ...bloco, nome }));
            },
          },
          a => a
        );
        if (!('then' in promise)) return next(promise);
        promise.catch(Action.erroDesconhecido).then(store.dispatch);
        if (action.type === 'obterBlocos') return next(Action.reset);
      };
    };
  }

  function handleAliasAction(store: Pick<Store<Model, Action>, 'dispatch' | 'getState'>) {
    return (next: Store<Model, SyncAction>['dispatch']) => {
      return (action: SyncAction | AliasAction): void => {
        const replaced = Action.match(
          action,
          {
            blocosModificados: ({ blocos }) => {
              bc.publish({ type: 'Blocos', blocos });
              return Action.blocosObtidos(blocos);
            },
            mensagemRecebida: ({ msg }) =>
              matchBy('type')(msg, {
                Blocos: ({ blocos }) => Action.blocosObtidos(blocos),
                NoOp: () => Action.noop,
              }),
          },
          s => s
        );
        return next(replaced);
      };
    };
  }

  function Main({ state }: { state: Model }) {
    return Model.match(state, {
      error: state => <ShowError reason={state.error} />,
      loaded: state => <Blocos state={state} />,
      init: () => <Loading />,
    });
  }

  function Loading() {
    return <>Carregando...</>;
  }

  function ShowError({ reason }: { reason: unknown }) {
    const message = messageFromReason(reason);

    return (
      <>
        <div class="gm-erro">{message}</div>
        <button onClick={() => store.dispatch(Action.obterBlocos)}>
          Tentar carregar dados salvos
        </button>{' '}
        <button onClick={() => store.dispatch(Action.excluirBD)}>Apagar os dados locais</button>
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
        else store.dispatch(Action.erroCapturado('Nome do bloco não pode estar em branco.'));
        setNome('');
      },
      [nome]
    );

    let aviso: JSX.Element | null = state.aviso ? <Aviso>{state.aviso}</Aviso> : null;

    const processosComBlocoNestaPagina = new Set(
      state.blocos.flatMap(({ processos }) => processos.filter(p => mapa.has(p)))
    );
    const processosSemBloco = new Map(
      Array.from(mapa).filter(([numproc]) => !processosComBlocoNestaPagina.has(numproc))
    );
    const semBloco = ((): CheckboxState => {
      let status: CheckboxState | undefined;
      for (const { checkbox } of processosSemBloco.values()) {
        if (checkbox.checked) {
          if (status === undefined) {
            status = 'checked';
          } else if (status === 'unchecked') {
            return 'partial';
          }
        } else {
          if (status === undefined) {
            status = 'unchecked';
          } else if (status === 'checked') {
            return 'partial';
          }
        }
      }
      return status ?? 'disabled';
    })();

    const todosPagina = ((): CheckboxState => {
      let status: CheckboxState | undefined;
      for (const { checkbox } of mapa.values()) {
        if (checkbox.checked) {
          if (status === undefined) {
            status = 'checked';
          } else if (status === 'unchecked') {
            return 'partial';
          }
        } else {
          if (status === undefined) {
            status = 'unchecked';
          } else if (status === 'checked') {
            return 'partial';
          }
        }
      }
      return status ?? 'disabled';
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
            {processosSemBloco.size > 0 && processosComBlocoNestaPagina.size > 0 && (
              <tr>
                <td>
                  {
                    <img
                      src={matchBy('semBloco')(
                        { semBloco },
                        {
                          checked: () => checkboxChecked,
                          disabled: () => checkboxDisabled,
                          partial: () => checkboxUndefined,
                          unchecked: () => checkboxEmpty,
                        }
                      )}
                      onClick={() => store.dispatch(Action.checkboxClicado(-1, semBloco))}
                    />
                  }
                </td>
                <td>
                  <label onClick={() => store.dispatch(Action.checkboxClicado(-1, semBloco))}>
                    (processos sem bloco)
                  </label>
                </td>
                <td>
                  <small>
                    (
                    {((s: number): string => `${s} processo${s > 1 ? 's' : ''}`)(
                      processosSemBloco.size
                    )}
                    )
                  </small>
                </td>
              </tr>
            )}
            {mapa.size > 0 && (
              <tr>
                <td>
                  {
                    <img
                      src={matchBy('todosPagina')(
                        { todosPagina },
                        {
                          checked: () => checkboxChecked,
                          disabled: () => checkboxDisabled,
                          partial: () => checkboxUndefined,
                          unchecked: () => checkboxEmpty,
                        }
                      )}
                      style={{
                        cursor: matchBy('todosPagina')(
                          { todosPagina },
                          {
                            disabled: () => 'not-allowed',
                          },
                          () => 'auto'
                        ),
                      }}
                      onClick={() => store.dispatch(Action.checkboxClicado(-2, todosPagina))}
                    />
                  }
                </td>
                <td>
                  <label onClick={() => store.dispatch(Action.checkboxClicado(-2, todosPagina))}>
                    (todos os processos desta página)
                  </label>
                </td>
                <td>
                  <small>
                    ({((s: number): string => `${s} processo${s > 1 ? 's' : ''}`)(mapa.size)})
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
        <br />
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
      store.dispatch(Action.erroCapturado('Nome do bloco não pode estar em branco.'));
    }
  }

  function Aviso(props: JSX.ElementChildrenAttribute) {
    return (
      <>
        <div class="gm-aviso">{props.children}</div>
        <button type="button" onClick={() => store.dispatch(Action.obterBlocos)}>
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
      <BotaoAcao src="imagens/minuta_editar.gif" label="Renomear" onClick={onRenomearClicked} />
    );
    let removerAusentes: JSX.Element | null = (
      <BotaoAcao
        src="imagens/minuta_transferir.png"
        label="Remover processos ausentes"
        onClick={() => store.dispatch(Action.removerProcessosAusentes(props.id))}
      />
    );

    if (editing) {
      displayNome = (
        <>
          <input class="rename" ref={input} onKeyUp={onKeyUp} value={props.nome} />
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
      let status: CheckboxState = 'disabled';
      for (const numproc of props.processos) {
        if (!mapa.has(numproc)) continue;
        const { checkbox } = mapa.get(numproc)!;
        if (checkbox.checked) {
          if (status === 'disabled') {
            status = 'checked';
          } else if (status === 'unchecked') {
            return 'partial';
          }
        } else {
          if (status === 'disabled') {
            status = 'unchecked';
          } else if (status === 'checked') {
            return 'partial';
          }
        }
      }
      return status;
    })();
    return (
      <tr>
        <td>
          <img
            src={matchBy('chkState')(
              { chkState },
              {
                partial: () => checkboxUndefined,
                unchecked: () => checkboxEmpty,
                checked: () => checkboxChecked,
                disabled: () => checkboxDisabled,
              }
            )}
            style={{
              cursor: matchBy('chkState')(
                { chkState },
                { disabled: () => 'not-allowed' },
                () => 'auto'
              ),
            }}
            onClick={() => store.dispatch(Action.checkboxClicado(props.id, chkState))}
          />
        </td>
        <td>
          <label onClick={() => store.dispatch(Action.checkboxClicado(props.id, chkState))}>
            {displayNome}
          </label>
        </td>
        <td>
          <small
            onClick={() => {
              const text = document.createTextNode(props.nome);
              dialogOutput.innerHTML = '';
              dialogOutput.append(
                'Processos do bloco ' + props.nome + ':',
                document.createElement('br'),
                ...props.processos.flatMap(num => [num, document.createElement('br')])
              );
              dialog.showModal();
            }}
          >
            ({createAbbr(props.nestaPagina, props.total)})
          </small>
        </td>
        <td>{botaoRenomear}</td>
        <td>
          <BotaoAcao src="imagens/minuta_excluir.gif" label="Excluir" onClick={onExcluirClicked} />
        </td>
        <td>{removerAusentes}</td>
      </tr>
    );

    function createAbbr(nestaPagina: number, total: number): JSX.Element | string {
      if (nestaPagina === total) return `${total} processo${total > 1 ? 's' : ''}`;
      const textoTotal = `${total} processo${total > 1 ? 's' : ''} no bloco`;
      const textoPagina = `${nestaPagina === 0 ? 'nenhum' : nestaPagina} nesta página`;
      const textoResumido = `${nestaPagina}/${total} processo${total > 1 ? 's' : ''}`;
      return <abbr title={`${textoTotal}, ${textoPagina}.`}>{textoResumido}</abbr>;
    }

    function onKeyUp(evt: JSX.TargetedEvent<HTMLInputElement, KeyboardEvent>) {
      if (evt.key === 'Enter') {
        const nome = evt.currentTarget.value;
        setEditing(false);
        if (p.isNonEmptyString(nome)) {
          store.dispatch(Action.renomearBloco(props.id, nome));
        } else {
          store.dispatch(Action.erroCapturado('Nome do bloco não pode estar em branco.'));
        }
      } else if (evt.key === 'Escape') {
        setEditing(() => false);
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
          `Este bloco possui ${len} processo${len > 1 ? 's' : ''}. Deseja excluí-lo?`
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
        class="infraButton"
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
