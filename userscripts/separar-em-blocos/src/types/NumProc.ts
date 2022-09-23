import { Opaque } from '@nadameu/opaque';
import * as p from '@nadameu/predicates';

export type NumProc = Opaque<string, { readonly Numproc: unique symbol }>;
const numprocRE = /^5\d{8}20\d{2}404(?:00|7(?:0|1|2)|99)\d{2}$/;
export const isNumProc = /* #__PURE__ */ p.refine(p.isString, (x): x is NumProc =>
  numprocRE.test(x)
);
