import { BroadcastService, createBroadcastService } from '@nadameu/create-broadcast-service';
import { expectUnreachable } from '@nadameu/expect-unreachable';
import { Handler } from '@nadameu/handler';
import { assert, isNonEmptyString, isNotNull, NonNegativeInteger } from '@nadameu/predicates';
import { h, JSX, render } from 'preact';
import { useCallback, useLayoutEffect, useMemo, useReducer } from 'preact/hooks';
import * as Database from '../database';
import * as FT from '../lib/fromThunk';
import { BroadcastMessage, isBroadcastMessage } from '../types/Action';
import { Bloco, BlocoProcesso } from '../types/Bloco';
import { NumProc } from '../types/NumProc';
import css from './ProcessoSelecionar.css';

type Dependencias = {
  DB: Pick<typeof Database, 'createBloco' | 'getBloco' | 'getBlocos' | 'updateBloco'>;
  bc: BroadcastService<BroadcastMessage>;
  numproc: NumProc;
};

type Model =
  | { status: 'Loading' }
  | { status: 'Success'; blocos: Bloco[]; inactive: boolean; erro?: string }
  | { status: 'Error'; reason: unknown };

type Action = FT.Action<Model, Dependencias>;
type Dispatch = FT.Dispatch<Model, Dependencias>;

const actions = {
  blocosModificados:
    (blocos: Bloco[], { fecharJanela = false } = {}): Action =>
    (state, dispatch, extra) => {
      const { bc } = extra;
      bc.publish({ type: 'Blocos', blocos });
      if (fecharJanela) window.close();
      return actions.blocosObtidos(blocos)(state, dispatch, extra);
    },
  blocosObtidos:
    (blocos: Bloco[]): Action =>
    () => ({ status: 'Success', blocos, inactive: false }),
  carregando: (): Action => state => {
    switch (state.status) {
      case 'Loading':
      case 'Error':
        return { status: 'Loading' };

      case 'Success':
        return { ...state, inactive: true, erro: undefined };
    }
    return expectUnreachable(state);
  },
  criarBloco: (nome: Bloco['nome']): Action =>
    fromThunk(async ({}, { DB }) => {
      const blocos = await DB.getBlocos();
      if (blocos.some(x => x.nome === nome))
        return actions.erroCapturado(`Já existe um bloco com o nome ${JSON.stringify(nome)}.`);
      const bloco: Bloco = {
        id: (Math.max(-1, ...blocos.map(x => x.id)) + 1) as NonNegativeInteger,
        nome,
        processos: [],
      };
      return actions.blocosModificados(await DB.createBloco(bloco));
    }),
  erro:
    (reason: unknown): Action =>
    () => ({ status: 'Error', reason }),
  erroCapturado:
    (reason: string): Action =>
    state => {
      switch (state.status) {
        case 'Loading':
          return { status: 'Error', reason };
        case 'Error':
          return state;
        case 'Success':
          return { ...state, inactive: false, erro: reason };
      }
      return expectUnreachable(state);
    },
  inserir: (id: Bloco['id'], { fecharJanela = false } = {}): Action =>
    actions.modificarProcessos(
      id,
      (processos, numproc) => {
        processos.add(numproc);
      },
      { fecharJanela }
    ),
  inserirEFechar: (id: Bloco['id']): Action => actions.inserir(id, { fecharJanela: true }),
  mensagemRecebida: (msg: BroadcastMessage): Action => {
    switch (msg.type) {
      case 'Blocos':
        return actions.blocosObtidos(msg.blocos);
      case 'NoOp':
        return actions.noop();
    }
    expectUnreachable(msg);
  },
  modificarProcessos: (
    id: Bloco['id'],
    fn: (processos: Set<NumProc>, numproc: NumProc) => void,
    { fecharJanela = false } = {}
  ): Action =>
    fromThunk(async (_, { DB, numproc }) => {
      const bloco = await DB.getBloco(id);
      if (!bloco) throw new Error(`Bloco não encontrado: ${id}.`);
      const processos = new Set(bloco.processos);
      fn(processos, numproc);
      const blocos = await DB.updateBloco({ ...bloco, processos: [...processos] });
      return actions.blocosModificados(blocos, { fecharJanela });
    }),
  noop: (): Action => state => state,
  obterBlocos: (): Action =>
    fromThunk(async ({}, { DB }) => actions.blocosModificados(await DB.getBlocos())),
  remover: (id: Bloco['id']): Action =>
    actions.modificarProcessos(id, (processos, numproc) => {
      processos.delete(numproc);
    }),
};

