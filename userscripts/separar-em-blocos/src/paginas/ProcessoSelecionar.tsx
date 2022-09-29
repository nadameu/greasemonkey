import { createBroadcastService } from '@nadameu/create-broadcast-service';
import { createStore } from '@nadameu/create-store';
import { Either, Left, Right } from '@nadameu/either';
import { createTaggedUnion, matchBy, Static } from '@nadameu/match';
import * as p from '@nadameu/predicates';
import { JSX, render } from 'preact';
import { useCallback } from 'preact/hooks';
import * as DB from '../database';
import { BroadcastMessage, isBroadcastMessage } from '../types/Action';
import { Bloco, BlocoProcesso } from '../types/Bloco';
import { NumProc } from '../types/NumProc';
import css from './ProcessoSelecionar.scss?inline';

export function ProcessoSelecionar(numproc: NumProc): Either<Error, void> {
  const mainMenu = document.getElementById('main-menu');
  if (p.isNull(mainMenu)) return Left(new Error('Menu não encontrado'));
  const style = document.head.appendChild(document.createElement('style'));
  style.textContent = css;
  const div = mainMenu.insertAdjacentElement('beforebegin', document.createElement('div'))!;
  div.id = 'gm-blocos';

  const Model = createTaggedUnion(
    {
      Loading: null,
      Success: (blocos: Bloco[], inactive: boolean, erro?: string) => ({ blocos, inactive, erro }),
      Error: (reason: unknown) => ({ reason }),
    },
    'status'
  );
  type Model = Static<typeof Model>;

  const Action = createTaggedUnion(
    {
      blocosModificados: (blocos: Bloco[], { fecharJanela = false } = {}) => ({
        blocos,
        fecharJanela,
      }),
      blocosObtidos: (blocos: Bloco[]) => ({ blocos }),
      carregando: null,
      criarBloco: (nome: Bloco['nome']) => ({ nome }),
      erro: (reason: unknown) => ({ reason }),
      erroCapturado: (reason: string) => ({ reason }),
      inserir: (id: Bloco['id'], { fecharJanela = false } = {}) => ({ id, fecharJanela }),
      inserirEFechar: (id: Bloco['id']) => ({ id }),
      mensagemRecebida: (msg: BroadcastMessage) => ({ msg }),
      modificarProcessos: (
        id: Bloco['id'],
        fn: (processos: Set<NumProc>, numproc: NumProc) => void,
        { fecharJanela = false } = {}
      ) => ({ id, fn, fecharJanela }),
      noop: null,
      obterBlocos: null,
      remover: (id: Bloco['id']) => ({ id }),
    },
    'type'
  );
  type Action = Static<typeof Action>;

  const store = createStore<Model, Action>(() => Model.Loading, reducer);
  const bc = createBroadcastService('gm-blocos', isBroadcastMessage);
  bc.subscribe(msg => store.dispatch(Action.mensagemRecebida(msg)));
  store.subscribe(update);
  store.dispatch(Action.obterBlocos);
  return Right(undefined);

  function asyncAction(state: Model, f: () => Promise<Action>): Model {
    f()
      .catch(err => Action.erro(err))
      .then(store.dispatch);
    return reducer(state, Action.carregando);
  }

  function reducer(state: Model, action: Action): Model {
    return Action.match(action, {
      blocosModificados: ({ blocos, fecharJanela }) =>
        asyncAction(state, async () => {
          bc.publish({ type: 'Blocos', blocos });
          if (fecharJanela) window.close();
          return Action.blocosObtidos(blocos);
        }),
      blocosObtidos: ({ blocos }) => Model.Success(blocos, false),
      carregando: () =>
        Model.match(
          state,
          {
            Success: state => Model.Success(state.blocos, true, undefined),
          },
          (): Model => Model.Loading
        ),
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
      erro: ({ reason }) => Model.Error(reason),
      erroCapturado: ({ reason }) =>
        Model.match(state, {
          Loading: () => Model.Error(reason),
          Error: s => s,
          Success: ({ blocos }) => Model.Success(blocos, false, reason),
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

  function update(state: Model) {
    render(<Main state={state} />, div);
  }

  function Main({ state }: { state: Model }) {
    return Model.match(state, {
      Error: ({ reason }) => <ShowError reason={reason} />,
      Loading: () => <Placeholder />,
      Success: ({ blocos, inactive, erro }) => (
        <Blocos
          blocos={blocos.map(({ processos, ...rest }) => ({
            ...rest,
            inserido: processos.includes(numproc),
          }))}
          disabled={inactive}
          erro={erro}
        />
      ),
    });
  }

  function ShowError({ reason }: { reason: unknown }) {
    const message = messageFromReason(reason);
    return (
      <>
        <h4>Blocos</h4>
        <div class="error">{message}</div>
        <button type="button" onClick={() => store.dispatch(Action.obterBlocos)}>
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

  function Blocos(props: { blocos: BlocoProcesso[]; disabled: boolean; erro?: string }) {
    let aviso: JSX.Element | null = null;
    if (props.erro) {
      aviso = <div class="error">{props.erro}</div>;
    }
    return (
      <>
        <h4>Blocos</h4>
        <ul>
          {props.blocos.map(info => (
            <BlocoPaginaProcesso key={info.id} {...info} disabled={props.disabled} />
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
        store.dispatch(Action.criarBloco(nome));
      }
    }
  }

  function BlocoPaginaProcesso(props: BlocoProcesso & { disabled: boolean }) {
    const onChange = (evt: JSX.TargetedEvent<HTMLInputElement>) => {
      if (evt.currentTarget.checked) {
        store.dispatch(Action.inserir(props.id));
      } else {
        store.dispatch(Action.remover(props.id));
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
              onClick={() => store.dispatch(Action.inserirEFechar(props.id))}
              disabled={props.disabled}
            />
          </>
        )}
      </li>
    );
  }
}
