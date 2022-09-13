import { h } from '@nadameu/create-element';
import { Either, Left, Right, validateAll } from '@nadameu/either';
import { expectUnreachable } from '@nadameu/expect-unreachable';
import { createFiniteStateMachine } from '@nadameu/finite-state-machine';
import * as p from '@nadameu/predicates';
import { NumProc } from './NumProc';
import { adicionarProcessoAguardando } from './processosAguardando';
import { TransicaoInvalida } from './TransicaoInvalida';

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

  {
    const output = h('output');
    const botao = h('button', { type: 'button', disabled: true, hidden: true });
    const div = h('div', null, output, botao);
    informacoesAdicionais.insertAdjacentElement('beforebegin', div);

    type Properties =
      | { mostrar: 'output'; mensagem: string; erro: boolean }
      | { mostrar: 'button'; mensagem: string };

    function propriedades(estado: Estado): Properties {
      switch (estado.status) {
        case 'AGUARDA_VERIFICACAO_SALDO':
          return { mostrar: 'output', mensagem: 'Verificando contas com saldo...', erro: false };

        case 'COM_CONTA':
          return { mostrar: 'button', mensagem: 'Atualizar saldo RPV' };

        case 'SEM_CONTA':
          return { mostrar: 'button', mensagem: 'Verificar saldo RPV' };

        case 'ERRO':
          return {
            mostrar: 'output',
            mensagem: 'Ocorreu um erro com a atualização de saldo de RPV.',
            erro: true,
          };

        default:
          return expectUnreachable(estado);
      }
    }

    let estadoAnterior: Estado;
    let exibicaoAnterior: Properties = { mostrar: 'output', mensagem: '', erro: false };
    const sub = fsm.subscribe(estado => {
      if (estado === estadoAnterior) return;
      estadoAnterior = estado;

      const exibicao = propriedades(estado);
      if (exibicao.mostrar === 'button') {
        if (exibicaoAnterior.mostrar === 'output') {
          output.hidden = true;

          botao.hidden = false;
          botao.disabled = false;
          botao.addEventListener('click', onClick);
        }
        botao.textContent = exibicao.mensagem;
      } else if (exibicao.mostrar === 'output') {
        if (exibicaoAnterior.mostrar === 'button') {
          botao.removeEventListener('click', onClick);
          botao.disabled = true;
          botao.hidden = true;

          output.hidden = false;
        }
        output.style.color = exibicao.erro ? 'red' : 'inherit';
        output.textContent = exibicao.mensagem;
      } else {
        expectUnreachable(exibicao);
      }
      exibicaoAnterior = exibicao;
    });
  }

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
