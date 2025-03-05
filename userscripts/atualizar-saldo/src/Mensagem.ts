import { createBroadcastService } from '@nadameu/create-broadcast-service';
import { makeConstructorsWith } from '@nadameu/match';
import * as p from '@nadameu/predicates';
import { isNumproc, NumProc } from './NumProc';

export const isMensagem = /* @__PURE__ */ p.isTaggedUnion('tipo', {
  InformaContas: {
    numproc: isNumproc,
    qtdComSaldo: p.isNumber,
    permiteAtualizar: p.isBoolean,
  },
  InformaSaldoDeposito: { numproc: isNumproc, qtdComSaldo: p.isNumber },
  PerguntaAtualizar: { numproc: isNumproc },
  RespostaAtualizar: { numproc: isNumproc, atualizar: p.isBoolean },
});
export type Mensagem = p.Static<typeof isMensagem>;
export const Mensagem = makeConstructorsWith('tipo', {
  InformaContas: (
    numproc: NumProc,
    qtdComSaldo: number,
    permiteAtualizar: boolean
  ) => ({
    numproc,
    qtdComSaldo,
    permiteAtualizar,
  }),
  InformaSaldoDeposito: (numproc: NumProc, qtdComSaldo: number) => ({
    numproc,
    qtdComSaldo,
  }),
  PerguntaAtualizar: (numproc: NumProc) => ({ numproc }),
  RespostaAtualizar: (numproc: NumProc, atualizar: boolean) => ({
    numproc,
    atualizar,
  }),
}) satisfies {
  [K in Mensagem['tipo']]: (...args: never[]) => Extract<Mensagem, { tipo: K }>;
};

export function createMsgService() {
  return createBroadcastService<Mensagem>('gm-atualizar-saldo', isMensagem);
}
