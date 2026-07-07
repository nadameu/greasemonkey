export const acoes = [
  'minuta_area_trabalho',
  'minuta_imprimir',
  'minuta_imprimir_preparar_lista',
] as const;
export type Acao = (typeof acoes)[number];
