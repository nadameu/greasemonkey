import { BroadcastService, createBroadcastService } from '@nadameu/create-broadcast-service';
import { createStore, Store } from '@nadameu/create-store';
import { Either, Left, Right, traverse } from '@nadameu/either';
import { Handler } from '@nadameu/handler';
import { createTaggedUnion, matchBy, Static } from '@nadameu/match';
import * as p from '@nadameu/predicates';
import { createRef, render } from 'preact';
import { useCallback, useEffect, useState } from 'preact/hooks';
import * as Database from '../database';
import { BroadcastMessage, isBroadcastMessage } from '../types/Action';
import { Bloco } from '../types/Bloco';
import { isNumProc, NumProc } from '../types/NumProc';
import css from './LocalizadorProcessoLista.scss';

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

const Model = createTaggedUnion(
  {
    init: null,
    loaded: (blocos: InfoBloco[], aviso?: string) => ({ blocos, aviso }),
    error: (error: unknown) => ({ error }),
  },
  'status'
);

type Model = Static<typeof Model>;

type Dependencias = {
  DB: Pick<
    typeof Database,
    'createBloco' | 'deleteBloco' | 'deleteBlocos' | 'getBloco' | 'getBlocos' | 'updateBloco'
  >;
  bc: BroadcastService<BroadcastMessage>;
  mapa: MapaProcessos;
};

const Action = createTaggedUnion(
  {
    blocosModificados: (blocos: Bloco[]) => ({ blocos }),
    blocosObtidos: (blocos: Bloco[]) => ({ blocos }),
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
    selecionarProcessos: (id: Bloco['id']) => ({ id }),
  },
  'type'
);
type Action = Static<typeof Action>;

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
  const asyncAction = (state: Model, f: () => Promise<Action>): Model => {
    f()
      .catch(err => Action.erroDesconhecido(err))
      .then(store.dispatch);
    return state;
  };
  const bc = createBroadcastService('gm-blocos', isBroadcastMessage);
  const store: Store<Model, Action> = createStore<Model, Action>(
    () => Model.init,
    (state, action) =>
      Action.match(action, {
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
        selecionarProcessos: ({ id }) =>
          asyncAction(state, async () => {
            const bloco = await Database.getBloco(id);
            if (!bloco) throw new Error(`Bloco não encontrado: ${id}.`);
            for (const [numproc, { checkbox }] of mapa) {
              if (bloco.processos.includes(numproc)) {
                if (!checkbox.checked) checkbox.click();
              } else {
                if (checkbox.checked) checkbox.click();
              }
            }
            return Action.noop;
          }),
      })
  );
  bc.subscribe(msg => store.dispatch(Action.mensagemRecebida(msg)));
  store.subscribe(state => {
    render(<Main state={state} />, div);
  });
  store.dispatch(Action.obterBlocos);
  return Right(undefined);

  function Main({ state }: { state: Model }) {
    return Model.match(state, {
      error: state => <ShowError reason={state.error} dispatch={store.dispatch} />,
      loaded: state => <Blocos state={state} dispatch={store.dispatch} />,
      init: () => <Loading />,
    });
  }
}

function Loading() {
  return <>Carregando...</>;
}

function ShowError({ dispatch, reason }: { reason: unknown; dispatch: Handler<Action> }) {
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
      <button onClick={() => dispatch(Action.obterBlocos)}>Tentar carregar dados salvos</button>
      <button onClick={() => dispatch(Action.excluirBD)}>Apagar os dados locais</button>
    </>
  );
}

function Blocos(props: { state: Extract<Model, { status: 'loaded' }>; dispatch: Handler<Action> }) {
  const [nome, setNome] = useState('');

  const onSubmit = useCallback(
    (e: Event) => {
      e.preventDefault();
      if (p.isNonEmptyString(nome)) props.dispatch(Action.criarBloco(nome));
      else props.dispatch(Action.erroCapturado('Nome do bloco não pode estar em branco.'));
      setNome('');
    },
    [nome]
  );

  let aviso: JSX.Element | null = null;
  if (props.state.aviso) {
    aviso = (
      <>
        <span style="color:red">{props.state.aviso}</span>
        <button onClick={() => props.dispatch(Action.obterBlocos)}>Recarregar dados</button>
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

function BlocoPaginaLista(props: InfoBloco & { dispatch: Handler<Action> }) {
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
      onClick={() => props.dispatch(Action.removerProcessosAusentes(props.id))}
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
        props.dispatch(Action.renomearBloco(props.id, nome));
      } else {
        props.dispatch(Action.erroCapturado('Nome do bloco não pode estar em branco.'));
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
    if (confirmed) props.dispatch(Action.excluirBloco(props.id));
  }
  function onSelecionarProcessosClicked() {
    props.dispatch(Action.selecionarProcessos(props.id));
  }
}
