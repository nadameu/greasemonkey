import { createBroadcastService } from '@nadameu/create-broadcast-service';
import { createTaggedUnion, matchBy, Static } from '@nadameu/match';
import * as p from '@nadameu/predicates';
import { isNumproc, NumProc } from './NumProc';

export const Mensagem = /* @__PURE__ */ createTaggedUnion(
  {
    InformaContas: (numproc: NumProc, qtdComSaldo: number, permiteAtualizar: boolean) => ({
      numproc,
      qtdComSaldo,
      permiteAtualizar,
    }),
    InformaSaldoDeposito: (numproc: NumProc, qtdComSaldo: number) => ({ numproc, qtdComSaldo }),
    PerguntaAtualizar: (numproc: NumProc) => ({ numproc }),
    RespostaAtualizar: (numproc: NumProc, atualizar: boolean) => ({ numproc, atualizar }),
  },
  'tipo'
);
export type Mensagem = Static<typeof Mensagem>;

type MensagemDict = {
  [K in Mensagem['tipo']]: Extract<Mensagem, { tipo: K }>;
};
type DefinicoesPredicate = {
  [K in keyof MensagemDict]: {
    [S in keyof MensagemDict[K] as Exclude<S, 'tipo'>]: p.Predicate<MensagemDict[K][S]>;
  };
};

export const isMensagem: p.Predicate<Mensagem> = /* @__PURE__ */ p.isTaggedUnion<
  'tipo',
  DefinicoesPredicate
>('tipo', {
  InformaContas: {
    numproc: isNumproc,
    qtdComSaldo: p.isNumber,
    permiteAtualizar: p.isBoolean,
  },
  InformaSaldoDeposito: { numproc: isNumproc, qtdComSaldo: p.isNumber },
  PerguntaAtualizar: { numproc: isNumproc },
  RespostaAtualizar: { numproc: isNumproc, atualizar: p.isBoolean },
});

export function createMsgService() {
  return createBroadcastService<Mensagem>('gm-atualizar-saldo', isMensagem);
}
