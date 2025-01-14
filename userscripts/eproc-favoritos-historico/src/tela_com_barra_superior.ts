import { h } from '@nadameu/create-element';
import * as P from '@nadameu/predicates';
import classes from './tela_com_barra_superior.module.scss';

export async function tela_com_barra_superior(casa: HTMLElement) {
  const link = casa.closest('a[href]');
  P.assert(P.isNotNull(link), 'Erro ao definir localização dos ícones.');
  const icone_ultimo = criar_icone({
    symbol: 'refresh',
    title: 'Reabrir último processo',
  });
  const icone_historico = criar_icone({
    symbol: 'history',
    title: 'Histórico de processos',
  });
  const icone_favoritos = criar_icone({
    symbol: 'bookmark_border',
    title: 'Favoritos',
  });
  const frag = h(
    'div',
    { classList: ['px-2'] },
    icone_ultimo,
    icone_historico,
    icone_favoritos
  );
  link.parentNode!.insertBefore(frag, link);
}

function criar_icone({ symbol, title }: { symbol: string; title: string }) {
  const icone = h(
    'i',
    {
      classList: [classes.icon, 'material-icons', 'navbar-icons'],
      style: { padding: '0' },
      title,
    },
    symbol
  );
  return h(
    'a',
    {
      classList: [classes.link],
      href: '#',
      onclick: e => e.preventDefault(),
    },
    icone
  );
}
