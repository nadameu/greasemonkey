import {
  BroadcastService,
  createBroadcastService,
} from '@nadameu/create-broadcast-service';
import { Either, Left, Right } from '@nadameu/either';
import { matchBy } from '@nadameu/match';
import * as p from '@nadameu/predicates';
import { JSX, render } from 'preact';
import { useCallback, useEffect, useMemo, useReducer } from 'preact/hooks';
import * as DB from '../database';
import { Bloco, BlocoProcesso } from '../types/Bloco';
import {
  BroadcastMessage,
  isBroadcastMessage,
} from '../types/BroadcastMessage';
import { NumProc } from '../types/NumProc';
import { Action } from '../types/ProcessoSelecionarAction';
import {
  LoadingState,
  State,
  SuccessState,
} from '../types/ProcessoSelecionarState';

export function ProcessoSelecionar(numproc: NumProc): Either<Error, void> {
  const mainMenu = document.getElementById('main-menu');
  if (p.isNull(mainMenu)) return Left(new Error('Menu não encontrado'));
  const div = mainMenu.insertAdjacentElement(
    'beforebegin',
    document.createElement('div')
  )!;
  div.className = 'gm-blocos__processo';
  render(<Main {...{ numproc }} />, div);
  return Right(undefined);
}

function createReducer({
  bc,
  numproc,
}: {
  bc: BroadcastService<BroadcastMessage>;
  numproc: NumProc;
}) {
  return reducer;

  function asyncAction(
    state: State,
    eventualAction: () => Promise<Action>
  ): [State, Promise<Action>] {
    const blocos = 'blocos' in state ? state.blocos : [];
    return [State.Loading(blocos), eventualAction()];
  }

  function modificarProcessos(
    state: State,
    {
      id,
      fn,
      fecharJanela,
    }: {
      id: Bloco['id'];
      fn: (processos: Set<NumProc>, numproc: NumProc) => void;
      fecharJanela: boolean;
    }
  ): [State, Promise<Action>] {
    return asyncAction(state, async () => {
      const bloco = await DB.getBloco(id);
      if (!bloco) throw new Error(`Bloco não encontrado: ${id}.`);
      const processos = new Set(bloco.processos);
      fn(processos, numproc);
      const blocos = await DB.updateBloco({
        ...bloco,
        processos: [...processos],
      });
      return Action.blocosModificados(blocos, { fecharJanela });
    });
  }

  function reducer(
    state: State,
    action: Action
  ): State | readonly [State, Promise<Action>] {
    return Action.match(action, {
      blocosModificados: ({ blocos, fecharJanela }) => {
        bc.publish({ type: 'Blocos', blocos });
        if (fecharJanela) window.close();
        return State.Success(blocos);
      },
      criarBloco: ({ nome }) =>
        asyncAction(state, async () => {
          const blocos = await DB.getBlocos();
          if (blocos.some(x => x.nome === nome))
            return Action.erro(
              `Já existe um bloco com o nome ${JSON.stringify(nome)}.`
            );
          const bloco: Bloco = {
            id: (Math.max(-1, ...blocos.map(x => x.id)) +
              1) as p.NonNegativeInteger,
            nome,
            processos: [],
          };
          return Action.blocosModificados(await DB.createBloco(bloco));
        }),
      erro: ({ reason }) => State.Error(reason),
      inserir: ({ id, fecharJanela }) =>
        modificarProcessos(state, {
          id,
          fn: (processos, numproc) => {
            processos.add(numproc);
          },
          fecharJanela,
        }),
      mensagemRecebida: ({ msg: { blocos } }) => State.Success(blocos),
      obterBlocos: () =>
        asyncAction(state, async () =>
          Action.blocosModificados(await DB.getBlocos())
        ),
      remover: ({ id }) =>
        modificarProcessos(state, {
          id,
          fn: (processos, numproc) => {
            processos.delete(numproc);
          },
          fecharJanela: false,
        }),
    });
  }
}

