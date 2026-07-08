export const acoes = ['minuta_area_trabalho', 'minuta_imprimir'] as const;
export type Acao = (typeof acoes)[number];
