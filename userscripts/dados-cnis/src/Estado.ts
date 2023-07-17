import { Static, createTaggedUnion } from '@nadameu/match';

export const Estado = createTaggedUnion({
  Aguardando: null,
  SemConsulta: null,
  Erro: (motivo: Error) => ({ motivo }),
  CarregandoDados: null,
  DadosCarregados: (dados: unknown) => ({ dados }),
});
export type Estado = Static<typeof Estado>;
