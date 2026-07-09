import { parseAreaDeTrabalho } from './parseAreaDeTrabalho';
import { parseEndereco } from './parseEndereco';
import { parseImprimir } from './parseImprimir';

export function main() {
  const resultado = parseEndereco(new URL(document.location.href)).map(acao => {
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
  if (!resultado.ok) throw resultado.reason;
}
