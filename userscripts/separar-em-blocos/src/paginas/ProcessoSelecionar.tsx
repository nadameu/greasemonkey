import { BroadcastService, createBroadcastService } from '@nadameu/create-broadcast-service';
import { Either, Left, Right } from '@nadameu/either';
import { matchBy } from '@nadameu/match';
import * as p from '@nadameu/predicates';
import { JSX, render } from 'preact';
import { useEffect, useMemo, useReducer } from 'preact/hooks';
import * as DB from '../database';
import { Bloco, BlocoProcesso } from '../types/Bloco';
import { BroadcastMessage, isBroadcastMessage } from '../types/BroadcastMessage';
import { NumProc } from '../types/NumProc';
import { Action } from '../types/ProcessoSelecionarAction';
import { State } from '../types/ProcessoSelecionarState';
import css from './ProcessoSelecionar.scss?inline';

export function ProcessoSelecionar(numproc: NumProc): Either<Error, void> {
  const mainMenu = document.getElementById('main-menu');
  if (p.isNull(mainMenu)) return Left(new Error('Menu não encontrado'));
  document.head.appendChild(document.createElement('style')).textContent = css;
  const div = mainMenu.insertAdjacentElement('beforebegin', document.createElement('div'))!;
  div.id = 'gm-blocos';
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

  function asyncAction(state: State, eventualAction: () => Promise<Action>): State {
    return State.match(state, {
      Loading: ({ blocos }) => State.Loading(blocos, eventualAction),
      Success: ({ blocos }) => State.Loading(blocos, eventualAction),
      Error: () => State.Loading([], eventualAction),
    });
  }

  function reducer(state: State, action: Action): State {
    return Action.match(action, {
      blocosModificados: ({ blocos, fecharJanela }) =>
        asyncAction(state, async () => {
          bc.publish({ type: 'Blocos', blocos });
          if (fecharJanela) window.close();
          return Action.blocosObtidos(blocos);
        }),
      blocosObtidos: ({ blocos }) => State.Success(blocos),
      criarBloco: ({ nome }) =>
        asyncAction(state, async () => {
          const blocos = await DB.getBlocos();
          if (blocos.some(x => x.nome === nome))
            return Action.erroCapturado(`Já existe um bloco com o nome ${JSON.stringify(nome)}.`);
          const bloco: Bloco = {
            id: (Math.max(-1, ...blocos.map(x => x.id)) + 1) as p.NonNegativeInteger,
            nome,
            processos: [],
          };
          return Action.blocosModificados(await DB.createBloco(bloco));
        }),
      erro: ({ reason }) => State.Error(reason),
      erroCapturado: ({ reason }) =>
        State.match(state, {
          Loading: () => State.Error(reason),
          Error: s => s,
          Success: ({ blocos }) => State.Success(blocos, reason),
        }),
      inserir: ({ id, fecharJanela }) =>
        reducer(
          state,
          Action.modificarProcessos(
            id,
            (processos, numproc) => {
              processos.add(numproc);
            },
            { fecharJanela }
          )
        ),
      inserirEFechar: ({ id }) => reducer(state, Action.inserir(id, { fecharJanela: true })),
      mensagemRecebida: ({ msg }) =>
        matchBy('type')(msg, {
          Blocos: ({ blocos }) => reducer(state, Action.blocosObtidos(blocos)),
          NoOp: () => state,
        }),
      modificarProcessos: ({ id, fn, fecharJanela }) =>
        asyncAction(state, async () => {
          const bloco = await DB.getBloco(id);
          if (!bloco) throw new Error(`Bloco não encontrado: ${id}.`);
          const processos = new Set(bloco.processos);
          fn(processos, numproc);
          const blocos = await DB.updateBloco({ ...bloco, processos: [...processos] });
          return Action.blocosModificados(blocos, { fecharJanela });
        }),
      noop: () => state,
      obterBlocos: () =>
        asyncAction(state, async () => Action.blocosModificados(await DB.getBlocos())),
      remover: ({ id }) =>
        reducer(
          state,
          Action.modificarProcessos(id, (processos, numproc) => {
            processos.delete(numproc);
          })
        ),
    });
  }
}

