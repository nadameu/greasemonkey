import { h } from '@nadameu/create-element';
import * as P from '@nadameu/predicates';
import classes from './styles.module.scss';

function main() {
  const numero = document.getElementById('txtNumProcesso');
  P.assert(P.isNotNullish(numero), 'Erro ao obter a barra superior.');
  const icon = h('i', { classList: ['material-icons-round', classes.icon] });
  const link = h(
    'a',
    {
      classList: [classes.link, 'col-auto', 'px-1'],
      href: '#',
      onclick,
    },
    icon
  );
  const div = h('div', { classList: [classes.div, 'row'] });
  numero.classList.add('col-auto');
  numero.classList.add('pr-0');
  numero.parentNode?.replaceChild(div, numero);
  div.append(numero, ' ', link);
  handle();

  function onclick(evt: Event) {
    evt.preventDefault();
    handle();
  }

  function handle() {
    if (icon.textContent === 'star_outline') {
      icon.textContent = 'star';
      link.title = 'Remover dos favoritos';
    } else {
      icon.textContent = 'star_outline';
      link.title = 'Adicionar aos favoritos';
    }
  }
}

main();
