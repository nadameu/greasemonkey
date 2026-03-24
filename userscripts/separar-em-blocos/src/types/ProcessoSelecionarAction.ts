import {
  FromConstructorsWith,
  makeConstructorsWith,
  matchWith,
} from '@nadameu/match';
import type { Bloco } from './Bloco';
import type { BroadcastMessage } from './BroadcastMessage';

export const Action = /* #__PURE__ */ makeConstructorsWith('type', {
  blocosModificados: (
    blocos: Bloco[],
    { fecharJanela = false }: { fecharJanela?: boolean } = {}
  ) => ({
    blocos,
    fecharJanela,
  }),
  criarBloco: (nome: Bloco['nome']) => ({ nome }),
  erro: (reason: unknown) => ({ reason }),
  inserir: (
    id: Bloco['id'],
    { fecharJanela = false }: { fecharJanela?: boolean } = {}
  ) => ({
    id,
    fecharJanela,
  }),
  mensagemRecebida: (msg: BroadcastMessage) => ({ msg }),
  obterBlocos: () => ({}),
  remover: (id: Bloco['id']) => ({ id }),
});
export type Action = FromConstructorsWith<'type', typeof Action>;
export const matchAction = matchWith('type')<Action>;
