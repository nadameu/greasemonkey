import { createStore } from '@nadameu/create-store';
import { Either, validateAll } from '@nadameu/either';
import { createTaggedUnion, match, Static } from '@nadameu/match';
import { Natural } from '@nadameu/predicates';
import { render } from 'preact';
import { createMsgService, Mensagem } from './Mensagem';
import { NumProc } from './NumProc';
import { obter } from './obter';

export function paginaProcesso(numproc: NumProc): Either<Error[], void> {
  return validateAll([obterInformacoesAdicionais(), obterLinkRPV(), obterLinkDepositos()]).map(
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
    AguardaAtualizacao: (dados: TipoContas) => dados,
    Ocioso: (dados: TipoContas) => dados,
    Erro: null,
  });
  type Estado = Static<typeof Estado>;

  const Acao = createTaggedUnion({
    Erro: null,
    PaginaContasAberta: null,
    VerificacaoTerminada: (info: TipoContas) => info,
    AtualizacaoRPV: (info: InfoTipo) => info,
    AtualizacaoDepositos: (info: InfoTipo) => info,
    Clique: (alvo: 'BOTAO_RPV' | 'LINK_RPV' | 'BOTAO_DEP' | 'LINK_DEP') => ({ alvo }),
  });
  type Acao = Static<typeof Acao>;

  const bc = createMsgService();
  const store = createStore<Estado, Acao>(
    () => {
      const INTERVALO = 100;
      let aguardarMilissegundos = 3000;
      const timer = window.setInterval(() => {
        aguardarMilissegundos -= INTERVALO;
        if (linkRPV.textContent === '') {
          if (aguardarMilissegundos <= 0) {
            window.clearInterval(timer);
            store.dispatch(Acao.Erro);
          }
        } else {
          window.clearInterval(timer);

          const info: TipoContas = {
            rpv: { quantidade: 0, atualiza: false },
            depositos: { quantidade: 0, atualiza: false },
          };

          if (linkRPV.textContent === 'Há conta com saldo')
            info.rpv = { quantidade: undefined, atualiza: true };

          if (linkDepositos.textContent === 'Há conta com saldo')
            info.depositos = { quantidade: undefined, atualiza: false };

          store.dispatch(Acao.VerificacaoTerminada(info));
        }
      }, INTERVALO);

      bc.subscribe(msg => {
        match(msg, {
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
      acao.match({
        AtualizacaoDepositos: dados =>
          estado.match({
            AguardaAtualizacao: ({ rpv }) => Estado.AguardaAtualizacao({ rpv, depositos: dados }),
            AguardaVerificacaoInicial: () => Estado.Erro,
            Erro: () => estado,
            Ocioso: ({ rpv }) => Estado.Ocioso({ rpv, depositos: dados }),
          }),
        AtualizacaoRPV: dados =>
          estado.match({
            AguardaAtualizacao: ({ depositos }) => Estado.Ocioso({ rpv: dados, depositos }),
            AguardaVerificacaoInicial: () => Estado.Erro,
            Erro: () => estado,
            Ocioso: ({ depositos }) => Estado.Ocioso({ rpv: dados, depositos }),
          }),
        Clique: ({ alvo }) =>
          estado.match({
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
        VerificacaoTerminada: dados => {
          const ocioso = Estado.Ocioso(dados);
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
      linkRPV.addEventListener('click', onClick);
      linkDepositos.addEventListener('click', onClick);
    }
    render(<App {...{ estado, onClick }} />, div);
  });

  function onClick(evt: Event) {
    if (evt.target === linkRPV) {
      store.dispatch(Acao.Clique('LINK_RPV'));
    } else if (evt.target === linkDepositos) {
      store.dispatch(Acao.Clique('LINK_DEP'));
    } else {
      const tipoBotao = (evt.target as HTMLElement | null)?.dataset.botao;
      if (tipoBotao === 'RPV') {
        store.dispatch(Acao.Clique('BOTAO_RPV'));
      } else if (tipoBotao === 'DEP') {
        store.dispatch(Acao.Clique('BOTAO_DEP'));
      } else {
        return;
      }
    }
    evt.preventDefault();
  }

  function App({ estado }: { estado: Estado }) {
    return match(estado, {
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
        linkRPV.removeEventListener('click', onClick);
        linkDepositos.removeEventListener('click', onClick);
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
