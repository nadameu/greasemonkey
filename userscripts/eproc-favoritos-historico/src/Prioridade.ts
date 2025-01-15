export const Prioridade = { BAIXA: 1, MEDIA: 2, ALTA: 3 } as const;
export type Prioridade = (typeof Prioridade)[keyof typeof Prioridade];
