import { createTaggedUnion, type matchBy } from '@nadameu/match';
import type { Bloco } from './Bloco';

export interface LoadingState {
  status: 'Loading';
  blocos: Bloco[];
}
export interface SuccessState {
  status: 'Success';
  blocos: Bloco[];
}
export interface ErrorState {
  status: 'Error';
  reason: unknown;
}
export type State = LoadingState | SuccessState | ErrorState;
export const State = /* #__PURE__ */ createTaggedUnion(
  {
    Loading: (blocos: Bloco[]) => ({ blocos }),
    Success: (blocos: Bloco[]) => ({ blocos }),
    Error: (reason: unknown) => ({ reason }),
  },
  'status'
) as {
  Loading: (blocos: Bloco[]) => LoadingState;
  Success: (blocos: Bloco[]) => SuccessState;
  Error: (reason: unknown) => ErrorState;
  match: ReturnType<typeof matchBy<'status'>>;
};
