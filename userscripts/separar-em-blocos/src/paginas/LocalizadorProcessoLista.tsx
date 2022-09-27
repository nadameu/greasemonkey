import { BroadcastService, createBroadcastService } from '@nadameu/create-broadcast-service';
import { Either, Left, Right, traverse } from '@nadameu/either';
import { expectUnreachable } from '@nadameu/expect-unreachable';
import * as p from '@nadameu/predicates';
import { createRef, render } from 'preact';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useReducer,
  useState,
} from 'preact/hooks';
import * as Database from '../database';
import * as FT from '../fromThunk';
import { BroadcastMessage, isBroadcastMessage } from '../types/Action';
import { Bloco } from '../types/Bloco';
import { isNumProc, NumProc } from '../types/NumProc';
import css from './LocalizadorProcessoLista.scss';
import iconeRenomear from './renomear.svg';

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

type Model =
  | { status: 'init' }
  | { status: 'loaded'; blocos: InfoBloco[]; aviso?: string }
  | { status: 'error'; error: unknown };

type Action = FT.Action<Model, Dependencias>;
type Dispatch = FT.Dispatch<Model, Dependencias>;

type Dependencias = {
  DB: Pick<
    typeof Database,
    'createBloco' | 'deleteBloco' | 'deleteBlocos' | 'getBloco' | 'getBlocos' | 'updateBloco'
  >;
  bc: BroadcastService<BroadcastMessage>;
  mapa: MapaProcessos;
};

const fromThunk = FT.createFromAsyncThunk<Model, Dependencias>(
  state => state,
  error => () => ({ status: 'error', error })
);

const actions = {
  blocosModificados:
    (blocos: Bloco[]): Action =>
    (state, dispatch, extra) => {
      const { bc } = extra;
      bc.publish({ type: 'Blocos', blocos });
      return actions.blocosObtidos(blocos)(state, dispatch, extra);
    },
  blocosObtidos:
    (blocos: Bloco[]): Action =>
    (state, _, { mapa }) => {
      const info = blocos.map(
        (bloco): InfoBloco => ({
          ...bloco,
          nestaPagina: bloco.processos.filter(numproc => mapa.has(numproc)).length,
          total: bloco.processos.length,
        })
      );
      if (state.status === 'error') return state;
      return { status: 'loaded', blocos: info };
    },
  criarBloco: (nome: Bloco['nome']): Action =>
    fromThunk(async (state, { DB }) => {
      const blocos = await DB.getBlocos();
      if (blocos.some(x => x.nome === nome))
        return actions.erroCapturado(`Já existe um bloco com o nome ${JSON.stringify(nome)}.`);
      const bloco: Bloco = {
        id: (Math.max(-1, ...blocos.map(x => x.id)) + 1) as p.NonNegativeInteger,
        nome,
        processos: [],
      };
      return actions.blocosModificados(await DB.createBloco(bloco));
    }),
  erroCapturado:
    (aviso: string): Action =>
    state => {
      switch (state.status) {
        case 'init':
          return { status: 'error', error: aviso };
        case 'error':
          return state;
        case 'loaded':
          return { ...state, aviso };
      }
      return expectUnreachable(state);
    },
  excluirBD: (): Action =>
    fromThunk(async ({}, { DB }) => {
      await DB.deleteBlocos();
      return actions.obterBlocos();
    }),
  excluirBloco: (bloco: p.NonNegativeInteger): Action =>
    fromThunk(async ({}, { DB }) => {
      return actions.blocosModificados(await DB.deleteBloco(bloco));
    }),
  mensagemRecebida: (msg: BroadcastMessage): Action => {
    switch (msg.type) {
      case 'Blocos':
        return actions.blocosObtidos(msg.blocos);
      case 'NoOp':
        return actions.noop();
      default:
        return expectUnreachable(msg);
    }
  },
  obterBlocos: (): Action =>
    fromThunk(async ({}, { DB }) => actions.blocosModificados(await DB.getBlocos())),
  noop: (): Action => state => state,
  removerProcessosAusentes: (id: Bloco['id']): Action =>
    fromThunk(async (_, { DB, mapa }) => {
      const bloco = await DB.getBloco(id);
      if (!bloco) throw new Error(`Bloco não encontrado: ${id}.`);
      const processos = bloco.processos.filter(x => mapa.has(x));
      return actions.blocosModificados(await DB.updateBloco({ ...bloco, processos }));
    }),
  renomearBloco: (id: Bloco['id'], nome: Bloco['nome']): Action =>
    fromThunk(async ({}, { DB }) => {
      const blocos = await DB.getBlocos();
      const bloco = blocos.find(x => x.id === id);
      if (!bloco) throw new Error(`Bloco não encontrado: ${id}.`);
      const others = blocos.filter(x => x.id !== id);
      if (others.some(x => x.nome === nome))
        return actions.erroCapturado(`Já existe um bloco com o nome ${JSON.stringify(nome)}.`);
      return actions.blocosModificados(await DB.updateBloco({ ...bloco, nome }));
    }),
  selecionarProcessos: (id: Bloco['id']): Action =>
    fromThunk(async ({}, { DB, mapa }) => {
      const bloco = await DB.getBloco(id);
      if (!bloco) throw new Error(`Bloco não encontrado: ${id}.`);
      for (const [numproc, { checkbox }] of mapa) {
        if (bloco.processos.includes(numproc)) {
          if (!checkbox.checked) checkbox.click();
        } else {
          if (checkbox.checked) checkbox.click();
        }
      }
      return actions.noop();
    }),
};

