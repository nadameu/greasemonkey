import { parseAreaDeTrabalho } from './parseAreaDeTrabalho';
import { parseEndereco } from './parseEndereco';
import { parseImprimir } from './parseImprimir';

export function main() {
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
