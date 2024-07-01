import {
  ExtraProperties,
  MemberOf,
  MemberTag,
  TaggedUnion,
  tag,
} from '@nadameu/match';
export type Estado = TaggedUnion<{
  Aguardando: {};
  SemConsulta: {};
  Erro: { motivo: Error };
  CarregandoDados: {};
  DadosCarregados: { dados: unknown };
}>;
const tagEstado: <T extends MemberTag<Estado>>(
  tag: T
) => (props: ExtraProperties<MemberOf<Estado, T>>) => MemberOf<Estado, T> =
  tag as unknown as any;
export const Estado = {
  Aguardando: tagEstado('Aguardando')({}),
  SemConsulta: tagEstado('SemConsulta')({}),
  Erro: (motivo: Error) => tagEstado('Erro')({ motivo }),
  CarregandoDados: tagEstado('CarregandoDados')({}),
  DadosCarregados: (dados: unknown) => tagEstado('DadosCarregados')({ dados }),
} satisfies Record<MemberTag<Estado>, Estado | ((...args: never[]) => Estado)>;