export function LocalizadorProcessoLista(): Either<Error, void> {
  const tabela = document.querySelector<HTMLTableElement>('table#tabelaLocalizadores');
  const linhas = Array.from(tabela?.rows ?? { length: 0 });
  if (linhas.length <= 1) return Right(undefined);

  const eitherMapa = traverse(linhas.slice(1), (linha, i) => {
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
    return Right([numproc, { linha, checkbox }] as const);
  });
  if (eitherMapa.isLeft) return eitherMapa as Left<Error>;
  const mapa: MapaProcessos = new Map(eitherMapa.rightValue);

  const barra = document.getElementById('divInfraBarraLocalizacao');
  if (p.isNullish(barra)) return Left(new Error('Não foi possível inserir os blocos na página.'));

  document.head.appendChild(document.createElement('head')).textContent = css;
  const div = barra.insertAdjacentElement('afterend', document.createElement('div'))!;
  div.id = 'gm-blocos';
  render(<Main mapa={mapa} />, div);
  return Right(undefined);
}

function Main(props: { mapa: MapaProcessos }) {
  const extra = useMemo((): Dependencias => {
    const DB = Database,
      bc = createBroadcastService('gm-blocos', isBroadcastMessage),
      { mapa } = props;
    return { DB, bc, mapa };
  }, []);

  const [state, dispatch] = useReducer(
    (state: Model, action: Action): Model => action(state, dispatch, extra),
    { status: 'init' }
  );

  useLayoutEffect(() => {
    extra.bc.subscribe(msg => dispatch(actions.mensagemRecebida(msg)));
    dispatch(actions.obterBlocos());
  }, []);

  switch (state.status) {
    case 'error':
      return <ShowError reason={state.error} dispatch={dispatch} />;

    case 'loaded':
      return <Blocos state={state} dispatch={dispatch} />;

    case 'init':
      return <Loading />;
  }
  return expectUnreachable(state);
}

function Loading() {
  return <>Carregando...</>;
}

function ShowError({ dispatch, reason }: { reason: unknown; dispatch: Dispatch }) {
  const message =
    reason instanceof Error
      ? reason.message
        ? `Ocorreu um erro: ${reason.message}`
        : 'Ocorreu um erro desconhecido.'
      : `Ocorreu um erro: ${String(reason)}`;

  return (
    <>
      <span style="color:red; font-weight: bold;">{message}</span>
      <br />
      <br />
      <button onClick={() => dispatch(actions.obterBlocos())}>Tentar carregar dados salvos</button>
      <button onClick={() => dispatch(actions.excluirBD())}>Apagar os dados locais</button>
    </>
  );
}

