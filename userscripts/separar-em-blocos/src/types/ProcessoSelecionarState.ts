import { createTaggedUnion, type matchBy } from '@nadameu/match';
import type { Bloco } from './Bloco';
import { Action } from './ProcessoSelecionarAction';

export interface LoadingState {
  status: 'Loading';
  blocos: Bloco[];
  promise: Promise<Action>;
}
export interface SuccessState {
  status: 'Success';
  blocos: Bloco[];
  erro?: string;
}
export interface ErrorState {
  status: 'Error';
  reason: unknown;
}
export type State = LoadingState | SuccessState | ErrorState;
export const State = /* #__PURE__ */ createTaggedUnion(
  {
    Loading: (blocos: Bloco[], eventualAction: () => Promise<Action>) => ({
      blocos,
      promise: eventualAction(),
    }),
    Success: (blocos: Bloco[], erro?: string) => ({
      blocos,
      erro,
    }),
    Error: (reason: unknown) => ({ reason }),
  },
  'status'
) as {
  Loading: (blocos: Bloco[], eventualAction: () => Promise<Action>) => LoadingState;
  Success: (blocos: Bloco[], erro?: string | undefined) => SuccessState;
  Error: (reason: unknown) => ErrorState;
  match: ReturnType<typeof matchBy<'status'>>;
};
