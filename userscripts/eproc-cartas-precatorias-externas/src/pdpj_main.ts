import { pdpj_consulta } from './pdpj_consulta';
import { pdpj_processo } from './pdpj_processo';

export function pdpj_main() {
  switch (document.location.pathname) {
    case '/consulta':
      return pdpj_consulta();

    case '/consulta/autosdigitais':
      return pdpj_processo();

    default:
      throw new Error(`Caminho desconhecido: ${document.location.pathname}.`);
  }
}
