import * as p from '@nadameu/predicates';
import { isNumProc, NumProc } from './NumProc';

export const isIdBloco = p.isNonNegativeInteger;

export const isNomeBloco = p.isNonEmptyString;

export const isBloco: p.Predicate<Bloco> = /* #__PURE__ */ p.hasShape({
  id: isIdBloco,
  nome: isNomeBloco,
  processos: p.isTypedArray(isNumProc),
});
export interface Bloco {
  id: p.Static<typeof isIdBloco>;
  nome: p.Static<typeof isNomeBloco>;
  processos: NumProc[];
}

export const isBlocoProcesso: p.Predicate<BlocoProcesso> =
  /* #__PURE__ */ p.hasShape({
    id: isIdBloco,
    nome: isNomeBloco,
    inserido: p.isBoolean,
  });
export interface BlocoProcesso {
  id: p.Static<typeof isIdBloco>;
  nome: p.Static<typeof isNomeBloco>;
  inserido: boolean;
}
