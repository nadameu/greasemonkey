import { createStore } from '@nadameu/create-store';
import { Static, createTaggedUnion } from '@nadameu/match';
import { Natural } from '@nadameu/predicates';
import { render } from 'preact';
import { Mensagem, createMsgService } from './Mensagem';
import { NumProc } from './NumProc';
import { obter } from './obter';
import { Result } from './Result';

export function paginaProcesso(numproc: NumProc): Result<void> {
  return Result.sequence(obterInformacoesAdicionais(), obterLinkRPV(), obterLinkDepositos()).map(
    ([informacoesAdicionais, linkRPV, linkDepositos]) =>
      modificarPaginaProcesso({ informacoesAdicionais, linkRPV, linkDepositos, numproc })
  );
}

function modificarPaginaProcesso({
  informacoesAdicionais,
  linkRPV,
  linkDepositos,
  numproc,
}: {
  informacoesAdicionais: HTMLElement;
  linkRPV: HTMLAnchorElement;
  linkDepositos: HTMLAnchorElement;
  numproc: NumProc;
}) {
  interface InfoTipo {
    quantidade: number | undefined;
    atualiza: boolean;
  }
  interface TipoContas {
    rpv: InfoTipo;
    depositos: InfoTipo;
  }

  const Estado = createTaggedUnion({
    AguardaVerificacaoInicial: null,
    AguardaAtualizacao: ({ rpv, depositos }: TipoContas) => ({ rpv, depositos }),
    Ocioso: ({ rpv, depositos }: TipoContas) => ({ rpv, depositos }),
    Erro: null,
  });
  type Estado = Static<typeof Estado>;

  const Acao = createTaggedUnion({
    Erro: null,
    PaginaContasAberta: null,
    VerificacaoTerminada: ({ rpv, depositos }: TipoContas) => ({ rpv, depositos }),
    AtualizacaoRPV: ({ quantidade, atualiza }: InfoTipo) => ({ quantidade, atualiza }),
    AtualizacaoDepositos: ({ quantidade, atualiza }: InfoTipo) => ({ quantidade, atualiza }),
    Clique: (alvo: 'BOTAO_RPV' | 'LINK_RPV' | 'BOTAO_DEP' | 'LINK_DEP') => ({ alvo }),
  });
  type Acao = Static<typeof Acao>;

  const bc = createMsgService();
  const store = createStore<Estado, Acao>(
    () => {
      const AGUARDAR_MS = 30000;

      const timer = window.setTimeout(() => {
        observer.disconnect();
        store.dispatch(Acao.Erro);
      }, AGUARDAR_MS);

      const observer = new MutationObserver(() => {
        window.clearTimeout(timer);
        observer.disconnect();
        const info: TipoContas = {
          rpv: { quantidade: 0, atualiza: false },
          depositos: { quantidade: 0, atualiza: false },
        };

        if (linkRPV.textContent === 'Há conta com saldo')
          info.rpv = { quantidade: undefined, atualiza: true };

        if (linkDepositos.textContent === 'Há conta com saldo')
          info.depositos = { quantidade: undefined, atualiza: false };

        store.dispatch(Acao.VerificacaoTerminada(info));
      });
      observer.observe(linkRPV, { childList: true });

      bc.subscribe(msg => {
        Mensagem.match(msg, {
          InformaContas: ({ numproc: msgNumproc, qtdComSaldo, permiteAtualizar }) => {
            if (msgNumproc !== numproc) return;
            store.dispatch(
              Acao.AtualizacaoRPV({ quantidade: qtdComSaldo, atualiza: permiteAtualizar })
            );
          },
          InformaSaldoDeposito: ({ numproc: msgNumproc, qtdComSaldo }) => {
            if (msgNumproc !== numproc) return;
            store.dispatch(Acao.AtualizacaoDepositos({ quantidade: qtdComSaldo, atualiza: false }));
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
      Acao.match(acao, {
        AtualizacaoDepositos: ({ quantidade, atualiza }) =>
          Estado.match(estado, {
            AguardaAtualizacao: ({ rpv }) =>
              Estado.AguardaAtualizacao({ rpv, depositos: { quantidade, atualiza } }),
            AguardaVerificacaoInicial: () => Estado.Erro,
            Erro: () => estado,
            Ocioso: ({ rpv }) => Estado.Ocioso({ rpv, depositos: { quantidade, atualiza } }),
          }),
        AtualizacaoRPV: ({ quantidade, atualiza }) =>
          Estado.match(estado, {
            AguardaAtualizacao: ({ depositos }) =>
              Estado.Ocioso({ rpv: { quantidade, atualiza }, depositos }),
            AguardaVerificacaoInicial: () => Estado.Erro,
            Erro: () => estado,
            Ocioso: ({ depositos }) => Estado.Ocioso({ rpv: { quantidade, atualiza }, depositos }),
          }),
        Clique: ({ alvo }) =>
          Estado.match(estado, {
            AguardaVerificacaoInicial: () => estado,
            AguardaAtualizacao: () => estado,
            Ocioso: dados => {
              if (alvo === 'BOTAO_DEP' || alvo === 'LINK_DEP') {
                window.open(linkDepositos.href);
              } else if (alvo === 'BOTAO_RPV' || alvo === 'LINK_RPV') {
                window.open(linkRPV.href);
                if (alvo === 'BOTAO_RPV' && dados.rpv.atualiza) {
                  return Estado.AguardaAtualizacao(dados);
                }
              }
              return estado;
            },
            Erro: () => estado,
          }),
        Erro: () =>
          Estado.match(estado, { Erro: () => estado }, () => {
            bc.destroy();
            return Estado.Erro;
          }),
        PaginaContasAberta: () =>
          Estado.match(estado, {
            AguardaVerificacaoInicial: () => Estado.Erro,
            AguardaAtualizacao: () => {
              bc.publish(Mensagem.RespostaAtualizar(numproc, true));
              return estado;
            },
            Ocioso: () => estado,
            Erro: () => estado,
          }),
        VerificacaoTerminada: ({ rpv, depositos }) => {
          const ocioso = Estado.Ocioso({ rpv, depositos });
          return Estado.match(estado, {
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
    }
    render(<App {...{ estado }} />, div);
  });

  function onClick(evt: Event) {
    const tipoBotao = (evt.target as HTMLElement | null)?.dataset.botao;
    if (tipoBotao === 'RPV') {
      store.dispatch(Acao.Clique('BOTAO_RPV'));
    } else if (tipoBotao === 'DEP') {
      store.dispatch(Acao.Clique('BOTAO_DEP'));
    } else {
      return;
    }
    evt.preventDefault();
  }

  function App({ estado }: { estado: Estado }) {
    return Estado.match(estado, {
      AguardaVerificacaoInicial: () => <output>Verificando contas com saldo...</output>,
      AguardaAtualizacao: () => <output>Aguardando atualização das contas...</output>,
      Ocioso: ({ depositos, rpv }) => {
        const qDep = depositos.quantidade as 0 | Natural | undefined;
        const qRPV = rpv.quantidade as 0 | Natural | undefined;

        const classe = qDep === 0 && qRPV === 0 ? 'zerado' : 'saldo';

        function textoContas(qtd: Natural | undefined) {
          if (qtd === undefined) return 'conta(s)';
          if (qtd === 1) return `1 conta`;
          return `${qtd} contas`;
        }
        const msgR = qRPV === 0 ? null : `${textoContas(qRPV)} de requisição de pagamento`;
        const msgD = qDep === 0 ? null : `${textoContas(qDep)} de depósito judicial`;
        const msgs = [msgR, msgD].filter((x): x is string => x !== null);
        const mensagem =
          msgs.length === 0 ? 'Sem saldo em conta(s).' : `Há ${msgs.join(' e ')} com saldo.`;
        return <MensagemComBotao {...{ classe, mensagem, rpv: qRPV ?? -1, dep: qDep ?? -1 }} />;
      },
      Erro: () => {
        sub.unsubscribe();
        return (
          <MensagemComBotao
            classe="erro"
            mensagem="Ocorreu um erro com a atualização de saldos."
            rpv={0}
            dep={0}
          />
        );
      },
    });
  }

  function MensagemComBotao({
    classe,
    mensagem,
    rpv,
    dep,
  }: {
    classe: string;
    mensagem: string;
    rpv: number;
    dep: number;
  }) {
    return (
      <>
        <span class={classe}>{mensagem}</span>{' '}
        <button
          type="button"
          data-botao="RPV"
          onClick={onClick}
          class={rpv === 0 ? 'zerado' : 'saldo'}
        >
          RPVs/precatórios
        </button>{' '}
        <button
          type="button"
          data-botao="DEP"
          onClick={onClick}
          class={dep === 0 ? 'zerado' : 'saldo'}
        >
          Depósitos judiciais
        </button>
      </>
    );
  }
}

function obterLinkRPV() {
  return obter<HTMLAnchorElement>(
    'a#labelPrecatorios',
    'Link para requisições de pagamento não encontrado.'
  );
}

function obterLinkDepositos() {
  return obter<HTMLAnchorElement>(
    'a#labelDepositoJudicial',
    'Link para depósitos judiciais não encontrado.'
  );
}

function obterInformacoesAdicionais() {
  return obter('#fldInformacoesAdicionais', 'Tabela de informações adicionais não encontrada.');
}
