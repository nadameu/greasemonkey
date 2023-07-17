import { createTaggedUnion, Static } from '@nadameu/match';
import * as p from '@nadameu/predicates';

export const Mensagem = createTaggedUnion({
  CarregandoDados: null,
  ErroDesconhecido: (erro: Error) => ({ erro }),
  SemConsulta: null,
  MultiplosModais: null,
});

export type Mensagem = Static<typeof Mensagem>;

export const isMensagem = p.isTaggedUnion('tag', {
  CarregandoDados: {},
  ErroDesconhecido: { erro: (x: unknown): x is Error => x instanceof Error },
  SemConsulta: {},
  MultiplosModais: {},
});
