import { h } from '@nadameu/create-element';
import { expectUnreachable } from '@nadameu/expect-unreachable';
import * as p from '@nadameu/predicates';
import { E, makeApplicativeValidation, maybeBool, O, pipeValue, semigroupArray } from 'adt-ts';
import { createFiniteStateMachine } from '@nadameu/finite-state-machine';
import { NumProc } from './NumProc';
import { adicionarProcessoAguardando } from './processosAguardando';
import { TransicaoInvalida } from './TransicaoInvalida';

export function paginaProcesso(numproc: NumProc) {
  return pipeValue(
    O.sequence(makeApplicativeValidation(semigroupArray))({
      informacoesAdicionais: obterInformacoesAdicionais(),
      link: obterLink(),
    }),
    E.map(({ informacoesAdicionais, link }) =>
      modificarPaginaProcesso({ informacoesAdicionais, link, numproc, url: link.href })
    )
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
    | { status: 'AGUARDA_VERIFICACAO_SALDO' }
    | { status: 'COM_CONTA' }
    | { status: 'SEM_CONTA' }
    | { status: 'ERRO' };
  type Acao = { type: 'SALDO_VERIFICADO'; haConta: boolean } | { type: 'CLIQUE' };
  const fsm = createFiniteStateMachine<Estado, Acao>(
    { status: 'AGUARDA_VERIFICACAO_SALDO' },
    {
      AGUARDA_VERIFICACAO_SALDO: {
        SALDO_VERIFICADO: (acao, estado) => {
          if (acao.haConta) {
            return { status: 'COM_CONTA' };
          } else {
            return { status: 'SEM_CONTA' };
          }
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
    (estado, acao) => ({
      status: 'ERRO',
      erro: new TransicaoInvalida(estado, acao),
    })
  );
  const botao = h(
    'button',
    { type: 'button', className: 'infraButton', disabled: true },
    'Verificando contas com saldo...'
  );
  botao.addEventListener('click', onClick);
  informacoesAdicionais.insertAdjacentElement('beforebegin', botao);

  const timer = window.setInterval(() => {
    if (link.textContent === '') return;
    window.clearInterval(timer);
    fsm.dispatch({ type: 'SALDO_VERIFICADO', haConta: link.textContent === 'Há conta com saldo' });
  }, 100);

  {
    let ultimo: Estado;
    const subscription = fsm.subscribe(estado => {
      if (estado === ultimo) return;
      ultimo = estado;

      let desconectar = false;

      switch (estado.status) {
        case 'AGUARDA_VERIFICACAO_SALDO':
          botao.disabled = true;
          botao.textContent = 'Verificando contas com saldo...';
          break;

        case 'SEM_CONTA':
          botao.disabled = false;
          botao.textContent = 'Verificar saldo RPV';
          desconectar = true;
          break;

        case 'COM_CONTA':
          botao.disabled = false;
          botao.textContent = 'Atualizar saldo RPV';
          desconectar = true;
          break;

        case 'ERRO':
          const div = h('div', null, 'Ocorreu um erro com a atualização de saldo de RPV.');
          div.style.color = 'red';
          botao.removeEventListener('click', onClick);
          botao.replaceWith(div);
          desconectar = true;
          break;

        default:
          expectUnreachable(estado);
      }
      if (desconectar) {
        subscription.unsubscribe();
      }
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
  return obter('#fldInformacoesAdicionais', 'InformacoesAdicionais não encontrada.');
}

function obter<T extends HTMLElement>(selector: string, msg: string) {
  return pipeValue(
    document.querySelector<T>(selector),
    maybeBool(p.isNotNull),
    E.noteL(() => [new Error(msg)])
  );
}