function Main({ numproc }: { numproc: NumProc }): JSX.Element {
  const bc = useMemo(() => {
    return createBroadcastService('gm-blocos', isBroadcastMessage);
  }, []);
  const handleStateAction = useMemo(() => {
    return createReducer({ bc, numproc });
  }, []);
  const [state, dispatch] = useReducer((state: State, action: Action) => {
    const result = handleStateAction(state, action);
    if (!Array.isArray(result)) return result;
    const [newState, promise] = result;
    promise.catch(Action.erro).then(dispatch);
    return newState;
  }, State.Loading([]));
  useEffect(() => {
    const sub = bc.subscribe(msg => dispatch(Action.mensagemRecebida(msg)));
    return () => {
      sub.unsubscribe();
    };
  }, []);
  useEffect(() => {
    dispatch(Action.obterBlocos);
  }, []);
  const criarBloco = useCallback(
    (nome: Bloco['nome']) => dispatch(Action.criarBloco(nome)),
    []
  );
  const toggleBloco = useCallback(
    (
      id: Bloco['id'],
      operacao: 'inserir' | 'remover',
      fecharJanela: boolean
    ) => {
      if (operacao === 'inserir') {
        dispatch(Action.inserir(id, { fecharJanela }));
      } else {
        dispatch(Action.remover(id));
      }
    },
    []
  );
  if (state.status === 'Error')
    return (
      <ShowError
        reason={state.reason}
        onRecarregarClick={() => dispatch(Action.obterBlocos)}
      />
    );
  if (state.status === 'Loading' && state.blocos.length === 0)
    return <Placeholder />;
  return (
    <Blocos
      state={state}
      numproc={numproc}
      criarBloco={criarBloco}
      toggleBloco={toggleBloco}
    />
  );
}
function ShowError({
  reason,
  onRecarregarClick,
}: {
  onRecarregarClick: () => void;
  reason: unknown;
}) {
  const message = messageFromReason(reason);
  return (
    <>
      <h4>Blocos</h4>
      <div class="error">{message}</div>
      <button type="button" onClick={onRecarregarClick}>
        Recarregar
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

function Placeholder() {
  const li = (
    <li class="placeholder">
      <span />
      <span />
      <span />
    </li>
  );
  return (
    <>
      <h4>Blocos</h4>
      <ul>
        {li}
        {li}
        {li}
      </ul>
      <button type="button" disabled>
        Novo
      </button>
    </>
  );
}

function Blocos(props: {
  state: LoadingState | SuccessState;
  numproc: NumProc;
  criarBloco: (nome: Bloco['nome']) => void;
  toggleBloco: (
    id: Bloco['id'],
    operacao: 'inserir' | 'remover',
    fecharJanela: boolean
  ) => void;
}) {
  const disabled = useMemo(
    () => props.state.status === 'Loading',
    [props.state.status]
  );
  const infoBlocos: BlocoProcesso[] = useMemo(
    () =>
      props.state.blocos.map(({ id, nome, processos }) => ({
        id,
        nome,
        inserido: processos.includes(props.numproc),
      })),
    [props.state.blocos]
  );
  const onNovoClicked = useCallback((evt: Event) => {
    evt.preventDefault();
    const nome = prompt('Nome do novo bloco:');
    if (nome === null) return;
    if (p.isNonEmptyString(nome)) {
      props.criarBloco(nome);
    }
  }, []);
  return (
    <>
      <h4>Blocos</h4>
      <ul>
        {infoBlocos.map(info => (
          <BlocoPaginaProcesso
            key={info.id}
            {...info}
            disabled={disabled}
            toggleBloco={props.toggleBloco}
          />
        ))}
      </ul>
      <button type="button" onClick={onNovoClicked} disabled={disabled}>
        Novo
      </button>
    </>
  );
}

function BlocoPaginaProcesso(
  props: BlocoProcesso & {
    disabled: boolean;
    toggleBloco: (
      id: Bloco['id'],
      operacao: 'inserir' | 'remover',
      fecharJanela: boolean
    ) => void;
  }
) {
  const onChange = useCallback(
    (evt: JSX.TargetedEvent<HTMLInputElement>) => {
      if (evt.currentTarget.checked) {
        props.toggleBloco(props.id, 'inserir', false);
      } else {
        props.toggleBloco(props.id, 'remover', false);
      }
    },
    [props.id]
  );
  const onTransportarClick = useCallback(() => {
    infraTooltipOcultar();
    props.toggleBloco(props.id, 'inserir', true);
  }, [props.id]);
  const transportar = useMemo(() => {
    if (props.inserido) return <span></span>;
    return (
      <>
        {' '}
        <input
          type="image"
          src="infra_css/imagens/transportar.gif"
          onMouseOver={() =>
            infraTooltipMostrar('Inserir processo no bloco e fechar a janela.')
          }
          onMouseOut={() => infraTooltipOcultar()}
          onClick={onTransportarClick}
          disabled={props.disabled}
        />
      </>
    );
  }, [props.inserido, props.disabled, props.id]);
  const id = useMemo(() => `gm-bloco-${props.id}`, [props.id]);
  return (
    <li>
      <input
        id={id}
        type="checkbox"
        checked={props.inserido}
        onChange={onChange}
        disabled={props.disabled}
      />{' '}
      <label for={`gm-bloco-${props.id}`}>{props.nome}</label>
      {transportar}
    </li>
  );
}