const fromThunk = /* #__PURE__ */ FT.createFromAsyncThunk(actions.carregando(), actions.erro);

export function ProcessoSelecionar(numproc: NumProc) {
  const mainMenu = document.getElementById('main-menu');
  assert(isNotNull(mainMenu));
  const style = document.head.appendChild(document.createElement('style'));
  style.textContent = css;
  const div = mainMenu.insertAdjacentElement('beforebegin', document.createElement('div'))!;
  div.id = 'gm-blocos';
  render(<Main numproc={numproc} />, div);
}

function Main(props: { numproc: NumProc }) {
  const extra = useMemo((): Dependencias => {
    const DB = Database,
      bc = createBroadcastService('gm-blocos', isBroadcastMessage),
      { numproc } = props;
    return { DB, bc, numproc };
  }, []);

  const [state, dispatch] = useReducer(
    (state: Model, action: Action): Model => action(state, dispatch, extra),
    { status: 'Loading' }
  );

  useLayoutEffect(() => {
    extra.bc.subscribe(msg => dispatch(actions.mensagemRecebida(msg)));
    dispatch(actions.obterBlocos());
  }, []);

  switch (state.status) {
    case 'Loading':
      return <Placeholder />;
    case 'Error':
      return <ShowError dispatch={dispatch} reason={state.reason} />;
    case 'Success':
      return (
        <Blocos
          blocos={state.blocos.map(({ processos, ...rest }) => ({
            ...rest,
            inserido: processos.includes(props.numproc),
          }))}
          dispatch={dispatch}
          disabled={state.inactive}
          erro={state.erro}
        />
      );
  }
  return expectUnreachable(state);
}

function ShowError({ dispatch, reason }: { dispatch: Dispatch; reason: unknown }) {
  const message =
    typeof reason === 'object' && reason !== null && reason instanceof Error
      ? reason.message
        ? `Ocorreu um erro: ${reason.message}`
        : 'Ocorreu um erro desconhecido.'
      : `Ocorreu um erro: ${String(reason)}`;

  return (
    <>
      <h4>Blocos</h4>
      <div class="error">{message}</div>
      <button type="button" onClick={() => dispatch(actions.obterBlocos())}>
        Recarregar
      </button>
    </>
  );
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
  dispatch: Handler<Action>;
  disabled: boolean;
  erro?: string;
}) {
  let aviso: h.JSX.Element | null = null;
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
            dispatch={props.dispatch}
            disabled={props.disabled}
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
    if (isNonEmptyString(nome)) {
      props.dispatch(actions.criarBloco(nome));
    }
  }
}

function BlocoPaginaProcesso(
  props: BlocoProcesso & { dispatch: Handler<Action>; disabled: boolean }
) {
  const onChange = useCallback(
    (evt: JSX.TargetedEvent<HTMLInputElement>) => {
      if (evt.currentTarget.checked) {
        props.dispatch(actions.inserir(props.id));
      } else {
        props.dispatch(actions.remover(props.id));
      }
    },
    [props.dispatch]
  );
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
            onClick={() => props.dispatch(actions.inserirEFechar(props.id))}
            disabled={props.disabled}
          />
        </>
      )}
    </li>
  );
}
