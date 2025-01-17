import { h } from '@nadameu/create-element';
import * as P from '@nadameu/predicates';
import { create_store } from './create_store';
import { criar_dialogo } from './criar_dialogo';
import * as db from './database';
import classes from './estilos.module.scss';
import { log_error } from './log_error';
import { mensagem_aviso_favoritos } from './mensagem_aviso_favoritos';
import { isNumProc } from './NumProc';
import { Prioridade } from './Prioridade';

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

  const { dialogo, aviso, output, barras } = criar_dialogo(
    'Adicionar aos favoritos',
    classes
  );
  aviso.append(...mensagem_aviso_favoritos.map(x => h('p', {}, x)));
  const salvar_e_fechar = async (evt: Event) => {
    evt.preventDefault();
    try {
      const motivo = input.value;
      const prioridade = (valor => {
        if (Object.values(Prioridade).includes(valor as any)) {
          return valor as Prioridade;
        } else {
          throw new Error(`Prioridade desconhecida: ${valor}`);
        }
      })(Number(select.value));
      await db.salvar_favorito({ numproc: numero, motivo, prioridade });
      status.set({ status: 'ACTIVE', motivo });
      dialogo.close();
    } catch (err) {
      status.set('ERROR');
      log_error(err);
      throw err;
    }
  };
  const fechar_sem_salvar = async (evt: Event) => {
    evt.preventDefault();
    try {
      dialogo.close();
      const favorito = await db.verificar_favorito(numero);
      if (favorito !== undefined) {
        status.set({ status: 'ACTIVE', motivo: favorito.motivo });
      } else {
        status.set('INACTIVE');
      }
    } catch (err) {
      status.set('ERROR');
      log_error(err);
      throw err;
    }
  };
  barras.forEach(barra => {
    const fechar = barra.firstChild as HTMLButtonElement;
    fechar.onclick = fechar_sem_salvar;
    barra.insertBefore(document.createTextNode(' '), barra.firstChild);
    barra.insertBefore(
      h('button', { type: 'button', onclick: salvar_e_fechar }, 'Salvar'),
      barra.firstChild
    );
  });

  document.body.append(dialogo);
  const textoPrioridades = {
    [Prioridade.BAIXA]: 'Baixa',
    [Prioridade.MEDIA]: 'Média',
    [Prioridade.ALTA]: 'Alta',
  } satisfies Record<Prioridade, string>;
  const select = h(
    'select',
    {},
    ...Object.values(Prioridade)
      .sort((x, y) => x - y)
      .map(valor =>
        h('option', { value: valor.toString() }, textoPrioridades[valor])
      )
  );
  const input = h('input', { autofocus: true, size: 50 });
  output.append(
    h('label', {}, 'Motivo: ', input),
    h('br'),
    h('label', {}, 'Prioridade: ', select)
  );

  const estrela = render_estrela(elemento_numero);
  status.subscribe(estrela.update);
  estrela.link.addEventListener('click', async evt => {
    evt.preventDefault();

    const current = status.get();
    if (current === 'ERROR' || current === 'PENDING') return;
    try {
      if (typeof current === 'object' && current.status === 'ACTIVE') {
        status.set('PENDING');
        await db.remover_favorito(numero);
        status.set('INACTIVE');
      } else {
        status.set('PENDING');
        dialogo.showModal();
        input.value = '';
        select.value = Prioridade.MEDIA.toString();
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
    link,
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
