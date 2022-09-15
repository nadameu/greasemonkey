import { Either, validateAll } from '@nadameu/either';
import { createFiniteStateMachine } from '@nadameu/finite-state-machine';
import { Handler } from '@nadameu/handler';
import { JSX, render } from 'preact';
import { NumProc } from './NumProc';
import { obter } from './obter';
import { adicionarProcessoAguardando } from './processosAguardando';
import { TransicaoInvalida } from './TransicaoInvalida';

export function paginaProcesso(numproc: NumProc): Either<Error[], void> {
  return validateAll([obterInformacoesAdicionais(), obterLink()]).map(
    ([informacoesAdicionais, link]) =>
      modificarPaginaProcesso({ informacoesAdicionais, link, numproc, url: link.href })
  );
}

type Estado =
  | { status: 'AGUARDA_VERIFICACAO_SALDO'; tentativas: number }
  | { status: 'COM_CONTA' }
  | { status: 'SEM_CONTA' }
  | { status: 'ERRO' };

type Acao = { type: 'TICK' } | { type: 'CLIQUE' };

function criarFSM({
  link,
  numproc,
  url,
}: {
  link: HTMLAnchorElement;
  numproc: NumProc;
  url: string;
}) {
  return createFiniteStateMachine<Estado, Acao>(
    { status: 'AGUARDA_VERIFICACAO_SALDO', tentativas: 0 },
    {
      AGUARDA_VERIFICACAO_SALDO: {
        TICK: (acao, estado) => {
          if (link.textContent === '') {
            if (estado.tentativas > 30) return { status: 'ERRO' };
            return { status: 'AGUARDA_VERIFICACAO_SALDO', tentativas: estado.tentativas + 1 };
          }
          if (link.textContent === 'Há conta com saldo') return { status: 'COM_CONTA' };
          return { status: 'SEM_CONTA' };
        },
      },
      COM_CONTA: {
        CLIQUE: (acao, estado) => {
          adicionarProcessoAguardando(numproc);
          window.open(url);
          return estado;
        },
      },
      SEM_CONTA: {
        CLIQUE: (acao, estado) => {
          window.open(url);
          return estado;
        },
      },
      ERRO: {
        CLIQUE: (_, estado) => {
          window.open(url);
          return estado;
        },
      },
    },
    (estado, acao) => ({ status: 'ERRO', erro: new TransicaoInvalida(estado, acao) })
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
  const fsm = criarFSM({ link, numproc, url });

  {
    const timer = window.setInterval(() => {
      fsm.dispatch({ type: 'TICK' });
    }, 100);
    const sub = fsm.subscribe(estado => {
      if (estado.status !== 'AGUARDA_VERIFICACAO_SALDO') {
        window.clearInterval(timer);
        sub.unsubscribe();
      }
    });
  }

  let div: HTMLElement | undefined;
  const sub = fsm.subscribe(estado => {
    if (!div) {
      div = document.createElement('div');
      div.className = 'gm-atualizar-saldo__processo';
      informacoesAdicionais.insertAdjacentElement('beforebegin', div);
    }
    render(<App {...{ estado, onClick }} />, div);
  });

  function onClick(evt: Event) {
    evt.preventDefault();
    fsm.dispatch({ type: 'CLIQUE' });
  }
}

function App(props: { estado: Estado; onClick: Handler<Event> }): JSX.Element;
function App({ estado, onClick }: { estado: Estado; onClick: Handler<Event> }) {
  if (estado.status === 'AGUARDA_VERIFICACAO_SALDO') {
    return <output>Verificando contas com saldo...</output>;
  }

  interface InfoMensagem {
    classe: string;
    mensagem: string;
    rotuloBotao: string;
  }
  const infoMensagem = ((): InfoMensagem => {
    switch (estado.status) {
      case 'COM_CONTA':
        return {
          classe: 'saldo',
          mensagem: 'Há conta(s) com saldo.',
          rotuloBotao: 'Atualizar',
        };

      case 'SEM_CONTA':
        return {
          classe: 'zerado',
          mensagem: 'Sem saldo em conta(s).',
          rotuloBotao: 'Abrir página',
        };

      case 'ERRO':
        return {
          classe: 'erro',
          mensagem: 'Ocorreu um erro com a atualização de saldo de RPV.',
          rotuloBotao: 'Abrir página',
        };
    }
  })();
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
