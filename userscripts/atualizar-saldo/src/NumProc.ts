import { Opaque } from '@nadameu/opaque';
import * as p from '@nadameu/predicates';

export type NumProc = Opaque<string, { readonly numproc: never }>;
export const isNumproc = p.refine(p.isString, (x): x is NumProc => /^\d{20}$/.test(x));
