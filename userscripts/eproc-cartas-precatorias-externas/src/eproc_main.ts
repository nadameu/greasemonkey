import { eproc_cartas } from './eproc_cartas';
import { eproc_processo } from './eproc_processo';

export function eproc_main() {
  const params = new URL(document.location.href).searchParams;
  switch (params.get('acao')) {
    case 'processo_selecionar':
      return eproc_processo();

    case 'relatorio_processo_carta_precatoria_listar':
      return eproc_cartas();

    default:
      throw new Error(`Ação desconhecida: ${params.get('acao')}`);
  }
}
