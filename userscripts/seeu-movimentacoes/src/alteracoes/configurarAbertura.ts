import { GM_info } from '$';
import { h } from '@nadameu/create-element';
import { createFiniteStateMachine } from '@nadameu/finite-state-machine';
import { FromConstructorsWith, makeConstructorsWith } from '@nadameu/match';
import {
  DadosAbertura,
  Posicao,
  posicaoToFeatures,
  TipoAbertura,
  validarPosicao,
} from './dadosAbertura';

const NOME_JANELA = `gm-${GM_info.script.name}__configurar-abertura`;

const State = makeConstructorsWith('status', {
  INICIO: (current: TipoAbertura) => ({ current }),
  SALVO_PADRAO: () => ({}),
  JANELA_POSICAO: () => ({}),
  JANELA_CONFIRMAR: (posicao: Posicao) => ({ posicao }),
  SALVO_JANELA: (posicao: Posicao) => ({ posicao }),
});
type State = FromConstructorsWith<'status', typeof State>;

const Action = makeConstructorsWith('type', {
  OPCAO_SELECIONADA: (opcao: TipoAbertura) => ({ opcao }),
  SALVAR: () => ({}),
});
type Action = FromConstructorsWith<'type', typeof Action>;

export function configurarAbertura() {
  const antiga = window.open('about:blank', NOME_JANELA);
  antiga?.close();
  const win = window.open(
    'about:blank',
    NOME_JANELA,
    posicaoToFeatures(
      validarPosicao({ top: 0, left: 0, width: 800, height: 450 })
    )
  );
  if (!win) {
    window.alert(
      [
        'Ocorreu um erro ao tentar configurar a abertura de documentos.',
        'Verifique se há permissão para abertura de janelas "pop-up".',
      ].join('\n')
    );
    return;
  }

  aoAbrirJanelaExecutar(win, () => onJanelaAberta(win));
}

function obterPosicaoJanela(win: Window): Posicao {
  return validarPosicao({
    top: win.screenY,
    left: win.screenX,
    width: win.innerWidth,
    height: win.innerHeight,
  });
}

function onJanelaAberta(win: Window) {
  const tipoAberturaAtual = DadosAbertura.carregar().tipo;
  const fsm = createFiniteStateMachine<State, Action>(
    State.INICIO(tipoAberturaAtual),
    {
      INICIO: {
        OPCAO_SELECIONADA: ({ opcao }) => State.INICIO(opcao),
        SALVAR: (_, { current }) => {
          if (current === 'padrao') return State.SALVO_PADRAO();
          return State.JANELA_POSICAO();
        },
      },
      SALVO_PADRAO: {},
      JANELA_POSICAO: {
        SALVAR: () => State.JANELA_CONFIRMAR(obterPosicaoJanela(win)),
      },
      JANELA_CONFIRMAR: {
        SALVAR: (_, { posicao }) => State.SALVO_JANELA(posicao),
      },
      SALVO_JANELA: {},
    },
    state => state
  );

  win.document.title = 'Configurar abertura de documentos';
  const inputPadrao = h('input', {
    type: 'radio',
    name: 'tipo',
    value: 'padrao',
    checked: tipoAberturaAtual === 'padrao',
    onclick: () => fsm.dispatch(Action.OPCAO_SELECIONADA('padrao')),
  });
  const inputJanela = h('input', {
    type: 'radio',
    name: 'tipo',
    value: 'janela',
    checked: tipoAberturaAtual === 'janela',
    onclick: () => fsm.dispatch(Action.OPCAO_SELECIONADA('janela')),
  });
  const botaoCancelar = h(
    'button',
    {
      type: 'button',
      onclick: () => win.close(),
    },
    'Cancelar'
  );
  const botaoSalvar = h('button', {
    type: 'button',
    onclick: () => fsm.dispatch(Action.SALVAR()),
  });
  const div = h(
    'div',
    {},
    p('Selecione a forma de abertura de documentos:'),
    p(h('label', {}, inputPadrao, ' ', 'Padrão do SEEU (abrir em abas)')),
    p(h('label', {}, inputJanela, ' ', 'Abrir em janelas separadas'))
  );
  win.document.body.append(
    h('h1', {}, 'Configurar abertura de documentos'),
    div,
    p(botaoCancelar, ' ', botaoSalvar)
  );
  fsm.subscribe(estado => {
    switch (estado.status) {
      case 'INICIO': {
        if (estado.current === 'padrao') {
          botaoSalvar.textContent = 'Salvar';
        } else {
          botaoSalvar.textContent = 'Próximo >';
        }
        break;
      }

      case 'SALVO_PADRAO': {
        DadosAbertura.salvar({ tipo: 'padrao' });
        win.close();
        break;
      }

      case 'JANELA_POSICAO': {
        div.textContent = '';
        div.append(
          p(
            'Mova esta janela para o local em que deseja que os documentos sejam abertos.'
          ),
          p('Depois, clique no botão "Próximo >".')
        );
        break;
      }

      case 'JANELA_CONFIRMAR': {
        const frag = document.createDocumentFragment();
        frag.append(...win.document.body.childNodes);
        win.close();
        const features = posicaoToFeatures(estado.posicao);
        try {
          const newWin = win.open('about:blank', `${NOME_JANELA}_2`, features);
          if (!newWin) throw new Error('Não foi possível abrir a janela.');
          win = newWin;
        } catch (e) {
          window.alert(
            [
              'Ocorreu um erro ao tentar configurar a abertura de documentos.',
              'Verifique se há permissão para abertura de janelas "pop-up".',
            ].join('\n')
          );
          return;
        }
        aoAbrirJanelaExecutar(win, () => {
          win.document.title = 'Configurar abertura de documentos';
          win.document.body.append(frag);
          div.textContent = '';
          botaoSalvar.textContent = 'Salvar';
          div.append(
            p('Esta janela foi aberta no local correto?'),
            p('Em caso positivo, clique em "Salvar".'),
            p('Do contrário, clique em "Cancelar" e configure novamente.'),
            p(
              'Obs.: alguns navegadores não permitem a abertura de janelas em ',
              'monitor diverso daquele em que se encontra a janela principal.'
            )
          );
        });
        break;
      }

      case 'SALVO_JANELA': {
        DadosAbertura.salvar({ tipo: 'janela', posicao: estado.posicao });
        win.close();
        break;
      }
    }
  });
}

function p(...children: Array<string | HTMLElement>): HTMLParagraphElement {
  return h('p', {}, ...children);
}
function aoAbrirJanelaExecutar(win: Window, callback: () => void) {
  if (win.document.readyState === 'complete') {
    callback();
  } else {
    win.addEventListener('load', () => callback());
  }
}
