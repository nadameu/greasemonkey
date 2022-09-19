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
  PerguntaAtualizar: (numproc: NumProc) => ({ numproc }),
  RespostaAtualizar: (numproc: NumProc, atualizar: boolean) => ({ numproc, atualizar }),
});
export type Mensagem = Static<typeof Mensagem>;
export const isMensagem: p.Predicate<MensagemTransmitida> = /* @__PURE__ */ p.isTaggedUnion('tag', {
  InformaContas: {
    data: p.hasShape({
      numproc: isNumproc,
      qtdComSaldo: p.isNumber,
      permiteAtualizar: p.isBoolean,
    }),
  },
  PerguntaAtualizar: { data: p.hasShape({ numproc: isNumproc }) },
  RespostaAtualizar: { data: p.hasShape({ numproc: isNumproc, atualizar: p.isBoolean }) },
});
export type MensagemTransmitida = {
  [K in Mensagem['tag']]: Omit<Extract<Mensagem, { tag: K }>, 'match'>;
}[Mensagem['tag']];

export function createMsgService() {
  return createBroadcastService<MensagemTransmitida>('gm-atualizar-saldo', isMensagem);
}
