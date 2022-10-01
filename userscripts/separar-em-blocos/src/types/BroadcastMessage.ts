import * as p from '@nadameu/predicates';
import { isBloco } from './Bloco';

export const isBroadcastMessage = /* #__PURE__ */ p.isTaggedUnion('type', {
  Blocos: { blocos: p.isArray(isBloco) },
  NoOp: {},
});
export type BroadcastMessage = p.Static<typeof isBroadcastMessage>;
