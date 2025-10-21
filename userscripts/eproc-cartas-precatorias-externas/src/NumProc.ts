import { Opaque } from '@nadameu/opaque';
import { arrayHasLength, assert, isString, refine } from '@nadameu/predicates';

export type NumProc = Opaque<string, { NumProc: NumProc }>;

export const isNumProc = refine(isString, (x: string): x is NumProc =>
  /^\d{20}$/.test(x)
);

export type NumProcFormatado = Opaque<
  string,
  { NumProcFormatado: NumProcFormatado }
>;
export const isNumProcFormatado = refine(
  isString,
  (x: string): x is NumProcFormatado =>
    /^\d{7}-\d{2}\.\d{4}\.\d\.?\d{2}\.\d{4}$/.test(x)
);

export function remover_formatacao(numproc: NumProcFormatado): NumProc {
  return numproc.replaceAll(/[.-]/g, '') as NumProc;
}

export function formatar(numproc: NumProc): NumProcFormatado {
  const partes = numproc.match(/^(.......)(..)(....)(.)(..)(....)$/);
  assert(partes !== null && arrayHasLength(7)(partes));
  const [, seq, dv, ...resto] = partes;
  return [`${seq}-${dv}`, ...resto].join('.') as NumProcFormatado;
}
