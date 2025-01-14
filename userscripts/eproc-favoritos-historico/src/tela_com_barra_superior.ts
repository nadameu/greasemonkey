import * as P from '@nadameu/predicates';

export async function tela_com_barra_superior(casa: HTMLElement) {
  const link = casa.closest('a[href]');
  P.assert(P.isNotNull(link), 'Erro ao definir localização dos ícones.');
}
