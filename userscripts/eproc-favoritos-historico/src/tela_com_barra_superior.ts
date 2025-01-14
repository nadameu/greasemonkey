import { h } from '@nadameu/create-element';
import * as P from '@nadameu/predicates';
import * as db from './database';
import { log_error } from './log_error';
import { query_first } from './query_first';
import classes from './tela_com_barra_superior.module.scss';

export async function tela_com_barra_superior() {
  const icones_casa = Array.from(
    document.querySelectorAll<HTMLElement>('#navbar i.navbar-icons')
  ).filter(x => x.textContent === 'home');
  if (icones_casa.length > 1) throw new Error('Mais de um ícone encontrado.');
  if (icones_casa.length === 0) return;
  const link_casa = icones_casa[0]!.closest('a[href]');
  P.assert(P.isNotNull(link_casa), 'Erro ao definir localização dos ícones.');

  const pesquisa_rapida = query_first<HTMLInputElement>(
    'input[id="txtNumProcessoPesquisaRapida"]'
  );
  const botao_mesma_aba = query_first<HTMLButtonElement>(
    'button[name="btnPesquisaRapidaSubmit"]'
  );
  const botao_nova_aba = query_first<HTMLButtonElement>(
    'button[name="btnPesquisaRapidaSubmitNovaAba"]'
  );

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
  const div = h(
    'div',
    { classList: ['px-2'] },
    icone_ultimo,
    icone_historico,
    icone_favoritos
  );
  link_casa.parentNode!.insertBefore(div, link_casa);

  const dialogo_historico = h('dialog', { classList: [classes.historico] });
  const dialogo_favoritos = h('dialog', { classList: [classes.favoritos] });
  document.body.append(dialogo_historico, dialogo_favoritos);

  icone_historico.addEventListener('click', async evt => {
    evt.preventDefault();
    const dh = dialogo_historico;
    dh.textContent = '';
    dh.showModal();
    dh.append(h('h1', {}, 'Histórico de processos'));
    const dl = h('dl');
    dh.append(dl);
    try {
      for (const entry of await db.obter_historico()) {
        const date = new Date(entry.timestamp);
        const link = h(
          'a',
          {
            href: '#',
            onclick: evt => {
              evt.preventDefault();
              dh.close();
              abrir_processo(entry.numproc).catch(err => {
                log_error(err);
              });
            },
          },
          entry.numproc
        );
        dh.append(h('dt', {}, link));
        dh.append(h('dd', {}, date.toLocaleString()));
      }
    } catch (err) {
      throw err;
    }
  });
  icone_favoritos.addEventListener('click', evt => {
    evt.preventDefault();
    dialogo_favoritos.showModal();
  });

  async function abrir_processo(numproc: string) {
    pesquisa_rapida.value = numproc;
    botao_mesma_aba.click();
  }
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
  const link = h(
    'a',
    {
      classList: [classes.link],
      href: '#',
    },
    icone
  );
  return link;
}
