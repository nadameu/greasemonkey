import { parseAreaDeTrabalho } from './parseAreaDeTrabalho';
import { AcaoDesconhecida, parseEndereco } from './parseEndereco';
import { parseImprimir } from './parseImprimir';
import { ok, Result } from './Result';
import { NotUnique } from './Result/functions';

export function main(): Result<() => void, AcaoDesconhecida | NotUnique> {
  return parseEndereco(new URL(document.location.href)).chain(acao => {
    switch (acao) {
      case 'minuta_area_trabalho':
        return parseAreaDeTrabalho();
      case 'minuta_imprimir':
        return parseImprimir();
      default:
        const _: never = acao;
        return _;
    }
  });
}
