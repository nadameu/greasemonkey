import { E, Either, tuple } from '@nadameu/adts';
import { createStore } from '@nadameu/create-store';
import { makeConstructorsWith, match, matchWith } from '@nadameu/match';
import * as p from '@nadameu/predicates';
import { render } from 'preact';
import { createMsgService, Mensagem } from './Mensagem';
import { NumProc } from './NumProc';
import { obter } from './obter';

export function paginaProcesso(numproc: NumProc): Either<Error, void> {
  return E.gen(function* ($_) {
    const informacoesAdicionais = yield* $_(obterInformacoesAdicionais());
    modificarPaginaProcesso({
      informacoesAdicionais,
      numproc,
    });
  });
}

function modificarPaginaProcesso({
  informacoesAdicionais,
  numproc,
}: {
  informacoesAdicionais: HTMLElement;
  numproc: NumProc;
}) {
  let linkRPV: HTMLAnchorElement;
  let linkDepositos: HTMLAnchorElement;

  interface InfoTipo {
    quantidade: number | undefined;
    atualiza: boolean;
  }
  interface TipoContas {
    rpv: InfoTipo;
    depositos: InfoTipo;
  }

  interface EstadoBase<K extends string> {
    status: K;
  }
  interface EstadoAguardaAtualizacao
    extends EstadoBase<'AguardaAtualizacao'>,
      TipoContas {}
  interface EstadoAguardaVerificacaoInicial
    extends EstadoBase<'AguardaVerificacaoInicial'> {}
  interface EstadoErro extends EstadoBase<'Erro'> {}
  interface EstadoOcioso extends EstadoBase<'Ocioso'>, TipoContas {}
  type Estado =
    | EstadoAguardaAtualizacao
    | EstadoAguardaVerificacaoInicial
    | EstadoErro
    | EstadoOcioso;

  const Estado = makeConstructorsWith('status', {
    AguardaVerificacaoInicial: () => ({}),
    AguardaAtualizacao: (tipoContas: TipoContas) => tipoContas,
    Ocioso: (tipoContas: TipoContas) => tipoContas,
    Erro: () => ({}),
  }) satisfies {
    [K in Estado['status']]: (
      ...args: never[]
    ) => Extract<Estado, { status: K }>;
  };
  const matchEstado = /* @__PURE__ */ matchWith('status')<Estado>;

  interface AcaoBase<K extends string> {
    type: K;
  }
  interface AcaoAtualizacaoDepositos
    extends AcaoBase<'AtualizacaoDepositos'>,
      InfoTipo {}
  interface AcaoAtualizacaoRPV extends AcaoBase<'AtualizacaoRPV'>, InfoTipo {}
  interface AcaoClique extends AcaoBase<'Clique'> {
    alvo: 'BOTAO_RPV' | 'LINK_RPV' | 'BOTAO_DEP' | 'LINK_DEP';
  }
  interface AcaoErro extends AcaoBase<'Erro'> {}
  interface AcaoPaginaContasAberta extends AcaoBase<'PaginaContasAberta'> {}
  interface AcaoVerificacaoTerminada
    extends AcaoBase<'VerificacaoTerminada'>,
      TipoContas {}
  type Acao =
    | AcaoAtualizacaoDepositos
    | AcaoAtualizacaoRPV
    | AcaoClique
    | AcaoErro
    | AcaoPaginaContasAberta
    | AcaoVerificacaoTerminada;
  const Acao = makeConstructorsWith('type', {
    AtualizacaoDepositos: (infoTipo: InfoTipo) => infoTipo,
    AtualizacaoRPV: (infoTipo: InfoTipo) => infoTipo,
    Clique: (alvo: 'BOTAO_RPV' | 'LINK_RPV' | 'BOTAO_DEP' | 'LINK_DEP') => ({
      alvo,
    }),
    Erro: () => ({}),
    PaginaContasAberta: () => ({}),
    VerificacaoTerminada: (tipoContas: TipoContas) => tipoContas,
  }) satisfies {
    [K in Acao['type']]: (...args: never[]) => Extract<Acao, { type: K }>;
  };

  const bc = createMsgService();
  const store = createStore<Estado, Acao>(
    () => {
      const AGUARDAR_MS = 30000;

      const timer = window.setTimeout(() => {
        observer.disconnect();
        store.dispatch(Acao.Erro());
      }, AGUARDAR_MS);

      const observer = new MutationObserver(() => {
        const tempRPV = obterLinkRPV();
        if (tempRPV._tag === 'Left') return;
        const tempDepositos = obterLinkDepositos();
        if (tempDepositos._tag === 'Left') return;
        linkRPV = tempRPV.right;
        linkDepositos = tempDepositos.right;
        window.clearTimeout(timer);
        observer.disconnect();
        const info: TipoContas = {
          rpv: { quantidade: 0, atualiza: false },
          depositos: { quantidade: 0, atualiza: false },
        };

        if (linkRPV.textContent?.trim() === 'Há conta com saldo')
          info.rpv = { quantidade: undefined, atualiza: true };

        if (linkDepositos.textContent?.trim() === 'Há conta com saldo')
          info.depositos = { quantidade: undefined, atualiza: false };
        store.dispatch(Acao.VerificacaoTerminada(info));
      });
      observer.observe(informacoesAdicionais, {
        childList: true,
        subtree: true,
      });

      bc.subscribe(msg => {
        matchWith('tipo')(msg)
          .case(
            'InformaContas',
            ({ numproc: msgNumproc, qtdComSaldo, permiteAtualizar }) => {
              if (msgNumproc !== numproc) return;
              store.dispatch(
                Acao.AtualizacaoRPV({
                  quantidade: qtdComSaldo,
                  atualiza: permiteAtualizar,
                })
              );
            }
          )
          .case(
            'InformaSaldoDeposito',
            ({ numproc: msgNumproc, qtdComSaldo }) => {
              if (msgNumproc !== numproc) return;
              store.dispatch(
                Acao.AtualizacaoDepositos({
                  quantidade: qtdComSaldo,
                  atualiza: false,
                })
              );
            }
          )
          .case('PerguntaAtualizar', ({ numproc: msgNumproc }) => {
            if (msgNumproc !== numproc) return;
            store.dispatch(Acao.PaginaContasAberta());
          })
          .case('RespostaAtualizar', () => {})
          .get();
      });

      return Estado.AguardaVerificacaoInicial();
    },
    (estado, acao) => {
      type Helper<P extends string, S extends Array<string>> = S extends []
        ? any
        : {
            [p in P]: S[number];
          };

      const matches =
        <
          T extends [Estado, Acao],
          const S extends Array<T[0]['status']>,
          const A extends Array<T[1]['type']>,
        >(
          statuses: S,
          types: A
        ) =>
        (obj: T): obj is Extract<T, [Helper<'status', S>, Helper<'type', A>]> =>
          (statuses.length === 0 ||
            statuses.some(status => obj[0].status === status)) &&
          (types.length === 0 || types.some(type => obj[1].type === type));

      return match(tuple(estado, acao))
        .when(matches(['Erro'], []), ([estado]) => estado)
        .when(matches([], ['Erro']), () => {
          bc.destroy();
          return Estado.Erro();
        })
        .when(
          matches(
            ['AguardaAtualizacao', 'AguardaVerificacaoInicial'],
            ['Clique']
          ),
          ([estado]) => estado
        )
        .when(
          matches(['AguardaAtualizacao', 'Ocioso'], ['AtualizacaoDepositos']),
          ([{ status, rpv }, { quantidade, atualiza }]) =>
            Estado[status]({ rpv, depositos: { quantidade, atualiza } })
        )
        .when(
          matches(['AguardaAtualizacao', 'Ocioso'], ['AtualizacaoRPV']),
          ([{ status, depositos }, { quantidade, atualiza }]) =>
            Estado[status]({ depositos, rpv: { quantidade, atualiza } })
        )
        .when(
          matches(
            ['AguardaVerificacaoInicial'],
            ['AtualizacaoDepositos', 'AtualizacaoRPV', 'PaginaContasAberta']
          ),
          () => Estado.Erro()
        )
        .when(
          matches(
            ['AguardaAtualizacao', 'AguardaVerificacaoInicial', 'Ocioso'],
            ['VerificacaoTerminada']
          ),
          ([, { rpv, depositos }]) => Estado.Ocioso({ rpv, depositos })
        )
        .when(matches(['Ocioso'], ['Clique']), ([dados, { alvo }]) => {
          if (alvo === 'BOTAO_DEP' || alvo === 'LINK_DEP') {
            window.open(linkDepositos.href);
          } else if (alvo === 'BOTAO_RPV' || alvo === 'LINK_RPV') {
            window.open(linkRPV.href);
            if (alvo === 'BOTAO_RPV' && dados.rpv.atualiza) {
              return Estado.AguardaAtualizacao(dados);
            }
          }
          return dados;
        })
        .when(matches(['Ocioso'], ['PaginaContasAberta']), ([estado]) => estado)
        .when(
          matches(['AguardaAtualizacao'], ['PaginaContasAberta']),
          ([estado]) => {
            bc.publish(Mensagem.RespostaAtualizar(numproc, true));
            return estado;
          }
        )
        .get();
    }
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
    return matchEstado(estado)
      .case('AguardaVerificacaoInicial', () => (
        <output>Verificando contas com saldo...</output>
      ))
      .case('AguardaAtualizacao', () => (
        <output>Aguardando atualização das contas...</output>
      ))
      .case('Ocioso', ({ depositos, rpv }) => {
        const qDep = depositos.quantidade as 0 | p.Natural | undefined;
        const qRPV = rpv.quantidade as 0 | p.Natural | undefined;

        const classe = qDep === 0 && qRPV === 0 ? 'zerado' : 'saldo';

        function textoContas(qtd: p.Natural | undefined) {
          if (qtd === undefined) return 'conta(s)';
          if (qtd === 1) return `1 conta`;
          return `${qtd} contas`;
        }
        const msgR =
          qRPV === 0 ? null : `${textoContas(qRPV)} de requisição de pagamento`;
        const msgD =
          qDep === 0 ? null : `${textoContas(qDep)} de depósito judicial`;
        const msgs = [msgR, msgD].filter((x): x is string => x !== null);
        const mensagem =
          msgs.length === 0
            ? 'Sem saldo em conta(s).'
            : `Há ${msgs.join(' e ')} com saldo.`;
        return (
          <MensagemComBotao
            {...{ classe, mensagem, rpv: qRPV ?? -1, dep: qDep ?? -1 }}
          />
        );
      })
      .case('Erro', () => {
        sub.unsubscribe();
        return (
          <MensagemComBotao
            classe="erro"
            mensagem="Ocorreu um erro com a atualização de saldos."
            rpv={0}
            dep={0}
          />
        );
      })
      .get();
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
  return obter(
    '#fldInformacoesAdicionais',
    'Tabela de informações adicionais não encontrada.'
  );
}
