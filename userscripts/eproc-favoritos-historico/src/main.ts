import * as pkg from '../package.json';
import { h } from '@nadameu/create-element';
import * as P from '@nadameu/predicates';
import * as db from './database';
import classes from './styles.module.scss';

const Status = ['PENDING', 'ACTIVE', 'INACTIVE', 'ERROR'] as const;
type Status = (typeof Status)[number];

export async function main() {
  const elemento_numero = document.getElementById('txtNumProcesso');
  P.assert(
    P.isNotNullish(elemento_numero),
    'Erro ao obter o número do processo.'
  );
  const numero_formatado = elemento_numero.textContent?.trim();
  P.assert(
    P.isNonEmptyString(numero_formatado),
    'Erro ao obter o número do processo.'
  );
  const numero = numero_formatado.replace(/[.-]/g, '');

  let status: Status;

  try {
    const resultado = await db.verificar_favorito(numero);
    status = resultado ? 'ACTIVE' : 'INACTIVE';
  } catch (err) {
    status = 'ERROR';
    throw err;
  }

  const update_render = render_estrela(elemento_numero, status, () => {
    if (status === 'ERROR' || status === 'PENDING') return;
    (async () => {
      try {
        if (status === 'ACTIVE') {
          update_render((status = 'PENDING'));
          await db.remover_favorito(numero);
          update_render((status = 'INACTIVE'));
        } else {
          update_render((status = 'PENDING'));
          await db.salvar_favorito(numero);
          update_render((status = 'ACTIVE'));
        }
      } catch (err) {
        update_render((status = 'ERROR'));
        console.group(pkg.name);
        console.error(err);
        console.groupEnd();
      }
    })();
  });
}

function render_estrela(
  elemento_numero: HTMLElement,
  initialStatus: Status,
  onclick: () => void
) {
  const parent = elemento_numero.parentNode!;
  const icon = h('i', { classList: ['material-icons-round', classes.icon] });
  const link = h(
    'a',
    {
      classList: [classes.link, classes.wait, 'col-auto', 'px-1'],
      href: '#',
    },
    icon
  );
  const div = h(
    'div',
    { classList: [classes.div, 'row'] },
    elemento_numero,
    link
  );
  parent.append(div);
  elemento_numero.classList.add('col-auto', 'pr-0');

  const info: Record<Status, { symbol: string; title: string }> = {
    PENDING: { symbol: 'pending', title: 'Aguarde' },
    ACTIVE: { symbol: 'star', title: 'Remover dos favoritos' },
    INACTIVE: { symbol: 'star_outline', title: 'Adicionar aos favoritos' },
    ERROR: { symbol: 'error', title: 'Erro ao carregar dados' },
  };

  update(initialStatus);

  link.addEventListener('click', e => {
    e.preventDefault();
    onclick();
  });

  return update;

  function update(status: Status) {
    const { symbol, title } = info[status];
    icon.textContent = symbol;
    link.title = title;

    if (status === 'PENDING') {
      link.classList.add(classes.wait);
    } else {
      link.classList.remove(classes.wait);
    }

    if (status === 'ACTIVE') {
      link.classList.add(classes.added);
    } else {
      link.classList.remove(classes.added);
    }
  }
}
