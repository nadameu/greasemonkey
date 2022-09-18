import { Either, validateAll } from '@nadameu/either';
import { Handler } from '@nadameu/handler';
import { JSX, render } from 'preact';
import { createStore } from './createStore';
import { createTaggedUnion, match, Static } from './match';
import { NumProc } from './NumProc';
import { obter } from './obter';
import { adicionarProcessoAguardando } from './processosAguardando';

export function paginaProcesso(numproc: NumProc): Either<Error[], void> {
  return validateAll([obterInformacoesAdicionais(), obterLink()]).map(
    ([informacoesAdicionais, link]) =>
      modificarPaginaProcesso({ informacoesAdicionais, link, numproc, url: link.href })
  );
}

const Estado = createTaggedUnion({
  AguardaVerificacaoSaldo: (tentativas: number) => tentativas,
  ComConta: null,
  SemConta: null,
  Erro: null,
});
type Estado = Static<typeof Estado>;

const Acao = createTaggedUnion({ Tick: null, Clique: null });
type Acao = Static<typeof Acao>;

function criarArmazem({
  link,
  numproc,
  url,
}: {
  link: HTMLAnchorElement;
  numproc: NumProc;
  url: string;
}) {
  return createStore<Estado, Acao>(
    () => Estado.AguardaVerificacaoSaldo(0),
    (estado, acao) =>
      acao.match({
        Tick: () =>
          estado.match(
            {
              AguardaVerificacaoSaldo: tentativas => {
                if (link.textContent === '') {
                  if (tentativas > 30) return Estado.Erro;
                  return Estado.AguardaVerificacaoSaldo(tentativas + 1);
                }
                if (link.textContent === 'Há conta com saldo') return Estado.ComConta;
                return Estado.SemConta;
              },
              Erro: () => estado,
            },
            () => Estado.Erro
          ),
        Clique: () =>
          estado.match(
            {
              ComConta: () => {
                adicionarProcessoAguardando(numproc);
                window.open(url);
                return estado;
              },
              AguardaVerificacaoSaldo: () => Estado.Erro,
            },
            () => {
              window.open(url);
              return estado;
            }
          ),
      })
  );
}

function modificarPaginaProcesso({
  informacoesAdicionais,
  link,
  numproc,
  url,
}: {
  informacoesAdicionais: HTMLElement;
  link: HTMLAnchorElement;
  numproc: NumProc;
  url: string;
}) {
  const store = criarArmazem({ link, numproc, url });

  {
    const timer = window.setInterval(() => {
      store.dispatch(Acao.Tick);
    }, 100);
    const sub = store.subscribe(estado => {
      if (estado.tag !== 'AguardaVerificacaoSaldo') {
        window.clearInterval(timer);
        sub.unsubscribe();
      }
    });
  }

  let div: HTMLElement | undefined;
  const sub = store.subscribe(estado => {
    if (!div) {
      div = document.createElement('div');
      div.className = 'gm-atualizar-saldo__processo';
      informacoesAdicionais.insertAdjacentElement('beforebegin', div);
    }
    render(<App {...{ estado, onClick }} />, div);
  });

  function onClick(evt: Event) {
    evt.preventDefault();
    store.dispatch(Acao.Clique);
  }
}

function App(props: { estado: Estado; onClick: Handler<Event> }): JSX.Element;
function App({ estado, onClick }: { estado: Estado; onClick: Handler<Event> }) {
  if (estado.tag === 'AguardaVerificacaoSaldo') {
    return <output>Verificando contas com saldo...</output>;
  }

  interface InfoMensagem {
    classe: string;
    mensagem: string;
    rotuloBotao: string;
  }
  const infoMensagem: InfoMensagem = match(estado, {
    ComConta: () => ({
      classe: 'saldo',
      mensagem: 'Há conta(s) com saldo.',
      rotuloBotao: 'Atualizar',
    }),
    SemConta: () => ({
      classe: 'zerado',
      mensagem: 'Sem saldo em conta(s).',
      rotuloBotao: 'Abrir página',
    }),
    Erro: () => ({
      classe: 'erro',
      mensagem: 'Ocorreu um erro com a atualização de saldo de RPV.',
      rotuloBotao: 'Abrir página',
    }),
  });
  return (
    <>
      <span class={infoMensagem.classe}>{infoMensagem.mensagem}</span>{' '}
      <button type="button" onClick={onClick} class={infoMensagem.classe}>
        {infoMensagem.rotuloBotao}
      </button>
    </>
  );
}

function obterLink() {
  return obter<HTMLAnchorElement>('a#labelPrecatorios', 'Link não encontrado.');
}

function obterInformacoesAdicionais() {
  return obter('#fldInformacoesAdicionais', 'Tabela de informações adicionais não encontrada.');
}
