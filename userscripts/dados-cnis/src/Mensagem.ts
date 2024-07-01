import { MemberWith, tag, TaggedWithUnion } from '@nadameu/match';
import * as p from '@nadameu/predicates';

export type Mensagem = TaggedWithUnion<
  'tag',
  {
    CarregandoDados: {};
    ErroDesconhecido: { erro: Error };
    SemConsulta: {};
    MultiplosModais: {};
  }
>;

const tagMensagem = tag as <T extends Mensagem['tag']>(
  tag: T
) => (
  props: Omit<MemberWith<Mensagem, 'tag', T>, 'tag'>
) => MemberWith<Mensagem, 'tag', T>;

export const Mensagem = {
  CarregandoDados: tagMensagem('CarregandoDados'),
  ErroDesconhecido: (erro: Error) => tagMensagem('ErroDesconhecido')({ erro }),
  MultiplosModais: tagMensagem('MultiplosModais'),
  SemConsulta: tagMensagem('SemConsulta'),
} satisfies Record<
  Mensagem['tag'],
  Mensagem | ((...args: never[]) => Mensagem)
>;

export const isMensagem = p.isTaggedUnion('tag', {
  CarregandoDados: {},
  ErroDesconhecido: { erro: (x: unknown): x is Error => x instanceof Error },
  SemConsulta: {},
  MultiplosModais: {},
});
