import { createBroadcastService } from '@nadameu/create-broadcast-service';
import { createStore, Store } from '@nadameu/create-store';
import { Either, Left, Right, traverse } from '@nadameu/either';
import { Handler } from '@nadameu/handler';
import { createTaggedUnion, matchBy, Static } from '@nadameu/match';
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

  const barra = document.getElementById('divInfraBarraLocalizacao');
  if (p.isNullish(barra)) return Left(new Error('Não foi possível inserir os blocos na página.'));

  document.head.appendChild(document.createElement('head')).textContent = css;
  const div = barra.insertAdjacentElement('afterend', document.createElement('div'))!;
  div.id = 'gm-blocos';

  const Model = createTaggedUnion(
    {
      init: null,
      loaded: (blocos: InfoBloco[], aviso?: string) => ({ blocos, aviso }),
      error: (error: unknown) => ({ error }),
    },
    'status'
  );
  type Model = Static<typeof Model>;

  type CheckboxState = 'checked' | 'unchecked' | 'partial' | 'disabled';

  const Action = createTaggedUnion(
    {
      blocosModificados: (blocos: Bloco[]) => ({ blocos }),
      blocosObtidos: (blocos: Bloco[]) => ({ blocos }),
      checkBoxClicado: (id: Bloco['id'] | null, estadoAnterior: CheckboxState) => ({
        id,
        estadoAnterior,
      }),
      criarBloco: (nome: Bloco['nome']) => ({ nome }),
      erroCapturado: (aviso: string) => ({ aviso }),
      erroDesconhecido: (erro: unknown) => ({ erro }),
      excluirBD: null,
      excluirBloco: (id: Bloco['id']) => ({ id }),
      mensagemRecebida: (msg: BroadcastMessage) => ({ msg }),
      obterBlocos: null,
      noop: null,
      removerProcessosAusentes: (id: Bloco['id']) => ({ id }),
      renomearBloco: (id: Bloco['id'], nome: Bloco['nome']) => ({ id, nome }),
    },
    'type'
  );
  type Action = Static<typeof Action>;

  const bc = createBroadcastService('gm-blocos', isBroadcastMessage);
  const store: Store<Model, Action> = createStore<Model, Action>(() => Model.init, reducer);
  bc.subscribe(msg => store.dispatch(Action.mensagemRecebida(msg)));
  if (tabela) {
    tabela.addEventListener('click', () => {
      update(store.getState());
    });
  }
  document.appendChild(document.createElement('style')).textContent = css;
  store.subscribe(update);
  store.dispatch(Action.obterBlocos);
  return Right(undefined);

  function update(state: Model) {
    return render(<Main state={state} />, div);
  }

  function asyncAction(state: Model, f: () => Promise<Action>): Model {
    f()
      .catch(err => Action.erroDesconhecido(err))
      .then(store.dispatch);
    return state;
  }

  function reducer(state: Model, action: Action): Model {
    return Action.match(action, {
      blocosModificados: ({ blocos }) =>
        asyncAction(state, async () => {
          bc.publish({ type: 'Blocos', blocos });
          return Action.blocosObtidos(blocos);
        }),
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
      checkBoxClicado: ({ id, estadoAnterior }) =>
        Model.match(
          state,
          {
            loaded: (state): Model => {
              if (estadoAnterior === 'disabled') return state;
              const processos = (() => {
                if (id === null) {
                  const processosComBloco = new Set(
                    Array.from(state.blocos.flatMap(({ processos }) => processos))
                  );
                  return Array.from(mapa)
                    .filter(([x]) => !processosComBloco.has(x))
                    .map(x => x[1]);
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
      criarBloco: ({ nome }) =>
        asyncAction(state, async () => {
          const blocos = await Database.getBlocos();
          if (blocos.some(x => x.nome === nome))
            return Action.erroCapturado(`Já existe um bloco com o nome ${JSON.stringify(nome)}.`);
          const bloco: Bloco = {
            id: (Math.max(-1, ...blocos.map(x => x.id)) + 1) as p.NonNegativeInteger,
            nome,
            processos: [],
          };
          return Action.blocosModificados(await Database.createBloco(bloco));
        }),
      erroCapturado: ({ aviso }) =>
        Model.match(state, {
          init: () => Model.error(aviso),
          error: state => state,
          loaded: state => ({ ...state, aviso }),
        }),
      erroDesconhecido: ({ erro }) =>
        Model.match(state, { error: state => state }, () => Model.error(erro)),
      excluirBD: () =>
        asyncAction(state, async () => {
          await Database.deleteBlocos();
          return Action.obterBlocos;
        }),
      excluirBloco: ({ id }) =>
        asyncAction(state, async () => Action.blocosModificados(await Database.deleteBloco(id))),
      mensagemRecebida: ({ msg }) =>
        asyncAction(state, async () => {
          return matchBy('type')(msg, {
            Blocos: ({ blocos }) => Action.blocosObtidos(blocos),
            NoOp: () => Action.noop,
          });
        }),
      obterBlocos: () =>
        asyncAction(state, async () => Action.blocosModificados(await Database.getBlocos())),
      noop: () => state,
      removerProcessosAusentes: ({ id }) =>
        asyncAction(state, async () => {
          const bloco = await Database.getBloco(id);
          if (!bloco) throw new Error(`Bloco não encontrado: ${id}.`);
          const processos = bloco.processos.filter(x => mapa.has(x));
          return Action.blocosModificados(await Database.updateBloco({ ...bloco, processos }));
        }),
      renomearBloco: ({ id, nome }) =>
        asyncAction(state, async () => {
          const blocos = await Database.getBlocos();
          const bloco = blocos.find(x => x.id === id);
          if (!bloco) throw new Error(`Bloco não encontrado: ${id}.`);
          const others = blocos.filter(x => x.id !== id);
          if (others.some(x => x.nome === nome))
            return Action.erroCapturado(`Já existe um bloco com o nome ${JSON.stringify(nome)}.`);
          return Action.blocosModificados(await Database.updateBloco({ ...bloco, nome }));
        }),
    });
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
        <span style="color:red; font-weight: bold;">{message}</span>
        <br />
        <br />
        <button onClick={() => store.dispatch(Action.obterBlocos)}>
          Tentar carregar dados salvos
        </button>
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

    const processosComBloco = new Set(state.blocos.flatMap(({ processos }) => processos));
    const processosSemBloco = new Map(
      Array.from(mapa).filter(([numproc]) => !processosComBloco.has(numproc))
    );
    const chkState = ((): CheckboxState => {
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

    return (
      <>
        <h4>Blocos</h4>
        <table>
          <tbody>
            {state.blocos.map(bloco => (
              <BlocoPaginaLista key={bloco.id} {...bloco} />
            ))}
          </tbody>
          {processosSemBloco.size > 0 && (
            <tfoot>
              <tr>
                <td>
                  {
                    <img
                      src={matchBy('chkState')(
                        { chkState },
                        {
                          checked: () => checkboxChecked,
                          disabled: () => checkboxDisabled,
                          partial: () => checkboxUndefined,
                          unchecked: () => checkboxEmpty,
                        }
                      )}
                      onClick={() => store.dispatch(Action.checkBoxClicado(null, chkState))}
                    />
                  }
                </td>
                <td>
                  <label onClick={() => store.dispatch(Action.checkBoxClicado(null, chkState))}>
                    &lt;processos sem bloco&gt;
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
            </tfoot>
          )}
        </table>
        <form onSubmit={onSubmit}>
          <input value={nome} onInput={evt => setNome(evt.currentTarget.value)} />{' '}
          <button>Criar</button>
        </form>
        <br />
        {aviso}
      </>
    );
  }

  function Aviso(props: JSX.ElementChildrenAttribute) {
    return (
      <>
        <span style="color:red">{props.children}</span>
        <button onClick={() => store.dispatch(Action.obterBlocos)}>Recarregar dados</button>
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
      displayNome = <input ref={input} onKeyUp={onKeyUp} value={props.nome} />;
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
            onClick={() => store.dispatch(Action.checkBoxClicado(props.id, chkState))}
          />
        </td>
        <td>
          <label onClick={() => store.dispatch(Action.checkBoxClicado(props.id, chkState))}>
            {displayNome}
          </label>
        </td>
        <td>
          <small>({createAbbr(props.nestaPagina, props.total)})</small>
        </td>
        <td>{botaoRenomear}</td>
        <td>
          <img
            class="infraButton"
            src="imagens/minuta_excluir.gif"
            onMouseOver={() => infraTooltipMostrar('Excluir')}
            onMouseOut={() => infraTooltipOcultar()}
            onClick={onExcluirClicked}
            aria-label="Excluir"
            width="16"
            height="16"
          />
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
      console.log('Key', evt.key);
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
        onClick={onClick}
        aria-label={label}
        width="16"
        height="16"
      />
    );
  }
}
