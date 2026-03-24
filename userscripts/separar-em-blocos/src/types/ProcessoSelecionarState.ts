import {
  FromConstructorsWith,
  makeConstructorsWith,
  matchWith,
} from '@nadameu/match';
import type { Bloco } from './Bloco';

export const State = /* #__PURE__ */ makeConstructorsWith('status', {
  Loading: (blocos: Bloco[]) => ({ blocos }),
  Success: (blocos: Bloco[]) => ({ blocos }),
  Error: (reason: unknown) => ({ reason }),
});
export type State = FromConstructorsWith<'status', typeof State>;
export const matchState = matchWith('status')<State>;
