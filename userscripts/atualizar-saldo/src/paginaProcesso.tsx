import { Either, Left, Right, validateAll } from '@nadameu/either';
import { expectUnreachable } from '@nadameu/expect-unreachable';
import { createFiniteStateMachine } from '@nadameu/finite-state-machine';
import * as p from '@nadameu/predicates';
import { NumProc } from './NumProc';
import { adicionarProcessoAguardando } from './processosAguardando';
import { TransicaoInvalida } from './TransicaoInvalida';
import { FunctionComponent, render } from 'preact';
import './paginaProcesso.scss';

export function paginaProcesso(numproc: NumProc): Either<Error[], void> {
  return validateAll([obterInformacoesAdicionais(), obterLink()]).map(
    ([informacoesAdicionais, link]) =>
      modificarPaginaProcesso({ informacoesAdicionais, link, numproc, url: link.href })
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
  type Estado =
    | { status: 'AGUARDA_VERIFICACAO_SALDO'; tentativas: number }
    | { status: 'COM_CONTA' }
    | { status: 'SEM_CONTA' }
    | { status: 'ERRO' };
  type Acao = { type: 'TICK' } | { type: 'CLIQUE' };
  const fsm = createFiniteStateMachine<Estado, Acao>(
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
      ERRO: {},
    },
    (estado, acao) => ({ status: 'ERRO', erro: new TransicaoInvalida(estado, acao) })
  );

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

  const App: FunctionComponent<{ estado: Estado }> = ({ estado }) => {
    switch (estado.status) {
      case 'AGUARDA_VERIFICACAO_SALDO':
        return <output>Verificando contas com saldo...</output>;

      case 'COM_CONTA':
        return <button onClick={onClick}>Atualizar saldo RPV</button>;

      case 'SEM_CONTA':
        return <button onClick={onClick}>Verificar saldo RPV</button>;

      case 'ERRO':
        return <output class="erro">Ocorreu um erro com a atualização de saldo de RPV.</output>;

      default:
        return expectUnreachable(estado);
    }
  };

  let div: HTMLElement | undefined;
  const sub = fsm.subscribe(estado => {
    if (!div) {
      div = document.createElement('div');
      div.className = 'gm-atualizar-saldo';
      informacoesAdicionais.insertAdjacentElement('beforebegin', div);
    }
    render(<App estado={estado} />, div);
  });

  function onClick(evt: Event) {
    evt.preventDefault();
    fsm.dispatch({ type: 'CLIQUE' });
  }
}

function obterLink() {
  return obter<HTMLAnchorElement>('a#labelPrecatorios', 'Link não encontrado.');
}

function obterInformacoesAdicionais() {
  return obter('#fldInformacoesAdicionais', 'Tabela de informações adicionais não encontrada.');
}

function obter<T extends HTMLElement>(selector: string, msg: string) {
  const elt = document.querySelector<T>(selector);
  if (p.isNull(elt)) return Left(new Error(msg));
  else return Right(elt);
}
