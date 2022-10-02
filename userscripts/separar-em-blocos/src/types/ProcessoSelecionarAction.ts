import { createTaggedUnion, type matchBy } from '@nadameu/match';
import type { Bloco } from './Bloco';
import type { BroadcastMessage } from './BroadcastMessage';
import type { NumProc } from './NumProc';

interface BlocosModificadosAction {
  type: 'blocosModificados';
  blocos: Bloco[];
  fecharJanela: boolean;
}
interface CriarBlocoAction {
  type: 'criarBloco';
  nome: Bloco['nome'];
}
interface ErroAction {
  type: 'erro';
  reason: unknown;
}
interface InserirAction {
  type: 'inserir';
  id: Bloco['id'];
  fecharJanela: boolean;
}
interface MensagemRecebidaAction {
  type: 'mensagemRecebida';
  msg: BroadcastMessage;
}
interface ModificarProcessosAction {
  type: 'modificarProcessos';
  id: Bloco['id'];
  fn: (processos: Set<NumProc>, numproc: NumProc) => void;
  fecharJanela: boolean;
}
export interface ObterBlocosAction {
  type: 'obterBlocos';
}
interface RemoverAction {
  type: 'remover';
  id: Bloco['id'];
}
export type Action =
  | BlocosModificadosAction
  | CriarBlocoAction
  | ErroAction
  | InserirAction
  | MensagemRecebidaAction
  | ModificarProcessosAction
  | ObterBlocosAction
  | RemoverAction;
export const Action = /* #__PURE__ */ createTaggedUnion(
  {
    blocosModificados: (blocos: Bloco[], { fecharJanela = false } = {}) => ({
      blocos,
      fecharJanela,
    }),
    criarBloco: (nome: Bloco['nome']) => ({ nome }),
    erro: (reason: unknown) => ({ reason }),
    inserir: (id: Bloco['id'], { fecharJanela = false } = {}) => ({ id, fecharJanela }),
    mensagemRecebida: (msg: BroadcastMessage) => ({ msg }),
    modificarProcessos: (
      id: Bloco['id'],
      fn: (processos: Set<NumProc>, numproc: NumProc) => void,
      { fecharJanela = false } = {}
    ) => ({ id, fn, fecharJanela }),
    obterBlocos: null,
    remover: (id: Bloco['id']) => ({ id }),
  },
  'type'
);
