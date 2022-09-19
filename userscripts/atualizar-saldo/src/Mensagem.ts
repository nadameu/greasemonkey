import { createBroadcastService } from '@nadameu/create-broadcast-service';
import { createTaggedUnion, Static } from '@nadameu/match';
import * as p from '@nadameu/predicates';
import { isNumproc, NumProc } from './NumProc';

export const Mensagem = /* @__PURE__ */ createTaggedUnion({
  InformaContas: (numproc: NumProc, qtdComSaldo: number, permiteAtualizar: boolean) => ({
    numproc,
    qtdComSaldo,
    permiteAtualizar,
  }),
  InformaSaldoDeposito: (numproc: NumProc, qtdComSaldo: number) => ({ numproc, qtdComSaldo }),
  PerguntaAtualizar: (numproc: NumProc) => ({ numproc }),
  RespostaAtualizar: (numproc: NumProc, atualizar: boolean) => ({ numproc, atualizar }),
});
export type Mensagem = Static<typeof Mensagem>;

type MensagemTransmitidaDict = {
  [K in Mensagem['tag']]: Omit<Extract<Mensagem, { tag: K }>, 'match' | 'matchOr'>;
};
export type MensagemTransmitida = MensagemTransmitidaDict[Mensagem['tag']];
type DefinicioesPredicate = {
  [K in keyof MensagemTransmitidaDict]: MensagemTransmitidaDict[K] extends { data: infer D }
    ? { data: p.Predicate<D> }
    : {};
};

export const isMensagem: p.Predicate<MensagemTransmitida> = /* @__PURE__ */ p.isTaggedUnion<
  'tag',
  DefinicioesPredicate
>('tag', {
  InformaContas: {
    data: p.hasShape({
      numproc: isNumproc,
      qtdComSaldo: p.isNumber,
      permiteAtualizar: p.isBoolean,
    }),
  },
  InformaSaldoDeposito: { data: p.hasShape({ numproc: isNumproc, qtdComSaldo: p.isNumber }) },
  PerguntaAtualizar: { data: p.hasShape({ numproc: isNumproc }) },
  RespostaAtualizar: { data: p.hasShape({ numproc: isNumproc, atualizar: p.isBoolean }) },
});

export function createMsgService() {
  return createBroadcastService<MensagemTransmitida>('gm-atualizar-saldo', isMensagem);
}
