import { createStore } from '@nadameu/create-store';
import { Either, validateAll } from '@nadameu/either';
import { createTaggedUnion, match, Static } from '@nadameu/match';
import { render } from 'preact';
import { createMsgService, Mensagem } from './Mensagem';
import { NumProc } from './NumProc';
import { obter } from './obter';

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
  const Estado = createTaggedUnion({
    AguardaVerificacaoInicial: null,
    AguardaAtualizacao: null,
    Ocioso: (contasComSaldo: number | undefined, permiteAtualizar: boolean) => ({
      contasComSaldo,
      permiteAtualizar,
    }),
    Erro: null,
  });
  type Estado = Static<typeof Estado>;

  const Acao = createTaggedUnion({
    Erro: null,
    PaginaContasAberta: null,
    VerificacaoTerminada: (contasComSaldo: number | undefined, permiteAtualizar: boolean) => ({
      contasComSaldo,
      permiteAtualizar,
    }),
    Clique: (alvo: 'BOTAO' | 'LINK') => ({ alvo }),
  });
  type Acao = Static<typeof Acao>;

  const bc = createMsgService();
  const store = createStore<Estado, Acao>(
    () => {
      const INTERVALO = 100;
      let aguardarMilissegundos = 3000;
      const timer = window.setInterval(() => {
        aguardarMilissegundos -= INTERVALO;
        if (link.textContent === '') {
          if (aguardarMilissegundos <= 0) {
            window.clearInterval(timer);
            store.dispatch(Acao.Erro);
          }
        } else {
          window.clearInterval(timer);
          if (link.textContent === 'Há conta com saldo')
            store.dispatch(Acao.VerificacaoTerminada(undefined, true));
          else store.dispatch(Acao.VerificacaoTerminada(0, false));
        }
      }, INTERVALO);

      bc.subscribe(msg => {
        match(msg, {
          InformaContas: ({ numproc: msgNumproc, qtdComSaldo, permiteAtualizar }) => {
            if (msgNumproc !== numproc) return;
            store.dispatch(Acao.VerificacaoTerminada(qtdComSaldo, permiteAtualizar));
          },
          PerguntaAtualizar: ({ numproc: msgNumproc }) => {
            if (msgNumproc !== numproc) return;
            store.dispatch(Acao.PaginaContasAberta);
          },
          RespostaAtualizar: () => {},
        });
      });

      return Estado.AguardaVerificacaoInicial;
    },
    (estado, acao) =>
      acao.match({
        Clique: ({ alvo }) =>
          estado.match({
            AguardaVerificacaoInicial: () => estado,
            AguardaAtualizacao: () => estado,
            Ocioso: ({ contasComSaldo, permiteAtualizar }) => {
              window.open(url);
              if (alvo === 'BOTAO' && permiteAtualizar) {
                return Estado.AguardaAtualizacao;
              }
              return estado;
            },
            Erro: () => estado,
          }),
        Erro: () =>
          estado.matchOr({ Erro: () => estado }, () => {
            bc.destroy();
            return Estado.Erro;
          }),
        PaginaContasAberta: () =>
          estado.match({
            AguardaVerificacaoInicial: () => Estado.Erro,
            AguardaAtualizacao: () => {
              bc.publish(Mensagem.RespostaAtualizar(numproc, true));
              return estado;
            },
            Ocioso: () => estado,
            Erro: () => estado,
          }),
        VerificacaoTerminada: ({ contasComSaldo, permiteAtualizar }) => {
          const ocioso = Estado.Ocioso(contasComSaldo, permiteAtualizar);
          return estado.match({
            AguardaVerificacaoInicial: () => ocioso,
            AguardaAtualizacao: () => ocioso,
            Ocioso: () => ocioso,
            Erro: () => estado,
          });
        },
      })
  );

  let div: HTMLElement | undefined;
  const sub = store.subscribe(estado => {
    if (!div) {
      div = document.createElement('div');
      div.className = 'gm-atualizar-saldo__processo';
      informacoesAdicionais.insertAdjacentElement('beforebegin', div);
      link.addEventListener('click', onClick);
    }
    render(<App {...{ estado, onClick }} />, div);
  });

  function onClick(evt: Event) {
    evt.preventDefault();
    if (evt.target === link) {
      store.dispatch(Acao.Clique('LINK'));
    } else {
      store.dispatch(Acao.Clique('BOTAO'));
    }
  }

  function App({ estado }: { estado: Estado }) {
    return match(estado, {
      AguardaVerificacaoInicial: () => <output>Verificando contas com saldo...</output>,
      AguardaAtualizacao: () => <output>Aguardando atualização das contas...</output>,
      Ocioso: ({ contasComSaldo, permiteAtualizar }) => {
        const classe = contasComSaldo === 0 ? 'zerado' : 'saldo';
        const mensagem =
          contasComSaldo === undefined
            ? 'Há conta(s) com saldo.'
            : contasComSaldo === 0
            ? 'Sem saldo em conta(s).'
            : contasComSaldo === 1
            ? 'Há 1 conta com saldo.'
            : `Há ${contasComSaldo} contas com saldo.`;
        const rotuloBotao = permiteAtualizar ? 'Atualizar' : 'Abrir página';
        return <MensagemComBotao {...{ classe, mensagem, rotuloBotao }} />;
      },
      Erro: () => {
        sub.unsubscribe();
        return (
          <MensagemComBotao
            classe="erro"
            mensagem="Ocorreu um erro com a atualização de saldo de RPV."
            rotuloBotao="Abrir página"
          />
        );
      },
    });
  }

  function MensagemComBotao({
    classe,
    mensagem,
    rotuloBotao,
  }: {
    classe: string;
    mensagem: string;
    rotuloBotao: string;
  }) {
    return (
      <>
        <span class={classe}>{mensagem}</span>{' '}
        <button type="button" onClick={onClick} class={classe}>
          {rotuloBotao}
        </button>
      </>
    );
  }
}

function obterLink() {
  return obter<HTMLAnchorElement>('a#labelPrecatorios', 'Link não encontrado.');
}

function obterInformacoesAdicionais() {
  return obter('#fldInformacoesAdicionais', 'Tabela de informações adicionais não encontrada.');
}
