import * as p from '@nadameu/predicates';
import { isBloco } from './Bloco';

export const isBroadcastMessage = /* #__PURE__ */ p.hasShape({
  type: p.isLiteral('Blocos'),
  blocos: p.isTypedArray(isBloco),
});
export type BroadcastMessage = p.Static<typeof isBroadcastMessage>;
