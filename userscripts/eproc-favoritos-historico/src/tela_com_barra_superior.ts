import { h } from '@nadameu/create-element';
import * as P from '@nadameu/predicates';
import * as db from './database';
import { formatar_numproc } from './formatar_numproc';
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

  const pesquisa_rapida = await query_first<HTMLInputElement>(
    'input[id="txtNumProcessoPesquisaRapida"]'
  );
  const botao_mesma_aba = await query_first<HTMLButtonElement>(
    'button[name="btnPesquisaRapidaSubmit"]'
  );
  const botao_nova_aba = await query_first<HTMLButtonElement>(
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
    try {
      dh.append(
        h(
          'table',
          {},
          h(
            'thead',
            {},
            ...['Favorito?', 'Processo', 'Último acesso'].map(texto =>
              h('th', {}, texto)
            )
          ),
          h(
            'tbody',
            {},
            ...(await db.obter_historico()).map(
              ({ numproc, favorito, acesso }) =>
                h(
                  'tr',
                  {},
                  h(
                    'td',
                    {},
                    favorito === undefined
                      ? ''
                      : h(
                          'i',
                          {
                            classList: ['material-icons'],
                            title: favorito.motivo,
                          },
                          'star'
                        )
                  ),
                  h(
                    'td',
                    {},
                    h(
                      'a',
                      {
                        href: '#',
                        onclick: evt => {
                          evt.preventDefault();
                          dh.close();
                          abrir_processo(numproc).catch(err => {
                            log_error(err);
                          });
                        },
                      },
                      formatar_numproc(numproc)
                    ),
                    h(
                      'a',
                      {
                        href: '#',
                        onclick: evt => {
                          evt.preventDefault();
                          dh.close();
                          abrir_processo_nova_aba(numproc).catch(err => {
                            log_error(err);
                          });
                        },
                      },
                      ' ',
                      h(
                        'i',
                        {
                          classList: ['material-icons'],
                          title: 'Abrir em nova aba',
                        },
                        'open_in_new'
                      )
                    )
                  ),
                  h('td', {}, new Date(acesso).toLocaleString('pt-BR'))
                )
            )
          )
        )
      );
    } catch (err) {
      if (err instanceof Error) log_error(err);
      else log_error(new Error(JSON.stringify(err)));
      throw err;
    }
  });
  icone_favoritos.addEventListener('click', async evt => {
    evt.preventDefault();
    const df = dialogo_favoritos;
    df.textContent = '';
    df.showModal();
    df.append(h('h1', {}, 'Favoritos'));
    try {
      df.append(
        h(
          'table',
          {},
          h(
            'thead',
            {},
            h(
              'tr',
              {},
              ...['Prioridade', 'Processo', 'Motivo'].map(texto =>
                h('th', {}, texto)
              )
            )
          ),
          h(
            'tbody',
            {},
            ...(await db.obter_favoritos()).map(
              ({ numproc, motivo, prioridade }) =>
                h(
                  'tr',
                  {},

                  h(
                    'td',
                    {},
                    {
                      [db.Prioridade.ALTA]: 'Alta',
                      [db.Prioridade.MEDIA]: 'Média',
                      [db.Prioridade.BAIXA]: 'Baixa',
                    }[prioridade]
                  ),
                  h(
                    'td',
                    {},
                    h(
                      'a',
                      {
                        href: '#',
                        onclick: evt => {
                          evt.preventDefault();
                          df.close();
                          abrir_processo(numproc).catch(err => {
                            log_error(err);
                          });
                        },
                      },
                      formatar_numproc(numproc)
                    ),
                    h(
                      'a',
                      {
                        href: '#',
                        onclick: evt => {
                          evt.preventDefault();
                          df.close();
                          abrir_processo_nova_aba(numproc).catch(err => {
                            log_error(err);
                          });
                        },
                      },
                      h(
                        'i',
                        {
                          classList: ['material-icons'],
                          title: 'Abrir em nova aba',
                        },
                        'open_in_new'
                      )
                    )
                  ),
                  h('td', {}, motivo)
                )
            )
          )
        )
      );
    } catch (err) {
      if (err instanceof Error) log_error(err);
      else log_error(new Error(JSON.stringify(err)));
      throw err;
    }
  });

  async function abrir_processo(numproc: string) {
    const valor_antigo = pesquisa_rapida.value;
    pesquisa_rapida.value = numproc;
    botao_mesma_aba.click();
    pesquisa_rapida.value = valor_antigo;
  }

  async function abrir_processo_nova_aba(numproc: string) {
    const valor_antigo = pesquisa_rapida.value;
    pesquisa_rapida.value = numproc;
    botao_nova_aba.click();
    pesquisa_rapida.value = valor_antigo;
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
