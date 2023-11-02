import { createTaggedUnion } from '@nadameu/match';
import type { Bloco } from './Bloco';
import type { BroadcastMessage } from './BroadcastMessage';

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
    inserir: (id: Bloco['id'], { fecharJanela = false } = {}) => ({
      id,
      fecharJanela,
    }),
    mensagemRecebida: (msg: BroadcastMessage) => ({ msg }),
    obterBlocos: null,
    remover: (id: Bloco['id']) => ({ id }),
  },
  'type'
);
