import { Opaque } from '@nadameu/opaque';

export type NumProc = Opaque<string, { NumProc: NumProc }>;
export function isNumProc(x: string): x is NumProc {
  return /^\d{20}$/.test(x);
}
