import { createTaggedUnion, type matchBy } from '@nadameu/match';
import type { Bloco } from './Bloco';
import type { BroadcastMessage } from './BroadcastMessage';
import type { NumProc } from './NumProc';

interface BlocosModificadosAction {
  type: 'blocosModificados';
  blocos: Bloco[];
  fecharJanela: boolean;
}
interface BlocosObtidosAction {
  type: 'blocosObtidos';
  blocos: Bloco[];
}
interface CriarBlocoAction {
  type: 'criarBloco';
  nome: Bloco['nome'];
}
interface ErroAction {
  type: 'erro';
  reason: unknown;
}
interface ErroCapturadoAction {
  type: 'erroCapturado';
  reason: string;
}
interface InserirAction {
  type: 'inserir';
  id: Bloco['id'];
  fecharJanela: boolean;
}
interface InserirEFecharAction {
  type: 'inserirEFechar';
  id: Bloco['id'];
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
export interface NoOpAction {
  type: 'noop';
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
  | BlocosObtidosAction
  | CriarBlocoAction
  | ErroAction
  | ErroCapturadoAction
  | InserirAction
  | InserirEFecharAction
  | MensagemRecebidaAction
  | ModificarProcessosAction
  | NoOpAction
  | ObterBlocosAction
  | RemoverAction;
export const Action = /* #__PURE__ */ createTaggedUnion(
  {
    blocosModificados: (blocos: Bloco[], { fecharJanela = false } = {}) => ({
      blocos,
      fecharJanela,
    }),
    blocosObtidos: (blocos: Bloco[]) => ({ blocos }),
    criarBloco: (nome: Bloco['nome']) => ({ nome }),
    erro: (reason: unknown) => ({ reason }),
    erroCapturado: (reason: string) => ({ reason }),
    inserir: (id: Bloco['id'], { fecharJanela = false } = {}) => ({ id, fecharJanela }),
    inserirEFechar: (id: Bloco['id']) => ({ id }),
    mensagemRecebida: (msg: BroadcastMessage) => ({ msg }),
    modificarProcessos: (
      id: Bloco['id'],
      fn: (processos: Set<NumProc>, numproc: NumProc) => void,
      { fecharJanela = false } = {}
    ) => ({ id, fn, fecharJanela }),
    noop: null,
    obterBlocos: null,
    remover: (id: Bloco['id']) => ({ id }),
  },
  'type'
) as {
  blocosModificados: (blocos: Bloco[], options?: { fecharJanela: boolean }) => Action;
  blocosObtidos: (blocos: Bloco[]) => Action;
  criarBloco: (nome: Bloco['nome']) => Action;
  erro: (reason: unknown) => Action;
  erroCapturado: (reason: string) => Action;
  inserir: (id: Bloco['id'], options?: { fecharJanela: boolean }) => Action;
  inserirEFechar: (id: Bloco['id']) => Action;
  mensagemRecebida: (msg: BroadcastMessage) => Action;
  modificarProcessos: (
    id: Bloco['id'],
    fn: (processos: Set<NumProc>, numproc: NumProc) => void,
    options?: { fecharJanela: boolean }
  ) => Action;
  noop: NoOpAction;
  obterBlocos: ObterBlocosAction;
  remover: (id: Bloco['id']) => Action;
  match: ReturnType<typeof matchBy<'type'>>;
};
