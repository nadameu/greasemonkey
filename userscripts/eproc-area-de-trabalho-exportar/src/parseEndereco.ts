import { Acao, acoes } from './acoes';
import { err, ok, Result } from './Result';

export function parseEndereco(url: URL): Result<Acao, AcaoDesconhecida> {
  const acao = url.searchParams.get('acao');
  if (acao !== null && acoes.includes(acao as any)) {
    return ok(acao as (typeof acoes)[number]);
  } else {
    return err(new AcaoDesconhecida(acao));
  }
}

export class AcaoDesconhecida extends Error {
  readonly name = 'AcaoDesconhecida';
  readonly cause: string | null;
  constructor(acao: string | null) {
    super();
    this.cause = acao;
  }
}