function Main({ numproc }: { numproc: NumProc }): JSX.Element {
  const bc = useMemo(() => {
    return createBroadcastService('gm-blocos', isBroadcastMessage);
  }, []);
  const [state, dispatch] = useReducer(createReducer({ bc, numproc }), null, () => {
    return State.Loading([], async () => Action.blocosModificados(await DB.getBlocos()));
  });
  useEffect(() => {
    const sub = bc.subscribe(msg => dispatch(Action.mensagemRecebida(msg)));
    return () => {
      sub.unsubscribe();
    };
  }, [dispatch]);
  useEffect(() => {
    if (state.status === 'Loading') {
      state.promise.catch(Action.erro).then(dispatch);
    }
  }, [state, dispatch]);
  return State.match(state, {
    Loading: ({ blocos }) => {
      if (blocos.length === 0) return <Placeholder />;
      else
        return (
          <Blocos
            blocos={blocos.map(({ id, nome, processos }) => ({
              id,
              nome,
              inserido: processos.includes(numproc),
            }))}
            disabled={true}
            criarBloco={nome => dispatch(Action.criarBloco(nome))}
            toggleBloco={(id, op, fecharJanela) => {
              if (op === 'inserir') {
                dispatch(Action.inserir(id, { fecharJanela }));
              } else {
                dispatch(Action.remover(id));
              }
            }}
          />
        );
    },
    Error: ({ reason }) => (
      <ShowError reason={reason} onRecarregarClick={() => dispatch(Action.obterBlocos)} />
    ),
    Success: ({ blocos, erro }) => (
      <Blocos
        blocos={blocos.map(({ id, nome, processos }) => ({
          id,
          nome,
          inserido: processos.includes(numproc),
        }))}
        disabled={false}
        erro={erro}
        criarBloco={nome => dispatch(Action.criarBloco(nome))}
        toggleBloco={(id, op, fecharJanela) => {
          if (op === 'inserir') {
            dispatch(Action.inserir(id, { fecharJanela }));
          } else {
            dispatch(Action.remover(id));
          }
        }}
      />
    ),
  });
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
      <button type="button" id="gm-novo-bloco" disabled>
        Novo
      </button>
    </>
  );
}

function Blocos(props: {
  blocos: BlocoProcesso[];
  disabled: boolean;
  erro?: string;
  criarBloco: (nome: Bloco['nome']) => void;
  toggleBloco: (id: Bloco['id'], operacao: 'inserir' | 'remover', fecharJanela: boolean) => void;
}) {
  let aviso: JSX.Element | null = null;
  if (props.erro) {
    aviso = <div class="error">{props.erro}</div>;
  }
  return (
    <>
      <h4>Blocos</h4>
      <ul>
        {props.blocos.map(info => (
          <BlocoPaginaProcesso
            key={info.id}
            {...info}
            disabled={props.disabled}
            toggleBloco={props.toggleBloco}
          />
        ))}
      </ul>
      <button type="button" id="gm-novo-bloco" onClick={onNovoClicked} disabled={props.disabled}>
        Novo
      </button>
      {aviso}
    </>
  );

  function onNovoClicked(evt: Event) {
    evt.preventDefault();
    const nome = prompt('Nome do novo bloco:');
    if (nome === null) return;
    if (p.isNonEmptyString(nome)) {
      props.criarBloco(nome);
    }
  }
}

function BlocoPaginaProcesso(
  props: BlocoProcesso & {
    disabled: boolean;

    toggleBloco: (id: Bloco['id'], operacao: 'inserir' | 'remover', fecharJanela: boolean) => void;
  }
) {
  const onChange = (evt: JSX.TargetedEvent<HTMLInputElement>) => {
    if (evt.currentTarget.checked) {
      props.toggleBloco(props.id, 'inserir', false);
    } else {
      props.toggleBloco(props.id, 'remover', false);
    }
  };
  return (
    <li>
      <input
        id={`gm-bloco-${props.id}`}
        type="checkbox"
        checked={props.inserido}
        onChange={onChange}
        disabled={props.disabled}
      />{' '}
      <label for={`gm-bloco-${props.id}`}>{props.nome}</label>
      {props.inserido ? (
        <span />
      ) : (
        <>
          {' '}
          <input
            type="image"
            src="infra_css/imagens/transportar.gif"
            onMouseOver={() => infraTooltipMostrar('Inserir processo no bloco e fechar a janela.')}
            onMouseOut={() => infraTooltipOcultar()}
            onClick={() => {
              infraTooltipOcultar();
              props.toggleBloco(props.id, 'inserir', true);
            }}
            disabled={props.disabled}
          />
        </>
      )}
    </li>
  );
}