function Blocos(props: { state: Extract<Model, { status: 'loaded' }>; dispatch: Dispatch }) {
  const [nome, setNome] = useState('');

  const onSubmit = useCallback(
    (e: Event) => {
      e.preventDefault();
      if (p.isNonEmptyString(nome)) props.dispatch(actions.criarBloco(nome));
      else props.dispatch(actions.erroCapturado('Nome do bloco não pode estar em branco.'));
      setNome('');
    },
    [nome]
  );

  let aviso: JSX.Element | null = null;
  if (props.state.aviso) {
    aviso = (
      <>
        <span style="color:red">{props.state.aviso}</span>
        <button onClick={() => props.dispatch(actions.obterBlocos())}>Recarregar dados</button>
      </>
    );
  }

  return (
    <>
      <h4>Blocos</h4>
      <ul>
        {props.state.blocos.map(bloco => (
          <BlocoPaginaLista key={bloco.id} {...bloco} dispatch={props.dispatch} />
        ))}
      </ul>
      <form onSubmit={onSubmit}>
        <input value={nome} onInput={evt => setNome(evt.currentTarget.value)} />{' '}
        <button>Criar</button>
      </form>
      <br />
      {aviso}
    </>
  );
}

function BlocoPaginaLista(props: InfoBloco & { dispatch: Dispatch }) {
  const [editing, setEditing] = useState(false);
  const input = createRef<HTMLInputElement>();
  useEffect(() => {
    if (editing && input.current) {
      input.current.select();
      input.current.focus();
    }
  }, [editing]);

  let displayNome: JSX.Element | string = props.nome;

  let botaoRenomear: JSX.Element | null = (
    <img
      class="infraButton"
      src="imagens/minuta_editar.gif"
      onMouseOver={() => infraTooltipMostrar('Renomear')}
      onMouseOut={() => infraTooltipOcultar()}
      onClick={onRenomearClicked}
      aria-label="Renomear"
      width="16"
      height="16"
    />
  );

  let removerAusentes: JSX.Element | null = (
    <img
      class="infraButton"
      src="imagens/minuta_transferir.png"
      onMouseOver={() => infraTooltipMostrar('Remover processos ausentes')}
      onMouseOut={() => infraTooltipOcultar()}
      onClick={() => props.dispatch(actions.removerProcessosAusentes(props.id))}
      aria-label="Remover processos ausentes"
      width="16"
      height="16"
    />
  );

  if (editing) {
    displayNome = <input ref={input} onKeyUp={onKeyUp} value={props.nome} />;
    botaoRenomear = null;
  } else if (props.nestaPagina > 0) {
    // displayNome = <button onClick={onSelecionarProcessosClicked}>{props.nome}</button>;
  }
  if (props.total <= props.nestaPagina) {
    removerAusentes = null;
  }

  const htmlId = `gmChkBloco${props.id}`;
  return (
    <li>
      <input type="checkbox" id={htmlId} />
      <label for={htmlId}>{displayNome}</label>
      <small>({createAbbr(props.nestaPagina, props.total)})</small>
      {botaoRenomear}{' '}
      <img
        class="infraButton"
        src="imagens/minuta_excluir.gif"
        onMouseOver={() => infraTooltipMostrar('Excluir')}
        onMouseOut={() => infraTooltipOcultar()}
        onClick={onExcluirClicked}
        aria-label="Excluir"
        width="16"
        height="16"
      />{' '}
      {removerAusentes}
    </li>
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
        props.dispatch(actions.renomearBloco(props.id, nome));
      } else {
        props.dispatch(actions.erroCapturado('Nome do bloco não pode estar em branco.'));
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
    if (confirmed) props.dispatch(actions.excluirBloco(props.id));
  }
  function onSelecionarProcessosClicked() {
    props.dispatch(actions.selecionarProcessos(props.id));
  }
}
