import { isAnyOf, isLiteral, Predicate } from '@nadameu/predicates';

export const Prioridade = { BAIXA: 1, MEDIA: 2, ALTA: 3 } as const;
export type Prioridade = (typeof Prioridade)[keyof typeof Prioridade];
export const isPrioridade: Predicate<Prioridade> = isAnyOf(
  isLiteral(Prioridade.BAIXA),
  isLiteral(Prioridade.MEDIA),
  isLiteral(Prioridade.ALTA)
);
