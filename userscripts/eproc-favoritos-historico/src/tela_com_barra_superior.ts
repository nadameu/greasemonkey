import { h } from '@nadameu/create-element';
import * as P from '@nadameu/predicates';
import { criar_dialogo } from './criar_dialogo';
import { criar_icone_material } from './criar_icone_material';
import { criar_tabela } from './criar_tabela';
import * as db from './database';
import classes from './estilos.module.scss';
import { formatar_numproc } from './formatar_numproc';
import { log_error } from './log_error';
import { mensagem_aviso_favoritos } from './mensagem_aviso_favoritos';
import { NumProc } from './NumProc';
import { Prioridade } from './Prioridade';
import { query_first } from './query_first';

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

  const abrir_processo = (numproc: NumProc, aba: 'MESMA_ABA' | 'NOVA_ABA') => {
    const valor_antigo = pesquisa_rapida.value;
    pesquisa_rapida.value = numproc;
    if (aba === 'MESMA_ABA') botao_mesma_aba.click();
    else botao_nova_aba.click();
    pesquisa_rapida.value = valor_antigo;
  };

  const link_historico = criar_link_barra({
    symbol: 'history',
    title: 'Histórico de processos',
  });
  const link_favoritos = criar_link_barra({
    symbol: 'bookmark_border',
    title: 'Favoritos',
  });
  const div = h('div', { classList: ['px-2'] }, link_historico, link_favoritos);
  link_casa.parentNode!.insertBefore(div, link_casa);

  const dialogo_historico = criar_dialogo_historico(abrir_processo);
  const dialogo_favoritos = criar_dialogo_favoritos(abrir_processo);
  document.body.append(dialogo_historico.dialogo, dialogo_favoritos.dialogo);

  const criar_handler_abertura =
    <T>(
      {
        dialogo,
        update,
      }: { dialogo: HTMLDialogElement; update(dados: T[]): void },
      obter_dados: () => Promise<T[]>
    ) =>
    (evt: Event) => {
      evt.preventDefault();

      update([]);
      dialogo.showModal();
      obter_dados()
        .then(update)
        .catch(err => {
          log_error(err);
          window.alert('Não foi possível obter os dados.');
          dialogo.close();
        });
    };

  link_historico.addEventListener(
    'click',
    criar_handler_abertura(dialogo_historico, db.obter_historico)
  );
  link_favoritos.addEventListener(
    'click',
    criar_handler_abertura(dialogo_favoritos, db.obter_favoritos)
  );
}

function criar_link_barra({
  symbol,
  title,
}: {
  symbol: string;
  title: string;
}) {
  const icone = criar_icone_material(symbol, title);
  icone.classList.add(classes.icon, 'navbar-icons');
  icone.style.padding = '0';

  const link = h('a', { classList: [classes.link], href: '#' }, icone);

  return link;
}

function criar_dialogo_historico(
  abrir_processo: (numproc: NumProc, aba: 'MESMA_ABA' | 'NOVA_ABA') => void
) {
  const { aviso, dialogo, output } = criar_dialogo(
    'Histórico de processos',
    classes
  );
  aviso.append(
    ...[
      'Aparecerão aqui apenas os processos acessados neste navegador e computador.',
      'Usuários com perfil de Diretor de Secretaria conseguem obter a relação completa de processos acessados.',
    ].map(x => h('p', {}, x))
  );
  const criar_links_numproc = criar_links_dialogo(dialogo, abrir_processo);
  return {
    dialogo,
    update(dados: ({ numproc: NumProc } & db.Item)[]) {
      if (dados.length === 0) {
        output.textContent = 'Não há dados relativos a processos acessados.';
        return;
      }
      output.textContent = '';
      output.append(
        criar_tabela(
          ['Favorito?', 'Processo', 'Último acesso'],
          dados.map(({ numproc, favorito, acesso }) => {
            const c0 =
              favorito === undefined
                ? ''
                : criar_icone_material('star', favorito.motivo);
            const c1 = criar_links_numproc(numproc);
            const c2 = new Date(acesso).toLocaleString('pt-BR');
            return [c0, c1, c2];
          })
        )
      );
    },
  };
}

function criar_dialogo_favoritos(
  abrir_processo: (numproc: NumProc, aba: 'MESMA_ABA' | 'NOVA_ABA') => void
) {
  const { dialogo, aviso, output, barras } = criar_dialogo(
    'Favoritos',
    classes
  );
  aviso.append(...mensagem_aviso_favoritos.map(x => h('p', {}, x)));
  const criar_links_numproc = criar_links_dialogo(dialogo, abrir_processo);
  barras.forEach(barra => {
    barra.prepend(
      h('button', { type: 'button' }, 'Importar...'),
      ' ',
      h(
        'button',
        {
          type: 'button',
          onclick: function exportar(evt) {
            evt.preventDefault();
            const new_hidden_state = !div_download.classList.contains(
              classes['div-download__hidden']
            );
            div_download.classList.toggle(
              classes['div-download__hidden'],
              new_hidden_state
            );
          },
        },
        'Exportar...'
      ),
      ' '
    );
  });
  const link_download = h(
    'a',
    {
      href: 'data:application/json,{"teste":"funcionou"}',
      download: 'processos_favoritos.json',
    },
    'Clique aqui'
  );
  const div_download = h(
    'p',
    {
      classList: [classes['div-download'], classes['div-download__hidden']],
    },
    link_download,
    ' para fazer download dos favoritos e salvá-los em um arquivo.',
    h('br')
  );
  barras[0]!.after(div_download);
  return {
    dialogo,
    update(dados: ({ numproc: NumProc } & db.Favorito)[]) {
      if (dados.length === 0) {
        output.textContent = 'Não há favoritos cadastrados.';
        return;
      }
      output.textContent = '';
      const arquivo = h('input', { type: 'file', accept: 'application/json' });
      const div = h('div', {}, h('div', { hidden: true }, arquivo));
      output.append(
        div,
        criar_tabela(
          ['Prioridade', 'Processo', 'Motivo'],
          dados.map(({ numproc, motivo, prioridade }) => {
            const c0 = {
              [Prioridade.ALTA]: 'Alta',
              [Prioridade.MEDIA]: 'Média',
              [Prioridade.BAIXA]: 'Baixa',
            }[prioridade];
            const c1 = criar_links_numproc(numproc);
            const c2 = motivo;
            return [c0, c1, c2];
          })
        )
      );
    },
  };
}

function criar_links_dialogo(
  dialogo: HTMLDialogElement,
  abrir_processo: (numproc: NumProc, aba: 'MESMA_ABA' | 'NOVA_ABA') => void
) {
  return (numproc: NumProc) => {
    const criar_onclick = (aba: 'MESMA_ABA' | 'NOVA_ABA') => (evt: Event) => {
      evt.preventDefault();
      if (aba === 'MESMA_ABA') dialogo.close();
      try {
        abrir_processo(numproc, aba);
      } catch (err) {
        log_error(err);
        window.alert('Não foi possível abrir o processo selecionado.');
      }
    };
    const link_mesma = h(
      'a',
      { href: '#', onclick: criar_onclick('MESMA_ABA') },
      formatar_numproc(numproc)
    );
    const link_nova = h(
      'a',
      { href: '#', onclick: criar_onclick('NOVA_ABA') },
      h(
        'i',
        {
          classList: ['material-icons'],
          title: 'Abrir em nova aba',
        },
        'open_in_new'
      )
    );
    const frag = document.createDocumentFragment();
    frag.append(link_mesma, ' ', link_nova);
    return frag;
  };
}
