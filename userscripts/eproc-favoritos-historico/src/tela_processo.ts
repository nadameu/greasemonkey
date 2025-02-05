import { h } from '@nadameu/create-element';
import { createStore } from '@nadameu/create-store';
import * as P from '@nadameu/predicates';
import { criar_dialogo } from './criar_dialogo';
import * as db from './database';
import classes from './estilos.module.scss';
import { formatar_numproc } from './formatar_numproc';
import { log_error } from './log_error';
import { mensagem_aviso_favoritos } from './mensagem_aviso_favoritos';
import { isNumProc } from './NumProc';
import { Prioridade } from './Prioridade';

type Status =
  | { status: 'PENDING' }
  | { status: 'ACTIVE'; motivo: string }
  | { status: 'INACTIVE' }
  | { status: 'ERROR' };

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

  const estado = createStore<Status, Status>(
    () => ({ status: 'PENDING' }),
    (_, x) => x
  );

  try {
    const resultado = await db.verificar_favorito(numero);
    estado.dispatch(
      resultado !== undefined
        ? { status: 'ACTIVE', motivo: resultado.motivo }
        : { status: 'INACTIVE' }
    );
  } catch (err) {
    estado.dispatch({ status: 'ERROR' });
    throw err;
  }

  const { dialogo, aviso, barras, output, titulo } = criar_dialogo(
    'TITULO_DIALOGO',
    classes
  );
  aviso.append(...mensagem_aviso_favoritos.map(x => h('p', {}, x)));
  const salvar_e_fechar = (evt: Event) => {
    evt.preventDefault();
    (async () => {
      const motivo = input.value;
      const valor_prioridade = Number(select.value);
      const prioridade = P.check(
        (p: number): p is Prioridade =>
          Object.values(Prioridade).includes(p as any),
        Number(select.value),
        `Prioridade desconhecida: ${valor_prioridade}`
      );
      await db.salvar_favorito({ numproc: numero, motivo, prioridade });
      estado.dispatch({ status: 'ACTIVE', motivo });
      dialogo.close();
    })().catch(err => {
      estado.dispatch({ status: 'ERROR' });
      log_error(err);
      window.alert('Erro ao salvar favorito.');
    });
  };
  const fechar_sem_salvar = (evt: Event) => {
    evt.preventDefault();
    (async () => {
      dialogo.close();
      const favorito = await db.verificar_favorito(numero);
      if (favorito !== undefined) {
        estado.dispatch({ status: 'ACTIVE', motivo: favorito.motivo });
      } else {
        estado.dispatch({ status: 'INACTIVE' });
      }
    })().catch(err => {
      estado.dispatch({ status: 'ERROR' });
      log_error(err);
    });
  };
  const remover_clicado = (evt: Event) => {
    evt.preventDefault();
    (async () => {
      const resposta = window.confirm(
        `Remover processo ${formatar_numproc(numero)} dos favoritos?`
      );
      if (resposta === true) {
        await db.remover_favorito(numero);
        dialogo.close();
        estado.dispatch({ status: 'INACTIVE' });
      }
    })().catch(err => {
      estado.dispatch({ status: 'ERROR' });
      log_error(err);
      window.alert('Erro ao remover dos favoritos.');
    });
  };
  const remover = barras.map(barra => {
    const fechar = barra.firstChild as HTMLButtonElement;
    fechar.onclick = fechar_sem_salvar;
    const frag = document.createDocumentFragment();
    const remover = h(
      'span',
      {},
      h('button', { type: 'button', onclick: remover_clicado }, 'Remover'),
      ' '
    );
    frag.append(
      h('button', { type: 'button', onclick: salvar_e_fechar }, 'Salvar'),
      ' ',
      remover
    );
    barra.insertBefore(frag, barra.firstChild);
    return remover;
  });
  const update_dialogo = (atual: db.Favorito | undefined) => {
    if (atual === undefined) {
      titulo.textContent = 'Adicionar aos favoritos';
      input.value = '';
      select.value = Prioridade.MEDIA.toString();
      remover.forEach(r => (r.hidden = true));
    } else {
      titulo.textContent = 'Alterar dados do favorito';
      input.value = atual.motivo;
      select.value = atual.prioridade.toString();
      remover.forEach(r => (r.hidden = false));
    }
  };

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
      .sort((x, y) => y - x)
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
  estado.subscribe(estrela.update);
  estrela.link.addEventListener('click', evt => {
    evt.preventDefault();

    const current = estado.getState();
    if (current.status === 'ERROR' || current.status === 'PENDING') return;
    (async () => {
      estado.dispatch({ status: 'PENDING' });
      const dados = await db.verificar_favorito(numero);
      if (current.status === 'ACTIVE' && dados === undefined) {
        estado.dispatch({ status: 'INACTIVE' });
        window.alert(
          'Dados não encontrados. Possivelmente desativado em outra aba.'
        );
      } else {
        update_dialogo(dados);
        dialogo.showModal();
      }
    })().catch(err => {
      estado.dispatch({ status: 'ERROR' });
      log_error(err);
      window.alert('Erro ao realizar a operação.');
    });
  });
}

function render_estrela(elemento_numero: HTMLElement) {
  const parent = elemento_numero.parentNode!;
  const icon = h('i', { classList: ['material-icons', classes.icon!] });
  const link = h(
    'a',
    {
      classList: [classes.link!, classes.wait!, 'col-auto', 'px-1'],
      href: '#',
    },
    icon
  );
  const div = h(
    'div',
    { classList: [classes.div!, 'row'] },
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
    update: (estado: Status) => {
      const { symbol, title } = info[estado.status];
      icon.textContent = symbol;

      if (estado.status === 'ACTIVE') {
        link.classList.add(classes.added!);
        link.classList.remove(classes.wait!);
      } else if (estado.status === 'PENDING') {
        link.classList.remove(classes.added!);
        link.classList.add(classes.wait!);
      } else {
        link.classList.remove(classes.added!);
        link.classList.remove(classes.wait!);
      }

      if (estado.status === 'ACTIVE') {
        link.title = estado.motivo.trim() || title;
      } else {
        link.title = title;
      }
    },
  };
}
