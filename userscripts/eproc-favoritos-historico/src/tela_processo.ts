import { h } from '@nadameu/create-element';
import * as P from '@nadameu/predicates';
import { create_store } from './create_store';
import * as db from './database';
import { log_error } from './log_error';
import { isNumProc } from './NumProc';
import { Prioridade } from './Prioridade';
import classes from './tela_processo.module.scss';

type Status =
  | 'PENDING'
  | { status: 'ACTIVE'; motivo: string }
  | 'INACTIVE'
  | 'ERROR';

export async function tela_processo() {
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
  const numero = P.check(
    isNumProc,
    numero_formatado.replace(/[.-]/g, ''),
    'Erro ao obter número do processo'
  );

  const status = create_store<Status>('PENDING');

  try {
    const resultado = await db.verificar_favorito(numero);
    status.set(
      resultado !== undefined
        ? { status: 'ACTIVE', motivo: resultado.motivo }
        : 'INACTIVE'
    );
  } catch (err) {
    status.set('ERROR');
    throw err;
  }

  const estrela = render_estrela(elemento_numero);
  status.subscribe(estrela.update);
  estrela.eventTarget.addEventListener('click', async () => {
    const current = status.get();
    if (current === 'ERROR' || current === 'PENDING') return;
    try {
      if (typeof current === 'object' && current.status === 'ACTIVE') {
        status.set('PENDING');
        await db.remover_favorito(numero);
        status.set('INACTIVE');
      } else {
        status.set('PENDING');
        // TODO
        const motivo = '';
        const prioridade = Prioridade.MEDIA;
        await db.salvar_favorito({ numproc: numero, motivo, prioridade });
        status.set({ status: 'ACTIVE', motivo });
      }
    } catch (err) {
      status.set('ERROR');
      log_error(err);
      throw err;
    }
  });
}

function render_estrela(elemento_numero: HTMLElement) {
  const parent = elemento_numero.parentNode!;
  const icon = h('i', { classList: ['material-icons', classes.icon] });
  const eventTarget = new EventTarget();
  const link = h(
    'a',
    {
      classList: [classes.link, classes.wait, 'col-auto', 'px-1'],
      href: '#',
      onclick: evt => {
        evt.preventDefault();
        eventTarget.dispatchEvent(new Event('click'));
      },
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

  const info: Record<
    Status extends infer S ? (S extends { status: infer K } ? K : S) : never,
    { symbol: string; title: string }
  > = {
    PENDING: { symbol: 'hourglass_top', title: 'Aguarde' },
    ACTIVE: { symbol: 'star', title: 'Remover dos favoritos' },
    INACTIVE: { symbol: 'star_outline', title: 'Adicionar aos favoritos' },
    ERROR: { symbol: 'error_outline', title: 'Erro ao carregar dados' },
  };

  return {
    eventTarget,
    update: (status: Status) => {
      const { symbol, title } =
        typeof status === 'string' ? info[status] : info[status.status];
      icon.textContent = symbol;
      if (typeof status === 'string') {
        link.title = title;
      } else if (typeof status === 'object' && status.status === 'ACTIVE') {
        link.title = status.motivo.trim() || title;
      } else {
        throw new Error('Status desconhecido.');
      }

      if (status === 'PENDING') {
        link.classList.add(classes.wait);
      } else {
        link.classList.remove(classes.wait);
      }

      if (typeof status === 'object' && status.status === 'ACTIVE') {
        link.classList.add(classes.added);
      } else {
        link.classList.remove(classes.added);
      }
    },
  };
}
